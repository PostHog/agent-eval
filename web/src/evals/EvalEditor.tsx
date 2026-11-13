import { Button, Input, Textarea } from "@posthog/quill";
import { type FormEvent, useState } from "react";
import { api, useApi } from "../api.js";
import { Field, Notice, PageTitle } from "../components.js";
import { RequestState } from "../PageState.js";
import { StatusIcon } from "../status/StatusIcon.js";
import type {
  EvalDraft,
  EvaluationData,
  Harness,
  Resources,
} from "../types.js";
import { EvalCriteria } from "./EvalCriteria.js";
import { EvalModels } from "./EvalModels.js";
import { EvalResources } from "./EvalResources.js";

export function EvalEditor({ id }: { id?: string }) {
  return id ? <ExistingEditor id={id} /> : <Editor />;
}

function ExistingEditor({ id }: { id: string }) {
  const { data, error, refresh } = useApi<EvaluationData>(`/evals/${id}`);

  return data ? (
    <Editor initial={data} />
  ) : (
    <RequestState error={error} retry={refresh} />
  );
}

function Editor({ initial }: { initial?: EvaluationData }) {
  const [value, setValue] = useState<EvalDraft>(
    initial ?? {
      title: "",
      prompt: "",
      criteria: [{ id: crypto.randomUUID(), description: "" }],
      environmentId: null,
      personaId: null,
      skillIds: [],
      mcpIds: [],
      models: [],
      judge: null,
    },
  );
  const {
    data: resources,
    error: resourceError,
    refresh: refreshResources,
    loading: resourcesLoading,
  } = useApi<Resources>("/resources");
  const {
    data: harnesses,
    error: harnessError,
    refresh: refreshHarnesses,
  } = useApi<Harness[]>("/harnesses");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function save(event: FormEvent) {
    event.preventDefault();

    if (value.criteria.some((criterion) => !criterion.description.trim())) {
      setError("Add text to each criterion before saving the eval.");

      return;
    }

    if (!value.models.length) {
      setError("Add at least one model before saving the eval.");

      return;
    }

    if (!value.judge) {
      setError("Add a judge before saving the eval.");

      return;
    }

    setSaving(true);
    setError("");

    try {
      const { id: _id, ...input } = { ...value, id: initial?.id };
      const saved = await api<EvaluationData>(
        initial ? `/evals/${initial.id}` : "/evals",
        { method: initial ? "PUT" : "POST", body: JSON.stringify(input) },
      );

      location.hash = `evals/${saved.id}`;
    } catch (error) {
      setError(String(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageTitle title={initial ? "Edit eval" : "New eval"}>
        <Button
          nativeButton={false}
          variant="outline"
          render={
            <a href={initial ? `#evals/${initial.id}` : "#evals"}>Cancel</a>
          }
        />
      </PageTitle>
      <p className="description">
        Define the task and what success means. Save the eval, then run it from
        the report page.
      </p>
      <Notice error={resourceError || harnessError} />
      {harnessError && (
        <Button type="button" onClick={refreshHarnesses}>
          Retry loading harnesses
        </Button>
      )}
      <form onSubmit={save} className="editor">
        <section>
          <h2>Task</h2>
          <Field label="Title">
            <Input
              required
              maxLength={200}
              value={value.title}
              onChange={(event) =>
                setValue({ ...value, title: event.target.value })
              }
            />
          </Field>
          <Field label="Prompt">
            <Textarea
              required
              rows={5}
              value={value.prompt}
              onChange={(event) =>
                setValue({ ...value, prompt: event.target.value })
              }
            />
          </Field>
        </section>
        <EvalCriteria value={value} onChange={setValue} />
        <EvalResources
          value={value}
          onChange={setValue}
          resources={resources}
          refreshResources={refreshResources}
          resourcesLoading={resourcesLoading}
        />
        <EvalModels value={value} onChange={setValue} harnesses={harnesses} />
        <div className="form-actions">
          <Notice error={error} />
          <p className="section-note">
            {value.criteria.length} criteria ·{" "}
            {value.models.reduce(
              (sum, model) =>
                sum + (Number.isFinite(model.count) ? model.count : 0),
              0,
            )}{" "}
            sessions per run · one judgment per session
          </p>
          <Button
            variant="primary"
            disabled={saving || !harnesses}
            type="submit"
          >
            {saving && <StatusIcon name="spinner" />}
            {saving ? "Saving..." : "Save eval"}
          </Button>
        </div>
      </form>
    </>
  );
}
