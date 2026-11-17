import { homedir } from "node:os";
import { join, resolve } from "node:path";

export function resolveDataDirectory(
  directory = process.env.AGENT_EVAL_DATA_DIR || join(homedir(), ".agent-eval"),
): string {
  return resolve(directory);
}
