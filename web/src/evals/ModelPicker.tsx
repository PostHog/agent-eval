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
    <div className="model-fields">
      <Field label="Harness">
        <select
          value={value.harness}
          onChange={(event) =>
            onChange({
              ...value,
              harness: event.target.value as ModelSettingsData["harness"],
              model: "",
            })
          }
        >
          {harnesses.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title}
              {item.installed ? "" : " (not installed)"}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Model">
        <ModelSelect
          harness={harness}
          value={value.model}
          onChange={(model) => onChange({ ...value, model })}
        />
      </Field>
      <Field label="Effort">
        <select
          value={value.effort}
          onChange={(event) =>
            onChange({
              ...value,
              effort: event.target.value as ModelSettingsData["effort"],
            })
          }
        >
          {["off", "minimal", "low", "medium", "high", "xhigh"].map(
            (effort) => (
              <option key={effort}>{effort}</option>
            ),
          )}
        </select>
      </Field>
      {!judge && (
        <Field label="Sessions">
          <input
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
        <input
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
        <input
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
      {harness && !harness.installed && (
        <p className="model-setup-note">
          {harness.title} is not installed. You can save this configuration, but
          must{" "}
          <a href="#harnesses" target="_blank" rel="noopener">
            set up the harness
          </a>{" "}
          before running it.
        </p>
      )}
    </div>
  );
}
