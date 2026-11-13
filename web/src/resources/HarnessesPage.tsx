import { useState } from "react";
import { useApi } from "../api.js";
import { Notice, PageTitle } from "../components.js";
import { HarnessIcon } from "../models/ModelReference.js";
import { searchModels } from "../models/model-search.js";
import { RequestState } from "../PageState.js";
import { StatusIcon } from "../status/StatusIcon.js";
import type { Credential, Harness } from "../types.js";
import { providerInfo } from "./provider-info.js";

export function HarnessesPage() {
  const { data, error, refresh, loading } = useApi<Harness[]>("/harnesses");
  const credentials = useApi<Credential[]>("/credentials");

  return (
    <>
      <PageTitle title="Harnesses">
        <a className="button" href="#credentials">
          Manage API keys
        </a>
        <button
          type="button"
          disabled={loading || credentials.loading}
          onClick={() => {
            refresh();
            credentials.refresh();
          }}
        >
          {(loading || credentials.loading) && <StatusIcon name="spinner" />}
          {loading || credentials.loading ? "Checking…" : "Refresh status"}
        </button>
      </PageTitle>
      <p className="description">
        Choose how agents run your evals. Each harness needs an installed
        adapter and an API key. A listed model does not guarantee that your
        provider account has access.
      </p>
      <Notice error={credentials.error} />
      {!data ? (
        <RequestState error={error} retry={refresh} />
      ) : (
        <>
          <Notice error={error} />
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Harness</th>
                  <th>Installation</th>
                  <th>API key</th>
                  <th>Models</th>
                  <th>MCP support</th>
                </tr>
              </thead>
              <tbody>
                {data.map((harness) => {
                  const key = credentials.data?.find(
                    (item) => item.provider === harness.provider,
                  );

                  return (
                    <tr key={harness.id}>
                      <td>
                        <span className="model-reference">
                          <HarnessIcon harness={harness.id} />
                          {harness.title}
                        </span>
                      </td>
                      <td className={harness.installed ? "pass" : "fail"}>
                        {harness.installed ? "Installed" : "Not installed"}
                        {!harness.installed && (
                          <small>Install {harness.title}, then refresh.</small>
                        )}
                      </td>
                      <td>
                        <span className={key?.configured ? "pass" : "muted"}>
                          {key
                            ? key.configured
                              ? "Configured"
                              : "Missing key"
                            : "Not checked"}
                        </span>
                        <small>
                          <a href="#credentials">
                            {providerInfo[harness.provider]?.name ??
                              harness.provider}{" "}
                            settings
                          </a>
                        </small>
                      </td>
                      <td>
                        <HarnessModels harness={harness} />
                      </td>
                      <td>
                        {harness.supportsMcp
                          ? "Supported (stdio)"
                          : "Not supported"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="section-note">
            Once your harness and key are configured,{" "}
            <a href="#evals/new">create an eval</a>.
          </p>
        </>
      )}
    </>
  );
}

function HarnessModels({ harness }: { harness: Harness }) {
  const [query, setQuery] = useState("");
  const models = searchModels(harness.models, query);

  return (
    <details>
      <summary>{harness.models.length} models</summary>
      <input
        className="catalog-search"
        type="search"
        aria-label={`Search ${harness.title} models`}
        placeholder="Search models"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <ul className="model-catalog">
        {models.map((model) => (
          <li key={model.id}>
            {model.name}
            <small>{model.id}</small>
          </li>
        ))}
      </ul>
      {models.length === 0 && <p className="muted">No matching models.</p>}
    </details>
  );
}
