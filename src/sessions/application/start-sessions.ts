import { randomUUID } from "node:crypto";
import {
  Inject,
  Injectable,
  NotFoundException,
  type OnModuleDestroy,
} from "@nestjs/common";
import pLimit from "p-limit";
import { z } from "zod";
import { ResourceRepository } from "../../catalog/domain/resource-repository.js";
import { CredentialStore } from "../../credentials/provider.js";
import { EvaluationRepository } from "../../evaluations/domain/evaluation-repository.js";
import { HarnessRegistry } from "../../harnesses/domain/harness-registry.js";
import type { ExecutionSnapshot } from "../domain/execution-snapshot.js";
import { Session } from "../domain/session.js";
import { SessionRepository } from "../domain/session-repository.js";
import { WorkspaceStore } from "../domain/workspace-store.js";
import { SessionWorker } from "./session-worker.js";

@Injectable()
export class StartSessions implements OnModuleDestroy {
  private readonly queue = pLimit(2);
  private readonly active = new Map<
    string,
    {
      session: Session;
      controller: AbortController;
      task: Promise<void> | undefined;
    }
  >();

  constructor(
    @Inject(EvaluationRepository) private readonly evals: EvaluationRepository,
    @Inject(ResourceRepository) private readonly catalog: ResourceRepository,
    @Inject(SessionRepository) private readonly sessions: SessionRepository,
    @Inject(WorkspaceStore) private readonly artifacts: WorkspaceStore,
    @Inject(SessionWorker) private readonly worker: SessionWorker,
    @Inject(HarnessRegistry) private readonly harnesses: HarnessRegistry,
    @Inject(CredentialStore) private readonly keys: CredentialStore,
  ) {}

  async start(evalId: string) {
    const evaluation = await this.evals.find(evalId);

    if (!evaluation) throw new NotFoundException("Eval not found.");

    const data = evaluation.snapshot();

    // Validate the complete batch before creating records or spending provider credits.
    const catalog = await this.harnesses.catalog();

    for (const settings of [...data.models, data.judge]) {
      const harness = catalog.find((entry) => entry.id === settings.harness);

      if (!harness?.installed)
        throw new Error(
          `Install the ${settings.harness} harness before running this eval.`,
        );
      if (!harness.models.some((model) => model.id === settings.model))
        throw new Error(
          `Choose a supported ${settings.harness} model: ${settings.model}`,
        );
      if (
        !(await this.keys.read(this.harnesses.get(settings.harness).provider))
      )
        throw new Error(
          `Add the ${harness.provider} API key before running this eval.`,
        );
    }
    const resources = await this.catalog.list();
    const environment =
      resources.environments.find((entry) => entry.id === data.environmentId) ??
      null;
    const persona =
      resources.personas.find((entry) => entry.id === data.personaId) ?? null;
    const snapshot: ExecutionSnapshot = {
      evaluation: data,
      environment,
      persona,
      skills: data.skillIds.map((id) => {
        const skill = resources.skills.find((entry) => entry.id === id);

        if (!skill) throw new Error(`Skill not found: ${id}`);

        return skill;
      }),
      mcps: data.mcpIds.map((id) => {
        const mcp = resources.mcps.find((entry) => entry.id === id);

        if (!mcp) throw new Error(`MCP not found: ${id}`);

        return { ...mcp, arguments: z.array(z.string()).parse(mcp.arguments) };
      }),
    };
    const batchId = randomUUID();
    const created: Session[] = [];

    try {
      for (const model of data.models) {
        for (let index = 0; index < model.count; index++) {
          const session = new Session(data, model);

          await this.sessions.insert(session, snapshot, batchId);
          created.push(session);
        }
      }
      await this.artifacts.prepare(
        created.map((session) => session.id),
        snapshot,
      );
    } catch (error) {
      for (const session of created) {
        session.fail(String(error));
        await this.sessions.save(session);
      }

      throw error;
    }

    for (const session of created) {
      const job = {
        session,
        controller: new AbortController(),
        task: undefined as Promise<void> | undefined,
      };

      this.active.set(session.id, job);
      job.task = this.queue(() =>
        this.worker.execute(session, snapshot, job.controller.signal),
      )
        .catch(async (error: unknown) => {
          if (!["failed", "cancelled", "completed"].includes(session.status))
            session.fail(String(error));

          await this.sessions.save(session);
        })
        .finally(() => this.active.delete(session.id));
    }

    return { batchId, sessionIds: created.map((session) => session.id) };
  }

  cancel(id: string): void {
    const job = this.active.get(id);

    if (!job) throw new NotFoundException("No active session with this ID.");

    job.controller.abort(new Error("Cancelled by the user."));
  }

  async onModuleDestroy(): Promise<void> {
    for (const job of this.active.values())
      job.controller.abort(new Error("Application stopped."));

    await Promise.allSettled([...this.active.values()].map((job) => job.task));
  }
}
