import assert from "node:assert/strict";
import { test } from "node:test";
import { summarizeRun } from "../web/src/status/run-progress.js";

test("run progress separates active work from finished sessions and acceptance", () => {
  const progress = summarizeRun([
    { status: "queued" },
    { status: "running" },
    { status: "judging" },
    { status: "completed" },
    { status: "failed" },
    { status: "cancelled" },
  ]);

  assert.equal(progress.active, true);
  assert.equal(progress.total, 6);
  assert.equal(progress.finished, 3);
  assert.equal(progress.counts.completed, 1);
  assert.equal(progress.counts.failed, 1);
  assert.equal(progress.counts.cancelled, 1);

  const failed = summarizeRun([{ status: "failed" }, { status: "failed" }]);

  assert.equal(failed.active, false);
  assert.equal(failed.finished, failed.total);
  assert.equal(failed.counts.completed, 0);
});

test("empty and unknown states do not invent progress", () => {
  const empty = summarizeRun([]);
  const unknown = summarizeRun([{ status: "unknown" }]);

  assert.equal(empty.total, 0);
  assert.equal(empty.finished, 0);
  assert.equal(empty.active, false);
  assert.equal(unknown.total, 1);
  assert.equal(unknown.finished, 0);
});
