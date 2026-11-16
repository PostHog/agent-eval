import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import type { ProcessCommand } from "../domain/execution.js";
import type { HarnessInput } from "../domain/harness.js";

// Native harnesses run as process groups so cancellation also stops their tool subprocesses.
export async function runProcess(command: ProcessCommand, input: HarnessInput) {
  const signal = AbortSignal.any([
    input.signal,
    AbortSignal.timeout(input.timeout * 1000),
  ]);

  signal.throwIfAborted();

  const child = spawn(command.binary, command.args, {
    cwd: input.workspace,
    env: { ...command.env, PWD: input.workspace },
    stdio: ["pipe", "pipe", "pipe"],
    detached: process.platform !== "win32",
  });
  let stderr = "";
  let failure: Error | undefined;
  let turns = 0;
  let pending = Promise.resolve();
  let forceStop: ReturnType<typeof setTimeout> | undefined;
  const kill = (signal: NodeJS.Signals) => {
    try {
      if (process.platform !== "win32" && child.pid)
        process.kill(-child.pid, signal);
      else child.kill(signal);
    } catch (error) {
      if (
        !(
          error &&
          typeof error === "object" &&
          "code" in error &&
          error.code === "ESRCH"
        )
      )
        failure ??= new Error(String(error));
    }
  };
  const stop = () => {
    kill("SIGTERM");
    forceStop ??= setTimeout(() => kill("SIGKILL"), 2000);
    forceStop.unref();
  };
  const lines = createInterface({ input: child.stdout });

  signal.addEventListener("abort", stop, { once: true });
  child.stderr.on("data", (chunk: Buffer) => {
    stderr = (stderr + chunk.toString()).slice(-8000);
  });
  child.stdin.on("error", (error: NodeJS.ErrnoException) => {
    if (error.code === "EPIPE") return;

    failure = error;
    stop();
  });

  lines.on("line", (line) => {
    let event: unknown;

    try {
      event = JSON.parse(line);
    } catch {
      event = { type: "output", text: line };
    }

    pending = pending
      .then(() => input.onRawEvent(event))
      .catch((error: unknown) => {
        failure = new Error(String(error));
        stop();
      });

    const type =
      event && typeof event === "object" && "type" in event ? event.type : "";

    if (
      ["turn.started", "assistant", "step_start"].includes(String(type)) &&
      ++turns > input.maxTurns
    ) {
      failure = new Error("The session reached the turn limit.");
      stop();
    }
  });

  child.stdin.end(input.prompt);

  try {
    const code = await new Promise<number | null>((resolve, reject) => {
      child.once("error", reject);
      child.once("close", resolve);
    });

    await pending;
    signal.throwIfAborted();

    if (failure) throw failure;
    if (code !== 0)
      throw new Error(`Harness exited with code ${code}. ${stderr}`);
  } finally {
    signal.removeEventListener("abort", stop);
    clearTimeout(forceStop);
    lines.close();
  }
}
