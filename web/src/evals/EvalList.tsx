import { useState } from "react";
import { useApi } from "../api.js";
import { Acceptance, Notice, PageTitle } from "../components.js";
import { ModelKey } from "../models/ModelReference.js";
import { EmptyState, RequestState } from "../PageState.js";
import { isActive } from "../sessions/session-filters.js";
import { StatusIcon } from "../status/StatusIcon.js";
import type { EvalRow } from "../types.js";
import { passesSession } from "./acceptance.js";

export function EvalList() {
  const { data, error, refresh } = useApi<EvalRow[]>("/evals", true);
  const [search, setSearch] = useState("");
  const models = [
    ...new Set(
      (data ?? []).flatMap((item) =>
        item.models.map((model) => `${model.harness}/${model.model}`),
      ),
    ),
  ];
  const filtered =
    data?.filter((item) =>
      `${item.title} ${item.prompt}`
        .toLowerCase()
        .includes(search.trim().toLowerCase()),
    ) ?? [];

  return (
    <>
      <PageTitle title="Evals">
        <a className="button primary" href="#evals/new">
          New eval
        </a>
      </PageTitle>
      <p className="description">
        Define a task, choose its resources, and compare how each harness and
        model performs.
      </p>
      {data ? (
        <Notice error={error} />
      ) : (
        <RequestState error={error} retry={refresh} />
      )}
      <div className="toolbar">
        <input
          aria-label="Search evals"
          type="search"
          placeholder="Search evals"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <span className="muted">
          {filtered.length} of {data?.length ?? 0} evals
        </span>
      </div>
      {filtered.length > 0 && (
        <>
          <p className="section-note">
            Pass rates use finished sessions from the latest 100 sessions per
            eval. Open an eval to compare a single run.
          </p>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Eval</th>
                  <th>Criteria</th>
                  <th>Last session</th>
                  {models.map((model) => (
                    <th key={model}>
                      <ModelKey value={model} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <a href={`#evals/${item.id}`}>{item.title}</a>
                      {item.sessions.some(isActive) && (
                        <span className="eval-active status-note">
                          <StatusIcon name="spinner" />
                          Run in progress
                        </span>
                      )}
                      <p className="cell-description">{item.prompt}</p>
                    </td>
                    <td>{item.criteria.length}</td>
                    <td>
                      {item.sessions[0]
                        ? new Date(item.sessions[0].createdAt).toLocaleString()
                        : "Not run"}
                    </td>
                    {models.map((model) => (
                      <td key={model}>
                        <Acceptance
                          decisions={item.sessions
                            .filter(
                              (session) =>
                                `${session.harness}/${session.model}` ===
                                  model && !isActive(session),
                            )
                            .map((session) => ({
                              passed: passesSession(session),
                            }))}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {data && data.length > 0 && filtered.length === 0 && (
        <EmptyState title="No matching evals">
          <button type="button" onClick={() => setSearch("")}>
            Clear search
          </button>
        </EmptyState>
      )}
      {data?.length === 0 && (
        <div className="empty">
          <h2>Create your first eval</h2>
          <p>
            Add a prompt and criteria, then choose the harnesses and models to
            test.
          </p>
          <p>
            First time here? <a href="#credentials">Add an API key</a> and{" "}
            <a href="#harnesses">check your harness</a>.
          </p>
          <a className="button primary" href="#evals/new">
            Create eval
          </a>
        </div>
      )}
    </>
  );
}
