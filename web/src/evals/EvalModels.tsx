import { Button } from "@posthog/quill";
import { useState } from "react";
import type { EvalDraft, Harness } from "../types.js";
import { defaultModel } from "./ModelPicker.js";
import { ModelSettingsDialog } from "./ModelSettingsDialog.js";
import { ModelSummary } from "./ModelSummary.js";

export function EvalModels<T extends Pick<EvalDraft, "models" | "judge">>({
  value,
  onChange,
  harnesses = [],
  saveTarget = "evaluation",
}: {
  value: T;
  onChange: (value: T) => void;
  harnesses?: Harness[];
  saveTarget?: "evaluation" | "settings";
}) {
  const [editing, setEditing] = useState<number | "new" | "judge" | null>(null);

  return (
    <>
      <section className="eval-model-section">
        <div className="section-heading">
          <h2>
            Session models{" "}
            <span className="muted">({value.models.length})</span>
          </h2>
          <Button
            type="button"
            variant="outline"
            disabled={!harnesses.length}
            onClick={() => setEditing("new")}
          >
            Add model
          </Button>
        </div>
        <p className="muted">
          These models perform the task. Add a model to choose its harness,
          effort, and session limits.
        </p>
        {!value.models.length && (
          <div className="model-selection-empty">
            <strong>No models selected</strong>
            <p>Add at least one model to run this evaluation.</p>
          </div>
        )}
        <div className="model-summary-list">
          {value.models.map((model, index) => (
            <ModelSummary
              key={`${index}-${model.harness}`}
              value={model}
              label={`Edit model configuration ${index + 1}`}
              onEdit={() => setEditing(index)}
              onRemove={() =>
                onChange({
                  ...value,
                  models: value.models.filter(
                    (_, position) => position !== index,
                  ),
                })
              }
            />
          ))}
        </div>
      </section>
      <section className="eval-model-section">
        <div className="section-heading">
          <h2>Judge</h2>
          {!value.judge && (
            <Button
              type="button"
              variant="outline"
              disabled={!harnesses.length}
              onClick={() => setEditing("judge")}
            >
              Add judge
            </Button>
          )}
        </div>
        <p className="muted">
          This model checks each session against your criteria. Its usage adds
          to the session cost.
        </p>
        {value.judge ? (
          <ModelSummary
            value={value.judge}
            judge
            label="Edit judge"
            onEdit={() => setEditing("judge")}
            onRemove={() => onChange({ ...value, judge: null })}
          />
        ) : (
          <div className="model-selection-empty">
            <strong>No judge selected</strong>
            <p>Add a judge to assess the results.</p>
          </div>
        )}
      </section>
      {editing !== null && (
        <ModelSettingsDialog
          saveTarget={saveTarget}
          title={
            editing === "judge"
              ? value.judge
                ? "Edit judge"
                : "Add judge"
              : editing === "new"
                ? "Add model"
                : "Edit model configuration"
          }
          initial={
            editing === "judge"
              ? (value.judge ?? defaultModel)
              : editing === "new"
                ? defaultModel
                : (value.models[editing] ?? defaultModel)
          }
          judge={editing === "judge"}
          harnesses={harnesses}
          onClose={() => setEditing(null)}
          onApply={(model) => {
            onChange(
              editing === "judge"
                ? { ...value, judge: model }
                : {
                    ...value,
                    models:
                      editing === "new"
                        ? [...value.models, model]
                        : value.models.map((item, index) =>
                            index === editing ? model : item,
                          ),
                  },
            );

            setEditing(null);
          }}
        />
      )}
    </>
  );
}
