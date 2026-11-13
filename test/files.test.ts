import assert from "node:assert/strict";
import { readdir, readFile, rm, symlink } from "node:fs/promises";

import { join } from "node:path";
import { test } from "node:test";
import { snapshot } from "../src/sessions/infrastructure/workspace-files.js";

import { fixture } from "./fixture.js";

test("snapshots exclude local state and reject symbolic links", async () => {
  const f = await fixture();

  try {
    const copy = join(f.root, "copy");

    await snapshot(f.workspace, copy);

    assert.deepEqual(await readdir(copy), ["app.ts"]);

    assert.equal(await readFile(join(copy, "app.ts"), "utf8"), "original");

    await symlink(join(f.workspace, "app.ts"), join(f.workspace, "link"));

    await assert.rejects(
      snapshot(f.workspace, join(f.root, "bad")),
      /symbolic link/,
    );
  } finally {
    await rm(f.root, { recursive: true, force: true });
  }
});
