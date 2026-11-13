import { Button } from "@posthog/quill";
import { useState } from "react";
import type { ResourceKind } from "../resources/resource-info.js";
import type { EvalDraft, Resource, Resources } from "../types.js";
import { ResourceDialog } from "./ResourceDialog.js";
import { ResourceSelection } from "./ResourceSelection.js";

const kinds = ["environments", "personas", "skills", "mcps"] as const;

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
  const [creating, setCreating] = useState<ResourceKind | null>(null);
  const [created, setCreated] = useState<Resources>({
    environments: [],
    personas: [],
    skills: [],
    mcps: [],
  });

  function saved(kind: ResourceKind, resource: Resource) {
    // Keep the new option visible while the catalog refresh is in flight.
    setCreated((current) => ({
      ...current,
      [kind]: [...current[kind], resource],
    }));

    const key = {
      environments: "environmentId",
      personas: "personaId",
      skills: "skillIds",
      mcps: "mcpIds",
    } as const;
    const field = key[kind];

    onChange({
      ...value,
      [field]:
        field === "skillIds" || field === "mcpIds"
          ? [...value[field], resource.id]
          : resource.id,
    });
    setCreating(null);
    refreshResources();
  }

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
        Each session gets its own copy of the environment folder. All resources
        are optional.
      </p>
      <div className="form-grid eval-resource-grid">
        {kinds.map((kind) => {
          const options = resources?.[kind] ?? [];
          const merged = [
            ...options,
            ...created[kind].filter(
              (resource) =>
                !options.some((option) => option.id === resource.id),
            ),
          ];

          return (
            <ResourceSelection
              key={kind}
              kind={kind}
              resources={merged}
              value={value}
              onChange={onChange}
              onCreate={() => setCreating(kind)}
              loading={resourcesLoading}
            />
          );
        })}
      </div>
      {creating && (
        <ResourceDialog
          kind={creating}
          onClose={() => setCreating(null)}
          onSaved={(resource) => saved(creating, resource)}
        />
      )}
    </section>
  );
}
