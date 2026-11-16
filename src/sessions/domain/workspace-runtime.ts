import type { HarnessRuntime } from "../../harnesses/domain/execution.js";
import type { HarnessId } from "../../harnesses/domain/harness.js";
import type { ExecutionSnapshot } from "./execution-snapshot.js";

export abstract class WorkspaceRuntimeFactory {
  abstract create(
    environment: ExecutionSnapshot["environment"],
    root: string,
    workspace: string,
    signal: AbortSignal,
    harness: HarnessId,
  ): Promise<HarnessRuntime>;
}
