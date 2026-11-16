import type { Harness, HarnessId } from "./harness.js";

export interface HarnessCatalogEntry {
  id: HarnessId;
  title: string;
  provider: string;
  installed: boolean;
  models: { id: string; name: string }[];
  supportsMcp: boolean;
  judgeSupportsMcp: boolean;
}

export abstract class HarnessRegistry {
  abstract get(id: HarnessId): Harness;
  abstract catalog(): Promise<HarnessCatalogEntry[]>;
}
