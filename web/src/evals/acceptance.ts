import type { Session } from "../types.js";

export function passesSession(session: {
  status: string;
  decisions: { passed: boolean }[];
}): boolean {
  return (
    session.status === "completed" &&
    session.decisions.length > 0 &&
    session.decisions.every((decision) => decision.passed)
  );
}

// A missing judgment remains in the denominator so failed sessions cannot raise acceptance.
export function criterionDecisions(
  sessions: Pick<Session, "decisions">[],
  id: string,
) {
  return sessions.map((session) => ({
    passed:
      session.decisions.find((decision) => decision.criterionSnapshotId === id)
        ?.passed ?? false,
  }));
}
