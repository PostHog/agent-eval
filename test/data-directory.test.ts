import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, realpath, rm } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

test("data directory defaults to the same home location from different projects and permits explicit overrides", async () => {
  const root = await realpath(
    await mkdtemp(join(tmpdir(), "agent-eval-path-")),
  );
  const moduleUrl = new URL(
    "../src/infrastructure/data-directory.ts",
    import.meta.url,
  ).href;

  function directoryFrom(cwd: string, configured = "", explicit?: string) {
    const result = spawnSync(
      process.execPath,
      [
        "--eval",
        `
      import { resolveDataDirectory } from ${JSON.stringify(moduleUrl)};
      console.log(resolveDataDirectory(${JSON.stringify(explicit)}));
    `,
      ],
      {
        cwd,
        env: { ...process.env, AGENT_EVAL_DATA_DIR: configured },
        encoding: "utf8",
      },
    );

    assert.equal(result.status, 0, result.stderr);
    return result.stdout.trim();
  }

  try {
    const first = join(root, "first");
    const second = join(root, "second");
    await mkdir(first);
    await mkdir(second);

    assert.equal(directoryFrom(first), join(homedir(), ".agent-eval"));
    assert.equal(directoryFrom(second), directoryFrom(first));
    assert.equal(directoryFrom(first, root), root);
    assert.equal(
      directoryFrom(second, root, "custom-data"),
      join(second, "custom-data"),
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
