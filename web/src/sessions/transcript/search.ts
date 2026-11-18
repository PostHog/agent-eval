import Fuse, { type FuseResultMatch } from "fuse.js";
import type { TranscriptEntry } from "./types.js";

export type MatchRanges = FuseResultMatch["indices"];
export type TranscriptMatches = Partial<
  Record<"title" | "text" | "output", MatchRanges>
>;

export function transcriptSearch(
  entries: TranscriptEntry[],
  displayText: (entry: TranscriptEntry) => string,
) {
  return new Fuse(
    entries.map((entry) => ({
      entry,
      title: entry.title,
      text: displayText(entry),
      output: entry.output,
    })),
    {
      keys: ["title", "text", "output"],
      includeMatches: true,
      ignoreLocation: true,
      threshold: 0.33,
      shouldSort: false,
    },
  );
}

export function highlightParts(
  text: string,
  ranges: MatchRanges = [],
  offset = 0,
) {
  const parts: { text: string; match: boolean; start: number }[] = [];
  let cursor = 0;
  for (const [first, last] of ranges) {
    const start = Math.max(cursor, first - offset);
    const end = Math.min(text.length, last + 1 - offset);
    if (end <= start) continue;
    if (cursor < start)
      parts.push({
        text: text.slice(cursor, start),
        match: false,
        start: cursor,
      });
    parts.push({ text: text.slice(start, end), match: true, start });
    cursor = end;
  }
  if (cursor < text.length)
    parts.push({ text: text.slice(cursor), match: false, start: cursor });
  return parts;
}
