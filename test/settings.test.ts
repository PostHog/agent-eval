import assert from "node:assert/strict";
import { test } from "node:test";
import { SessionQueue } from "../src/sessions/application/session-queue.js";
import { ApplicationSettings } from "../src/settings/domain/application-settings.js";

test("application settings validate the session concurrency limit", () => {
  assert.equal(ApplicationSettings.defaults().value.sessionConcurrency, 2);
  assert.throws(() => ApplicationSettings.create({ sessionConcurrency: 0 }));
  assert.throws(() => ApplicationSettings.create({ sessionConcurrency: 33 }));
});

test("evaluation defaults validate model settings and permit empty selections", () => {
  const defaults = ApplicationSettings.defaults().value;

  assert.equal(defaults.evaluationDefaults.models.length, 6);
  assert.equal(defaults.evaluationDefaults.judge?.effort, "low");
  for (const model of defaults.evaluationDefaults.models) {
    assert.equal(model.effort, "high");
    assert.equal(model.count, 1);
    assert.equal(model.maxTurns, 100);
    assert.equal(model.timeoutSeconds, 600);
  }
  assert.deepEqual(
    ApplicationSettings.create({
      ...defaults,
      evaluationDefaults: { models: [], judge: null },
    }).value.evaluationDefaults,
    { models: [], judge: null },
  );
  for (const change of [
    { model: "" },
    { harness: "unknown" },
    { maxTurns: 0 },
    { timeoutSeconds: -1 },
    { effort: "invalid" },
  ]) {
    assert.throws(() =>
      ApplicationSettings.create({
        ...defaults,
        evaluationDefaults: {
          ...defaults.evaluationDefaults,
          models: [{ ...defaults.evaluationDefaults.models[0], ...change }],
        },
      }),
    );
  }
  assert.throws(() =>
    ApplicationSettings.create({
      ...defaults,
      evaluationDefaults: {
        ...defaults.evaluationDefaults,
        models: defaults.evaluationDefaults.models.map((model) => ({
          ...model,
          count: 100,
        })),
      },
    }),
  );
  defaults.evaluationDefaults.models.pop();
  assert.equal(
    ApplicationSettings.defaults().value.evaluationDefaults.models.length,
    6,
  );
});

test("the session queue applies a new concurrency limit", async () => {
  const queue = new SessionQueue();
  let active = 0;
  let peak = 0;

  queue.setConcurrency(3);

  await Promise.all(
    Array.from({ length: 3 }, () =>
      queue.run(async () => {
        active++;
        peak = Math.max(peak, active);
        await new Promise((resolve) => setTimeout(resolve, 10));
        active--;
      }),
    ),
  );

  assert.equal(peak, 3);
});
