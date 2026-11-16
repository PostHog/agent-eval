import { Button, Input } from "@posthog/quill";
import { useState } from "react";
import { PathPickerDialog } from "./PathPickerDialog.js";
import { ResourceIcon } from "./ResourceIcon.js";

export function PathInput({
  id,
  kind,
  value,
  placeholder,
  required,
  onChange,
}: {
  id?: string;
  kind: "directory" | "file";
  value: string;
  placeholder: string;
  required?: boolean;
  onChange: (value: string) => void;
}) {
  const [picking, setPicking] = useState(false);

  return (
    <>
      <div className="path-input">
        <Input
          id={id}
          required={required}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
        <Button type="button" onClick={() => setPicking(true)}>
          <ResourceIcon name={kind === "directory" ? "folder" : "file"} />
          Browse
        </Button>
      </div>
      {picking && (
        <PathPickerDialog
          kind={kind}
          initialPath={value}
          onClose={() => setPicking(false)}
          onChoose={(path) => {
            onChange(path);
            setPicking(false);
          }}
        />
      )}
    </>
  );
}
