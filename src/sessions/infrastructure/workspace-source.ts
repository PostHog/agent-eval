import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import type { ExecutionSnapshot } from "../domain/execution-snapshot.js";
import { snapshot } from "./workspace-files.js";

type Environment = ExecutionSnapshot["environment"];

export async function prepareWorkspaceSource(
  environment: Environment,
  target: string,
  omit: string[],
): Promise<void> {
  if (environment?.workspacePath) {
    await snapshot(resolve(environment.workspacePath), target, omit);
    return;
  }

  if (environment?.repositoryUrl) {
    await cloneRepository(environment.repositoryUrl, target);
    return;
  }

  await mkdir(target, { recursive: true });
}

async function cloneRepository(repository: string, target: string) {
  await new Promise<void>((resolveClone, reject) => {
    const child = spawn(
      "git",
      ["clone", "--depth", "1", "--no-tags", "--", repository, target],
      { stdio: ["ignore", "ignore", "pipe"] },
    );
    let stderr = "";

    child.stderr.on("data", (chunk: Buffer) => {
      stderr = (stderr + chunk.toString()).slice(-8000);
    });
    child.once("error", reject);
    child.once("close", (code) => {
      if (code === 0) resolveClone();
      else
        reject(
          new Error(
            `Could not clone the environment repository (${code}): ${stderr.trim()}`,
          ),
        );
    });
  });
}
