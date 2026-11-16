import { Inject, Injectable } from "@nestjs/common";
import {
  ApplicationSettings,
  type ApplicationSettingsData,
  applicationSettingsSchema,
} from "../domain/application-settings.js";
import { SettingsRepository } from "../domain/settings-repository.js";

@Injectable()
export class SettingsService {
  constructor(
    @Inject(SettingsRepository)
    private readonly settings: SettingsRepository,
  ) {}

  async get(): Promise<ApplicationSettingsData> {
    return { ...(await this.settings.get()).value };
  }

  async update(input: unknown): Promise<ApplicationSettingsData> {
    const changes = applicationSettingsSchema.partial().parse(input);
    const settings = ApplicationSettings.create({
      ...(await this.settings.get()).value,
      ...changes,
    });

    await this.settings.save(settings);

    return { ...settings.value };
  }
}
