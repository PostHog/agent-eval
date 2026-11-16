import type { ModelSettingsData } from "../../evaluations/domain/model-settings.js";

export interface ProcessCommand {
  binary: string;
  args: string[];
  env: NodeJS.ProcessEnv;
}

export interface ShellOptions {
  onData: (data: Buffer) => void;
  signal?: AbortSignal;
  timeout?: number;
  env?: NodeJS.ProcessEnv;
}

export interface HarnessRuntime {
  readonly kind: "local" | "docker";
  process(command: ProcessCommand, cwd: string): Promise<ProcessCommand>;
  shell(
    command: string,
    cwd: string,
    options: ShellOptions,
  ): Promise<{ exitCode: number | null }>;
  close(): Promise<void>;
}

export interface HarnessRequest {
  label: string;
  directory: string;
  workspace: string;
  skills: string[];
  prompt: string;
  model: string;
  effort: ModelSettingsData["effort"];
  tools: (
    | "read"
    | "bash"
    | "edit"
    | "write"
    | "grep"
    | "find"
    | "ls"
    | "web_fetch"
  )[];
  timeout: number;
  maxTurns: number;
  signal: AbortSignal;
  persona?: string;
  apiKey?: string;
  mcps?: { title: string; command: string; arguments: string[] }[];
  onRawEvent?: (event: unknown) => Promise<void>;
  runtime?: HarnessRuntime;
}

export interface HarnessResult {
  label: string;
  model?: string;
  status: "completed" | "failed";
  text: string;
  error?: string;
  durationMs: number;
  usage?: {
    input: number;
    output: number;
    cacheRead: number;
    cacheWrite: number;
    total: number;
    costUsd: number | null;
  };
}

export type HarnessUsage = NonNullable<HarnessResult["usage"]>;
