import { Button } from "@posthog/quill";
import { useState } from "react";
import { DockerfileEditorDialog } from "./DockerfileEditorDialog.js";
import { ResourceIcon } from "./ResourceIcon.js";

export function InlineDockerfile({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const lines = value.split("\n");

  return (
    <>
      <div className="inline-dockerfile">
        <div className="inline-dockerfile-heading">
          <span className="docker-default-title">
            <ResourceIcon name="file" />
            <strong>Inline Dockerfile</strong>
          </span>
          <Button type="button" onClick={() => setEditing(true)}>
            {value ? "Edit Dockerfile" : "Write Dockerfile"}
          </Button>
        </div>
        {value ? (
          <>
            <pre>
              {lines.slice(0, 6).join("\n")}
              {lines.length > 6 ? "\n…" : ""}
            </pre>
            <p className="muted">
              {lines.length} {lines.length === 1 ? "line" : "lines"}
            </p>
          </>
        ) : (
          <p className="muted">No Dockerfile has been added.</p>
        )}
      </div>
      {editing && (
        <DockerfileEditorDialog
          value={value}
          onClose={() => setEditing(false)}
          onApply={(next) => {
            onChange(next);
            setEditing(false);
          }}
        />
      )}
    </>
  );
}
