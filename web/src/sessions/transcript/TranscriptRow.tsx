import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@posthog/quill";
import { StatusIcon } from "../../status/StatusIcon.js";
import { Markdown } from "../Markdown.js";
import {
  highlightParts,
  type MatchRanges,
  type TranscriptMatches,
} from "./search.js";
import type { TranscriptEntry } from "./types.js";

function Highlighted({
  text,
  ranges,
}: {
  text: string;
  ranges?: MatchRanges | undefined;
}) {
  return highlightParts(text, ranges).map((part) =>
    part.match ? <mark key={part.start}>{part.text}</mark> : part.text,
  );
}

export function TranscriptRow({
  entry,
  matches,
}: {
  entry: TranscriptEntry;
  matches?: TranscriptMatches | undefined;
}) {
  const tool = entry.kind === "tool" || entry.kind === "web";

  return (
    <article
      className={`transcript-row transcript-${entry.kind}`}
      id={`event-${entry.sequence}`}
    >
      <span className="transcript-sequence">{entry.sequence}</span>
      {tool ? (
        <div className="transcript-tool">
          <div className="tool-command">
            <span
              className={`tool-state ${entry.status}`}
              title={entry.status}
              role="img"
              aria-label={`Tool ${entry.status ?? "status unavailable"}`}
            >
              <StatusIcon
                name={
                  entry.status === "running"
                    ? "spinner"
                    : entry.status === "failed"
                      ? "error"
                      : entry.status === "passed"
                        ? "check"
                        : "info"
                }
              />
            </span>
            <strong>
              <Highlighted text={entry.title} ranges={matches?.title} />
            </strong>
            <code>
              <Highlighted text={entry.text} ranges={matches?.text} />
            </code>
          </div>
          {entry.output ? (
            <Collapsible
              className="tool-output"
              key={matches?.output ? "match" : "idle"}
              defaultOpen={Boolean(matches?.output)}
            >
              <CollapsibleTrigger>
                <span className={`tool-result-status ${entry.status}`}>
                  {entry.status === "failed" ? "Failed" : "Result"}
                </span>{" "}
                {entry.output.replaceAll(/\s+/g, " ").slice(0, 180)}
              </CollapsibleTrigger>
              <CollapsibleContent>
                <pre>
                  <Highlighted text={entry.output} ranges={matches?.output} />
                </pre>
              </CollapsibleContent>
            </Collapsible>
          ) : (
            <span className="tool-pending">
              {entry.status === "running"
                ? "Running…"
                : entry.status === "failed"
                  ? "Failed · No output"
                  : "No output"}
            </span>
          )}
        </div>
      ) : entry.kind === "thinking" ? (
        <Collapsible
          className="thinking-block"
          key={matches?.text ? "match" : "idle"}
          defaultOpen={Boolean(matches?.text)}
        >
          <CollapsibleTrigger>Thinking…</CollapsibleTrigger>
          <CollapsibleContent>
            <Markdown text={entry.text} matches={matches?.text} />
          </CollapsibleContent>
        </Collapsible>
      ) : entry.kind === "system" ? (
        <p className="transcript-error">
          <Highlighted text={entry.title} ranges={matches?.title} />{" "}
          <Highlighted text={entry.text} ranges={matches?.text} />
        </p>
      ) : (
        <Markdown text={entry.text} matches={matches?.text} />
      )}
    </article>
  );
}
