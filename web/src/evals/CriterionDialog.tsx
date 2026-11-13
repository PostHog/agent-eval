import {
  Button,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from "@posthog/quill";
import { type FormEvent, useState } from "react";
import { Field } from "../components.js";
import { Dialog } from "../Dialog.js";
import { Markdown } from "../sessions/Markdown.js";
import type { EvalDraft } from "../types.js";

type Criterion = EvalDraft["criteria"][number];

export function CriterionDialog({
  initial,
  onApply,
  onClose,
}: {
  initial?: Criterion;
  onApply: (criterion: Criterion) => void;
  onClose: () => void;
}) {
  const [description, setDescription] = useState(initial?.description ?? "");

  function apply(event: FormEvent) {
    event.preventDefault();

    if (!description.trim()) return;

    onApply({
      id: initial?.id ?? crypto.randomUUID(),
      description: description.trim(),
    });
  }

  return (
    <Dialog
      title={initial ? "Edit criterion" : "Add criterion"}
      onClose={onClose}
    >
      <form onSubmit={apply}>
        <p className="muted">
          Describe one expected result and the evidence the judge must find.
          Include the conditions for a pass or fail.
        </p>
        <Tabs defaultValue="write">
          <div className="actions editor-tabs">
            <TabsList aria-label="Criterion editor">
              <TabsTrigger value="write">Write</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
            <span className="muted">Markdown supported</span>
          </div>
          <TabsContent value="write">
            <Field label="Acceptance criterion">
              <Textarea
                rows={12}
                value={description}
                placeholder="Pass if the agent… Fail if…"
                onChange={(event) => setDescription(event.target.value)}
              />
            </Field>
          </TabsContent>
          <TabsContent value="preview">
            <div className="criterion-preview">
              {description.trim() ? (
                <Markdown text={description} />
              ) : (
                <p className="muted">Write a criterion to preview it.</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
        <footer className="dialog-actions">
          <span className="muted">
            {description.length.toLocaleString()} characters
          </span>
          <Button type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={!description.trim()}
          >
            Apply criterion
          </Button>
        </footer>
      </form>
    </Dialog>
  );
}
