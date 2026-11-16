import assert from "node:assert/strict";
import { readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { test } from "node:test";
import { Resource } from "../src/catalog/domain/resource.js";
import { createSession } from "../src/harnesses/infrastructure/pi/runtime.js";
import { skillDocument } from "../src/sessions/infrastructure/artifact-store.js";
import { fixture } from "./fixture.js";

test("Pi creates a session with only the supplied tools and skills", async () => {
  const f = await fixture();

  try {
    const session = await createSession({
      label: "test",
      directory: join(f.root, "session"),
      workspace: f.workspace,
      skills: [f.skill],
      prompt: "Test",
      model: "anthropic/claude-sonnet-4.5",
      effort: "off",
      tools: ["read", "web_fetch"],
      timeout: 600,
      maxTurns: 50,
      signal: new AbortController().signal,
    });

    try {
      assert.deepEqual(session.getActiveToolNames().sort(), [
        "read",
        "web_fetch",
      ]);

      assert.equal(session.model?.provider, "openrouter");

      assert.match(session.systemPrompt, /test-skill/);

      assert.match(
        await readFile(join(f.root, "session", "effective.json"), "utf8"),
        /test-skill/,
      );
    } finally {
      session.dispose();
    }
  } finally {
    await rm(f.root, { recursive: true, force: true });
  }
});

test("skills use exactly one inline or file source", () => {
  const inline = Resource.create({
    kind: "skill",
    title: "Review TypeScript",
    filePath: null,
    content: "Check every changed TypeScript file.",
  });

  assert.equal(inline.value.kind, "skill");
  assert.match(
    skillDocument("Review TypeScript", "Check the code."),
    /name: review-typescript/,
  );
  assert.throws(() =>
    Resource.create({
      kind: "skill",
      title: "Invalid",
      filePath: "/tmp/skill.md",
      content: "Two sources",
    }),
  );
});

test("environments choose one workspace source and one execution mode", () => {
  const docker = Resource.create({
    kind: "environment",
    title: "Hog CLI",
    workspacePath: null,
    repositoryUrl: "https://github.com/PostHog/posthog.git",
    executionMode: "docker",
    dockerfilePath: "/tmp/Dockerfile.hog",
    dockerfileContent: null,
  });

  assert.equal(docker.value.kind, "environment");
  assert.equal(docker.value.executionMode, "docker");

  assert.throws(() =>
    Resource.create({
      kind: "environment",
      title: "Two sources",
      workspacePath: "/tmp/project",
      repositoryUrl: "https://github.com/PostHog/posthog.git",
      executionMode: "local",
      dockerfilePath: null,
      dockerfileContent: null,
    }),
  );
  assert.throws(() =>
    Resource.create({
      kind: "environment",
      title: "Two Dockerfiles",
      workspacePath: null,
      repositoryUrl: null,
      executionMode: "docker",
      dockerfilePath: "/tmp/Dockerfile",
      dockerfileContent: "FROM node:22",
    }),
  );
});
