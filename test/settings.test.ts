import assert from "node:assert/strict";
import { test } from "node:test";
import { SessionQueue } from "../src/sessions/application/session-queue.js";
import { ApplicationSettings } from "../src/settings/domain/application-settings.js";

test("application settings validate the session concurrency limit", () => {
  assert.equal(ApplicationSettings.defaults().value.sessionConcurrency, 2);
  assert.throws(() => ApplicationSettings.create({ sessionConcurrency: 0 }));
  assert.throws(() => ApplicationSettings.create({ sessionConcurrency: 33 }));
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
