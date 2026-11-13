import { z } from "zod";

const schema = z
  .object({
    harness: z.enum(["pi", "opencode", "codex", "claude"]).default("pi"),
    model: z.string().trim().min(1),
    effort: z
      .enum(["off", "minimal", "low", "medium", "high", "xhigh"])
      .default("off"),
    count: z.number().int().min(1).max(100).default(1),
    timeoutSeconds: z.number().int().min(1).max(86400).default(600),
    maxTurns: z.number().int().min(1).max(1000).default(50),
  })
  .strict();

export type ModelSettingsData = z.infer<typeof schema>;

export class ModelSettings {
  private constructor(readonly value: Readonly<ModelSettingsData>) {}

  static create(input: unknown): ModelSettings {
    return new ModelSettings(Object.freeze(schema.parse(input)));
  }
}
