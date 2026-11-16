import { Button } from "@posthog/quill";
import { useState } from "react";
import type { ResourceKind } from "../resources/resource-info.js";
import type { EvalDraft, Harness, Resource, Resources } from "../types.js";
import { ResourceDialog } from "./ResourceDialog.js";
import {
  ResourceSelection,
  type ResourceTarget,
  selectionField,
} from "./ResourceSelection.js";

const kinds = ["environments", "personas", "skills", "mcps"] as const;
const judgeKinds = ["skills", "mcps"] as const;

export function EvalResources({
  value,
  onChange,
  resources,
  refreshResources,
  resourcesLoading,
  judgeHarness,
}: {
  value: EvalDraft;
  onChange: (value: EvalDraft) => void;
  resources?: Resources;
  refreshResources: () => void;
  resourcesLoading: boolean;
  judgeHarness?: Harness;
}) {
  const [creating, setCreating] = useState<{
    kind: ResourceKind;
    target: ResourceTarget;
  } | null>(null);
  const [created, setCreated] = useState<Resources>({
    environments: [],
    personas: [],
    skills: [],
    mcps: [],
  });

  function saved(
    kind: ResourceKind,
    target: ResourceTarget,
    resource: Resource,
  ) {
    // Keep the new option visible while the catalog refresh is in flight.
    setCreated((current) => ({
      ...current,
      [kind]: [...current[kind], resource],
    }));

    if (kind === "skills" || kind === "mcps") {
      const field = selectionField(kind, target);

      onChange({ ...value, [field]: [...value[field], resource.id] });
    } else
      onChange({
        ...value,
        [kind === "environments" ? "environmentId" : "personaId"]: resource.id,
      });

    setCreating(null);
    refreshResources();
  }

  function options(kind: ResourceKind) {
    const listed = resources?.[kind] ?? [];

    return [
      ...listed,
      ...created[kind].filter(
        (resource) => !listed.some((option) => option.id === resource.id),
      ),
    ];
  }

  const judgeMcpUnavailable =
    judgeHarness && !judgeHarness.judgeSupportsMcp
      ? `The ${judgeHarness.title} judge cannot use MCP servers. Choose another judge harness to add them.`
      : undefined;

  return (
    <section>
      <div className="section-heading">
        <h2>Environment and resources</h2>
        <Button
          type="button"
          disabled={resourcesLoading}
          onClick={refreshResources}
        >
          {resourcesLoading ? "Refreshing…" : "Refresh resources"}
        </Button>
      </div>
      <p className="muted">
        Each session gets an independent environment workspace and runtime. All
        resources are optional.
      </p>
      <div className="form-grid eval-resource-grid">
        {kinds.map((kind) => (
          <ResourceSelection
            key={kind}
            kind={kind}
            resources={options(kind)}
            value={value}
            onChange={onChange}
            onCreate={() => setCreating({ kind, target: "agent" })}
            loading={resourcesLoading}
          />
        ))}
      </div>
      <h3 className="judge-resources-heading">Judge resources</h3>
      <p className="muted">
        Optional. Judge skills are added to the judge instructions. Judge MCP
        servers give the judge tools to check evidence. The judge never gets
        file, shell, or web tools, and it does not receive the agent resources
        above.
      </p>
      <div className="form-grid eval-resource-grid">
        {judgeKinds.map((kind) => (
          <ResourceSelection
            key={`judge-${kind}`}
            kind={kind}
            target="judge"
            resources={options(kind)}
            value={value}
            onChange={onChange}
            onCreate={() => setCreating({ kind, target: "judge" })}
            loading={resourcesLoading}
            unavailable={kind === "mcps" ? judgeMcpUnavailable : undefined}
          />
        ))}
      </div>
      {creating && (
        <ResourceDialog
          kind={creating.kind}
          onClose={() => setCreating(null)}
          onSaved={(resource) =>
            saved(creating.kind, creating.target, resource)
          }
        />
      )}
    </section>
  );
}
