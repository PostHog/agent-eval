import { Button, Input } from "@posthog/quill";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import { api } from "../api.js";
import { Notice } from "../components.js";
import { Dialog } from "../Dialog.js";
import { StatusIcon } from "../status/StatusIcon.js";
import { ResourceIcon } from "./ResourceIcon.js";

interface Listing {
  path: string;
  parent: string | null;
  entries: { name: string; path: string; kind: "directory" | "file" }[];
}

export function PathPickerDialog({
  kind,
  initialPath,
  onChoose,
  onClose,
}: {
  kind: "directory" | "file";
  initialPath: string;
  onChoose: (path: string) => void;
  onClose: () => void;
}) {
  const [listing, setListing] = useState<Listing>();
  const [path, setPath] = useState(initialPath);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const load = useCallback(
    async (nextPath?: string) => {
      setLoading(true);
      setError("");

      try {
        const query = new URLSearchParams({ kind });

        if (nextPath) query.set("path", nextPath);

        const next = await api<Listing>(`/filesystem?${query}`);

        setListing(next);
        setPath(next.path);
      } catch (error) {
        setError(String(error));
      } finally {
        setLoading(false);
      }
    },
    [kind],
  );

  useEffect(() => {
    void load(initialPath || undefined);
  }, [initialPath, load]);

  function openPath(event: FormEvent) {
    event.preventDefault();
    void load(path);
  }

  return (
    <Dialog
      title={
        kind === "directory" ? "Choose a local folder" : "Choose a local file"
      }
      onClose={onClose}
    >
      <form className="path-picker" onSubmit={openPath}>
        <div className="path-picker-location">
          <Input
            aria-label="Location"
            value={path}
            onChange={(event) => setPath(event.target.value)}
          />
          <Button type="submit" disabled={loading}>
            Open
          </Button>
        </div>
        <Notice error={error} />
        <div className="path-picker-list" aria-busy={loading}>
          {loading ? (
            <p className="loading-state">
              <StatusIcon name="spinner" /> Reading folder…
            </p>
          ) : (
            <>
              {listing?.parent && (
                <button
                  type="button"
                  onClick={() => void load(listing.parent ?? undefined)}
                >
                  <span className="path-entry-name">
                    <ResourceIcon name="folder" /> Parent folder
                  </span>
                  <span className="muted">{listing.parent}</span>
                </button>
              )}
              {listing?.entries.map((entry) => (
                <button
                  type="button"
                  key={entry.path}
                  onClick={() => {
                    if (entry.kind === "directory") void load(entry.path);
                    else onChoose(entry.path);
                  }}
                >
                  <span className="path-entry-name">
                    <ResourceIcon
                      name={entry.kind === "directory" ? "folder" : "file"}
                    />
                    {entry.name}
                  </span>
                  <span className="muted">
                    {entry.kind === "directory" ? "Folder" : "File"}
                  </span>
                </button>
              ))}
              {listing?.entries.length === 0 && (
                <p className="empty-path">
                  No matching entries in this folder.
                </p>
              )}
            </>
          )}
        </div>
        <div className="actions">
          {kind === "directory" && listing && (
            <Button
              type="button"
              variant="primary"
              onClick={() => onChoose(listing.path)}
            >
              Choose this folder
            </Button>
          )}
          <Button type="button" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
