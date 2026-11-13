import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@posthog/quill";
import { StatusIcon } from "../../status/StatusIcon.js";
import { Markdown } from "../Markdown.js";
import type { TranscriptEntry } from "./types.js";

export function TranscriptRow({ entry }: { entry: TranscriptEntry }) {
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
            <strong>{entry.title}</strong>
            <code>{entry.text}</code>
          </div>
          {entry.output ? (
            <Collapsible className="tool-output">
              <CollapsibleTrigger>
                <span className={`tool-result-status ${entry.status}`}>
                  {entry.status === "failed" ? "Failed" : "Result"}
                </span>{" "}
                {entry.output.replaceAll(/\s+/g, " ").slice(0, 180)}
              </CollapsibleTrigger>
              <CollapsibleContent>
                <pre>{entry.output}</pre>
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
        <Collapsible className="thinking-block">
          <CollapsibleTrigger>Thinking…</CollapsibleTrigger>
          <CollapsibleContent>
            <Markdown text={entry.text} />
          </CollapsibleContent>
        </Collapsible>
      ) : entry.kind === "system" ? (
        <p className="transcript-error">
          {entry.title} {entry.text}
        </p>
      ) : (
        <Markdown text={entry.text} />
      )}
    </article>
  );
}
