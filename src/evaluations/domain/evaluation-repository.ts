import type { Evaluation } from "./evaluation.js";

export abstract class EvaluationRepository {
  abstract find(id: string): Promise<Evaluation | null>;
  abstract save(evaluation: Evaluation): Promise<void>;
}
