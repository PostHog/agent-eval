import "./dom.js";
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { useState } from "react";
import { EvalCriteria } from "../src/evals/EvalCriteria.js";
import { EvalModels } from "../src/evals/EvalModels.js";
import { defaultModel } from "../src/evals/ModelPicker.js";
import type { EvalDraft, Harness } from "../src/types.js";

const { cleanup, fireEvent, render, screen, waitFor } = await import(
  "@testing-library/react"
);

afterEach(cleanup);

const harnesses: Harness[] = [
  {
    id: "pi",
    title: "Pi",
    installed: true,
    provider: "openrouter",
    supportsMcp: true,
    judgeSupportsMcp: true,
    models: [
      { id: "model-a", name: "Model A" },
      { id: "model-b", name: "Model B" },
    ],
  },
  {
    id: "codex",
    title: "Codex",
    installed: true,
    provider: "openai",
    supportsMcp: true,
    judgeSupportsMcp: true,
    models: [{ id: "model-c", name: "Model C" }],
  },
];

function Editor({
  onSubmit,
  empty = false,
}: {
  onSubmit: () => void;
  empty?: boolean;
}) {
  const [value, setValue] = useState<EvalDraft>({
    title: "Test",
    prompt: "Task",
    criteria: [{ id: "criterion-1", description: "Original criterion" }],
    environmentId: null,
    personaId: null,
    skillIds: [],
    mcpIds: [],
    judgeSkillIds: [],
    judgeMcpIds: [],
    judgeMcpTools: {},
    models: empty ? [] : [{ ...defaultModel, model: "model-a" }],
    judge: empty ? null : { ...defaultModel, model: "model-a" },
  });

  return (
    <form onSubmit={onSubmit}>
      <EvalCriteria value={value} onChange={setValue} />
      <EvalModels value={value} onChange={setValue} harnesses={harnesses} />
      <output data-testid="draft">{JSON.stringify(value)}</output>
    </form>
  );
}

function draft(): EvalDraft {
  return JSON.parse(screen.getByTestId("draft").textContent ?? "{}");
}

test("criterion dialogs discard cancelled edits and apply text without submitting the eval", () => {
  let submissions = 0;

  render(<Editor onSubmit={() => submissions++} />);
  fireEvent.click(screen.getByRole("button", { name: "Edit criterion 1" }));
  fireEvent.change(screen.getByLabelText("Acceptance criterion"), {
    target: { value: "Discard this" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  assert.equal(draft().criteria[0]?.description, "Original criterion");

  fireEvent.click(screen.getByRole("button", { name: "Edit criterion 1" }));
  fireEvent.change(screen.getByLabelText("Acceptance criterion"), {
    target: { value: "  Pass if **tests pass**.  " },
  });
  fireEvent.click(screen.getByRole("tab", { name: "Preview" }));
  assert.equal(
    document.querySelector(".criterion-preview strong")?.textContent,
    "tests pass",
  );
  fireEvent.click(screen.getByRole("button", { name: "Apply criterion" }));
  assert.equal(draft().criteria[0]?.description, "Pass if **tests pass**.");
  assert.equal(draft().criteria[0]?.id, "criterion-1");
  assert.equal(submissions, 0);
  assert.equal(Boolean(screen.queryByRole("dialog")), false);
});

test("model dialogs search, reset on harness change, and apply settings to only the selected row", async () => {
  let submissions = 0;

  render(<Editor onSubmit={() => submissions++} />);
  fireEvent.click(
    screen.getByRole("button", { name: "Edit model configuration 1" }),
  );
  fireEvent.change(screen.getByLabelText("Search models"), {
    target: { value: "Model B" },
  });
  assert.equal(screen.getAllByRole("button", { name: /Model B/ }).length, 1);
  fireEvent.click(screen.getByRole("button", { name: /Model B/ }));
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  assert.equal(draft().models[0]?.model, "model-a");

  fireEvent.click(
    screen.getByRole("button", { name: "Edit model configuration 1" }),
  );
  fireEvent.click(screen.getByRole("combobox", { name: "Harness" }));
  const codex = await screen.findByRole("option", { name: "Codex" });

  fireEvent.pointerDown(codex);
  fireEvent.click(codex);
  assert.equal(
    screen
      .getByRole("button", { name: "Apply settings" })
      .getAttribute("aria-disabled"),
    "true",
  );
  fireEvent.click(screen.getByRole("button", { name: /Model C/ }));
  fireEvent.change(screen.getByLabelText("Sessions"), {
    target: { value: "3" },
  });
  fireEvent.click(screen.getByRole("combobox", { name: "Effort" }));
  const high = await screen.findByRole("option", { name: "high" });

  fireEvent.pointerDown(high);
  fireEvent.click(high);
  fireEvent.click(screen.getByRole("button", { name: "Apply settings" }));
  assert.equal(draft().models[0]?.harness, "codex");
  assert.equal(draft().models[0]?.count, 3);
  assert.equal(draft().models[0]?.effort, "high");
  assert.equal(draft().judge?.model, "model-a");
  assert.equal(submissions, 0);
});

test("adding a model commits only on Apply; judge settings do not alter session models", () => {
  render(<Editor onSubmit={() => assert.fail("Eval must not submit")} />);
  fireEvent.click(screen.getByRole("button", { name: "Add model" }));
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  assert.equal(draft().models.length, 1);

  fireEvent.click(screen.getByRole("button", { name: "Add model" }));
  fireEvent.click(screen.getByRole("button", { name: /Model B/ }));
  fireEvent.click(screen.getByRole("button", { name: "Apply settings" }));
  assert.equal(draft().models.length, 2);

  fireEvent.click(screen.getByRole("button", { name: "Edit judge" }));
  assert.equal(Boolean(screen.queryByLabelText("Sessions")), false);
  fireEvent.click(screen.getByRole("button", { name: /Model B/ }));
  fireEvent.click(screen.getByRole("button", { name: "Apply settings" }));
  assert.equal(draft().judge?.model, "model-b");
  assert.equal(draft().judge?.count, 1);
  assert.equal(draft().models[0]?.model, "model-a");
});

test("Escape discards a criterion edit and restores focus to its trigger", async () => {
  render(<Editor onSubmit={() => assert.fail("Eval must not submit")} />);

  const trigger = screen.getByRole("button", { name: "Edit criterion 1" });

  trigger.focus();
  fireEvent.click(trigger);
  fireEvent.change(screen.getByLabelText("Acceptance criterion"), {
    target: { value: "Unsaved edit" },
  });
  fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });

  assert.equal(Boolean(screen.queryByRole("dialog")), false);
  assert.equal(draft().criteria[0]?.description, "Original criterion");
  await waitFor(() => assert.equal(document.activeElement === trigger, true));
});

test("empty selections stay empty until applied and the last model and judge can be removed", () => {
  render(<Editor empty onSubmit={() => assert.fail("Eval must not submit")} />);

  assert.equal(draft().models.length, 0);
  assert.equal(draft().judge, null);
  assert.equal(Boolean(screen.queryByText(/100 turns/)), false);
  fireEvent.click(screen.getByRole("button", { name: "Add model" }));
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  assert.equal(draft().models.length, 0);

  fireEvent.click(screen.getByRole("button", { name: "Add model" }));
  fireEvent.click(screen.getByRole("button", { name: /Model A/ }));
  fireEvent.click(screen.getByRole("button", { name: "Apply settings" }));
  assert.equal(draft().models[0]?.model, "model-a");

  fireEvent.click(screen.getByRole("button", { name: "Add judge" }));
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  assert.equal(draft().judge, null);

  fireEvent.click(screen.getByRole("button", { name: "Add judge" }));
  fireEvent.click(screen.getByRole("button", { name: /Model B/ }));
  fireEvent.click(screen.getByRole("button", { name: "Apply settings" }));
  assert.equal(draft().judge?.model, "model-b");

  fireEvent.click(
    screen.getByRole("button", { name: "Remove model configuration 1" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Remove judge" }));
  assert.equal(draft().models.length, 0);
  assert.equal(draft().judge, null);
  assert.equal(Boolean(screen.getByText("No models selected")), true);
  assert.equal(Boolean(screen.getByText("No judge selected")), true);
});
