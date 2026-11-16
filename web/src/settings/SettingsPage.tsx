import { Button, Input } from "@posthog/quill";
import { type FormEvent, useEffect, useState } from "react";
import { ApplicationSettings } from "../../../src/settings/domain/application-settings.js";
import { api, useApi } from "../api.js";
import { Field, Notice, PageTitle } from "../components.js";
import { Feedback, RequestState } from "../PageState.js";
import { StatusIcon } from "../status/StatusIcon.js";

export function SettingsPage() {
  const { data, error, refresh } = useApi<{ sessionConcurrency: number }>(
    "/settings",
  );
  const [concurrency, setConcurrency] = useState("");
  const [saveError, setSaveError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) setConcurrency(String(data.sessionConcurrency));
  }, [data]);

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setSaveError("");
    setMessage("");

    try {
      const settings = ApplicationSettings.create({
        sessionConcurrency: Number(concurrency),
      }).value;

      await api("/settings", {
        method: "PUT",
        body: JSON.stringify(settings),
      });
      setMessage(
        "Settings saved. The new limit now applies to queued sessions.",
      );
    } catch (error) {
      setSaveError(String(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageTitle title="Settings" />
      <p className="description">
        Control how agent-eval uses this computer and your model providers.
        These settings apply to all evaluations.
      </p>
      {!data ? (
        <RequestState error={error} retry={refresh} />
      ) : (
        <form className="settings-form" onSubmit={(event) => void save(event)}>
          <section className="settings-section">
            <div className="settings-section-heading">
              <span className="settings-section-icon" aria-hidden="true">
                ↯
              </span>
              <div>
                <h2>Session execution</h2>
                <p>
                  Set the maximum number of coding sessions that can run at the
                  same time.
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
                value={concurrency}
                onChange={(event) => setConcurrency(event.target.value)}
              />
            </Field>
            <p className="settings-help">
              Default: 2. A higher limit completes large runs faster, but it
              uses more CPU, memory, Docker capacity, and provider quota.
            </p>
          </section>
          <Notice error={saveError || error} />
          <Feedback message={message} />
          <div className="settings-actions">
            <Button type="submit" variant="primary" disabled={saving}>
              {saving && <StatusIcon name="spinner" />}
              {saving ? "Saving…" : "Save settings"}
            </Button>
          </div>
        </form>
      )}
    </>
  );
}
