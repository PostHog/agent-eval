import type { EvalDraft } from "../types.js";

export function EvalCriteria({
  value,
  onChange,
}: {
  value: EvalDraft;
  onChange: (value: EvalDraft) => void;
}) {
  return (
    <section>
      <h2>Criteria</h2>
      <p className="muted">
        The judge tests every criterion separately for each session.
      </p>
      {value.criteria.map((criterion, index) => (
        <div className="criterion-input" key={criterion.id}>
          <span>{index + 1}</span>
          <textarea
            rows={2}
            required
            aria-label={`Criterion ${index + 1}`}
            value={criterion.description}
            onChange={(event) =>
              onChange({
                ...value,
                criteria: value.criteria.map((item) =>
                  item.id === criterion.id
                    ? { ...item, description: event.target.value }
                    : item,
                ),
              })
            }
          />
          <button
            type="button"
            aria-label={`Remove criterion ${index + 1}`}
            disabled={value.criteria.length === 1}
            onClick={() =>
              onChange({
                ...value,
                criteria: value.criteria.filter(
                  (item) => item.id !== criterion.id,
                ),
              })
            }
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          onChange({
            ...value,
            criteria: [
              ...value.criteria,
              { id: crypto.randomUUID(), description: "" },
            ],
          })
        }
      >
        Add criterion
      </button>
    </section>
  );
}
