import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { ProcessCommand } from "../domain/execution.js";
import type { HarnessInput } from "../domain/harness.js";

export async function externalCommand(
  id: "codex" | "claude" | "opencode",
  input: HarnessInput,
): Promise<ProcessCommand> {
  const model = input.settings.model;
  const effort = input.settings.effort;
  const env = input.runtime?.kind === "docker" ? {} : { ...process.env };

  for (const key of [
    "OPENAI_API_KEY",
    "CODEX_API_KEY",
    "ANTHROPIC_API_KEY",
    "OPENROUTER_API_KEY",
  ])
    delete env[key];

  // Only Claude Code can limit which MCP tools are callable. Never ignore a tool limit silently.
  if (id !== "claude" && input.mcps?.some((server) => server.allowedTools))
    throw new Error(`The ${id} harness cannot limit MCP tools.`);

  const tokenVariable = (index: number) => `AGENT_EVAL_MCP_TOKEN_${index}`;
  for (const [index, server] of (input.mcps ?? []).entries()) {
    if (server.accessToken) env[tokenVariable(index)] = server.accessToken;
  }

  if (id === "codex") {
    // Codex accepts a per-run key without redefining its reserved OpenAI provider.
    env.CODEX_API_KEY = input.apiKey;

    // With approval_policy="never", Codex rejects MCP calls unless each configured server pre-approves its tools.
    const mcpArgs = (input.mcps ?? []).flatMap((server, index) => [
      ...(server.url
        ? ["-c", `mcp_servers.eval_${index}.url=${JSON.stringify(server.url)}`]
        : [
            "-c",
            `mcp_servers.eval_${index}.command=${JSON.stringify(server.command)}`,
            "-c",
            `mcp_servers.eval_${index}.args=${JSON.stringify(server.arguments)}`,
          ]),
      ...(server.accessToken
        ? [
            "-c",
            `mcp_servers.eval_${index}.bearer_token_env_var=${JSON.stringify(tokenVariable(index))}`,
          ]
        : []),
      "-c",
      `mcp_servers.eval_${index}.default_tools_approval_mode="approve"`,
    ]);

    return {
      binary: "codex",
      args: [
        "exec",
        "--json",
        "--ephemeral",
        "--ignore-user-config",
        "--skip-git-repo-check",
        "--sandbox",
        input.runtime?.kind === "docker"
          ? "danger-full-access"
          : input.tools.length
            ? "workspace-write"
            : "read-only",
        "-c",
        "sandbox_workspace_write.network_access=true",
        "-c",
        'approval_policy="never"',
        "-c",
        'model_provider="openai"',
        "-c",
        `model_reasoning_effort=${JSON.stringify(effort === "off" || effort === "minimal" ? "low" : effort)}`,
        "--model",
        model,
        ...mcpArgs,
        "-",
      ],
      env,
    };
  }

  if (id === "claude") {
    env.ANTHROPIC_API_KEY = input.apiKey;

    const path = join(input.directory, "mcp-config.json");

    await writeFile(
      path,
      JSON.stringify({
        mcpServers: Object.fromEntries(
          (input.mcps ?? []).map((server, index) => [
            `eval_${index}`,
            server.url
              ? {
                  type: "http",
                  url: server.url,
                  ...(server.accessToken && {
                    headers: {
                      Authorization: `Bearer \${${tokenVariable(index)}}`,
                    },
                  }),
                }
              : { command: server.command, args: server.arguments },
          ]),
        ),
      }),
    );

    return {
      binary: "claude",
      args: [
        "--print",
        "--bare",
        "--verbose",
        "--output-format",
        "stream-json",
        "--model",
        model,
        "--effort",
        effort === "off" || effort === "minimal" ? "low" : effort,
        "--permission-mode",
        "acceptEdits",
        "--allowedTools",
        [
          "Bash",
          "Read",
          "Edit",
          "Write",
          "Glob",
          "Grep",
          "WebFetch",
          "WebSearch",
          ...(input.mcps ?? []).flatMap((server, index) =>
            server.allowedTools
              ? server.allowedTools.map(
                  (tool) => `mcp__eval_${index}__${claudeToolName(tool)}`,
                )
              : [`mcp__eval_${index}__*`],
          ),
        ].join(","),
        ...(input.tools.length ? [] : ["--tools", ""]),
        "--strict-mcp-config",
        "--mcp-config",
        path,
      ],
      env,
    };
  }

  env.OPENROUTER_API_KEY = input.apiKey;
  env.OPENCODE_CONFIG_CONTENT = JSON.stringify({
    provider: { openrouter: { options: { apiKey: input.apiKey } } },
    mcp: Object.fromEntries(
      (input.mcps ?? []).map((server, index) => [
        `eval_${index}`,
        server.url
          ? {
              type: "remote",
              url: server.url,
              oauth: false,
              ...(server.accessToken && {
                headers: {
                  Authorization: `Bearer {env:${tokenVariable(index)}}`,
                },
              }),
            }
          : { type: "local", command: [server.command, ...server.arguments] },
      ]),
    ),
    permission: input.tools.length ? "allow" : "deny",
  });

  // Docker installs the published v1 CLI; local runs use v2's private server.
  const docker = input.runtime?.kind === "docker";

  return {
    binary: "opencode",
    args: [
      "run",
      ...(docker ? [] : ["--standalone"]),
      "--format",
      "json",
      "--model",
      docker ? model : `${model}${effort === "off" ? "" : `#${effort}`}`,
      ...(docker && effort !== "off" ? ["--variant", effort] : []),
    ],
    env,
  };
}

// Claude Code replaces characters outside letters, digits, underscores, and hyphens in MCP tool names.
function claudeToolName(tool: string): string {
  return tool.replaceAll(/[^a-zA-Z0-9_-]/g, "_");
}
