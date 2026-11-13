import { stripVTControlCharacters } from "node:util";
import chalk from "chalk";
import { z } from "zod";

const object = (value: unknown) =>
  z.record(z.unknown()).safeParse(value).data ?? {};

export function nativeTrace(raw: unknown): string {
  const event = object(raw);
  const item = object(event.item);
  const part = object(event.part);
  const state = object(part.state);
  let text = "";

  if (["turn.started", "step_start"].includes(String(event.type)))
    text = "Starting turn";
  else if (event.type === "assistant") text = "Received model response";
  else if (event.type === "result")
    text = event.is_error ? "Failed" : "Completed";
  else if (event.type === "error") text = "Harness error";
  else if (item.type === "command_execution")
    text = `${event.type === "item.completed" ? "Finished" : "Running"} shell: ${String(item.command ?? "")}`;
  else if (part.type === "tool")
    text = `${String(state.status ?? "Tool")} ${String(part.tool ?? "")} ${String(state.title ?? "")}`;
  else if (item.type === "file_change") text = "Updated workspace files";

  const line = stripVTControlCharacters(text).replaceAll(/\s+/g, " ").trim();

  return line.length > 110 ? `${line.slice(0, 107)}...` : line;
}

export function printNativeTrace(label: string, event: unknown): void {
  const text = nativeTrace(event);

  if (text) process.stdout.write(`${chalk.cyan(`[${label}]`)} ${text}\n`);
}
