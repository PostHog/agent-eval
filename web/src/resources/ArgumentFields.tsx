export function ArgumentFields({
  value,
  onChange,
}: {
  value: { id: string; value: string }[];
  onChange: (value: { id: string; value: string }[]) => void;
}) {
  return (
    <fieldset className="argument-fields">
      <legend>Arguments</legend>
      {value.map((argument, index) => (
        <div className="criterion-input" key={argument.id}>
          <input
            aria-label={`Argument ${index + 1}`}
            value={argument.value}
            onChange={(event) =>
              onChange(
                value.map((item, position) =>
                  position === index
                    ? { ...item, value: event.target.value }
                    : item,
                ),
              )
            }
          />
          <button
            type="button"
            aria-label={`Remove argument ${index + 1}`}
            onClick={() =>
              onChange(value.filter((_, position) => position !== index))
            }
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          onChange([...value, { id: crypto.randomUUID(), value: "" }])
        }
      >
        Add argument
      </button>
    </fieldset>
  );
}
