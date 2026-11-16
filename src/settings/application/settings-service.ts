import { Inject, Injectable } from "@nestjs/common";
import {
  ApplicationSettings,
  type ApplicationSettingsData,
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
    const settings = ApplicationSettings.create(input);

    await this.settings.save(settings);

    return { ...settings.value };
  }
}
