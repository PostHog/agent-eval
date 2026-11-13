import type { ExecutionSnapshot } from "./execution-snapshot.js";

// Durable workspace snapshots are a port. SQLite is one implementation.
export abstract class WorkspaceStore {
  abstract prepare(
    sessionIds: string[],
    snapshot: ExecutionSnapshot,
  ): Promise<void>;
  abstract capture(
    sessionId: string,
    root: string,
    phase: string,
    prefix?: string,
  ): Promise<void>;
  abstract restore(
    sessionId: string,
    root: string,
    phase: string,
  ): Promise<void>;
}
