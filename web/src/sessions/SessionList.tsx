import { useState } from "react";
import { useApi } from "../api.js";
import {
  CheckBar,
  duration,
  money,
  Notice,
  PageTitle,
  Status,
} from "../components.js";
import { ModelReference } from "../models/ModelReference.js";
import { EmptyState, RequestState } from "../PageState.js";
import type { Session } from "../types.js";
import { filterSessions } from "./session-filters.js";

export function SessionList() {
  const { data, error, refresh } = useApi<Session[]>("/sessions", true);

  return (
    <>
      <PageTitle title="Coding sessions">
        <a className="button" href="#evals">
          Go to evals
        </a>
      </PageTitle>
      <p className="description">
        Find a session, inspect its trace, and see why it passed or failed.
        Needs review includes failed checks, execution errors, and cancelled
        sessions.
      </p>
      {data ? (
        <>
          <Notice error={error} />
          <SessionsTable sessions={data} />
        </>
      ) : (
        <RequestState error={error} retry={refresh} />
      )}
    </>
  );
}

export function SessionsTable({ sessions }: { sessions: Session[] }) {
  const [model, setModel] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const models = [
    ...new Set(
      sessions.map((session) => `${session.harness}/${session.model}`),
    ),
  ];
  const filtered = filterSessions(sessions, search, model, status);

  function clear() {
    setModel("");
    setStatus("");
    setSearch("");
  }

  if (sessions.length === 0)
    return (
      <EmptyState title="No sessions yet">
        <p>Run an eval to compare models and inspect their work here.</p>
      </EmptyState>
    );

  return (
    <>
      <div className="toolbar">
        <input
          type="search"
          aria-label="Search sessions"
          placeholder="Search eval, model, or environment"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <label>
          Harness / model{" "}
          <select
            value={model}
            onChange={(event) => setModel(event.target.value)}
          >
            <option value="">All</option>
            {models.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label>
          Result{" "}
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">All sessions</option>
            <option value="active">In progress</option>
            <option value="review">Needs review</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed session</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>
        {(search || model || status) && (
          <button type="button" onClick={clear}>
            Clear filters
          </button>
        )}
        <span className="muted">
          {filtered.length} of {sessions.length} sessions
        </span>
      </div>
      {filtered.length > 0 && (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Harness / model</th>
                <th>Eval</th>
                <th>Criteria</th>
                <th>Judge verdict</th>
                <th>Status</th>
                <th>Duration</th>
                <th>Est. cost</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((session) => (
                <tr key={session.id}>
                  <td>
                    <ModelReference
                      harness={session.harness}
                      model={session.model}
                    />
                    <small>
                      <a
                        aria-label={`View ${session.model} session for ${session.eval.title}`}
                        href={`#sessions/${session.id}`}
                      >
                        View session
                      </a>
                    </small>
                  </td>
                  <td>
                    <a href={`#evals/${session.evalId}`}>
                      {session.eval.title}
                    </a>
                  </td>
                  <td>
                    <CheckBar
                      decisions={session.decisions}
                      criteria={session.snapshot.evaluation.criteria}
                    />
                  </td>
                  <td className="verdict-preview">
                    <p className="cell-description">
                      {session.error ?? session.verdict ?? "Awaiting judgment"}
                    </p>
                  </td>
                  <td>
                    <Status value={session.status} />
                  </td>
                  <td>{duration(session.durationMs)}</td>
                  <td>{money(session.costUsd)}</td>
                  <td>{new Date(session.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {filtered.length === 0 && (
        <EmptyState title="No sessions match these filters">
          <button type="button" onClick={clear}>
            Clear filters
          </button>
        </EmptyState>
      )}
    </>
  );
}
