import { z } from "zod";

export const applicationSettingsSchema = z
  .object({
    sessionConcurrency: z.number().int().min(1).max(32),
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
