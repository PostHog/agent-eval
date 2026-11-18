import { Input } from "@posthog/quill";
import { Choice } from "../Choice.js";
import { Field } from "../components.js";
import { ModelSelect } from "../models/ModelSelect.js";
import type { Harness, ModelSettingsData } from "../types.js";

export const defaultModel: ModelSettingsData = {
  harness: "pi",
  model: "",
  effort: "low",
  count: 1,
  timeoutSeconds: 600,
  maxTurns: 100,
};

export function ModelPicker({
  value,
  onChange,
  harnesses,
  judge = false,
}: {
  value: ModelSettingsData;
  onChange: (value: ModelSettingsData) => void;
  harnesses: Harness[];
  judge?: boolean;
}) {
  const harness = harnesses.find((item) => item.id === value.harness);

  return (
    <>
      <Field label="Harness">
        <Choice
          value={value.harness}
          onValueChange={(next) =>
            onChange({
              ...value,
              harness: next as ModelSettingsData["harness"],
              model: "",
            })
          }
          options={harnesses.map((item) => ({
            value: item.id,
            label: `${item.title}${item.installed ? "" : " (not installed)"}`,
          }))}
        />
      </Field>
      <ModelSelect
        key={value.harness}
        harness={harness}
        value={value.model}
        onChange={(model) => onChange({ ...value, model })}
      />
      <div className="model-fields">
        <Field label="Effort">
          <Choice
            value={value.effort}
            onValueChange={(next) =>
              onChange({
                ...value,
                effort: next as ModelSettingsData["effort"],
              })
            }
            options={["off", "minimal", "low", "medium", "high", "xhigh"].map(
              (effort) => ({ value: effort, label: effort }),
            )}
          />
        </Field>
        {!judge && (
          <Field label="Sessions">
            <Input
              required
              type="number"
              min={1}
              max={100}
              value={value.count}
              onChange={(event) =>
                onChange({ ...value, count: event.target.valueAsNumber })
              }
            />
          </Field>
        )}
        <Field label="Timeout (seconds)">
          <Input
            required
            type="number"
            min={1}
            max={86400}
            value={value.timeoutSeconds}
            onChange={(event) =>
              onChange({ ...value, timeoutSeconds: event.target.valueAsNumber })
            }
          />
        </Field>
        <Field label="Maximum turns">
          <Input
            required
            type="number"
            min={1}
            max={1000}
            value={value.maxTurns}
            onChange={(event) =>
              onChange({ ...value, maxTurns: event.target.valueAsNumber })
            }
          />
        </Field>
      </div>
      <p className="section-note">
        Effort depends on the model. Sessions: 1–100. Timeout: 1–86,400 seconds.
        Turns: 1–1,000.
      </p>
      {harness && !harness.installed && (
        <p className="model-setup-note">
          {harness.title} is not installed. You can save this configuration now.
          Before you run an evaluation,{" "}
          <a href="#harnesses" target="_blank" rel="noopener">
            install the harness
          </a>
          .
        </p>
      )}
    </>
  );
}
