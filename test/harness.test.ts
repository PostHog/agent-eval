import assert from "node:assert/strict";
import { realpath, rm } from "node:fs/promises";
import { test } from "node:test";
import { ModelSettings } from "../src/evaluations/domain/model-settings.js";
import type { HarnessInput } from "../src/harnesses/domain/harness.js";
import { externalCommand } from "../src/harnesses/infrastructure/external-command.js";
import { summarizeEvents } from "../src/harnesses/infrastructure/external-events.js";
import { runProcess } from "../src/harnesses/infrastructure/process-runner.js";
import { fixture } from "./fixture.js";

test("native adapters keep credentials out of arguments and disable judge tools", async () => {
  const f = await fixture();

  try {
    const input: HarnessInput = {
      label: "judge",
      directory: f.root,
      workspace: f.workspace,
      skills: [],
      prompt: "Test",
      model: "test",
      effort: "low",
      tools: [],
      timeout: 10,
      maxTurns: 2,
      apiKey: "secret-key",
      signal: new AbortController().signal,
      settings: { ...ModelSettings.create({ model: "test" }).value },
      onRawEvent: async () => {},
    };

    for (const id of ["codex", "claude", "opencode"] as const) {
      const command = await externalCommand(id, input);

      assert.doesNotMatch(JSON.stringify(command.args), /secret-key/);

      if (id === "codex") {
        assert.ok(command.args.includes("read-only"));
        assert.equal(command.env.CODEX_API_KEY, "secret-key");
        assert.equal(command.env.OPENAI_API_KEY, undefined);
        assert.ok(
          !command.args.some((argument) =>
            argument.startsWith("model_providers.openai."),
          ),
        );
      }
      if (id === "claude")
        assert.equal(command.args[command.args.indexOf("--tools") + 1], "");
      if (id === "opencode") {
        assert.ok(command.args.includes("--standalone"));

        assert.equal(
          JSON.parse(command.env.OPENCODE_CONFIG_CONTENT ?? "{}").permission,
          "deny",
        );
      }
    }

    const events: unknown[] = [];

    await runProcess(
      {
        binary: process.execPath,
        args: [
          "-e",
          'console.log(JSON.stringify({type:"result",result:process.env.PWD,cwd:process.cwd()}))',
        ],
        env: { ...process.env, PWD: f.root },
      },
      {
        ...input,
        onRawEvent: async (event) => {
          events.push(event);
        },
      },
    );

    assert.equal(summarizeEvents(events).text, f.workspace);

    assert.deepEqual(events, [
      { type: "result", result: f.workspace, cwd: await realpath(f.workspace) },
    ]);

    await assert.rejects(
      runProcess(
        {
          binary: process.execPath,
          args: ["-e", "setInterval(()=>{},1000)"],
          env: process.env,
        },
        { ...input, signal: AbortSignal.timeout(30) },
      ),
      /abort|timeout/i,
    );
  } finally {
    await rm(f.root, { recursive: true, force: true });
  }
});

test("native errors preserve provider messages from structured stdout", () => {
  const message = "Quota exceeded. Check your plan and billing details.";

  assert.equal(summarizeEvents([{ type: "error", message }]).error, message);
  assert.equal(
    summarizeEvents([{ type: "turn.failed", error: { message } }]).error,
    message,
  );
  assert.equal(
    summarizeEvents([{ type: "error", error: { data: { message } } }]).error,
    message,
  );
  assert.equal(
    summarizeEvents([
      { type: "result", is_error: true, result: "Authentication failed" },
    ]).error,
    "Authentication failed",
  );
});

test("native usage distinguishes unavailable cost and avoids double-counting Codex cached input", () => {
  const codex = summarizeEvents([
    {
      type: "turn.completed",
      usage: { input_tokens: 100, output_tokens: 10, cached_input_tokens: 50 },
    },
  ]);

  assert.equal(codex.usage?.total, 110);

  assert.equal(codex.usage?.costUsd, null);

  const claude = summarizeEvents([
    {
      type: "result",
      result: "Done",
      total_cost_usd: 0.03,
      usage: {
        input_tokens: 10,
        output_tokens: 20,
        cache_read_input_tokens: 30,
        cache_creation_input_tokens: 5,
      },
    },
  ]);

  assert.equal(claude.usage?.total, 65);

  assert.equal(claude.usage?.costUsd, 0.03);
});
