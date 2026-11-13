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
        <Button
          nativeButton={false}
          variant="primary"
          render={<a href="#evals/new">New eval</a>}
        />
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
        <Input
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
            <Table fullWidth size="sm">
              <TableHeader>
                <TableRow>
                  <TableHead>Eval</TableHead>
                  <TableHead>Criteria</TableHead>
                  <TableHead>Last session</TableHead>
                  {models.map((model) => (
                    <TableHead key={model}>
                      <ModelKey value={model} />
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
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
                    {models.map((model) => (
                      <TableCell key={model}>
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
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
      {data && data.length > 0 && filtered.length === 0 && (
        <EmptyState title="No matching evals">
          <Button type="button" onClick={() => setSearch("")}>
            Clear search
          </Button>
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
          <Button
            nativeButton={false}
            variant="primary"
            render={<a href="#evals/new">Create eval</a>}
          />
        </div>
      )}
    </>
  );
}
