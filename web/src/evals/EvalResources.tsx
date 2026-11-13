import { Field } from "../components.js";
import type { EvalDraft, Resources } from "../types.js";

export function EvalResources({
  value,
  onChange,
  resources,
  refreshResources,
  resourcesLoading,
}: {
  value: EvalDraft;
  onChange: (value: EvalDraft) => void;
  resources?: Resources;
  refreshResources: () => void;
  resourcesLoading: boolean;
}) {
  return (
    <section>
      <h2>Environment and resources</h2>
      <p className="muted">
        Each session receives its own copy of the environment folder. Resources
        are optional.
      </p>
      <div className="resource-links">
        <a href="#environments" target="_blank" rel="noopener">
          Manage environments
        </a>
        <a href="#personas" target="_blank" rel="noopener">
          Manage personas
        </a>
        <button
          type="button"
          disabled={resourcesLoading}
          onClick={refreshResources}
        >
          {resourcesLoading ? "Loading resources…" : "Refresh resources"}
        </button>
      </div>
      <div className="form-grid">
        <Field label="Environment">
          <select
            value={value.environmentId ?? ""}
            onChange={(event) =>
              onChange({
                ...value,
                environmentId: event.target.value || null,
              })
            }
          >
            <option value="">Empty workspace</option>
            {resources?.environments.map((resource) => (
              <option value={resource.id} key={resource.id}>
                {resource.title}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Persona">
          <select
            value={value.personaId ?? ""}
            onChange={(event) =>
              onChange({ ...value, personaId: event.target.value || null })
            }
          >
            <option value="">No persona</option>
            {resources?.personas.map((resource) => (
              <option value={resource.id} key={resource.id}>
                {resource.title}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="form-grid">
        {(["skills", "mcps"] as const).map((kind) => (
          <fieldset key={kind}>
            <legend>{kind === "skills" ? "Skills" : "MCP servers"}</legend>
            {resources?.[kind].length === 0 && (
              <p className="muted">
                No resources yet.{" "}
                <a href={`#${kind}`} target="_blank" rel="noopener">
                  Add {kind === "skills" ? "skills" : "MCP servers"} in a new
                  tab
                </a>
                , then select Refresh resources here.
              </p>
            )}
            {resources?.[kind].map((resource) => {
              const key = kind === "skills" ? "skillIds" : "mcpIds";
              return (
                <label className="checkbox" key={resource.id}>
                  <input
                    type="checkbox"
                    checked={value[key].includes(resource.id)}
                    onChange={(event) =>
                      onChange({
                        ...value,
                        [key]: event.target.checked
                          ? [...value[key], resource.id]
                          : value[key].filter((id) => id !== resource.id),
                      })
                    }
                  />
                  {resource.title}
                </label>
              );
            })}
          </fieldset>
        ))}
      </div>
    </section>
  );
}
