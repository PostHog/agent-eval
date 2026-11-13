import { Progress } from "@posthog/quill";
import { summarizeRun } from "./run-progress.js";
import { Status } from "./Status.js";
import { StatusIcon } from "./StatusIcon.js";

export function RunProgress({ sessions }: { sessions: { status: string }[] }) {
  const { counts, finished, total, active } = summarizeRun(sessions);

  if (!total) return null;

  const interrupted = counts.failed + counts.cancelled > 0;
  const finishedRun = finished === total;
  const tone = active
    ? "active"
    : !finishedRun
      ? "unknown"
      : interrupted
        ? "interrupted"
        : "complete";
  const title = active
    ? "Run in progress"
    : !finishedRun
      ? "Run status unavailable"
      : interrupted
        ? "Run finished with interruptions"
        : "Run finished";

  return (
    <section className={`run-progress ${tone}`} aria-label="Run progress">
      <div className="run-progress-heading">
        <output className="status-note" aria-live="polite">
          <StatusIcon
            name={
              active
                ? "spinner"
                : !finishedRun
                  ? "info"
                  : interrupted
                    ? "error"
                    : "check"
            }
          />
          <strong>{title}</strong>
        </output>
        <span>
          {finished} / {total} sessions finished
        </span>
      </div>
      <Progress
        className="my-3"
        variant={interrupted ? "warning" : finishedRun ? "success" : "info"}
        value={finished}
        max={total}
        aria-label="Finished sessions"
        aria-valuetext={`${finished} of ${total} sessions finished`}
      />
      <div className="run-progress-counts">
        {Object.entries(counts)
          .filter(([, count]) => count > 0)
          .map(([state, count]) => (
            <span key={state}>
              <Status value={state} />
              <strong>{count}</strong>
            </span>
          ))}
      </div>
      <p className="section-note">
        {active
          ? "Updates automatically. Acceptance includes finished sessions only."
          : finishedRun
            ? "Execution is finished. Review the criteria below for acceptance."
            : "Some session states are unavailable."}
      </p>
    </section>
  );
}
