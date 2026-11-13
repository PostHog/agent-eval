import type { Harness } from "../types.js";

export function searchModels(models: Harness["models"], query: string) {
  const terms = query.toLowerCase().trim().split(/\s+/);

  return models.filter((model) => {
    const text = `${model.name} ${model.id}`.toLowerCase();

    return terms.every((term) => text.includes(term));
  });
}
