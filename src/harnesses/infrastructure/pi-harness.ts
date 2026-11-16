import { Injectable } from "@nestjs/common";
import type { Harness, HarnessInput } from "../domain/harness.js";
import { providerModels } from "./model-catalog.js";
import { runSession } from "./pi/session.js";

@Injectable()
export class PiHarness implements Harness {
  readonly id = "pi";
  readonly title = "Pi";
  readonly provider = "openrouter";
  readonly binary = null;
  readonly supportsMcp = true;
  readonly judgeSupportsMcp = true;

  models() {
    return providerModels(this.provider);
  }

  run(input: HarnessInput) {
    return runSession(input);
  }
}
