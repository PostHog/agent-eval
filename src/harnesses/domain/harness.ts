import type { Provider } from "../../credentials/provider.js";
import type { ModelSettingsData } from "../../evaluations/domain/model-settings.js";
import type { HarnessRequest, HarnessResult } from "./execution.js";

export type HarnessId = ModelSettingsData["harness"];
export type { HarnessResult, HarnessUsage } from "./execution.js";
export type HarnessInput = HarnessRequest & {
  settings: ModelSettingsData;
  onRawEvent: (event: unknown) => Promise<void>;
};

// A harness adapter owns native commands and events. Application services see one execution contract.
export interface Harness {
  readonly id: HarnessId;
  readonly title: string;
  readonly provider: Provider;
  readonly binary: string | null;
  readonly supportsMcp: boolean;
  // True when MCP tools stay callable while every built-in tool is off, as the judge requires.
  readonly judgeSupportsMcp: boolean;
  models(): Promise<{ id: string; name: string }[]>;
  run(input: HarnessInput): Promise<HarnessResult>;
}
