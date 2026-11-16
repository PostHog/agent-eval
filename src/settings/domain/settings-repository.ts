import type { ApplicationSettings } from "./application-settings.js";

export abstract class SettingsRepository {
  abstract get(): Promise<ApplicationSettings>;
  abstract save(settings: ApplicationSettings): Promise<void>;
}
