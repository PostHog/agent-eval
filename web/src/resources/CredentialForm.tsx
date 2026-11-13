import { type FormEvent, useState } from "react";
import { api } from "../api.js";
import { Field, Notice } from "../components.js";
import { StatusIcon } from "../status/StatusIcon.js";
import type { Credential } from "../types.js";
import { providerInfo } from "./provider-info.js";

export function CredentialForm({
  credential,
  onSaved,
}: {
  credential: Credential;
  onSaved: () => void;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const provider = providerInfo[credential.provider];

  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      await api(`/credentials/${credential.provider}`, {
        method: "PUT",
        body: JSON.stringify({ key: value }),
      });
      setValue("");
      onSaved();
    } catch (error) {
      setError(String(error));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (
      !confirm(
        "Remove the saved key? An environment key will still be used if one is configured.",
      )
    )
      return;

    setError("");
    setBusy(true);

    try {
      await api(`/credentials/${credential.provider}`, { method: "DELETE" });
      onSaved();
    } catch (error) {
      setError(String(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <details className="credential-panel" open={!credential.configured}>
      <summary>
        <strong>{provider?.name ?? credential.provider}</strong>
        <span className="muted">{provider?.harnesses}</span>
        <span className={credential.configured ? "pass" : "muted"}>
          {credential.configured
            ? credential.source === "database"
              ? "Saved locally"
              : "From environment"
            : "No key"}
        </span>
      </summary>
      <form className="credential-form" onSubmit={save}>
        <p className="muted">
          {credential.configured
            ? "Enter a new key to replace the key used for future sessions. Stored keys are never displayed."
            : `Add a key to run ${provider?.harnesses ?? credential.provider} sessions.`}
        </p>
        <Notice error={error} />
        <Field label="API key">
          <input
            required
            type="password"
            autoComplete="new-password"
            disabled={busy}
            value={value}
            placeholder={
              credential.configured
                ? "Enter a replacement key"
                : "Enter an API key"
            }
            onChange={(event) => setValue(event.target.value)}
          />
        </Field>
        <div className="actions">
          <button type="submit" className="primary" disabled={busy || !value}>
            {busy && <StatusIcon name="spinner" />}
            {busy
              ? "Updating…"
              : credential.configured
                ? "Replace key"
                : "Save key"}
          </button>
          {credential.source === "database" && (
            <button type="button" disabled={busy} onClick={() => void remove()}>
              Remove saved key
            </button>
          )}
        </div>
      </form>
    </details>
  );
}
