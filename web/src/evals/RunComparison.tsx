import { Acceptance, money } from "../components.js";
import { ModelKey } from "../models/ModelReference.js";
import { isActive } from "../sessions/session-filters.js";
import type { EvaluationData, Session } from "../types.js";
import { criterionDecisions, passesSession } from "./acceptance.js";

export function RunComparison({
  sessions,
  definition,
}: {
  sessions: Session[];
  definition: EvaluationData;
}) {
  const models = [
    ...new Set(
      sessions.map((session) => `${session.harness}/${session.model}`),
    ),
  ];

  if (models.length === 0) return null;

  return (
    <section className="section">
      <h2>Acceptance by harness and model</h2>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Harness / model</th>
              <th>Sessions</th>
              <th>Criteria passed</th>
              <th>Sessions passing all criteria</th>
              <th>Session cost (USD, incl. judge)</th>
            </tr>
          </thead>
          <tbody>
            {models.map((model) => {
              const group = sessions.filter(
                (session) => `${session.harness}/${session.model}` === model,
              );
              const finished = group.filter((session) => !isActive(session));

              return (
                <tr key={model}>
                  <td>
                    <ModelKey value={model} />
                  </td>
                  <td>{group.length}</td>
                  <td>
                    <Acceptance
                      decisions={definition.criteria.flatMap((criterion) =>
                        criterionDecisions(finished, criterion.id),
                      )}
                    />
                  </td>
                  <td>
                    <Acceptance
                      decisions={finished.map((session) => ({
                        passed: passesSession(session),
                      }))}
                    />
                  </td>
                  <td>
                    {group.some((session) => session.costUsd !== null)
                      ? money(
                          group.reduce(
                            (sum, session) => sum + (session.costUsd ?? 0),
                            0,
                          ),
                        )
                      : "Unavailable"}
                    {group.some((session) => session.costUsd !== null) &&
                      group.some((session) => session.costUsd === null) && (
                        <small>Partial cost</small>
                      )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
