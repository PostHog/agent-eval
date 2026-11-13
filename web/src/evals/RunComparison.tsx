import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@posthog/quill";
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
        <Table fullWidth size="sm">
          <TableHeader>
            <TableRow>
              <TableHead>Harness / model</TableHead>
              <TableHead>Sessions</TableHead>
              <TableHead>Criteria passed</TableHead>
              <TableHead>Sessions passing all criteria</TableHead>
              <TableHead>Session cost (USD, incl. judge)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {models.map((model) => {
              const group = sessions.filter(
                (session) => `${session.harness}/${session.model}` === model,
              );
              const finished = group.filter((session) => !isActive(session));

              return (
                <TableRow key={model}>
                  <TableCell>
                    <ModelKey value={model} />
                  </TableCell>
                  <TableCell>{group.length}</TableCell>
                  <TableCell>
                    <Acceptance
                      decisions={definition.criteria.flatMap((criterion) =>
                        criterionDecisions(finished, criterion.id),
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <Acceptance
                      decisions={finished.map((session) => ({
                        passed: passesSession(session),
                      }))}
                    />
                  </TableCell>
                  <TableCell>
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
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
