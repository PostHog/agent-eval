import assert from "node:assert/strict";
import { test } from "node:test";
import type { AgentSessionEvent } from "@earendil-works/pi-coding-agent";
import { printTrace } from "../src/harnesses/infrastructure/pi/trace.js";

test("console traces show one-line tool details and omit results", () => {
  let output = "";

  const write = process.stdout.write;

  process.stdout.write = ((value: string) => {
    output += value;

    return true;
  }) as typeof process.stdout.write;

  try {
    printTrace("agent-001", {
      type: "tool_execution_start",
      toolCallId: "1",
      toolName: "bash",
      args: { command: "npm run build\ncat private-file" },
    } as AgentSessionEvent);

    printTrace("agent-001", {
      type: "tool_execution_end",
      toolCallId: "1",
      toolName: "bash",
      result: { output: "private result" },
      isError: false,
      durationMs: 1100,
    } as AgentSessionEvent);
  } finally {
    process.stdout.write = write;
  }

  assert.match(output, /… bash npm run build cat private-file/);

  assert.match(output, /✓ bash \(1\.1s\)/);

  assert.doesNotMatch(output, /private result/);
});
