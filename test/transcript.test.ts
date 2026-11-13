import assert from "node:assert/strict";
import { test } from "node:test";
import { buildTranscript } from "../web/src/sessions/transcript/transcript.js";
import type { EventRow } from "../web/src/types.js";

function rows(...events: unknown[]): EventRow[] {
  return events.map((event, index) => ({
    id: index + 1,
    sequence: index + 1,
    phase: "agent",
    createdAt: "2026-11-12T12:00:00Z",
    event,
  }));
}

test("Pi transcript joins tool results to calls and omits stream deltas", () => {
  const result = buildTranscript(
    rows(
      {
        type: "tool_execution_start",
        toolCallId: "call-1",
        toolName: "bash",
        args: { command: "npm run build" },
      },
      { type: "message_update", assistantMessageEvent: { delta: "partial" } },
      {
        type: "tool_execution_end",
        toolCallId: "call-1",
        toolName: "bash",
        result: { content: [{ type: "text", text: "Build passed" }] },
      },
      {
        type: "message_end",
        message: {
          role: "assistant",
          content: [
            { type: "text", text: "**Done**" },
            { type: "thinking", thinking: "Check the output." },
          ],
        },
      },
    ),
  );

  assert.equal(result.length, 3);
  assert.equal(result[0]?.text, "npm run build");
  assert.equal(result[0]?.output, "Build passed");
  assert.equal(result[0]?.sequence, 1);
  assert.equal(result[0]?.status, "passed");
  assert.equal(result[2]?.kind, "thinking");
});

test("Codex updates one command row and retains failed exit status", () => {
  const result = buildTranscript(
    rows(
      {
        type: "item.started",
        item: { id: "one", type: "command_execution", command: "npm test" },
      },
      {
        type: "item.completed",
        item: {
          id: "one",
          type: "command_execution",
          command: "npm test",
          exit_code: 1,
          aggregated_output: "Test failed",
        },
      },
    ),
  );

  assert.equal(result.length, 1);
  assert.equal(result[0]?.status, "failed");
  assert.equal(result[0]?.output, "Test failed");
});

test("Claude pairs tool messages and does not repeat its final response", () => {
  const result = buildTranscript(
    rows(
      {
        type: "assistant",
        message: {
          content: [
            {
              type: "tool_use",
              id: "read-1",
              name: "Read",
              input: { file_path: "app.ts" },
            },
          ],
        },
      },
      {
        type: "user",
        message: {
          content: [
            {
              type: "tool_result",
              tool_use_id: "read-1",
              content: "Source code",
            },
          ],
        },
      },
      {
        type: "assistant",
        message: { content: [{ type: "text", text: "Done" }] },
      },
      { type: "result", result: "Done" },
    ),
  );

  assert.equal(result.length, 2);
  assert.equal(result[0]?.title, "Read");
  assert.equal(result[0]?.output, "Source code");
});

test("OpenCode shows web evidence and ignores unknown events safely", () => {
  const result = buildTranscript(
    rows(null, "unknown", {
      type: "tool_use",
      part: {
        id: "part",
        callID: "web-1",
        type: "tool",
        tool: "webfetch",
        state: {
          status: "completed",
          input: { url: "https://posthog.com/docs" },
          output: "Docs",
        },
      },
    }),
  );

  assert.equal(result.length, 1);
  assert.equal(result[0]?.kind, "web");
  assert.equal(result[0]?.text, "https://posthog.com/docs");
  assert.equal(result[0]?.output, "Docs");
});
