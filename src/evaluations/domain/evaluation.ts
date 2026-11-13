import { randomUUID } from "node:crypto";
import { z } from "zod";
import { Criterion } from "./criterion.js";
import { ModelSettings, type ModelSettingsData } from "./model-settings.js";

const schema = z
  .object({
    id: z.string().uuid(),
    title: z.string().trim().min(1).max(200),
    prompt: z.string().trim().min(1),
    criteria: z
      .array(z.object({ id: z.string().uuid(), description: z.string() }))
      .min(1),
    environmentId: z.string().uuid().nullable(),
    personaId: z.string().uuid().nullable(),
    skillIds: z.array(z.string().uuid()),
    mcpIds: z.array(z.string().uuid()),
    models: z.array(z.unknown()).min(1),
    judge: z.unknown(),
    revision: z.number().int().positive(),
  })
  .strict();

export interface EvaluationData
  extends Omit<z.infer<typeof schema>, "models" | "judge"> {
  models: ModelSettingsData[];
  judge: ModelSettingsData;
}

// The aggregate keeps criteria and execution settings consistent within one revision.
export class Evaluation {
  private constructor(private data: EvaluationData) {}

  static create(input: Omit<EvaluationData, "id" | "revision">): Evaluation {
    return Evaluation.restore({ ...input, id: randomUUID(), revision: 1 });
  }

  static restore(input: unknown): Evaluation {
    const data = schema.parse(input);
    const criteria = data.criteria.map((criterion) =>
      Criterion.restore(criterion),
    );
    const models = data.models.map(
      (model) => ModelSettings.create(model).value,
    );

    if (
      new Set(criteria.map((criterion) => criterion.id)).size !==
      criteria.length
    )
      throw new Error("Criterion IDs must be unique.");

    if (models.reduce((count, model) => count + model.count, 0) > 100)
      throw new Error("An eval cannot start more than 100 sessions at once.");

    return new Evaluation({
      ...data,
      criteria,
      models,
      judge: ModelSettings.create(data.judge).value,
    });
  }

  get id(): string {
    return this.data.id;
  }

  snapshot(): EvaluationData {
    // Callers receive a copy so an edit cannot change a historical session.
    return structuredClone(this.data);
  }

  revise(input: Omit<EvaluationData, "id" | "revision">): void {
    this.data = Evaluation.restore({
      ...input,
      id: this.id,
      revision: this.data.revision + 1,
    }).snapshot();
  }
}
