import { Button, Checkbox } from "@posthog/quill";
import { useId } from "react";
import { Choice } from "../Choice.js";
import { type ResourceKind, resourceInfo } from "../resources/resource-info.js";
import type { EvalDraft, Resource } from "../types.js";

export type ResourceTarget = "agent" | "judge";

// Agent and judge selections reuse the same library but save to separate fields.
export function selectionField(
  kind: "skills" | "mcps",
  target: ResourceTarget,
) {
  if (target === "judge")
    return kind === "skills" ? "judgeSkillIds" : "judgeMcpIds";

  return kind === "skills" ? "skillIds" : "mcpIds";
}

export function ResourceSelection({
  kind,
  resources,
  value,
  onChange,
  onCreate,
  loading,
  target = "agent",
  unavailable,
}: {
  kind: ResourceKind;
  resources: Resource[];
  value: EvalDraft;
  onChange: (value: EvalDraft) => void;
  onCreate: () => void;
  loading: boolean;
  target?: ResourceTarget;
  unavailable?: string;
}) {
  const id = useId();
  const multiple = kind === "skills" || kind === "mcps";
  const info = resourceInfo[kind];

  return (
    <div className="resource-selection">
      <div className="section-heading">
        <h3 id={id}>
          {multiple
            ? info.title
            : kind === "environments"
              ? "Environment"
              : "Persona"}
        </h3>
        <Button type="button" disabled={!!unavailable} onClick={onCreate}>
          Create {info.singular}
        </Button>
      </div>
      {unavailable ? (
        <p className="muted">{unavailable}</p>
      ) : multiple ? (
        <div className="resource-options">
          {resources.length === 0 && (
            <p className="muted">
              {loading
                ? "Loading resources…"
                : `No ${info.title.toLowerCase()} yet.`}
            </p>
          )}
          {resources.map((resource) => {
            const key = selectionField(kind, target);

            return (
              <label
                className="checkbox"
                key={resource.id}
                htmlFor={`${id}-${resource.id}`}
              >
                <Checkbox
                  id={`${id}-${resource.id}`}
                  checked={value[key].includes(resource.id)}
                  onCheckedChange={(checked) =>
                    onChange({
                      ...value,
                      [key]: checked
                        ? [...value[key], resource.id]
                        : value[key].filter((id) => id !== resource.id),
                    })
                  }
                />
                {resource.title}
              </label>
            );
          })}
        </div>
      ) : (
        <Choice
          aria-labelledby={id}
          value={
            (kind === "environments" ? value.environmentId : value.personaId) ??
            ""
          }
          onValueChange={(next) =>
            onChange({
              ...value,
              [kind === "environments" ? "environmentId" : "personaId"]:
                next || null,
            })
          }
          options={[
            {
              value: "",
              label: kind === "environments" ? "Empty workspace" : "No persona",
            },
            ...resources.map((resource) => ({
              value: resource.id,
              label: resource.title,
            })),
          ]}
        />
      )}
    </div>
  );
}
