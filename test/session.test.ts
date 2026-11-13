import assert from "node:assert/strict";
import { readdir, rm } from "node:fs/promises";

import { join } from "node:path";
import { test } from "node:test";
import { runSession } from "../src/harnesses/infrastructure/pi/session.js";

import { fixture } from "./fixture.js";

test("the Pi SDK records a model selection failure without a model request", async () => {
  const f = await fixture();

  const directory = join(f.root, "session");

  try {
    const result = await runSession({
      label: "test",
      directory,
      workspace: f.workspace,
      skills: [],
      prompt: "Test",
      model: "missing",
      effort: "off",
      tools: [],
      timeout: 600,
      maxTurns: 50,
      signal: new AbortController().signal,
    });

    assert.equal(result.status, "failed");

    assert.equal(result.usage?.total, 0);

    assert.equal(result.usage?.costUsd, 0);

    assert.match(result.error ?? "", /Unknown OpenRouter model/);

    const files = await readdir(directory);

    assert.ok(!files.includes("result.json"));
    assert.ok(!files.includes("events.jsonl"));
    assert.ok(!files.includes("prompt.txt"));
  } finally {
    await rm(f.root, { recursive: true, force: true });
  }
});
