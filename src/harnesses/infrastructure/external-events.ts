import { z } from "zod";
import type { HarnessUsage } from "../domain/harness.js";

function object(value: unknown): Record<string, unknown> {
  const result = z.record(z.unknown()).safeParse(value);

  return result.success ? result.data : {};
}

const number = (value: unknown) => (typeof value === "number" ? value : 0);

function errorMessage(event: Record<string, unknown>): string {
  const detail = object(event.error);
  const data = object(detail.data);
  const message =
    detail.message ??
    data.message ??
    event.message ??
    event.result ??
    event.error;

  return typeof message === "string" ? message : "Harness returned an error.";
}

export function summarizeEvents(events: unknown[]) {
  let text = "";
  let error: string | undefined;
  let usage: HarnessUsage | undefined;

  for (const raw of events) {
    const event = object(raw);
    const item = object(event.item);
    const part = object(event.part);
    const message = object(event.message);

    if (item.type === "agent_message" && typeof item.text === "string")
      text = item.text;
    if (event.type === "text" && typeof part.text === "string")
      text += part.text;
    if (event.type === "assistant" && Array.isArray(message.content))
      text = message.content
        .map((block) => object(block).text ?? "")
        .join("\n");
    if (event.type === "result" && typeof event.result === "string")
      text = event.result;
    if (
      event.is_error === true ||
      event.type === "error" ||
      event.type === "turn.failed"
    )
      error = errorMessage(event);

    if (
      event.type === "turn.completed" ||
      event.type === "result" ||
      event.type === "step_finish"
    ) {
      const tokens = object(event.usage ?? part.tokens);
      const cache = object(tokens.cache);
      const input = number(tokens.input_tokens ?? tokens.input);
      const output = number(tokens.output_tokens ?? tokens.output);
      const cacheRead = number(
        tokens.cache_read_input_tokens ??
          tokens.cached_input_tokens ??
          cache.read,
      );
      const cacheWrite = number(
        tokens.cache_creation_input_tokens ?? cache.write,
      );
      const cost =
        typeof event.total_cost_usd === "number"
          ? event.total_cost_usd
          : typeof part.cost === "number"
            ? part.cost
            : null;
      const previous = event.type === "result" ? undefined : usage;

      usage = {
        input: (previous?.input ?? 0) + input,
        output: (previous?.output ?? 0) + output,
        cacheRead: (previous?.cacheRead ?? 0) + cacheRead,
        cacheWrite: (previous?.cacheWrite ?? 0) + cacheWrite,
        total:
          (previous?.total ?? 0) +
          input +
          output +
          (event.type === "turn.completed" ? 0 : cacheRead + cacheWrite),
        costUsd: cost === null ? null : (previous?.costUsd ?? 0) + cost,
      };
    }
  }

  return { text, error, usage };
}
