import assert from "node:assert/strict";
import { test } from "node:test";
import {
  type CaptureAi,
  observedHarness,
} from "../src/analytics/observed-harness.js";
import { ModelSettings } from "../src/evaluations/domain/model-settings.js";
import type { Harness, HarnessInput } from "../src/harnesses/domain/harness.js";

const input: HarnessInput = {
  label: "test",
  directory: "/tmp",
  workspace: "/tmp",
  skills: [],
  prompt: "private prompt",
  model: "openrouter/test/model",
  effort: "low",
  tools: [],
  timeout: 10,
  maxTurns: 2,
  signal: new AbortController().signal,
  settings: { ...ModelSettings.create({ model: "test" }).value },
  onRawEvent: async () => {},
};

test("AI events preserve harness usage without uploading content or double-counting totals", async () => {
  for (const [id, event, expectedType, exclusive] of [
    [
      "pi",
      {
        type: "message_end",
        message: {
          role: "assistant",
          content: "private output",
          usage: {
            input: 10,
            output: 5,
            cacheRead: 2,
            cacheWrite: 1,
            cost: { total: 0.01 },
          },
        },
      },
      "$ai_generation",
      true,
    ],
    [
      "claude",
      {
        type: "assistant",
        message: {
          id: "msg-1",
          content: "private output",
          usage: {
            input_tokens: 10,
            output_tokens: 5,
            cache_read_input_tokens: 2,
            cache_creation_input_tokens: 1,
          },
        },
      },
      "$ai_generation",
      true,
    ],
    [
      "opencode",
      {
        type: "step_finish",
        part: {
          id: "step-1",
          cost: 0.01,
          tokens: { input: 10, output: 5, cache: { read: 2, write: 1 } },
        },
      },
      "$ai_generation",
      true,
    ],
    [
      "codex",
      {
        type: "turn.completed",
        usage: { input_tokens: 10, output_tokens: 5, cached_input_tokens: 2 },
      },
      "$ai_span",
      false,
    ],
  ] as const) {
    const captured: Parameters<CaptureAi>[] = [];
    const harness: Harness = {
      id,
      title: id,
      provider: "openrouter",
      binary: id,
      supportsMcp: true,
      models: async () => [],
      run: async (request) => {
        await request.onRawEvent({ type: "turn.started" });
        await request.onRawEvent(event);
        if (id === "claude" || id === "opencode")
          await request.onRawEvent(event);
        await request.onRawEvent({
          type: "result",
          total_cost_usd: 0.01,
          usage: { input_tokens: 10, output_tokens: 5 },
        });
        return {
          label: "test",
          text: "private output",
          status: "completed",
          durationMs: 5,
        };
      },
    };
    await observedHarness(
      harness,
      (...args) => captured.push(args),
      "session-1",
      "agent",
    ).run(input);
    assert.equal(captured.length, 2);
    assert.equal(captured[0]?.[0], expectedType);
    assert.equal(captured[0]?.[1].$ai_input_tokens, 10);
    assert.equal(captured[0]?.[1].$ai_cache_read_input_tokens, 2);
    assert.equal(captured[0]?.[1].$ai_cache_reporting_exclusive, exclusive);
    assert.equal(captured[0]?.[1].$ai_parent_id, captured[1]?.[1].$ai_span_id);
    assert.equal(captured[1]?.[1].$ai_trace_id, "session-1");
    assert.equal(captured[1]?.[1].$ai_is_error, false);
    assert.doesNotMatch(JSON.stringify(captured), /private/);
  }
});

test("AI spans separate repeated judge attempts and retain failure without leaking errors", async () => {
  const captured: Parameters<CaptureAi>[] = [];
  const harness: Harness = {
    id: "pi",
    title: "Pi",
    provider: "openrouter",
    binary: null,
    supportsMcp: true,
    models: async () => [],
    run: async () => {
      throw new Error("private provider error");
    },
  };
  const observed = observedHarness(
    harness,
    (...args) => captured.push(args),
    "session-1",
    "judge",
  );
  await assert.rejects(observed.run(input), /private provider error/);
  await assert.rejects(observed.run(input), /private provider error/);
  assert.equal(captured.length, 2);
  assert.notEqual(captured[0]?.[1].$ai_span_id, captured[1]?.[1].$ai_span_id);
  assert.equal(captured[0]?.[1].$ai_is_error, true);
  assert.doesNotMatch(JSON.stringify(captured), /private/);
  await assert.rejects(
    observedHarness(
      harness,
      () => {
        throw new Error("telemetry failed");
      },
      "session-1",
      "agent",
    ).run(input),
    /private provider error/,
  );
});
