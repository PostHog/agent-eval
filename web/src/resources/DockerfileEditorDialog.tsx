import { StreamLanguage } from "@codemirror/language";
import { dockerFile } from "@codemirror/legacy-modes/mode/dockerfile";
import { Button } from "@posthog/quill";
import CodeMirror, { EditorView } from "@uiw/react-codemirror";
import { useState } from "react";
import { Dialog } from "../Dialog.js";

const dockerfileLanguage = StreamLanguage.define(dockerFile);
const editorLabel = EditorView.contentAttributes.of({
  "aria-label": "Dockerfile contents",
});

export function DockerfileEditorDialog({
  value,
  onApply,
  onClose,
}: {
  value: string;
  onApply: (value: string) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(value);

  return (
    <Dialog title="Edit inline Dockerfile" onClose={onClose}>
      <div className="dockerfile-editor-heading">
        <div>
          <strong>Dockerfile</strong>
          <p className="muted">
            This file builds the isolated runtime used by every session.
          </p>
        </div>
        <span>
          {draft.split("\n").length} {draft.includes("\n") ? "lines" : "line"}
        </span>
      </div>
      <CodeMirror
        className="dockerfile-editor"
        value={draft}
        autoFocus
        minHeight="380px"
        maxHeight="60vh"
        placeholder="FROM node:22-bookworm-slim"
        theme="dark"
        basicSetup={{
          bracketMatching: true,
          closeBrackets: true,
          foldGutter: true,
          highlightActiveLine: true,
          highlightActiveLineGutter: true,
          lineNumbers: true,
        }}
        extensions={[dockerfileLanguage, editorLabel]}
        onChange={setDraft}
      />
      <div className="dialog-actions">
        <span className="muted">Changes apply when you select Apply.</span>
        <Button type="button" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="button"
          variant="primary"
          disabled={!draft.trim()}
          onClick={() => onApply(draft)}
        >
          Apply Dockerfile
        </Button>
      </div>
    </Dialog>
  );
}
