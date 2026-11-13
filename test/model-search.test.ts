import assert from "node:assert/strict";
import { test } from "node:test";
import { searchModels } from "../web/src/models/model-search.js";

test("model search matches display names and IDs without changing catalog order", () => {
  const models = [
    { id: "openai/gpt-6.1-sol", name: "GPT-6.1 Sol" },
    { id: "anthropic/claude-sonnet-5.5", name: "Claude Sonnet 5.5" },
  ];

  assert.deepEqual(searchModels(models, "  "), models);
  assert.deepEqual(searchModels(models, "SONNET"), [models[1]]);
  assert.deepEqual(searchModels(models, " OpenAI   sol "), [models[0]]);
  assert.deepEqual(searchModels(models, "missing"), []);
  assert.deepEqual(searchModels([], "gpt"), []);
});
