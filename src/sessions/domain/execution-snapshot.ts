import type { EvaluationData } from "../../evaluations/domain/evaluation.js";

export interface ExecutionSnapshot {
  evaluation: EvaluationData;
  environment: { title: string; workspacePath: string | null } | null;
  persona: { title: string; description: string } | null;
  skills: { title: string; content: string }[];
  mcps: { title: string; command: string; arguments: string[] }[];
}
