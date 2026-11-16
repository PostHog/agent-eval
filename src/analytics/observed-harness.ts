import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { Harness } from "../harnesses/domain/harness.js";

type Properties = Record<string, string | number | boolean | null>;
export type CaptureAi = (
  event: string,
  properties: Properties,
  timestamp: Date,
) => void;
const record = (value: unknown) =>
  z.record(z.unknown()).safeParse(value).data ?? {};

// Native harnesses expose usage events, not the provider clients they call.
export function observedHarness(
  harness: Harness,
  capture: CaptureAi,
  traceId: string,
  phase: "agent" | "judge",
): Harness {
  return {
    id: harness.id,
    title: harness.title,
    provider: harness.provider,
    binary: harness.binary,
    supportsMcp: harness.supportsMcp,
    models: () => harness.models(),
    async run(input) {
      const started = new Date();
      const spanId = randomUUID();
      const seen = new Set<string>();
      let generationStarted: number | undefined;
      let failed = true;
      const totals: Properties = {};
      const common: Properties = {
        $ai_trace_id: traceId,
        $ai_session_id: null,
        $ai_model: input.model.replace(/^openrouter\//, ""),
        $ai_provider: harness.provider,
        harness: harness.id,
        phase,
        effort: input.effort,
      };
      const emit: CaptureAi = (event, properties, timestamp) => {
        try {
          capture(event, properties, timestamp);
        } catch {
          // Telemetry must not interrupt a paid agent run.
        }
      };

      try {
        const result = await harness.run({
          ...input,
          onRawEvent: async (raw) => {
            await input.onRawEvent(raw);
            const event = record(raw);
            if (
              ["message_start", "step_start", "turn.started"].includes(
                String(event.type),
              )
            )
              generationStarted = Date.now();

            const message = record(event.message);
            const part = record(event.part);
            const pi =
              harness.id === "pi" &&
              event.type === "message_end" &&
              message.role === "assistant";
            const claude =
              harness.id === "claude" && event.type === "assistant";
            const openCode =
              harness.id === "opencode" && event.type === "step_finish";
            const codex =
              harness.id === "codex" && event.type === "turn.completed";
            if (!pi && !claude && !openCode && !codex) return;

            const usage = record(
              openCode ? part.tokens : codex ? event.usage : message.usage,
            );
            if (!Object.keys(usage).length) return;
            const id = message.id ?? part.id ?? event.uuid;
            if (typeof id === "string") {
              if (seen.has(id)) return;
              seen.add(id);
            }

            const cache = record(usage.cache);
            const properties: Properties = {
              ...common,
              $ai_parent_id: spanId,
              $ai_span_id: randomUUID(),
              $ai_span_name: codex ? `${phase} turn` : `${phase} generation`,
              $ai_is_error:
                message.stopReason === "error" ||
                message.stopReason === "aborted",
              usage_scope: codex ? "turn" : "generation",
              $ai_cache_reporting_exclusive: !codex,
            };
            const counts = {
              $ai_input_tokens: usage.input_tokens ?? usage.input,
              $ai_output_tokens: usage.output_tokens ?? usage.output,
              $ai_cache_read_input_tokens:
                usage.cache_read_input_tokens ??
                usage.cached_input_tokens ??
                usage.cacheRead ??
                cache.read,
              $ai_cache_creation_input_tokens:
                usage.cache_creation_input_tokens ??
                usage.cacheWrite ??
                cache.write,
              $ai_total_cost_usd: openCode
                ? part.cost
                : pi
                  ? record(usage.cost).total
                  : undefined,
            };
            for (const [key, value] of Object.entries(counts)) {
              if (
                typeof value === "number" &&
                Number.isFinite(value) &&
                value >= 0
              )
                properties[key] = value;
            }
            if (properties.$ai_total_cost_usd !== undefined)
              properties.$ai_cost_passthrough = true;
            if (generationStarted !== undefined)
              properties.$ai_latency = (Date.now() - generationStarted) / 1000;
            emit(
              codex ? "$ai_span" : "$ai_generation",
              properties,
              new Date(generationStarted ?? Date.now()),
            );
            generationStarted = undefined;
          },
        });
        failed = result.status === "failed";
        if (result.usage) {
          totals.harness_input_tokens = result.usage.input;
          totals.harness_output_tokens = result.usage.output;
          totals.harness_cache_read_tokens = result.usage.cacheRead;
          totals.harness_cache_write_tokens = result.usage.cacheWrite;
          totals.harness_total_tokens = result.usage.total;
          totals.harness_cost_usd = result.usage.costUsd;
        }
        return result;
      } finally {
        emit(
          "$ai_span",
          {
            ...common,
            ...totals,
            $ai_parent_id: traceId,
            $ai_span_id: spanId,
            $ai_span_name: `${phase} run`,
            $ai_latency: (Date.now() - started.getTime()) / 1000,
            $ai_is_error: failed,
            cancelled: input.signal.aborted,
          },
          started,
        );
      }
    },
  };
}
