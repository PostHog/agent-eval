import { Inject, Injectable } from "@nestjs/common";
import { Database } from "../../infrastructure/database.js";
import { ApplicationSettings } from "../domain/application-settings.js";
import { SettingsRepository } from "../domain/settings-repository.js";

const SETTINGS_ID = "local";

@Injectable()
export class PrismaSettingsRepository extends SettingsRepository {
  constructor(@Inject(Database) private readonly database: Database) {
    super();
  }

  async get(): Promise<ApplicationSettings> {
    const saved = await this.database.appSettings.findUnique({
      where: { id: SETTINGS_ID },
    });

    return saved
      ? ApplicationSettings.create({
          sessionConcurrency: saved.sessionConcurrency,
        })
      : ApplicationSettings.defaults();
  }

  async save(settings: ApplicationSettings): Promise<void> {
    await this.database.appSettings.upsert({
      where: { id: SETTINGS_ID },
      create: { id: SETTINGS_ID, ...settings.value },
      update: settings.value,
    });
  }
}
