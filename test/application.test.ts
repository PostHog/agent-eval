import "reflect-metadata";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { NestFactory } from "@nestjs/core";
import { ApplicationModule } from "../src/application.module.js";
import { Resource } from "../src/catalog/domain/resource.js";
import { PrismaCatalog } from "../src/catalog/infrastructure/prisma-catalog.js";
import { KeyVault } from "../src/credentials/key-vault.js";
import { EvaluationsService } from "../src/evaluations/application/evaluations-service.js";
import { ModelSettings } from "../src/evaluations/domain/model-settings.js";
import { PrismaEvaluationRepository } from "../src/evaluations/infrastructure/prisma-evaluation-repository.js";
import type { Harness } from "../src/harnesses/domain/harness.js";
import type { HarnessRegistry } from "../src/harnesses/domain/harness-registry.js";
import { Database } from "../src/infrastructure/database.js";
import { migrateDatabase } from "../src/infrastructure/migrations.js";
import { SessionWorker } from "../src/sessions/application/session-worker.js";
import { StartSessions } from "../src/sessions/application/start-sessions.js";
import { ArtifactStore } from "../src/sessions/infrastructure/artifact-store.js";
import { PrismaSessionRepository } from "../src/sessions/infrastructure/prisma-session-repository.js";
import { fixture } from "./fixture.js";

test("SQLite saves eval revisions, encrypted credentials, independent judgments, logs, files, and usage", async () => {
  const f = await fixture();
  const data = await mkdtemp(join(tmpdir(), "agent-eval-database-"));
  const previousDirectory = process.env.AGENT_EVAL_DATA_DIR;
  const previousUrl = process.env.DATABASE_URL;

  await migrateDatabase(data);

  const db = new Database();

  try {
    const catalog = new PrismaCatalog(db);
    const environment = Resource.create({
      kind: "environment",
      title: "Sample",
      description: "Test workspace",
      workspacePath: f.workspace,
    });
    const persona = Resource.create({
      kind: "persona",
      title: "Engineer",
      description: "Verify all changes.",
    });
    const skill = Resource.create({
      kind: "skill",
      title: "Inspect the code",
      filePath: null,
      content: "Read app.ts before making changes.",
    });

    await catalog.save(environment);
    await catalog.save(persona);
    await catalog.save(skill);

    const vault = new KeyVault(db);

    await vault.save("openrouter", "test-secret");

    assert.equal(await vault.read("openrouter"), "test-secret");

    assert.doesNotMatch(JSON.stringify(await vault.list()), /test-secret/);

    assert.doesNotMatch(
      (
        await db.credential.findUniqueOrThrow({
          where: { provider: "openrouter" },
        })
      ).encryptedValue,
      /test-secret/,
    );

    const evals = new EvaluationsService(new PrismaEvaluationRepository(db));
    const model = {
      ...ModelSettings.create({ model: "test-model", count: 2 }).value,
    };
    const evaluation = await evals.save({
      title: "Install",
      prompt: "Change the app",
      criteria: [{ description: "App changed" }],
      models: [model],
      judge: model,
      environmentId: environment.value.id,
      personaId: persona.value.id,
      skillIds: [skill.value.id],
    });

    await assert.rejects(catalog.delete("persona", persona.value.id));

    let judgeCalls = 0;
    const adapter: Harness = {
      id: "pi",
      title: "Test",
      binary: null,
      provider: "openrouter",
      supportsMcp: true,
      models: async () => [{ id: "test-model", name: "Test" }],
      run: async (input) => {
        await input.onRawEvent({ type: "test", label: input.label });

        if (input.label === "judge") judgeCalls++;
        else {
          assert.match(input.persona ?? "", /Verify all changes/);
          assert.equal(
            await readFile(join(input.workspace, "app.ts"), "utf8"),
            "original",
          );
          assert.match(
            await readFile(join(input.skills[0] ?? "", "SKILL.md"), "utf8"),
            /Read app\.ts before making changes/,
          );
          await writeFile(join(input.workspace, "app.ts"), "changed");
          await writeFile(
            join(input.directory, "messages.json"),
            JSON.stringify([{ role: "assistant", content: "Changed app.ts" }]),
          );
        }

        return {
          label: input.label,
          status: "completed",
          durationMs: 1,
          text:
            input.label === "judge"
              ? JSON.stringify({
                  summary: "Changed correctly",
                  decisions: evaluation.criteria.map((criterion) => ({
                    criterionId: criterion.id,
                    passed: true,
                    feedback: "The edit is in the transcript.",
                  })),
                })
              : "Done",
          usage: {
            input: 10,
            output: 5,
            cacheRead: 0,
            cacheWrite: 0,
            total: 15,
            costUsd: 0.01,
          },
        };
      },
    };
    const harnesses: HarnessRegistry = {
      get: () => adapter,
      catalog: async () => [
        {
          id: "pi",
          title: "Test",
          installed: true,
          provider: "openrouter",
          models: [{ id: "test-model", name: "Test" }],
          supportsMcp: true,
        },
      ],
    };
    const sessions = new PrismaSessionRepository(db);
    const artifacts = new ArtifactStore(db);
    const worker = new SessionWorker(sessions, artifacts, harnesses, vault);
    const starter = new StartSessions(
      new PrismaEvaluationRepository(db),
      catalog,
      sessions,
      artifacts,
      worker,
      harnesses,
      vault,
    );

    await starter.start(evaluation.id);
    await starter.onModuleDestroy();

    // A shutdown cancels active work. Start another batch and wait for its independent judgments.
    const batch = await starter.start(evaluation.id);

    for (let attempt = 0; attempt < 500; attempt++) {
      const pending = await db.session.count({
        where: {
          batchId: batch.batchId,
          status: { in: ["queued", "running", "judging"] },
        },
      });

      if (!pending) break;

      await new Promise((resolve) => setTimeout(resolve, 20));
    }

    const saved = await db.session.findMany({
      where: { batchId: batch.batchId },
      include: {
        decisions: true,
        events: true,
        artifacts: { select: { phase: true, path: true } },
      },
    });

    assert.equal(saved.length, 2);

    assert.equal(judgeCalls, 2);

    for (const session of saved) {
      assert.equal(session.status, "completed", session.error ?? "");
      assert.equal(session.decisions.length, 1);
      assert.equal(session.totalTokens, 30);
      assert.equal(session.costUsd, 0.02);
      assert.equal(session.events.length, 2);
      assert.ok(
        session.artifacts.some(
          (file) => file.phase === "output" && file.path === "app.ts",
        ),
      );
      assert.ok(!session.artifacts.some((file) => file.path === ".env"));
    }

    const { id: _id, ...revision } = evaluation;

    const revised = await evals.save(
      { ...revision, prompt: "A revised prompt" },
      evaluation.id,
    );

    assert.equal(revised.revision, 2);

    await assert.rejects(evals.save(revision, evaluation.id), /changed/);

    assert.match(JSON.stringify(saved[0]?.snapshot), /Change the app/);

    assert.equal(
      await readFile(join(f.workspace, "app.ts"), "utf8"),
      "original",
    );

    const app = await NestFactory.create(ApplicationModule, { logger: false });

    await app.init();
    await app.close();
  } finally {
    await db.$disconnect();
    if (previousDirectory === undefined) delete process.env.AGENT_EVAL_DATA_DIR;
    else process.env.AGENT_EVAL_DATA_DIR = previousDirectory;
    if (previousUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previousUrl;
    await rm(data, { recursive: true, force: true });
    await rm(f.root, { recursive: true, force: true });
  }
});
