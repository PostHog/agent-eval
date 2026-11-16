import assert from "node:assert/strict";
import { test } from "node:test";
import { Criterion } from "../src/evaluations/domain/criterion.js";
import { Evaluation } from "../src/evaluations/domain/evaluation.js";
import { ModelSettings } from "../src/evaluations/domain/model-settings.js";
import { Session } from "../src/sessions/domain/session.js";

function evaluation() {
  return Evaluation.create({
    title: "Install PostHog",
    prompt: "Install PostHog and verify the build.",
    environmentId: null,
    personaId: null,
    skillIds: [],
    mcpIds: [],
    judgeSkillIds: [],
    judgeMcpIds: [],
    criteria: [Criterion.create("The build passes.")],
    models: [{ ...ModelSettings.create({ model: "openai/test" }).value }],
    judge: { ...ModelSettings.create({ model: "anthropic/test" }).value },
  });
}

test("eval revisions preserve session configuration and criterion identity", () => {
  const evalEntity = evaluation();
  const original = evalEntity.snapshot();
  const model = original.models[0];

  assert.ok(model);

  const session = new Session(original, model);

  evalEntity.revise({ ...original, prompt: "A different task." });
  original.criteria.length = 0;

  assert.equal(evalEntity.snapshot().revision, 2);

  assert.equal(session.snapshot().evaluation.revision, 1);

  assert.equal(session.snapshot().evaluation.criteria.length, 1);

  assert.equal(
    session.snapshot().evaluation.prompt,
    "Install PostHog and verify the build.",
  );
});

test("session transitions require a complete individual judgment", () => {
  const data = evaluation().snapshot();
  const model = data.models[0];

  assert.ok(model);

  const session = new Session(data, model);

  assert.throws(() => session.beginJudging(), /Cannot change/);

  session.start();
  session.beginJudging();

  assert.throws(
    () => session.complete({ summary: "Incomplete", decisions: [] }),
    /every session criterion/,
  );

  session.complete({
    summary: "Build verified.",
    decisions: data.criteria.map((criterion) => ({
      criterionId: criterion.id,
      passed: true,
      feedback: "Build command returned exit code 0.",
    })),
  });

  assert.equal(session.status, "completed");

  assert.throws(() => session.cancel(), /already finished/);

  assert.throws(() => session.start(), /Cannot change/);
});

test("domain values reject empty criteria and invalid model settings", () => {
  assert.throws(() => Criterion.create(" "));

  assert.throws(() => ModelSettings.create({ model: "model", count: 0 }));

  const data = evaluation().snapshot();

  assert.throws(() => Evaluation.restore({ ...data, criteria: [] }));

  assert.throws(
    () =>
      Evaluation.restore({
        ...data,
        criteria: [...data.criteria, ...data.criteria],
      }),
    /unique/,
  );
});

test("a valid judgment preserves the agent execution failure", () => {
  const data = evaluation().snapshot();
  const model = data.models[0];

  assert.ok(model);

  const session = new Session(data, model);

  session.start();
  session.beginJudging("Harness failed at startup.");
  session.complete({
    summary: "No agent actions.",
    decisions: data.criteria.map((criterion) => ({
      criterionId: criterion.id,
      passed: false,
      feedback: "The harness failed before execution.",
    })),
  });

  assert.equal(session.status, "failed");
  assert.equal(session.snapshot().error, "Harness failed at startup.");
  assert.equal(session.snapshot().judgment?.decisions.length, 1);
});
