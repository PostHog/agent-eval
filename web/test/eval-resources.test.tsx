import "./dom.js";
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { useState } from "react";
import { EvalResources } from "../src/evals/EvalResources.js";
import { defaultModel } from "../src/evals/ModelPicker.js";
import type { EvalDraft, Harness } from "../src/types.js";

const { cleanup, fireEvent, render, screen, waitFor } = await import(
  "@testing-library/react"
);
const originalFetch = globalThis.fetch;

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
});

function Editor({
  refreshed,
  judgeHarness,
}: {
  refreshed: () => void;
  judgeHarness?: Harness;
}) {
  const [value, setValue] = useState<EvalDraft>({
    title: "Draft",
    prompt: "Task",
    criteria: [],
    environmentId: null,
    personaId: null,
    skillIds: [],
    mcpIds: [],
    judgeSkillIds: [],
    judgeMcpIds: [],
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
        judgeHarness={judgeHarness}
      />
      <output data-testid="draft">{JSON.stringify(value)}</output>
    </form>
  );
}

// Skills and MCP servers have an agent button first and a judge button second.
for (const [kind, field, button] of [
  ["environment", "environmentId", 0],
  ["persona", "personaId", 0],
  ["skill", "skillIds", 0],
  ["MCP server", "mcpIds", 0],
  ["skill", "judgeSkillIds", 1],
  ["MCP server", "judgeMcpIds", 1],
] as const) {
  test(`creating a ${kind} for ${field} selects it before the catalog refresh returns`, async () => {
    let refreshes = 0;
    let submitted: Record<string, unknown> = {};

    globalThis.fetch = async (_url, options) => {
      submitted = JSON.parse(String(options?.body));

      return Response.json({ ...submitted, id: "new-resource" });
    };

    render(<Editor refreshed={() => refreshes++} />);
    const create = screen.getAllByRole("button", { name: `Create ${kind}` })[
      button
    ];

    assert.ok(create);
    fireEvent.click(create);
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
      field.endsWith("Ids") ? ["new-resource"] : "new-resource",
    );

    // Agent and judge selections stay independent.
    for (const other of [
      "skillIds",
      "mcpIds",
      "judgeSkillIds",
      "judgeMcpIds",
    ] as const)
      if (other !== field) assert.deepEqual(draft[other], []);

    assert.equal(draft.title, "Draft");
    assert.equal(refreshes, 1);
    assert.equal(submitted.title, "New resource");
    assert.ok(screen.getAllByText("New resource").length > 0);
  });
}

test("judge MCP servers are unavailable for a judge harness that cannot use them", () => {
  render(
    <Editor
      refreshed={() => {}}
      judgeHarness={{
        id: "opencode",
        title: "OpenCode",
        provider: "openrouter",
        installed: true,
        models: [],
        supportsMcp: true,
        judgeSupportsMcp: false,
      }}
    />,
  );

  assert.ok(screen.getByText(/The OpenCode judge cannot use MCP servers/));

  const [agentMcp, judgeMcp] = screen.getAllByRole("button", {
    name: "Create MCP server",
  });

  // Quill buttons expose the disabled state through aria-disabled.
  assert.notEqual(agentMcp?.getAttribute("aria-disabled"), "true");
  assert.equal(judgeMcp?.getAttribute("aria-disabled"), "true");
});

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
