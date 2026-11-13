import { useMemo, useRef, useState } from "react";
import { Notice, Status } from "../components.js";
import { ModelReference } from "../models/ModelReference.js";
import { LoadingState } from "../PageState.js";
import type { Session } from "../types.js";
import { TranscriptRow } from "./transcript/TranscriptRow.js";
import { buildTranscript } from "./transcript/transcript.js";
import { useSessionEvents } from "./useSessionEvents.js";

const filters = [
  "focus",
  "all",
  "message",
  "user",
  "thinking",
  "tool",
  "web",
  "system",
] as const;

export function LogPanel({
  session,
  active,
}: {
  session: Session;
  active: boolean;
}) {
  const { events, error } = useSessionEvents(session.id, active);
  const [filter, setFilter] = useState<string>("focus");
  const [phase, setPhase] = useState("agent");
  const [raw, setRaw] = useState(false);
  const [more, setMore] = useState(false);
  const [search, setSearch] = useState("");
  const container = useRef<HTMLDivElement>(null);
  const phaseEvents = useMemo(
    () => events.filter((event) => event.phase === phase),
    [events, phase],
  );
  const entries = useMemo(() => buildTranscript(phaseEvents), [phaseEvents]);
  const visible = entries.filter(
    (entry) =>
      (filter === "all" ||
        (filter === "focus"
          ? entry.kind !== "system"
          : entry.kind === filter)) &&
      `${entry.title} ${entry.text} ${entry.output ?? ""}`
        .toLowerCase()
        .includes(search.trim().toLowerCase()),
  );
  const shown = more ? visible : visible.slice(0, 150);
  const model = phase === "agent" ? session : session.snapshot.evaluation.judge;
  const prompt = session.snapshot.evaluation.prompt;
  const count = (kind: string) =>
    entries.filter(
      (entry) =>
        kind === "all" ||
        (kind === "focus" ? entry.kind !== "system" : entry.kind === kind),
    ).length;

  return (
    <div className="transcript">
      <div className="transcript-toolbar">
        <fieldset className="transcript-filters" aria-label="Filter transcript">
          {filters.map((kind) => (
            <button
              type="button"
              key={kind}
              className={`filter-${kind}`}
              aria-pressed={filter === kind}
              disabled={raw}
              onClick={() => setFilter(kind)}
            >
              {kind === "message"
                ? "messages"
                : kind === "tool"
                  ? "tools"
                  : kind}{" "}
              <span>{count(kind)}</span>
            </button>
          ))}
        </fieldset>
        <div className="transcript-options">
          <input
            type="search"
            aria-label="Search transcript"
            placeholder="Search transcript"
            value={search}
            disabled={raw}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select
            aria-label="Execution phase"
            value={phase}
            onChange={(event) => setPhase(event.target.value)}
          >
            <option value="agent">Agent</option>
            <option value="judge">Judge</option>
          </select>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={raw}
              onChange={(event) => setRaw(event.target.checked)}
            />
            Raw events
          </label>
          {search && (
            <button type="button" onClick={() => setSearch("")}>
              Clear search
            </button>
          )}
        </div>
      </div>
      <Notice error={error} />
      <div className="transcript-scroll" ref={container}>
        <header className="transcript-intro">
          <ModelReference harness={model.harness} model={model.model} />
          <dl>
            <dt>environment</dt>
            <dd>{session.snapshot.environment?.title ?? "Empty workspace"}</dd>
            <dt>status</dt>
            <dd>
              <Status value={session.status} />
            </dd>
          </dl>
        </header>
        {phase === "agent" &&
          !entries.some(
            (entry) => entry.kind === "user" && entry.text === prompt,
          ) && <div className="transcript-prompt">{prompt}</div>}
        {raw
          ? phaseEvents.map((event) => (
              <details key={event.id} className="raw-event">
                <summary>
                  Event {event.sequence} ·{" "}
                  {new Date(event.createdAt).toLocaleTimeString()}
                </summary>
                <pre>{JSON.stringify(event.event, null, 2)}</pre>
              </details>
            ))
          : shown.map((entry) => (
              <TranscriptRow key={entry.id} entry={entry} />
            ))}
        {!raw && visible.length > shown.length && (
          <button
            type="button"
            className="load-transcript"
            onClick={() => setMore(true)}
          >
            Show {visible.length - shown.length} more entries
          </button>
        )}
        {!raw &&
          visible.length === 0 &&
          (active && entries.length === 0 ? (
            <LoadingState label="Waiting for session activity…" />
          ) : (
            <p className="empty">No entries match this filter and search.</p>
          ))}
      </div>
      <button
        type="button"
        className="back-to-top"
        onClick={() =>
          container.current?.scrollTo({ top: 0, behavior: "instant" })
        }
      >
        Back to top
      </button>
    </div>
  );
}
