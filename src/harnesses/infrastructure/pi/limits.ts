import type { AgentSession } from "@earendil-works/pi-coding-agent";
import type { HarnessRequest } from "../../domain/execution.js";
import { printTrace } from "./trace.js";

export function monitorSession(
  session: Pick<AgentSession, "subscribe" | "abort">,
  request: HarnessRequest,
) {
  let failure: string | undefined;

  let turns = 0;

  let pendingEvents = Promise.resolve();

  const stop = (reason: string) => {
    failure ??= reason;

    void session.abort();
  };

  const cancel = () => stop("The run was interrupted.");

  const unsubscribe = session.subscribe((event) => {
    try {
      printTrace(
        `${request.label} ${request.model} ${turns + 1}/${request.maxTurns}`,
        event,
      );

      if (request.onRawEvent)
        pendingEvents = pendingEvents
          .then(() => request.onRawEvent?.(event))
          .catch((error: unknown) =>
            stop(`Cannot save the trace: ${String(error)}`),
          );
    } catch (error) {
      stop(`Cannot save the trace: ${String(error)}`);
    }

    if (
      event.type === "turn_end" &&
      ++turns >= request.maxTurns &&
      event.message.role === "assistant" &&
      event.message.stopReason === "toolUse"
    ) {
      stop("The session reached the turn limit.");
    }
  });

  const timer = setTimeout(
    () => stop("The session reached the time limit."),
    request.timeout * 1000,
  );

  request.signal.addEventListener("abort", cancel, { once: true });

  return {
    flush: () => pendingEvents,
    check: () => {
      if (failure) throw new Error(failure);
    },
    dispose: () => {
      clearTimeout(timer);

      request.signal.removeEventListener("abort", cancel);

      unsubscribe();
    },
  };
}
