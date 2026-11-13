import { stripVTControlCharacters } from "node:util";
import type { AgentSessionEvent } from "@earendil-works/pi-coding-agent";
import chalk from "chalk";

function oneLine(value: unknown): string {
  if (typeof value !== "string") return "";

  const line = value.replaceAll(/\s+/g, " ").trim();

  return line.length > 90 ? `${line.slice(0, 87)}...` : line;
}

function toolDetail(toolName: string, args: unknown): string {
  if (!args || typeof args !== "object") return "";

  const values = args as Record<string, unknown>;

  if (toolName === "bash") return oneLine(values.command);

  if (toolName === "web_fetch") return oneLine(values.url);

  if (["read", "edit", "write", "ls"].includes(toolName))
    return oneLine(values.path);

  if (toolName === "grep" || toolName === "find") {
    const pattern = oneLine(values.pattern);
    const path = oneLine(values.path) || ".";

    return pattern ? `${pattern} in ${path}` : path;
  }

  return "";
}

export function printTrace(label: string, event: AgentSessionEvent): void {
  let text: string;

  switch (event.type) {
    case "turn_start":
      text = "Starting turn";
      break;
    case "message_end":
      if (
        event.message.role !== "assistant" ||
        event.message.stopReason === "toolUse"
      )
        return;

      text = event.message.content
        .filter((part) => part.type === "text")
        .map((part) => part.text)
        .join("\n");
      break;
    case "tool_execution_start":
      text =
        `… ${event.toolName} ${toolDetail(event.toolName, event.args)}`.trim();
      break;
    case "tool_execution_end":
      text = `${event.isError ? "✗" : "✓"} ${event.toolName}${event.durationMs ? ` (${(event.durationMs / 1000).toFixed(1)}s)` : ""}`;
      break;
    default:
      return;
  }

  for (const line of stripVTControlCharacters(text).split("\n")) {
    const prefix = chalk.cyan(`[${label}]`);

    process.stdout.write(`${prefix} ${line}\n`);
  }
}
