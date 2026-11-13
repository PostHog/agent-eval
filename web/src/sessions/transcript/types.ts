import { z } from "zod";

export type EntryKind =
  | "message"
  | "user"
  | "thinking"
  | "tool"
  | "web"
  | "system";
export interface TranscriptEntry {
  id: string;
  sequence: number;
  kind: EntryKind;
  title: string;
  text: string;
  output?: string;
  status?: "running" | "passed" | "failed";
}

export const record = (value: unknown): Record<string, unknown> =>
  z.record(z.unknown()).safeParse(value).data ?? {};
export const string = (value: unknown): string =>
  typeof value === "string" ? value : "";
export const blocksText = (value: unknown): string =>
  typeof value === "string"
    ? value
    : Array.isArray(value)
      ? value
          .map((part) => string(record(part).text))
          .filter(Boolean)
          .join("\n")
      : "";

export function toolText(value: unknown): string {
  const args = record(value);

  return (
    string(
      args.command ??
        args.filePath ??
        args.file_path ??
        args.path ??
        args.url ??
        args.pattern,
    ) || (Object.keys(args).length ? JSON.stringify(args) : "")
  );
}

export const toolKind = (name: string): EntryKind =>
  /web|fetch|search/i.test(name) ? "web" : "tool";
