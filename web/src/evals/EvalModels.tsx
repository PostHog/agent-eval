import type { EvalDraft, Harness } from "../types.js";
import { defaultModel, ModelPicker } from "./ModelPicker.js";

export function EvalModels({
  value,
  onChange,
  harnesses,
}: {
  value: EvalDraft;
  onChange: (value: EvalDraft) => void;
  harnesses?: Harness[];
}) {
  return (
    <section>
      <h2>Harnesses and models</h2>
      <p className="muted">
        Each model configuration can run multiple independent sessions.{" "}
        <a href="#harnesses" target="_blank" rel="noopener">
          Check harness setup in a new tab
        </a>
        .
      </p>
      {value.models.map((model, index) => (
        <div className="model-row" key={`${index}-${model.harness}`}>
          <h3>Model configuration {index + 1}</h3>
          <ModelPicker
            value={model}
            harnesses={harnesses ?? []}
            onChange={(updated) =>
              onChange({
                ...value,
                models: value.models.map((item, position) =>
                  position === index ? updated : item,
                ),
              })
            }
          />
          <button
            type="button"
            aria-label={`Remove model configuration ${index + 1}`}
            disabled={value.models.length === 1}
            onClick={() =>
              onChange({
                ...value,
                models: value.models.filter(
                  (_, position) => position !== index,
                ),
              })
            }
          >
            Remove model
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          onChange({
            ...value,
            models: [...value.models, { ...defaultModel }],
          })
        }
      >
        Add model
      </button>
    </section>
  );
}
