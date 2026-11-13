import { Button, Input, Textarea } from "@posthog/quill";
import { type FormEvent, useState } from "react";
import { api } from "../api.js";
import { Field, Notice } from "../components.js";
import { StatusIcon } from "../status/StatusIcon.js";
import type { Resource } from "../types.js";
import { ArgumentFields } from "./ArgumentFields.js";
import { type ResourceKind, resourceInfo } from "./resource-info.js";

export function ResourceForm({
  kind,
  initial,
  onClose,
  onSaved,
  onSavingChange,
  hideTitle = false,
}: {
  kind: ResourceKind;
  initial?: Resource;
  onClose: () => void;
  onSaved: (resource: Resource) => void;
  onSavingChange?: (saving: boolean) => void;
  hideTitle?: boolean;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [path, setPath] = useState(
    initial?.workspacePath ?? initial?.directory ?? initial?.command ?? "",
  );
  const [args, setArgs] = useState<{ id: string; value: string }[]>(() =>
    (initial?.arguments ?? []).map((value) => ({
      id: crypto.randomUUID(),
      value,
    })),
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    onSavingChange?.(true);
    setError("");

    try {
      const value = {
        kind: resourceInfo[kind].kind,
        title,
        description,
        ...(kind === "environments" ? { workspacePath: path || null } : {}),
        ...(kind === "skills" ? { directory: path } : {}),
        ...(kind === "mcps"
          ? { command: path, arguments: args.map((argument) => argument.value) }
          : {}),
      };

      const saved = await api<Resource>(
        initial ? `/resources/${initial.id}` : "/resources",
        {
          method: initial ? "PUT" : "POST",
          body: JSON.stringify(value),
        },
      );
      onSaved(saved);
    } catch (error) {
      setError(String(error));
    } finally {
      setSaving(false);
      onSavingChange?.(false);
    }
  }

  return (
    <form className="resource-form" onSubmit={save}>
      {!hideTitle && (
        <h2>
          {initial ? "Edit" : "Add"} {resourceInfo[kind].singular}
        </h2>
      )}
      <p className="muted">{resourceInfo[kind].hint}</p>
      <Notice error={error} />
      <Field label="Title">
        <Input
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </Field>
      <Field
        label={kind === "personas" ? "Persona instructions" : "Description"}
      >
        <Textarea
          required={kind === "personas"}
          rows={4}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </Field>
      {kind !== "personas" && (
        <Field
          label={
            kind === "environments"
              ? "Workspace folder (leave empty for an empty workspace)"
              : kind === "skills"
                ? "Skill folder containing SKILL.md"
                : "MCP executable"
          }
        >
          <Input
            required={kind !== "environments"}
            value={path}
            placeholder={kind === "mcps" ? "npx" : "/absolute/path/to/folder"}
            onChange={(event) => setPath(event.target.value)}
          />
        </Field>
      )}
      {kind === "mcps" && <ArgumentFields value={args} onChange={setArgs} />}
      <div className="actions">
        <Button type="submit" variant="primary" disabled={saving}>
          {saving && <StatusIcon name="spinner" />}
          {saving ? "Saving..." : `Save ${resourceInfo[kind].singular}`}
        </Button>
        <Button type="button" disabled={saving} onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
