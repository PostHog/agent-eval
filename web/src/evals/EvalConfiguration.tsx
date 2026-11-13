import { useApi } from "../api.js";
import { ModelReference } from "../models/ModelReference.js";
import type { EvaluationData, Resources, Session } from "../types.js";

export function EvalConfiguration({
  definition,
  snapshot,
}: {
  definition: EvaluationData;
  snapshot?: Session["snapshot"];
}) {
  const { data } = useApi<Resources>("/resources");
  const environment = snapshot
    ? snapshot.environment?.title
    : data?.environments.find((item) => item.id === definition.environmentId)
        ?.title;
  const persona = snapshot
    ? snapshot.persona?.title
    : data?.personas.find((item) => item.id === definition.personaId)?.title;
  const skills =
    snapshot?.skills ??
    data?.skills.filter((item) => definition.skillIds.includes(item.id));
  const mcps =
    snapshot?.mcps ??
    data?.mcps.filter((item) => definition.mcpIds.includes(item.id));

  return (
    <aside className="context-panel">
      <h2>{snapshot ? "Run configuration" : "Configuration"}</h2>
      <dl>
        <dt>Revision</dt>
        <dd>{definition.revision}</dd>
        <dt>Environment</dt>
        <dd>
          {environment ??
            (definition.environmentId ? "Unavailable" : "Empty workspace")}
        </dd>
        <dt>Persona</dt>
        <dd>{persona ?? (definition.personaId ? "Unavailable" : "None")}</dd>
        <dt>Skills</dt>
        <dd>
          {skills?.map((item) => item.title).join(", ") ||
            (definition.skillIds.length
              ? `${definition.skillIds.length} selected`
              : "None")}
        </dd>
        <dt>MCP servers</dt>
        <dd>
          {mcps?.map((item) => item.title).join(", ") ||
            (definition.mcpIds.length
              ? `${definition.mcpIds.length} selected`
              : "None")}
        </dd>
        <dt>Session models</dt>
        {definition.models.map((model, index) => (
          <dd key={`${index}-${model.model}`}>
            <ModelReference harness={model.harness} model={model.model} />
            <small>
              {model.count} {model.count === 1 ? "session" : "sessions"} ·{" "}
              {model.effort} effort
            </small>
          </dd>
        ))}
        <dt>Judge</dt>
        <dd>
          <ModelReference
            harness={definition.judge.harness}
            model={definition.judge.model}
          />
        </dd>
      </dl>
    </aside>
  );
}
