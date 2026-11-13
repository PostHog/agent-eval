import assert from "node:assert/strict";
import { rm, writeFile } from "node:fs/promises";
import { delimiter, join } from "node:path";
import { test } from "node:test";
import { ModelSettings } from "../src/evaluations/domain/model-settings.js";
import { ExternalHarness } from "../src/harnesses/infrastructure/external-harness.js";
import { fixture } from "./fixture.js";

test("Codex quota errors survive a nonzero exit with empty stderr", async () => {
  const f = await fixture();
  const previousPath = process.env.PATH;

  try {
    await writeFile(
      join(f.root, "codex"),
      `#!${process.execPath}\nconsole.log(JSON.stringify({type:"turn.failed",error:{message:"Quota exceeded. Check your plan and billing details."}}));\nprocess.exitCode=1;\n`,
      { mode: 0o700 },
    );

    process.env.PATH = `${f.root}${delimiter}${previousPath ?? ""}`;

    const settings = ModelSettings.create({
      harness: "codex",
      model: "test",
    }).value;
    const harness = new ExternalHarness("codex", "Codex", "openai");
    const result = await harness.run({
      label: "test",
      directory: f.root,
      workspace: f.workspace,
      skills: [],
      prompt: "Test",
      model: "test",
      effort: "low",
      tools: [],
      timeout: 5,
      maxTurns: 1,
      signal: new AbortController().signal,
      settings,
      onRawEvent: async () => {},
    });

    assert.equal(result.status, "failed");
    assert.match(result.error ?? "", /^Quota exceeded/);
    assert.match(result.error ?? "", /exited with code 1/);
  } finally {
    if (previousPath === undefined) delete process.env.PATH;
    else process.env.PATH = previousPath;

    await rm(f.root, { recursive: true, force: true });
  }
});
