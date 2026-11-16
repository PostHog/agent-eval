import type { EvaluationData } from "../../evaluations/domain/evaluation.js";

export interface ExecutionSnapshot {
  evaluation: EvaluationData;
  environment: {
    title: string;
    workspacePath: string | null;
    repositoryUrl: string | null;
    executionMode: "local" | "docker";
    dockerfilePath: string | null;
    dockerfileContent: string | null;
  } | null;
  persona: { title: string; description: string } | null;
  skills: { title: string; content: string }[];
  mcps: { title: string; command: string; arguments: string[] }[];
}
