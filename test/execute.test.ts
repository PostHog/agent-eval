import assert from "node:assert/strict";
import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { test } from "node:test";
import type { AgentSessionEvent } from "@earendil-works/pi-coding-agent";
import type { HarnessRequest } from "../src/harnesses/domain/execution.js";
import { executeSession } from "../src/harnesses/infrastructure/pi/execute.js";
import { fixture } from "./fixture.js";

type ExecutableSession = Parameters<typeof executeSession>[0];

function fakeSession(event?: AgentSessionEvent): ExecutableSession {
  let listener: (event: AgentSessionEvent) => void = () => {};

  let finish: () => void = () => {};

  return {
    messages: [],
    subscribe: (callback) => {
      listener = callback;

      return () => {};
    },
    prompt: async () =>
      new Promise<void>((resolve) => {
        finish = resolve;

        if (event) listener(event);
      }),
    abort: async () => finish(),
    getLastAssistantText: () => "Done",
  };
}

const turn: AgentSessionEvent = {
  type: "turn_end",
  toolResults: [],
  message: {
    role: "assistant",
    content: [],
    api: "anthropic-messages",
    provider: "anthropic",
    model: "test",
    stopReason: "toolUse",
    timestamp: 0,
    usage: {
      input: 0,
      output: 0,
      cacheRead: 0,
      cacheWrite: 0,
      totalTokens: 0,
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
    },
  },
};

test("execution stops on timeout, turn limit, and interruption", async () => {
  const f = await fixture();

  const directory = join(f.root, "execution");

  const controller = new AbortController();

  const request: HarnessRequest = {
    label: "test",
    directory,
    workspace: f.workspace,
    skills: [],
    prompt: "Test",
    model: "anthropic/claude-sonnet-4.5",
    effort: "off",
    tools: [],
    timeout: 0.01,
    maxTurns: 1,
    signal: controller.signal,
  };

  await mkdir(directory);

  try {
    await assert.rejects(executeSession(fakeSession(), request), /time limit/);

    await assert.rejects(
      executeSession(fakeSession(turn), request),
      /turn limit/,
    );

    const events: unknown[] = [];

    await assert.rejects(
      executeSession(fakeSession(turn), {
        ...request,
        onRawEvent: async (event) => {
          await Promise.resolve();

          events.push(event);
        },
      }),
      /turn limit/,
    );

    assert.deepEqual(events, [turn]);

    await assert.rejects(
      executeSession(fakeSession(turn), {
        ...request,
        timeout: 1,
        maxTurns: 2,
        onRawEvent: async () => {
          throw new Error("Database unavailable");
        },
      }),
      /Cannot save the trace:.*Database unavailable/,
    );

    const pending = executeSession(fakeSession(), request);

    controller.abort();

    await assert.rejects(pending, /interrupted/);
  } finally {
    await rm(f.root, { recursive: true, force: true });
  }
});
