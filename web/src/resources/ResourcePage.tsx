import { useState } from "react";
import { api, useApi } from "../api.js";
import { Notice, PageTitle } from "../components.js";
import { EmptyState, Feedback, RequestState } from "../PageState.js";
import type { Resource, Resources } from "../types.js";
import { ResourceForm } from "./ResourceForm.js";
import { type ResourceKind, resourceInfo } from "./resource-info.js";

export function ResourcePage({ kind }: { kind: ResourceKind }) {
  const { data, error, refresh } = useApi<Resources>("/resources");
  const [editing, setEditing] = useState<Resource | "new" | null>(null);
  const [failure, setFailure] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [removing, setRemoving] = useState("");
  const info = resourceInfo[kind];
  const filtered =
    data?.[kind].filter((resource) =>
      `${resource.title} ${resource.description}`
        .toLowerCase()
        .includes(search.trim().toLowerCase()),
    ) ?? [];

  async function remove(resource: Resource) {
    if (
      !confirm(
        `Delete ${resource.title}? Resources used by an eval cannot be deleted.`,
      )
    )
      return;

    setRemoving(resource.id);
    setFailure("");
    setMessage("");

    try {
      await api(`/resources/${info.kind}/${resource.id}`, { method: "DELETE" });
      setMessage(`${resource.title} was deleted.`);
      refresh();
    } catch (error) {
      setFailure(String(error));
    } finally {
      setRemoving("");
    }
  }

  return (
    <>
      <PageTitle title={info.title}>
        <button
          type="button"
          className="primary"
          disabled={editing !== null}
          onClick={() => setEditing("new")}
        >
          Add {info.singular}
        </button>
      </PageTitle>
      <p className="description">{info.description}</p>
      <Notice error={failure || (data ? error : undefined)} />
      <Feedback message={message} />
      {editing !== null && (
        <ResourceForm
          key={editing === "new" ? "new" : editing.id}
          kind={kind}
          initial={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            setMessage(
              "Saved. Select this resource when you edit an eval. Existing sessions keep their original configuration.",
            );
            refresh();
          }}
        />
      )}
      {!data ? (
        <RequestState error={error} retry={refresh} />
      ) : data[kind].length === 0 ? (
        <EmptyState title={`No ${info.title.toLowerCase()} yet`}>
          <p>{info.hint}</p>
          {editing === null && (
            <button type="button" onClick={() => setEditing("new")}>
              Add {info.singular}
            </button>
          )}
        </EmptyState>
      ) : (
        <>
          <div className="toolbar">
            <input
              type="search"
              aria-label={`Search ${info.title.toLowerCase()}`}
              placeholder={`Search ${info.title.toLowerCase()}`}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <span className="muted">
              {filtered.length} of {data[kind].length}
            </span>
          </div>
          {filtered.length === 0 ? (
            <EmptyState title="No matching resources">
              <button type="button" onClick={() => setSearch("")}>
                Clear search
              </button>
            </EmptyState>
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Description</th>
                    {kind !== "personas" && <th>Configuration</th>}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((resource) => (
                    <tr key={resource.id}>
                      <td>{resource.title}</td>
                      <td>
                        <p className="cell-description">
                          {resource.description || "No description"}
                        </p>
                      </td>
                      {kind !== "personas" && (
                        <td className="resource-path">
                          {resource.workspacePath ??
                            resource.directory ??
                            resource.command ??
                            "Empty workspace"}
                        </td>
                      )}
                      <td>
                        <div className="actions">
                          <button
                            type="button"
                            disabled={editing !== null}
                            aria-label={`Edit ${resource.title}`}
                            onClick={() => setEditing(resource)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            disabled={Boolean(removing) || editing !== null}
                            aria-label={`Delete ${resource.title}`}
                            onClick={() => void remove(resource)}
                          >
                            {removing === resource.id ? "Deleting…" : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="section-note">
            Changes apply to future sessions. <a href="#evals">Go to evals</a>{" "}
            to use these resources.
          </p>
        </>
      )}
    </>
  );
}
