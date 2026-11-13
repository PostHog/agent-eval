import assert from "node:assert/strict";
import { rm } from "node:fs/promises";
import { join } from "node:path";
import { test } from "node:test";
import { Criterion } from "../src/evaluations/domain/criterion.js";
import { ModelSettings } from "../src/evaluations/domain/model-settings.js";
import type {
  Harness,
  HarnessInput,
  HarnessResult,
} from "../src/harnesses/domain/harness.js";
import { judgeSession } from "../src/sessions/application/judge-session.js";
import { parseJudgment } from "../src/sessions/domain/judgment.js";
import { fixture } from "./fixture.js";

const criterion = Criterion.create("The build passes.");
const decision = {
  criterionId: criterion.id,
  passed: false,
  feedback: "No build output.",
};
const valid = { summary: "Build not verified.", decisions: [decision] };
const placeholder = { ...decision, criterionId: "ab42bb-placeholder" };
const invalid = { ...valid, decisions: [placeholder, decision] };

test("judgments reject extra, missing, duplicate, and unknown criterion IDs", () => {
  assert.deepEqual(parseJudgment(valid, [criterion.id]), valid);

  for (const decisions of [
    [],
    [decision, decision],
    [placeholder, decision],
    [{ ...decision, criterionId: crypto.randomUUID() }],
  ])
    assert.throws(
      () => parseJudgment({ ...valid, decisions }, [criterion.id]),
      /judge/i,
    );
});

test("judge retries malformed reports once, retains evidence, and counts both attempts", async () => {
  const f = await fixture();
  const settings = ModelSettings.create({ model: "test" }).value;
  const calls: HarnessInput[] = [];
  const events: unknown[] = [];
  const input: HarnessInput = {
    label: "judge",
    directory: f.root,
    workspace: f.workspace,
    skills: [],
    prompt: "Original evidence",
    model: "test",
    effort: "low",
    tools: [],
    timeout: 10,
    maxTurns: 2,
    signal: new AbortController().signal,
    settings,
    onRawEvent: async (event) => {
      events.push(event);
    },
  };
  const result = (text: string): HarnessResult => ({
    label: "judge",
    status: "completed",
    text,
    durationMs: 10,
    usage: {
      input: 10,
      output: 5,
      cacheRead: 2,
      cacheWrite: 0,
      total: 17,
      costUsd: 0.01,
    },
  });
  let responses: HarnessResult[] = [];
  const harness: Harness = {
    id: "pi",
    title: "Test",
    provider: "openrouter",
    binary: null,
    supportsMcp: false,
    models: async () => [],
    run: async (request) => {
      calls.push(request);

      const response = responses.shift();

      assert.ok(response, "No more than the expected judge calls are allowed");

      return response;
    },
  };

  try {
    responses = [
      result(JSON.stringify(invalid)),
      result(JSON.stringify(valid)),
    ];

    const repaired = await judgeSession(harness, input, [criterion.id]);

    assert.equal(repaired.status, "completed");
    assert.equal(calls.length, 2);
    assert.equal(calls[1]?.directory, join(f.root, "retry"));
    assert.match(calls[1]?.prompt ?? "", /Original evidence/);
    assert.ok(calls[1]?.prompt.includes(criterion.id));
    assert.equal(events.length, 1);
    assert.equal(repaired.usage?.total, 34);
    assert.equal(repaired.usage?.costUsd, 0.02);
    assert.equal(repaired.durationMs, 20);

    responses = [result("not JSON"), result(JSON.stringify(invalid))];

    const failed = await judgeSession(harness, input, [criterion.id]);

    assert.equal(failed.status, "failed");
    assert.match(failed.error ?? "", /invalid after one retry/);
    assert.equal(failed.usage?.costUsd, 0.02);

    responses = [{ ...result(""), status: "failed", error: "Quota exceeded" }];

    assert.equal(
      (await judgeSession(harness, input, [criterion.id])).error,
      "Quota exceeded",
    );
    assert.equal(calls.length, 5);

    const unpriced = result(JSON.stringify(valid));

    assert.ok(unpriced.usage);

    unpriced.usage.costUsd = null;
    responses = [result("not JSON"), unpriced];

    assert.equal(
      (await judgeSession(harness, input, [criterion.id])).usage?.costUsd,
      null,
    );

    const controller = new AbortController();
    const callsBeforeCancel = calls.length;

    responses = [result("not JSON")];

    const cancelled = await judgeSession(
      harness,
      {
        ...input,
        signal: controller.signal,
        onRawEvent: async () => controller.abort(new Error("Cancelled")),
      },
      [criterion.id],
    );

    assert.equal(cancelled.status, "failed");
    assert.match(cancelled.error ?? "", /Cancelled/);
    assert.equal(cancelled.usage?.costUsd, 0.01);
    assert.equal(calls.length, callsBeforeCancel + 1);
  } finally {
    await rm(f.root, { recursive: true, force: true });
  }
});
