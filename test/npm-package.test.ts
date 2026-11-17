import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import {
  mkdtemp,
  readdir,
  readFile,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import { packageNpm } from "../scripts/package-npm.js";

const require = createRequire(import.meta.url);
const { binaries, binaryName } = require("../npm/agent-eval.cjs") as {
  binaries: Record<string, string>;
  binaryName: (platform: string, architecture: string) => string;
};

test("npm package includes all targets, no runtime dependencies, and rejects incomplete releases", async () => {
  const root = await mkdtemp(join(tmpdir(), "agent-eval-npm-"));
  const output = join(root, "package");
  try {
    await assert.rejects(packageNpm(root, output), /ENOENT/);
    for (const name of Object.values(binaries))
      await writeFile(join(root, name), name);
    await assert.rejects(
      packageNpm(root, output, "v0.0.0-wrong"),
      /does not match/,
    );
    await packageNpm(root, output);
    const manifest = JSON.parse(
      await readFile(join(output, "package.json"), "utf8"),
    );
    assert.equal(manifest.name, "@posthog/agent-eval");
    assert.equal(manifest.bin["agent-eval"], "bin/agent-eval.cjs");
    assert.equal(manifest.private, undefined);
    assert.equal(manifest.dependencies, undefined);
    assert.equal(manifest.optionalDependencies, undefined);
    assert.equal(manifest.scripts, undefined);
    assert.deepEqual(
      (await readdir(join(output, "binaries"))).sort(),
      Object.values(binaries).sort(),
    );
    assert.equal(Object.keys(binaries).length, 5);
    assert.equal(binaryName("win32", "x64"), "agent-eval-windows-x64.exe");
    assert.throws(() => binaryName("win32", "arm64"), /does not support/);
    assert.throws(() => binaryName("freebsd", "x64"), /does not support/);
    if (process.platform !== "win32") {
      assert.equal(
        (
          await stat(
            join(
              output,
              "binaries",
              binaryName(process.platform, process.arch),
            ),
          )
        ).mode & 0o777,
        0o755,
      );
    }
    await writeFile(join(root, binaryName("linux", "x64")), "");
    await assert.rejects(packageNpm(root, output), /Invalid binary/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("npm launcher forwards arguments, terminal IO, signals, exit codes, and spawn errors", async () => {
  const source = await readFile(
    new URL("../npm/agent-eval.cjs", import.meta.url),
    "utf8",
  );
  const child = new EventEmitter();
  const forwarded: string[] = [];
  Object.assign(child, { kill: (signal: string) => forwarded.push(signal) });
  const signals: string[] = [];
  const errors: string[] = [];
  const fakeProcess = Object.assign(new EventEmitter(), {
    platform: "linux",
    arch: "x64",
    pid: 123,
    argv: [
      "node",
      "launcher.cjs",
      "--data",
      "folder with spaces",
      "--port",
      "3210",
    ],
    exitCode: undefined as number | undefined,
    kill: (_pid: number, signal: string) => signals.push(signal),
  });
  const module = { exports: {} };
  const mockRequire = Object.assign(
    (id: string) => {
      if (id !== "node:child_process") return require(id);
      return {
        spawn: (file: string, args: string[], options: { stdio: string }) => {
          assert.equal(
            file,
            join("package", "binaries", "agent-eval-linux-x64"),
          );
          assert.deepEqual(Array.from(args), fakeProcess.argv.slice(2));
          assert.equal(options.stdio, "inherit");
          return child;
        },
      };
    },
    { main: module },
  );
  const launch = () =>
    runInNewContext(source, {
      require: mockRequire,
      module,
      __dirname: join("package", "bin"),
      process: fakeProcess,
      console: { error: (message: string) => errors.push(message) },
    });

  launch();
  fakeProcess.emit("SIGTERM");
  assert.deepEqual(forwarded, ["SIGTERM"]);
  child.emit("close", 17, null);
  assert.equal(fakeProcess.exitCode, 17);
  assert.equal(fakeProcess.listenerCount("SIGTERM"), 0);
  child.removeAllListeners();
  launch();
  child.emit("close", null, "SIGINT");
  assert.deepEqual(signals, ["SIGINT"]);
  child.removeAllListeners();
  launch();
  child.emit("error", new Error("ENOENT"));
  child.emit("close", -2, null);
  assert.match(errors[0] ?? "", /Could not start agent-eval: ENOENT/);
  assert.notEqual(fakeProcess.exitCode, 0);
});
