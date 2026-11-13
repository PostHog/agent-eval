import { Button } from "@posthog/quill";
import { type FormEvent, useState } from "react";
import { ModelSettings } from "../../../src/evaluations/domain/model-settings.js";
import { Notice } from "../components.js";
import { Dialog } from "../Dialog.js";
import type { Harness, ModelSettingsData } from "../types.js";
import { ModelPicker } from "./ModelPicker.js";

export function ModelSettingsDialog({
  title,
  initial,
  harnesses,
  judge,
  onApply,
  onClose,
}: {
  title: string;
  initial: ModelSettingsData;
  harnesses: Harness[];
  judge?: boolean;
  onApply: (value: ModelSettingsData) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState({ ...initial });
  const [error, setError] = useState("");

  function apply(event: FormEvent) {
    event.preventDefault();

    try {
      const settings = ModelSettings.create({
        ...value,
        count: judge ? 1 : value.count,
      });

      onApply({ ...settings.value });
    } catch {
      setError(
        "Choose a model and enter whole numbers within the limits shown.",
      );
    }
  }

  return (
    <Dialog title={title} onClose={onClose}>
      <form onSubmit={apply}>
        <ModelPicker
          value={value}
          onChange={setValue}
          harnesses={harnesses}
          judge={judge}
        />
        <Notice error={error} />
        <footer className="dialog-actions">
          <span className="muted">Changes apply when you save the eval.</span>
          <Button type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={!value.model}>
            Apply settings
          </Button>
        </footer>
      </form>
    </Dialog>
  );
}
