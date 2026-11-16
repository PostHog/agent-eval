import "./dom.js";
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { useState } from "react";
import { EvalResources } from "../src/evals/EvalResources.js";
import { defaultModel } from "../src/evals/ModelPicker.js";
import type { EvalDraft } from "../src/types.js";

const { cleanup, fireEvent, render, screen, waitFor } = await import(
  "@testing-library/react"
);
const originalFetch = globalThis.fetch;

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
});

function Editor({ refreshed }: { refreshed: () => void }) {
  const [value, setValue] = useState<EvalDraft>({
    title: "Draft",
    prompt: "Task",
    criteria: [],
    environmentId: null,
    personaId: null,
    skillIds: [],
    mcpIds: [],
    models: [defaultModel],
    judge: defaultModel,
  });

  return (
    <form
      onSubmit={() => assert.fail("Resource creation must not submit the eval")}
    >
      <EvalResources
        value={value}
        onChange={setValue}
        resources={{ environments: [], personas: [], skills: [], mcps: [] }}
        resourcesLoading={false}
        refreshResources={refreshed}
      />
      <output data-testid="draft">{JSON.stringify(value)}</output>
    </form>
  );
}

for (const [kind, field] of [
  ["environment", "environmentId"],
  ["persona", "personaId"],
  ["skill", "skillIds"],
  ["MCP server", "mcpIds"],
] as const) {
  test(`creating a ${kind} selects it before the catalog refresh returns`, async () => {
    let refreshes = 0;
    let submitted: Record<string, unknown> = {};

    globalThis.fetch = async (_url, options) => {
      submitted = JSON.parse(String(options?.body));

      return Response.json({ ...submitted, id: "new-resource" });
    };

    render(<Editor refreshed={() => refreshes++} />);
    fireEvent.click(screen.getByRole("button", { name: `Create ${kind}` }));
    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "New resource" },
    });
    if (kind === "skill")
      fireEvent.change(screen.getByLabelText("Skill instructions"), {
        target: { value: "Test instructions" },
      });
    else if (kind !== "environment")
      fireEvent.change(
        screen.getByLabelText(
          kind === "persona" ? "Persona instructions" : "Description",
        ),
        { target: { value: "Test instructions" } },
      );

    if (kind === "MCP server")
      fireEvent.change(screen.getByLabelText("MCP executable"), {
        target: { value: "npx" },
      });

    fireEvent.click(screen.getByRole("button", { name: `Save ${kind}` }));
    await waitFor(() =>
      assert.equal(Boolean(screen.queryByRole("dialog")), false),
    );

    const draft: EvalDraft = JSON.parse(
      screen.getByTestId("draft").textContent ?? "{}",
    );

    assert.deepEqual(
      draft[field],
      field === "skillIds" || field === "mcpIds"
        ? ["new-resource"]
        : "new-resource",
    );
    assert.equal(draft.title, "Draft");
    assert.equal(refreshes, 1);
    assert.equal(submitted.title, "New resource");
    assert.ok(screen.getByText("New resource"));
  });
}

test("resource errors keep the entered data and allow retry", async () => {
  globalThis.fetch = async () =>
    Response.json(
      { message: "Choose an existing directory." },
      { status: 400 },
    );

  render(
    <Editor refreshed={() => assert.fail("Failed save must not refresh")} />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Create environment" }));
  fireEvent.change(screen.getByLabelText("Title"), {
    target: { value: "My project" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save environment" }));
  await screen.findByRole("alert");
  assert.equal(
    (screen.getByLabelText("Title") as HTMLInputElement).value,
    "My project",
  );
  assert.equal(
    (
      screen.getByRole("button", {
        name: "Save environment",
      }) as HTMLButtonElement
    ).disabled,
    false,
  );
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  assert.equal(Boolean(screen.queryByRole("dialog")), false);
});
