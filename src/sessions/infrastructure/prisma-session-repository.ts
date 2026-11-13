import { Inject, Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type { HarnessResult } from "../../harnesses/domain/harness.js";
import { Database } from "../../infrastructure/database.js";
import type { ExecutionSnapshot } from "../domain/execution-snapshot.js";
import type { Session } from "../domain/session.js";
import { SessionRepository } from "../domain/session-repository.js";

export const json = (value: unknown): Prisma.InputJsonValue =>
  JSON.parse(JSON.stringify(value));

@Injectable()
export class PrismaSessionRepository extends SessionRepository {
  constructor(@Inject(Database) private readonly db: Database) {
    super();
  }

  async insert(
    session: Session,
    snapshot: ExecutionSnapshot,
    batchId: string,
  ): Promise<void> {
    await this.db.session.create({
      data: {
        id: session.id,
        evalId: snapshot.evaluation.id,
        batchId,
        model: session.model.model,
        harness: session.model.harness,
        status: session.status,
        snapshot: json(snapshot),
      },
    });
  }

  async save(
    session: Session,
    agent?: HarnessResult,
    judge?: HarnessResult,
  ): Promise<void> {
    const data = session.snapshot();
    const usages = [agent?.usage, judge?.usage].filter(
      (usage) => usage !== undefined,
    );
    const completeCost =
      usages.length === 2 && usages.every((usage) => usage.costUsd !== null);
    const finished = ["completed", "failed", "cancelled"].includes(data.status);

    const previous = await this.db.session.findUniqueOrThrow({
      where: { id: session.id },
      select: { startedAt: true },
    });

    await this.db.session.update({
      where: { id: data.id },
      data: {
        status: data.status,
        error: data.error ?? agent?.error ?? null,
        ...(agent ? { agentResult: json(agent) } : {}),
        ...(judge ? { judgeResult: json(judge) } : {}),
        ...(usages.length
          ? {
              inputTokens: usages.reduce((sum, usage) => sum + usage.input, 0),
              outputTokens: usages.reduce(
                (sum, usage) => sum + usage.output,
                0,
              ),
              cacheRead: usages.reduce(
                (sum, usage) => sum + usage.cacheRead,
                0,
              ),
              cacheWrite: usages.reduce(
                (sum, usage) => sum + usage.cacheWrite,
                0,
              ),
              totalTokens: usages.reduce((sum, usage) => sum + usage.total, 0),
              costUsd: completeCost
                ? usages.reduce((sum, usage) => sum + (usage.costUsd ?? 0), 0)
                : null,
            }
          : {}),
        ...(data.status === "running" ? { startedAt: new Date() } : {}),
        ...(finished
          ? {
              finishedAt: new Date(),
              durationMs: previous.startedAt
                ? Date.now() - previous.startedAt.getTime()
                : 0,
            }
          : {}),
        ...(data.judgment
          ? {
              verdict: data.judgment.summary,
              decisions: {
                deleteMany: {},
                create: data.judgment.decisions.map((decision) => ({
                  criterionSnapshotId: decision.criterionId,
                  criterionDescription:
                    data.evaluation.criteria.find(
                      (criterion) => criterion.id === decision.criterionId,
                    )?.description ?? "",
                  passed: decision.passed,
                  feedback: decision.feedback,
                })),
              },
            }
          : {}),
      },
    });
  }

  async event(sessionId: string, phase: string, event: unknown): Promise<void> {
    const last = await this.db.sessionEvent.findFirst({
      where: { sessionId },
      orderBy: { sequence: "desc" },
      select: { sequence: true },
    });

    await this.db.sessionEvent.create({
      data: {
        sessionId,
        phase,
        sequence: (last?.sequence ?? 0) + 1,
        event: json(event),
      },
    });
  }

  async events(sessionId: string, phase: string): Promise<unknown[]> {
    const events = await this.db.sessionEvent.findMany({
      where: { sessionId, phase },
      orderBy: { sequence: "asc" },
    });

    return events.map((entry) => entry.event);
  }
}
