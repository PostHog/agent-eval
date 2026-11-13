import { Button } from "@posthog/quill";
import { useState } from "react";
import type { EvalDraft } from "../types.js";
import { CriterionDialog } from "./CriterionDialog.js";

export function EvalCriteria({
  value,
  onChange,
}: {
  value: EvalDraft;
  onChange: (value: EvalDraft) => void;
}) {
  const [editing, setEditing] = useState<
    EvalDraft["criteria"][number] | "new" | null
  >(null);

  return (
    <section>
      <div className="section-heading">
        <h2>
          Criteria <span className="muted">({value.criteria.length})</span>
        </h2>
        <Button type="button" onClick={() => setEditing("new")}>
          Add criterion
        </Button>
      </div>
      <p className="muted">
        The judge tests each criterion separately. Select a criterion to edit
        it.
      </p>
      <ol className="criteria-editor-list">
        {value.criteria.map((criterion, index) => (
          <li key={criterion.id}>
            <Button
              type="button"
              className="criterion-summary"
              aria-label={`Edit criterion ${index + 1}`}
              onClick={() => setEditing(criterion)}
            >
              <span className="muted">{index + 1}</span>
              <span>
                {criterion.description || "Add an acceptance criterion"}
              </span>
              <span className="edit-affordance">Edit</span>
            </Button>
            <Button
              type="button"
              aria-label={`Remove criterion ${index + 1}`}
              disabled={value.criteria.length === 1}
              onClick={() =>
                onChange({
                  ...value,
                  criteria: value.criteria.filter(
                    (item) => item.id !== criterion.id,
                  ),
                })
              }
            >
              Remove
            </Button>
          </li>
        ))}
      </ol>
      {editing !== null && (
        <CriterionDialog
          initial={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
          onApply={(criterion) => {
            onChange({
              ...value,
              criteria:
                editing === "new"
                  ? [...value.criteria, criterion]
                  : value.criteria.map((item) =>
                      item.id === criterion.id ? criterion : item,
                    ),
            });

            setEditing(null);
          }}
        />
      )}
    </section>
  );
}
