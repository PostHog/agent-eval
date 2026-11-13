import { useState } from "react";
import { useApi } from "../api.js";
import { Notice, PageTitle } from "../components.js";
import { Feedback, RequestState } from "../PageState.js";
import type { Credential } from "../types.js";
import { CredentialForm } from "./CredentialForm.js";
import { providerInfo } from "./provider-info.js";

export function CredentialsPage() {
  const { data, error, refresh } = useApi<Credential[]>("/credentials");
  const [message, setMessage] = useState("");

  return (
    <>
      <PageTitle title="API keys">
        <a className="button" href="#harnesses">
          Check harnesses
        </a>
      </PageTitle>
      <p className="description">
        Add a key for the harness you want to use. You do not need keys for
        every provider.
      </p>
      <Feedback message={message} />
      {data ? (
        <Notice error={error} />
      ) : (
        <RequestState error={error} retry={refresh} />
      )}
      <div className="credentials">
        {data?.map((credential) => (
          <CredentialForm
            key={`${credential.provider}-${credential.source}-${credential.configured}`}
            credential={credential}
            onSaved={() => {
              setMessage(
                `${providerInfo[credential.provider]?.name ?? credential.provider} key settings updated.`,
              );
              refresh();
            }}
          />
        ))}
      </div>
      <details className="section">
        <summary>Key storage and environment overrides</summary>
        <p className="section-note">
          Keys are encrypted in SQLite. The encryption key stays in the local
          application data directory; back up both files together. A saved key
          overrides the environment key for that provider. Removing the saved
          key restores the environment fallback.
        </p>
      </details>
    </>
  );
}
