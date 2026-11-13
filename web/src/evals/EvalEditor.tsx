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
import { defaultModel, ModelPicker } from "./ModelPicker.js";

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
      models: [{ ...defaultModel }],
      judge: { ...defaultModel },
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

    if ([...value.models, value.judge].some((model) => !model.model)) {
      setError("Choose a model for each session configuration and the judge.");

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
        <a
          className="button"
          href={initial ? `#evals/${initial.id}` : "#evals"}
        >
          Cancel
        </a>
      </PageTitle>
      <p className="description">
        Define the task and what success means. Save the eval, then run it from
        the report page.
      </p>
      <Notice error={resourceError || harnessError} />
      {harnessError && (
        <button type="button" onClick={refreshHarnesses}>
          Retry loading harnesses
        </button>
      )}
      <form onSubmit={save} className="editor">
        <section>
          <h2>Task</h2>
          <Field label="Title">
            <input
              required
              maxLength={200}
              value={value.title}
              onChange={(event) =>
                setValue({ ...value, title: event.target.value })
              }
            />
          </Field>
          <Field label="Prompt">
            <textarea
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
        <section>
          <h2>Judge</h2>
          <p className="muted">
            Each session receives its own judgment. Judge usage contributes to
            the session cost.
          </p>
          <ModelPicker
            judge
            value={value.judge}
            harnesses={harnesses ?? []}
            onChange={(judge) => setValue({ ...value, judge })}
          />
        </section>
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
          <button
            className="primary"
            disabled={saving || !harnesses}
            type="submit"
          >
            {saving && <StatusIcon name="spinner" />}
            {saving ? "Saving..." : "Save eval"}
          </button>
        </div>
      </form>
    </>
  );
}
