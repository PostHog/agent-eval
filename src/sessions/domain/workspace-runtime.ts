import type { HarnessRuntime } from "../../harnesses/domain/execution.js";
import type { ExecutionSnapshot } from "./execution-snapshot.js";

export abstract class WorkspaceRuntimeFactory {
  abstract create(
    environment: ExecutionSnapshot["environment"],
    root: string,
    workspace: string,
    signal: AbortSignal,
  ): Promise<HarnessRuntime>;
}
