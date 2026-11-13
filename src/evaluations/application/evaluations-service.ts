import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { z } from "zod";
import { Criterion } from "../domain/criterion.js";
import { Evaluation } from "../domain/evaluation.js";
import { EvaluationRepository } from "../domain/evaluation-repository.js";
import { ModelSettings } from "../domain/model-settings.js";

const inputSchema = z
  .object({
    title: z.string(),
    prompt: z.string(),
    revision: z.number().int().positive().optional(),
    criteria: z.array(
      z.object({ id: z.string().uuid().optional(), description: z.string() }),
    ),
    environmentId: z.string().uuid().nullable().default(null),
    personaId: z.string().uuid().nullable().default(null),
    skillIds: z.array(z.string().uuid()).default([]),
    mcpIds: z.array(z.string().uuid()).default([]),
    models: z.array(z.unknown()),
    judge: z.unknown(),
  })
  .strict();

@Injectable()
export class EvaluationsService {
  constructor(
    @Inject(EvaluationRepository)
    private readonly repository: EvaluationRepository,
  ) {}

  async get(id: string) {
    const entity = await this.repository.find(id);

    if (!entity) throw new NotFoundException("Eval not found.");

    return entity;
  }

  async save(input: unknown, id?: string) {
    const value = inputSchema.parse(input);
    const data = {
      title: value.title,
      prompt: value.prompt,
      environmentId: value.environmentId,
      personaId: value.personaId,
      skillIds: [...new Set(value.skillIds)],
      mcpIds: [...new Set(value.mcpIds)],
      criteria: value.criteria.map((criterion) =>
        criterion.id
          ? Criterion.restore(criterion)
          : Criterion.create(criterion.description),
      ),
      models: value.models.map((model) => ({
        ...ModelSettings.create(model).value,
      })),
      judge: { ...ModelSettings.create(value.judge).value },
    };
    const entity = id ? await this.get(id) : Evaluation.create(data);

    if (id) {
      if (value.revision !== entity.snapshot().revision)
        throw new ConflictException(
          "This eval changed. Reload it before saving.",
        );

      entity.revise(data);
    }

    await this.repository.save(entity);

    return entity.snapshot();
  }
}
