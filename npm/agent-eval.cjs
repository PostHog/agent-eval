#!/usr/bin/env node
const { spawn } = require("node:child_process");
const { join } = require("node:path");

const binaries = {
  "darwin-arm64": "agent-eval-darwin-arm64",
  "darwin-x64": "agent-eval-darwin-x64",
  "linux-arm64": "agent-eval-linux-arm64",
  "linux-x64": "agent-eval-linux-x64",
  "win32-x64": "agent-eval-windows-x64.exe",
};

function binaryName(platform, architecture) {
  const name = binaries[`${platform}-${architecture}`];
  if (!name) {
    throw new Error(`agent-eval does not support ${platform}/${architecture}.`);
  }
  return name;
}

function main() {
  const executable = join(
    __dirname,
    "..",
    "binaries",
    binaryName(process.platform, process.arch),
  );
  const child = spawn(executable, process.argv.slice(2), { stdio: "inherit" });

  // Forward signals sent to the npm launcher so the server can shut down cleanly.
  const handlers = ["SIGINT", "SIGTERM", "SIGHUP"].map((signal) => {
    const handler = () => child.kill(signal);
    process.on(signal, handler);
    return [signal, handler];
  });
  child.once("error", (error) => {
    console.error(`Could not start agent-eval: ${error.message}`);
    process.exitCode = 1;
  });
  child.once("close", (code, signal) => {
    for (const [name, handler] of handlers)
      process.removeListener(name, handler);
    if (signal) process.kill(process.pid, signal);
    else process.exitCode = code !== null && code >= 0 ? code : 1;
  });
}

module.exports = { binaries, binaryName };

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
