import assert from "node:assert/strict";
import {
  chmod,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";
import { test } from "node:test";
import { DefaultWorkspaceRuntimeFactory } from "../src/sessions/infrastructure/workspace-runtime-factory.js";

test(
  "a Docker runtime routes processes and shell commands through one container",
  {
    skip:
      process.platform === "win32" ? "Requires a Unix Docker fixture." : false,
  },
  async () => {
    const root = await mkdtemp(join(tmpdir(), "agent-eval-docker-"));
    const bin = join(root, "bin");
    const workspace = join(root, "workspace");
    const dockerfile = join(root, "Dockerfile");
    const log = join(root, "docker.log");
    const previousPath = process.env.PATH;
    const previousLog = process.env.AGENT_EVAL_DOCKER_LOG;

    try {
      await mkdir(bin);
      await mkdir(workspace);
      await writeFile(dockerfile, "FROM scratch\n");
      await writeFile(
        join(bin, "docker"),
        '#!/bin/sh\necho "$@" >> "$AGENT_EVAL_DOCKER_LOG"\ncase "$1" in\n  build) echo sha256:test ;;\n  run) echo container-test ;;\nesac\n',
      );
      await chmod(join(bin, "docker"), 0o700);
      process.env.PATH = `${bin}${delimiter}${previousPath ?? ""}`;
      process.env.AGENT_EVAL_DOCKER_LOG = log;

      const runtime = await new DefaultWorkspaceRuntimeFactory().create(
        {
          title: "Docker",
          workspacePath: null,
          repositoryUrl: null,
          executionMode: "docker",
          dockerfilePath: dockerfile,
          dockerfileContent: null,
        },
        root,
        workspace,
        new AbortController().signal,
        "codex",
      );
      const command = await runtime.process(
        {
          binary: "hog",
          args: ["--version"],
          env: { ...process.env, HOG_TEST_KEY: "secret" },
        },
        workspace,
      );

      assert.equal(runtime.kind, "docker");
      assert.equal(command.binary, "docker");
      assert.deepEqual(command.args.slice(0, 5), [
        "exec",
        "--interactive",
        "--workdir",
        "/agent-eval/workspace",
        "--env-file",
      ]);
      assert.deepEqual(command.args.slice(-3), [
        "container-test",
        "hog",
        "--version",
      ]);
      assert.match(
        await readFile(command.args[5] ?? "", "utf8"),
        /HOG_TEST_KEY=secret/,
      );
      assert.match(
        await readFile(join(root, "docker-build", "Dockerfile"), "utf8"),
        /RUN npm install --global @openai\/codex@0\.169\.0/,
      );

      await runtime.shell("hog --version", workspace, {
        onData: () => {},
        env: { ...process.env, HOG_SHELL_KEY: "shell-secret" },
      });
      await runtime.close();

      const inline = await new DefaultWorkspaceRuntimeFactory().create(
        {
          title: "Inline Dockerfile",
          workspacePath: null,
          repositoryUrl: null,
          executionMode: "docker",
          dockerfilePath: null,
          dockerfileContent: "FROM scratch\n",
        },
        root,
        workspace,
        new AbortController().signal,
        "pi",
      );

      assert.equal(
        await readFile(join(root, "docker-build", "Dockerfile"), "utf8"),
        "FROM scratch\n",
      );
      await inline.close();

      const openCode = await new DefaultWorkspaceRuntimeFactory().create(
        {
          title: "OpenCode Dockerfile",
          workspacePath: null,
          repositoryUrl: null,
          executionMode: "docker",
          dockerfilePath: dockerfile,
          dockerfileContent: null,
        },
        root,
        workspace,
        new AbortController().signal,
        "opencode",
      );

      assert.match(
        await readFile(join(root, "docker-build", "Dockerfile"), "utf8"),
        /RUN npm install --global opencode-ai@1\.19\.5/,
      );
      await openCode.close();

      const calls = await readFile(log, "utf8");

      assert.match(calls, /build --quiet --file/);
      assert.match(calls, /run --detach --rm/);
      assert.match(
        calls,
        /exec --interactive --workdir \/agent-eval\/workspace --env-file/,
      );
      assert.match(calls, /rm --force container-test/);
    } finally {
      if (previousPath === undefined) delete process.env.PATH;
      else process.env.PATH = previousPath;
      if (previousLog === undefined) delete process.env.AGENT_EVAL_DOCKER_LOG;
      else process.env.AGENT_EVAL_DOCKER_LOG = previousLog;
      await rm(root, { recursive: true, force: true });
    }
  },
);
