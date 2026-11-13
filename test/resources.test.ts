import assert from "node:assert/strict";
import { readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { test } from "node:test";
import { createSession } from "../src/harnesses/infrastructure/pi/runtime.js";
import { fixture } from "./fixture.js";

test("Pi creates a session with only the supplied tools and skills", async () => {
  const f = await fixture();

  try {
    const session = await createSession({
      label: "test",
      directory: join(f.root, "session"),
      workspace: f.workspace,
      skills: [f.skill],
      prompt: "Test",
      model: "anthropic/claude-sonnet-4.5",
      effort: "off",
      tools: ["read", "web_fetch"],
      timeout: 600,
      maxTurns: 50,
      signal: new AbortController().signal,
    });

    try {
      assert.deepEqual(session.getActiveToolNames().sort(), [
        "read",
        "web_fetch",
      ]);

      assert.equal(session.model?.provider, "openrouter");

      assert.match(session.systemPrompt, /test-skill/);

      assert.match(
        await readFile(join(f.root, "session", "effective.json"), "utf8"),
        /test-skill/,
      );
    } finally {
      session.dispose();
    }
  } finally {
    await rm(f.root, { recursive: true, force: true });
  }
});
