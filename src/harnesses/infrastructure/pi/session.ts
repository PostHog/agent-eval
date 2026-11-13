import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import type { HarnessRequest, HarnessResult } from "../../domain/execution.js";
import { executeSession } from "./execute.js";
import { writeJson } from "./json-file.js";
import { createSession } from "./runtime.js";

export async function runSession(
  request: HarnessRequest,
): Promise<HarnessResult> {
  const started = Date.now();

  let session: Awaited<ReturnType<typeof createSession>> | undefined;

  let result: HarnessResult;

  let usage = {
    input: 0,
    output: 0,
    cacheRead: 0,
    cacheWrite: 0,
    total: 0,
    costUsd: 0,
  };

  await mkdir(request.directory, { recursive: true });

  try {
    request.signal.throwIfAborted();

    session = await createSession(request);

    const text = await executeSession(session, request);

    result = {
      label: request.label,
      status: "completed",
      text,
      durationMs: Date.now() - started,
    };
  } catch (error) {
    result = {
      label: request.label,
      status: "failed",
      text: session?.getLastAssistantText() ?? "",
      error: error instanceof Error ? error.message : String(error),
      durationMs: Date.now() - started,
    };
  } finally {
    if (session) {
      try {
        const stats = session.getSessionStats();

        usage = { ...stats.tokens, costUsd: stats.cost };

        await writeJson(
          join(request.directory, "messages.json"),
          session.messages,
        );
      } finally {
        session.dispose();

        await session.closeMcp();
      }
    }
  }

  result.model = request.model;

  result.usage = usage;

  return result;
}
