import { Button, Input } from "@posthog/quill";
import { type FormEvent, useState } from "react";
import {
  ApplicationSettings,
  type ApplicationSettingsData,
} from "../../../src/settings/domain/application-settings.js";
import { api, useApi } from "../api.js";
import { Field, Notice, PageTitle } from "../components.js";
import { EvalModels } from "../evals/EvalModels.js";
import { Feedback, RequestState } from "../PageState.js";
import { StatusIcon } from "../status/StatusIcon.js";
import type { Harness } from "../types.js";

export function SettingsPage() {
  const { data, error, refresh } = useApi<ApplicationSettingsData>("/settings");

  return (
    <>
      <PageTitle title="Settings" />
      <p className="description">
        Control session concurrency and choose the defaults for new evaluations.
      </p>
      {data ? (
        <SettingsForm initial={data} />
      ) : (
        <RequestState error={error} retry={refresh} />
      )}
    </>
  );
}

function SettingsForm({ initial }: { initial: ApplicationSettingsData }) {
  const [value, setValue] = useState(initial);
  const { data: harnesses, error, refresh } = useApi<Harness[]>("/harnesses");
  const [saveError, setSaveError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setSaveError("");
    setMessage("");

    try {
      const settings = ApplicationSettings.create(value).value;

      await api("/settings", {
        method: "PUT",
        body: JSON.stringify(settings),
      });
      setMessage(
        "Settings saved. The new limit now applies to queued sessions. Model and judge defaults apply to new evaluations.",
      );
    } catch (error) {
      setSaveError(String(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="settings-form" onSubmit={(event) => void save(event)}>
      <section className="settings-section">
        <div className="settings-section-heading">
          <span className="settings-section-icon" aria-hidden="true">
            ↯
          </span>
          <div>
            <h2>Session execution</h2>
            <p>
              Set the maximum number of coding sessions that can run at the same
              time.
            </p>
          </div>
        </div>
        <Field label="Concurrent agent sessions">
          <Input
            type="number"
            min="1"
            max="32"
            step="1"
            required
            value={value.sessionConcurrency}
            onChange={(event) => {
              setValue({
                ...value,
                sessionConcurrency: event.target.valueAsNumber,
              });
              setMessage("");
            }}
          />
        </Field>
        <p className="settings-help">
          Default: 2. A higher limit completes large runs faster, but it uses
          more CPU, memory, Docker capacity, and provider quota.
        </p>
      </section>
      <section className="settings-section">
        <div className="settings-section-heading">
          <span className="settings-section-icon" aria-hidden="true">
            ⚙
          </span>
          <div>
            <h2>Evaluation defaults</h2>
            <p>
              Choose session models and a judge for new evaluations. Existing
              evaluations keep their configuration.
            </p>
          </div>
        </div>
        <Notice error={error} />
        {error && (
          <Button type="button" onClick={refresh}>
            Retry loading harnesses
          </Button>
        )}
        <EvalModels
          value={value.evaluationDefaults}
          onChange={(evaluationDefaults) => {
            setValue({ ...value, evaluationDefaults });
            setMessage("");
          }}
          harnesses={harnesses}
          saveTarget="settings"
        />
        <p className="section-note">
          You can remove all models or the judge to start with an empty
          selection.
        </p>
      </section>
      <Notice error={saveError} />
      <Feedback message={message} />
      <div className="settings-actions">
        <Button type="submit" variant="primary" disabled={saving}>
          {saving && <StatusIcon name="spinner" />}
          {saving ? "Saving…" : "Save settings"}
        </Button>
      </div>
    </form>
  );
}
