import { duration, money, number } from "../components.js";
import type { Session } from "../types.js";

export function SessionMetadata({ session }: { session: Session }) {
  const snapshot = session.snapshot;

  return (
    <dl className="session-metadata">
      <div>
        <dt>Persona</dt>
        <dd>{snapshot.persona?.title ?? "None"}</dd>
      </div>
      <div>
        <dt>Environment</dt>
        <dd>{snapshot.environment?.title ?? "Empty workspace"}</dd>
      </div>
      <div>
        <dt>Skills / MCP servers</dt>
        <dd>
          {snapshot.skills.length} / {snapshot.mcps.length}
        </dd>
      </div>
      <div>
        <dt>Started</dt>
        <dd>
          {session.startedAt
            ? new Date(session.startedAt).toLocaleString()
            : "Not started"}
        </dd>
      </div>
      <div>
        <dt>Duration</dt>
        <dd>{duration(session.durationMs)}</dd>
      </div>
      <div>
        <dt>Tokens in / out</dt>
        <dd>
          {number(session.inputTokens)} / {number(session.outputTokens)}
        </dd>
      </div>
      <div>
        <dt>Cache read / write</dt>
        <dd>
          {number(session.cacheRead)} / {number(session.cacheWrite)}
        </dd>
      </div>
      <div>
        <dt>Total tokens</dt>
        <dd>{number(session.totalTokens)}</dd>
      </div>
      <div>
        <dt>Estimated USD</dt>
        <dd>{money(session.costUsd)}</dd>
      </div>
      <div>
        <dt>Eval</dt>
        <dd className="eval-outcome">
          <span className="pass">
            {session.decisions.filter((decision) => decision.passed).length}{" "}
            passed
          </span>{" "}
          ·{" "}
          <span className="fail">
            {session.decisions.filter((decision) => !decision.passed).length}{" "}
            failed
          </span>{" "}
          ·{" "}
          <span className="muted">
            {Math.max(
              0,
              snapshot.evaluation.criteria.length - session.decisions.length,
            )}{" "}
            not assessed
          </span>
        </dd>
      </div>
    </dl>
  );
}
