import { config } from "dotenv";

export function loadEnvironment(path = ".env"): void {
  config({ path, quiet: true });
}
