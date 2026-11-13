import type { AgentSession } from "@earendil-works/pi-coding-agent";
import type { HarnessRequest } from "../../domain/execution.js";
import { monitorSession } from "./limits.js";

type ExecutableSession = Pick<
  AgentSession,
  "subscribe" | "abort" | "prompt" | "messages" | "getLastAssistantText"
>;

function responseText(session: ExecutableSession): string {
  const last = session.messages
    .filter((message) => message.role === "assistant")
    .at(-1);

  if (last?.stopReason === "error" || last?.stopReason === "aborted") {
    throw new Error(last.errorMessage ?? last.stopReason);
  }

  const text = session.getLastAssistantText();

  if (!text?.trim()) throw new Error("The session returned no text.");

  return text;
}

export async function executeSession(
  session: ExecutableSession,
  request: HarnessRequest,
): Promise<string> {
  const monitor = monitorSession(session, request);

  try {
    request.signal.throwIfAborted();

    await session.prompt(request.prompt, { expandPromptTemplates: false });

    await monitor.flush();

    monitor.check();

    return responseText(session);
  } finally {
    monitor.dispose();

    await monitor.flush();
  }
}
