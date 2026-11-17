import assert from "node:assert/strict";
import { rm } from "node:fs/promises";
import { join } from "node:path";
import { test } from "node:test";
import type { HarnessRequest } from "../src/harnesses/domain/execution.js";
import { connectMcpTools } from "../src/harnesses/infrastructure/pi/mcp-tools.js";
import { fixture } from "./fixture.js";

test("Pi registers only allowed MCP tools when a list is given", async () => {
  const f = await fixture();
  const server = {
    title: "Docs",
    command: process.execPath,
    arguments: [join(import.meta.dir, "fake-mcp-server.ts")],
  };
  const request = (
    mcps: NonNullable<HarnessRequest["mcps"]>,
  ): HarnessRequest => ({
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
    signal: new AbortController().signal,
    mcps,
  });

  try {
    // Agents get every tool from the server.
    const agent = await connectMcpTools(request([server]));

    await agent.close();
    assert.deepEqual(agent.tools.map((tool) => tool.label).sort(), [
      "Docs: delete_doc",
      "Docs: read_doc",
    ]);

    // Judges get only the allowed tools. Unknown names add nothing.
    const judge = await connectMcpTools(
      request([{ ...server, allowedTools: ["read_doc", "missing_tool"] }]),
    );

    await judge.close();
    assert.deepEqual(
      judge.tools.map((tool) => tool.label),
      ["Docs: read_doc"],
    );
  } finally {
    await rm(f.root, { recursive: true, force: true });
  }
});
