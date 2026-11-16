import { z } from "zod";
import { modelSettingsSchema } from "../../evaluations/domain/model-settings.js";

const evaluationDefaultsSchema = z
  .object({
    models: z
      .array(modelSettingsSchema)
      .max(100)
      .refine(
        (models) => models.reduce((sum, model) => sum + model.count, 0) <= 100,
        "Defaults cannot exceed 100 sessions per evaluation.",
      ),
    judge: modelSettingsSchema
      .refine((model) => model.count === 1, "The judge runs once per session.")
      .nullable(),
  })
  .strict();

export type EvaluationDefaultsData = z.infer<typeof evaluationDefaultsSchema>;

function evaluationDefaults(): EvaluationDefaultsData {
  const limits = { count: 1, maxTurns: 100, timeoutSeconds: 600 };

  return {
    models: [
      {
        ...limits,
        harness: "claude",
        model: "claude-opus-5-5",
        effort: "high",
      },
      { ...limits, harness: "codex", model: "gpt-6.1-sol", effort: "high" },
      {
        ...limits,
        harness: "pi",
        model: "~deepseek/deepseek-v4-flash-latest",
        effort: "high",
      },
      {
        ...limits,
        harness: "opencode",
        model: "openrouter/moonshotai/kimi-k3",
        effort: "high",
      },
      { ...limits, harness: "pi", model: "qwen/qwen3.8-flash", effort: "high" },
      {
        ...limits,
        harness: "claude",
        model: "claude-sonnet-5-5",
        effort: "high",
      },
    ],
    judge: {
      ...limits,
      harness: "pi",
      model: "anthropic/claude-sonnet-5.5",
      effort: "low",
    },
  };
}

export const applicationSettingsSchema = z
  .object({
    sessionConcurrency: z.number().int().min(1).max(32),
    evaluationDefaults: evaluationDefaultsSchema.default(evaluationDefaults),
  })
  .strict();

export type ApplicationSettingsData = z.infer<typeof applicationSettingsSchema>;

export class ApplicationSettings {
  private constructor(readonly value: Readonly<ApplicationSettingsData>) {}

  static defaults(): ApplicationSettings {
    return ApplicationSettings.create({ sessionConcurrency: 2 });
  }

  static create(input: unknown): ApplicationSettings {
    return new ApplicationSettings(
      Object.freeze(applicationSettingsSchema.parse(input)),
    );
  }
}
