import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@posthog/quill";
import { ModelReference } from "../models/ModelReference.js";
import type { Session } from "../types.js";

export function ConfigurationPanel({ session }: { session: Session }) {
  const snapshot = session.snapshot;

  return (
    <div className="configuration-summary">
      <h2>Saved session configuration</h2>
      <p className="muted">
        This snapshot records the settings used for this session. Later eval
        edits do not change it.
      </p>
      <dl>
        <dt>Eval revision</dt>
        <dd>{snapshot.evaluation.revision}</dd>
        <dt>Agent</dt>
        <dd>
          <ModelReference harness={session.harness} model={session.model} />
        </dd>
        <dt>Judge</dt>
        <dd>
          <ModelReference
            harness={snapshot.evaluation.judge.harness}
            model={snapshot.evaluation.judge.model}
          />
        </dd>
        <dt>Environment</dt>
        <dd>
          {snapshot.environment?.title ?? "Empty workspace"}
          {snapshot.environment && (
            <small>
              {snapshot.environment.executionMode === "docker"
                ? snapshot.environment.dockerfilePath
                  ? "Docker · local Dockerfile"
                  : "Docker · saved Dockerfile"
                : "This computer"}
              {" · "}
              {snapshot.environment.repositoryUrl ??
                snapshot.environment.workspacePath ??
                "Empty workspace"}
            </small>
          )}
        </dd>
        <dt>Persona</dt>
        <dd>
          {snapshot.persona?.title ?? "None"}
          {snapshot.persona && (
            <p className="preserve-lines">{snapshot.persona.description}</p>
          )}
        </dd>
        <dt>Skills</dt>
        <dd>
          {snapshot.skills.length ? (
            <ul>
              {snapshot.skills.map((skill) => (
                <li key={skill.title}>{skill.title}</li>
              ))}
            </ul>
          ) : (
            "None"
          )}
        </dd>
        <dt>MCP servers</dt>
        <dd>
          {snapshot.mcps.length ? (
            <ul>
              {snapshot.mcps.map((mcp, index) => (
                <li key={`${index}-${mcp.title}`}>
                  {mcp.title}
                  <small>{mcp.command}</small>
                </li>
              ))}
            </ul>
          ) : (
            "None"
          )}
        </dd>
      </dl>
      <Collapsible>
        <CollapsibleTrigger>Full configuration (JSON)</CollapsibleTrigger>
        <CollapsibleContent>
          <pre className="configuration">
            {JSON.stringify(snapshot, null, 2)}
          </pre>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
