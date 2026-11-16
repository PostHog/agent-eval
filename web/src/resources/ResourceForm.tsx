import { Button, Input, Textarea } from "@posthog/quill";
import { type FormEvent, useState } from "react";
import { api } from "../api.js";
import { Choice } from "../Choice.js";
import { Field, Notice } from "../components.js";
import { StatusIcon } from "../status/StatusIcon.js";
import type { Resource } from "../types.js";
import { ArgumentFields } from "./ArgumentFields.js";
import { DefaultDockerfile } from "./DefaultDockerfile.js";
import { InlineDockerfile } from "./InlineDockerfile.js";
import { PathInput } from "./PathInput.js";
import { ResourceIcon, type ResourceIconName } from "./ResourceIcon.js";
import { type ResourceKind, resourceInfo } from "./resource-info.js";

function EnvironmentSectionHeading({
  icon,
  title,
  description,
}: {
  icon: ResourceIconName;
  title: string;
  description: string;
}) {
  return (
    <header className="environment-section-heading">
      <span className="environment-section-icon">
        <ResourceIcon name={icon} />
      </span>
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </header>
  );
}

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
    initial?.workspacePath ?? initial?.filePath ?? initial?.command ?? "",
  );
  const [repositoryUrl, setRepositoryUrl] = useState(
    initial?.repositoryUrl ?? "",
  );
  const [dockerfilePath, setDockerfilePath] = useState(
    initial?.dockerfilePath ?? "",
  );
  const [dockerfileContent, setDockerfileContent] = useState(
    initial?.dockerfileContent ?? "",
  );
  const [dockerfileSource, setDockerfileSource] = useState<
    "default" | "file" | "inline"
  >(
    initial?.dockerfileContent
      ? "inline"
      : initial?.dockerfilePath
        ? "file"
        : "default",
  );
  const [environmentSource, setEnvironmentSource] = useState<
    "empty" | "folder" | "repository"
  >(
    initial?.repositoryUrl
      ? "repository"
      : initial?.workspacePath
        ? "folder"
        : "empty",
  );
  const [executionMode, setExecutionMode] = useState<"local" | "docker">(
    initial?.executionMode ?? "local",
  );
  const [content, setContent] = useState(initial?.content ?? "");
  const [skillSource, setSkillSource] = useState<"inline" | "file">(
    initial?.filePath ? "file" : "inline",
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

    if (
      kind === "environments" &&
      executionMode === "docker" &&
      dockerfileSource === "inline" &&
      !dockerfileContent.trim()
    ) {
      setError("Add the inline Dockerfile before saving the environment.");
      return;
    }

    setSaving(true);
    onSavingChange?.(true);
    setError("");

    try {
      const value = {
        kind: resourceInfo[kind].kind,
        title,
        ...(kind === "personas" || kind === "mcps" ? { description } : {}),
        ...(kind === "environments"
          ? {
              workspacePath: environmentSource === "folder" ? path : null,
              repositoryUrl:
                environmentSource === "repository" ? repositoryUrl : null,
              executionMode,
              dockerfilePath:
                executionMode === "docker" && dockerfileSource === "file"
                  ? dockerfilePath
                  : null,
              dockerfileContent:
                executionMode === "docker" && dockerfileSource === "inline"
                  ? dockerfileContent
                  : null,
            }
          : {}),
        ...(kind === "skills"
          ? {
              filePath: skillSource === "file" ? path : null,
              content: skillSource === "inline" ? content : null,
            }
          : {}),
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
      {kind !== "environments" && (
        <p className="muted">{resourceInfo[kind].hint}</p>
      )}
      <Notice error={error} />
      <Field label="Title">
        <Input
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </Field>
      {kind !== "skills" && kind !== "environments" && (
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
      )}
      {kind === "skills" && (
        <>
          <Field label="Source">
            <Choice
              value={skillSource}
              onValueChange={(value) =>
                setSkillSource(value as "inline" | "file")
              }
              options={[
                { value: "inline", label: "Write instructions here" },
                { value: "file", label: "Use a local file" },
              ]}
            />
          </Field>
          {skillSource === "inline" ? (
            <Field label="Skill instructions">
              <Textarea
                required
                rows={12}
                value={content}
                onChange={(event) => setContent(event.target.value)}
              />
            </Field>
          ) : (
            <Field label="Skill file">
              <PathInput
                kind="file"
                required
                value={path}
                placeholder="/absolute/path/to/skill.md"
                onChange={setPath}
              />
            </Field>
          )}
        </>
      )}
      {kind === "environments" && (
        <div className="environment-form">
          <section>
            <EnvironmentSectionHeading
              icon="workspace"
              title="Workspace contents"
              description="Files copied into the isolated workspace for each session."
            />
            <Field label="Workspace source">
              <Choice
                value={environmentSource}
                onValueChange={(value) =>
                  setEnvironmentSource(
                    value as "empty" | "folder" | "repository",
                  )
                }
                options={[
                  { value: "empty", label: "Empty workspace" },
                  { value: "folder", label: "Local folder" },
                  { value: "repository", label: "Git repository" },
                ]}
              />
            </Field>
            {environmentSource === "folder" && (
              <Field label="Source directory">
                <PathInput
                  kind="directory"
                  required
                  value={path}
                  placeholder="/absolute/path/to/project"
                  onChange={setPath}
                />
              </Field>
            )}
            {environmentSource === "repository" && (
              <Field label="Repository URL">
                <Input
                  required
                  value={repositoryUrl}
                  placeholder="https://github.com/PostHog/posthog.git"
                  onChange={(event) => setRepositoryUrl(event.target.value)}
                />
              </Field>
            )}
          </section>
          <section>
            <EnvironmentSectionHeading
              icon="runtime"
              title="Command runtime"
              description="Process boundary used for every agent and tool command."
            />
            <Field label="Execution target">
              <Choice
                value={executionMode}
                onValueChange={(value) =>
                  setExecutionMode(value as "local" | "docker")
                }
                options={[
                  { value: "local", label: "This computer" },
                  { value: "docker", label: "Docker container" },
                ]}
              />
            </Field>
            {executionMode === "docker" && (
              <div className="environment-subsection">
                <EnvironmentSectionHeading
                  icon="container"
                  title="Container image"
                  description="Dockerfile used to build this environment."
                />
                <Field label="Image definition">
                  <Choice
                    value={dockerfileSource}
                    onValueChange={(value) =>
                      setDockerfileSource(value as typeof dockerfileSource)
                    }
                    options={[
                      { value: "default", label: "Use the built-in image" },
                      { value: "file", label: "Use a local Dockerfile" },
                      { value: "inline", label: "Write a Dockerfile" },
                    ]}
                  />
                </Field>
                {dockerfileSource === "default" && <DefaultDockerfile />}
                {dockerfileSource === "file" && (
                  <Field label="Dockerfile path">
                    <PathInput
                      kind="file"
                      required
                      value={dockerfilePath}
                      placeholder="/absolute/path/to/Dockerfile"
                      onChange={setDockerfilePath}
                    />
                  </Field>
                )}
                {dockerfileSource === "inline" && (
                  <InlineDockerfile
                    value={dockerfileContent}
                    onChange={setDockerfileContent}
                  />
                )}
                <p className="muted">
                  Native harnesses require their executable in the image. Pi
                  only requires the commands that the agent uses.
                </p>
              </div>
            )}
          </section>
        </div>
      )}
      {kind === "mcps" && (
        <Field label="MCP executable">
          <Input
            required
            value={path}
            placeholder="npx"
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
