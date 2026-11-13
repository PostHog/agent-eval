import { useRef, useState } from "react";
import { useApi } from "../api.js";
import { Notice } from "../components.js";
import { EmptyState, RequestState } from "../PageState.js";
import type { Artifact } from "../types.js";

export function FilesPanel({ id, active }: { id: string; active: boolean }) {
  const { data, error, refresh } = useApi<Artifact[]>(
    `/sessions/${id}/files`,
    active,
  );
  const [phase, setPhase] = useState("output");
  const [selected, setSelected] = useState<Artifact>();
  const [text, setText] = useState("");
  const [failure, setFailure] = useState("");
  const [search, setSearch] = useState("");
  const request = useRef(0);
  const files = data?.filter((file) => file.phase === phase) ?? [];
  const filtered = files.filter((file) =>
    file.path.toLowerCase().includes(search.trim().toLowerCase()),
  );

  async function read(file: Artifact) {
    const version = ++request.current;

    setSelected(file);
    setText("Loading file...");
    setFailure("");

    try {
      const response = await fetch(`/api/sessions/${id}/files/${file.id}`);

      if (!response.ok) throw new Error("Cannot read this file.");

      const content = await response.text();

      if (version === request.current) setText(content);
    } catch (error) {
      if (version === request.current) {
        setFailure(String(error));
        setText("");
      }
    }
  }

  return (
    <>
      <div className="toolbar">
        <label>
          Files{" "}
          <select
            value={phase}
            onChange={(event) => {
              request.current++;
              setPhase(event.target.value);
              setSelected(undefined);
              setFailure("");
              setSearch("");
            }}
          >
            <option value="input">Original input</option>
            <option value="output">Final workspace</option>
            <option value="agent-runtime">Agent runtime</option>
            <option value="judge-runtime">Judge runtime</option>
          </select>
        </label>
        <input
          type="search"
          aria-label="Search file paths"
          placeholder="Search file paths"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <span className="muted">
          {filtered.length} of {files.length} files
        </span>
      </div>
      <Notice error={failure || (data ? error : undefined)} />
      {!data ? (
        <RequestState error={error} retry={refresh} />
      ) : files.length === 0 ? (
        <EmptyState title="No saved files in this phase">
          <p>
            {active
              ? "Files appear as workspace snapshots are saved. Check again after the session finishes."
              : "This session has no files saved for the selected phase. Choose another phase."}
          </p>
        </EmptyState>
      ) : (
        <div className="file-browser">
          <nav aria-label="Session files">
            {filtered.map((file) => (
              <button
                type="button"
                key={file.id}
                className={selected?.id === file.id ? "selected" : ""}
                aria-current={selected?.id === file.id ? "true" : undefined}
                onClick={() => void read(file)}
              >
                {file.path}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="muted">
                No matching files.{" "}
                <button type="button" onClick={() => setSearch("")}>
                  Clear search
                </button>
              </p>
            )}
          </nav>
          <section>
            {selected ? (
              <>
                <div className="toolbar">
                  <h3>{selected.path}</h3>
                  <a
                    href={`/api/sessions/${id}/files/${selected.id}`}
                    download={selected.path.split("/").pop()}
                  >
                    Download
                  </a>
                </div>
                <pre>{text}</pre>
              </>
            ) : (
              <p className="empty">Choose a file to read its saved contents.</p>
            )}
          </section>
        </div>
      )}
    </>
  );
}
