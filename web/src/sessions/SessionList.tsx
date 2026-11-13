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
import { useApi } from "../api.js";
import { Choice } from "../Choice.js";
import {
  CheckBar,
  duration,
  Field,
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
        <Button
          nativeButton={false}
          variant="outline"
          render={<a href="#evals">Go to evals</a>}
        />
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
        <Input
          type="search"
          aria-label="Search sessions"
          placeholder="Search eval, model, or environment"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <Field label="Harness / model">
          <Choice
            value={model}
            onValueChange={setModel}
            options={[
              { value: "", label: "All" },
              ...models.map((model) => ({ value: model, label: model })),
            ]}
          />
        </Field>
        <Field label="Result">
          <Choice
            value={status}
            onValueChange={setStatus}
            options={[
              { value: "", label: "All sessions" },
              { value: "active", label: "In progress" },
              { value: "review", label: "Needs review" },
              { value: "completed", label: "Completed" },
              { value: "failed", label: "Failed session" },
              { value: "cancelled", label: "Cancelled" },
            ]}
          />
        </Field>
        {(search || model || status) && (
          <Button type="button" onClick={clear}>
            Clear filters
          </Button>
        )}
        <span className="muted">
          {filtered.length} of {sessions.length} sessions
        </span>
      </div>
      {filtered.length > 0 && (
        <div className="table-scroll">
          <Table fullWidth size="sm">
            <TableHeader>
              <TableRow>
                <TableHead>Harness / model</TableHead>
                <TableHead>Eval</TableHead>
                <TableHead>Criteria</TableHead>
                <TableHead>Judge verdict</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Est. cost</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((session) => (
                <TableRow key={session.id}>
                  <TableCell>
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
                  </TableCell>
                  <TableCell>
                    <a href={`#evals/${session.evalId}`}>
                      {session.eval.title}
                    </a>
                  </TableCell>
                  <TableCell>
                    <CheckBar
                      decisions={session.decisions}
                      criteria={session.snapshot.evaluation.criteria}
                    />
                  </TableCell>
                  <TableCell className="verdict-preview">
                    <p className="cell-description">
                      {session.error ?? session.verdict ?? "Awaiting judgment"}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Status value={session.status} />
                  </TableCell>
                  <TableCell>{duration(session.durationMs)}</TableCell>
                  <TableCell>{money(session.costUsd)}</TableCell>
                  <TableCell>
                    {new Date(session.createdAt).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {filtered.length === 0 && (
        <EmptyState title="No sessions match these filters">
          <Button type="button" onClick={clear}>
            Clear filters
          </Button>
        </EmptyState>
      )}
    </>
  );
}
