import { StatusIcon } from "./StatusIcon.js";

export function Acceptance({
  decisions,
  unit = "checks",
}: {
  decisions: { passed: boolean }[];
  unit?: "checks" | "sessions";
}) {
  if (!decisions.length)
    return (
      <span className="status-note muted">
        <StatusIcon name="clock" />
        Not judged
      </span>
    );

  const passed = decisions.filter((decision) => decision.passed).length;
  const label = `${passed} of ${decisions.length} ${unit} passed`;

  return (
    <span
      className={`acceptance ${passed === decisions.length ? "pass" : "fail"}`}
    >
      <span className="acceptance-value">
        <strong>{Math.round((100 * passed) / decisions.length)}%</strong>
        <small>
          {passed}/{decisions.length}
        </small>
      </span>
      <meter
        className="acceptance-meter"
        min={0}
        max={decisions.length}
        value={passed}
        aria-label={label}
        title={label}
      />
    </span>
  );
}
