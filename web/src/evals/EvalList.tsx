import {
  Button,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@posthog/quill";
import { useState } from "react";
import { api, useApi } from "../api.js";
import { Acceptance, Notice, PageTitle } from "../components.js";
import { EmptyState, RequestState } from "../PageState.js";
import { isActive } from "../sessions/session-filters.js";
import { StatusIcon } from "../status/StatusIcon.js";
import type { EvalRow, EvaluationData } from "../types.js";
import { passesSession } from "./acceptance.js";

export function EvalList() {
  const { data, error, refresh } = useApi<EvalRow[]>("/evals", true);
  const [search, setSearch] = useState("");
  const [duplicating, setDuplicating] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const filtered =
    data?.filter((item) =>
      `${item.title} ${item.prompt}`
        .toLowerCase()
        .includes(search.trim().toLowerCase()),
    ) ?? [];

  async function duplicate(item: EvalRow) {
    setDuplicating(item.id);
    setActionError("");

    try {
      const copy = await api<EvaluationData>(`/evals/${item.id}/duplicate`, {
        method: "POST",
      });

      location.hash = `evals/${copy.id}/edit`;
    } catch (error) {
      setActionError(String(error));
      setDuplicating(null);
    }
  }

  return (
    <>
      <PageTitle title="Evaluations">
        <Button
          nativeButton={false}
          variant="primary"
          render={<a href="#evals/new">New evaluation</a>}
        />
      </PageTitle>
      <p className="description">
        Define a task, choose its resources, and compare how each harness and
        model performs.
      </p>
      {data ? (
        <Notice error={error || actionError} />
      ) : (
        <RequestState error={error} retry={refresh} />
      )}
      <div className="toolbar">
        <Input
          aria-label="Search evaluations"
          type="search"
          placeholder="Search evaluations"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <span className="muted">
          {filtered.length} of {data?.length ?? 0} evaluations
        </span>
      </div>
      {filtered.length > 0 && (
        <>
          <p className="section-note">
            Acceptance uses finished sessions from the latest 100 sessions per
            evaluation. Open an evaluation to compare a single run.
          </p>
          <div className="table-scroll">
            <Table fullWidth size="sm">
              <TableHeader>
                <TableRow>
                  <TableHead className="evaluation-name-column">
                    Evaluation
                  </TableHead>
                  <TableHead>Criteria</TableHead>
                  <TableHead>Last session</TableHead>
                  <TableHead>Average acceptance</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="evaluation-name-column">
                      <a href={`#evals/${item.id}`}>{item.title}</a>
                      {item.sessions.some(isActive) && (
                        <span className="eval-active status-note">
                          <StatusIcon name="spinner" />
                          Run in progress
                        </span>
                      )}
                      <p className="cell-description">{item.prompt}</p>
                    </TableCell>
                    <TableCell>{item.criteria.length}</TableCell>
                    <TableCell>
                      {item.sessions[0]
                        ? new Date(item.sessions[0].createdAt).toLocaleString()
                        : "Not run"}
                    </TableCell>
                    <TableCell>
                      <Acceptance
                        unit="sessions"
                        decisions={item.sessions
                          .filter((session) => !isActive(session))
                          .map((session) => ({
                            passed: passesSession(session),
                          }))}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        disabled={duplicating !== null}
                        aria-label={`Duplicate ${item.title}`}
                        onClick={() => void duplicate(item)}
                      >
                        {duplicating === item.id && (
                          <StatusIcon name="spinner" />
                        )}
                        {duplicating === item.id ? "Duplicating…" : "Duplicate"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
      {data && data.length > 0 && filtered.length === 0 && (
        <EmptyState title="No matching evaluations">
          <Button type="button" onClick={() => setSearch("")}>
            Clear search
          </Button>
        </EmptyState>
      )}
      {data?.length === 0 && (
        <div className="empty">
          <h2>Create your first evaluation</h2>
          <p>
            Add a prompt and criteria, then choose the harnesses and models to
            test.
          </p>
          <p>
            First time here? <a href="#credentials">Add an API key</a> and{" "}
            <a href="#harnesses">check your harness</a>.
          </p>
          <Button
            nativeButton={false}
            variant="primary"
            render={<a href="#evals/new">Create evaluation</a>}
          />
        </div>
      )}
    </>
  );
}
