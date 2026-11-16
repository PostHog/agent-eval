import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  Optional,
} from "@nestjs/common";
import { z } from "zod";
import { AnalyticsService } from "../../analytics/analytics-service.js";
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
    judgeSkillIds: z.array(z.string().uuid()).default([]),
    judgeMcpIds: z.array(z.string().uuid()).default([]),
    models: z.array(z.unknown()),
    judge: z.unknown(),
  })
  .strict();

@Injectable()
export class EvaluationsService {
  constructor(
    @Inject(EvaluationRepository)
    private readonly repository: EvaluationRepository,
    @Optional()
    @Inject(AnalyticsService)
    private readonly analytics?: AnalyticsService,
  ) {}

  async get(id: string) {
    const entity = await this.repository.find(id);

    if (!entity) throw new NotFoundException("Evaluation not found.");

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
      judgeSkillIds: [...new Set(value.judgeSkillIds)],
      judgeMcpIds: [...new Set(value.judgeMcpIds)],
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
          "This evaluation changed. Reload it before saving.",
        );

      entity.revise(data);
    }

    await this.repository.save(entity);
    this.analytics?.capture(id ? "evaluation updated" : "evaluation created", {
      evaluation_id: entity.snapshot().id,
      criteria_count: data.criteria.length,
      model_count: data.models.length,
      judge_skill_count: data.judgeSkillIds.length,
      judge_mcp_count: data.judgeMcpIds.length,
    });

    return entity.snapshot();
  }

  async duplicate(id: string) {
    const copy = (await this.get(id)).duplicate();

    await this.repository.save(copy);
    this.analytics?.capture("evaluation duplicated", {
      source_evaluation_id: id,
      evaluation_id: copy.snapshot().id,
    });

    return copy.snapshot();
  }
}
