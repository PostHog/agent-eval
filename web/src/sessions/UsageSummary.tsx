import { duration, money, number } from "../components.js";
import { ModelKey } from "../models/ModelReference.js";
import type { Session } from "../types.js";

export function UsageSummary({ sessions }: { sessions: Session[] }) {
  const groups = new Map<
    string,
    {
      executions: number;
      input: number;
      output: number;
      cache: number;
      total: number;
      cost: number;
      priced: number;
      measured: number;
    }
  >();

  // Group agent and judge usage by the model that actually incurred it.
  for (const session of sessions) {
    for (const [phase, result] of [
      ["agent", session.agentResult],
      ["judge", session.judgeResult],
    ] as const) {
      if (!result) continue;

      const settings =
        phase === "agent"
          ? { harness: session.harness, model: session.model }
          : session.snapshot.evaluation.judge;
      const key = `${settings.harness} / ${settings.model}`;
      const value = groups.get(key) ?? {
        executions: 0,
        input: 0,
        output: 0,
        cache: 0,
        total: 0,
        cost: 0,
        priced: 0,
        measured: 0,
      };

      value.executions++;

      if (result.usage) {
        value.measured++;
        value.input += result.usage.input;
        value.output += result.usage.output;
        value.cache += result.usage.cacheRead + result.usage.cacheWrite;
        value.total += result.usage.total;

        if (result.usage.costUsd !== null) {
          value.cost += result.usage.costUsd;
          value.priced++;
        }
      }

      groups.set(key, value);
    }
  }

  const values = [...groups.values()];
  const total = values.reduce((sum, value) => sum + value.total, 0);
  const cost = values.reduce((sum, value) => sum + value.cost, 0);
  const priced = values.reduce((sum, value) => sum + value.priced, 0);
  const measured = values.reduce((sum, value) => sum + value.measured, 0);
  const executions = values.reduce((sum, value) => sum + value.executions, 0);
  const starts = sessions.map((session) =>
    new Date(session.startedAt ?? session.createdAt).getTime(),
  );
  const ends = sessions.map((session) =>
    session.finishedAt ? new Date(session.finishedAt).getTime() : Date.now(),
  );
  const elapsed = sessions.length ? Math.max(...ends) - Math.min(...starts) : 0;

  return (
    <section className="section">
      <h2>Run statistics</h2>
      <div className="stats-row">
        <span>
          Elapsed <strong>{duration(elapsed)}</strong>
        </span>
        <span>
          Tokens <strong>{measured ? number(total) : "Unavailable"}</strong>
          {measured > 0 && measured < executions && " (partial)"}
        </span>
        <span>
          Estimated USD <strong>{priced ? money(cost) : "Unavailable"}</strong>
          {priced > 0 && priced < executions && " (partial)"}
        </span>
        <span>
          Sessions <strong>{sessions.length}</strong>
        </span>
      </div>
      <p className="muted">
        Includes task agents and judges. Cost available for {priced}/
        {executions} executions. Missing usage is not zero usage. Provider
        prices can differ from these estimates.
      </p>
      <details>
        <summary>Usage by harness and model</summary>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Harness / model</th>
                <th>Executions</th>
                <th>Input</th>
                <th>Output</th>
                <th>Cached</th>
                <th>Total tokens</th>
                <th>Estimated USD</th>
              </tr>
            </thead>
            <tbody>
              {[...groups.entries()].map(([key, value]) => (
                <tr key={key}>
                  <td>
                    <ModelKey value={key} />
                  </td>
                  <td>{value.executions}</td>
                  <td>{value.measured ? number(value.input) : "—"}</td>
                  <td>{value.measured ? number(value.output) : "—"}</td>
                  <td>{value.measured ? number(value.cache) : "—"}</td>
                  <td>
                    {value.measured ? number(value.total) : "Unavailable"}
                    {value.measured > 0 &&
                      value.measured < value.executions && (
                        <small>Partial usage</small>
                      )}
                  </td>
                  <td>
                    {value.priced ? money(value.cost) : "Unavailable"}
                    {value.priced > 0 && value.priced < value.executions && (
                      <small>Partial cost</small>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
