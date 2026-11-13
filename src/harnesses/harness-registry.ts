import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { Inject, Injectable } from "@nestjs/common";
import type { Harness, HarnessId } from "./domain/harness.js";
import { HarnessRegistry } from "./domain/harness-registry.js";
import { ExternalHarness } from "./infrastructure/external-harness.js";
import { PiHarness } from "./infrastructure/pi-harness.js";

@Injectable()
export class DefaultHarnessRegistry extends HarnessRegistry {
  private readonly adapters: Harness[];

  constructor(@Inject(PiHarness) pi: PiHarness) {
    super();
    this.adapters = [
      pi,
      new ExternalHarness("opencode", "OpenCode", "openrouter"),
      new ExternalHarness("codex", "Codex", "openai"),
      new ExternalHarness("claude", "Claude Code", "anthropic"),
    ];
  }

  get(id: HarnessId): Harness {
    const adapter = this.adapters.find((harness) => harness.id === id);

    if (!adapter) throw new Error(`Unknown harness: ${id}`);

    return adapter;
  }

  async catalog() {
    return Promise.all(
      this.adapters.map(async (adapter) => {
        const installed = adapter.binary
          ? await promisify(execFile)(adapter.binary, ["--version"], {
              timeout: 5000,
            }).then(
              () => true,
              () => false,
            )
          : true;
        const provider = adapter.provider;
        const models = await adapter.models();

        return {
          id: adapter.id,
          title: adapter.title,
          provider,
          installed,
          models,
          supportsMcp: adapter.supportsMcp,
        };
      }),
    );
  }
}
