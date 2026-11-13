import "./dom.js";
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { ResourceForm } from "../src/resources/ResourceForm.js";

const { cleanup, fireEvent, render, screen, waitFor } = await import(
  "@testing-library/react"
);

afterEach(cleanup);

test("a skill uses inline instructions or one local file", async () => {
  const requests: Record<string, unknown>[] = [];

  globalThis.fetch = async (_input, init) => {
    const body = JSON.parse(String(init?.body));

    requests.push(body);

    return new Response(JSON.stringify({ id: crypto.randomUUID(), ...body }), {
      headers: { "content-type": "application/json" },
    });
  };

  const view = render(
    <ResourceForm kind="skills" onClose={() => {}} onSaved={() => {}} />,
  );

  assert.equal(Boolean(screen.queryByLabelText("Description")), false);
  fireEvent.change(screen.getByLabelText("Title"), {
    target: { value: "Review code" },
  });
  fireEvent.change(screen.getByLabelText("Skill instructions"), {
    target: { value: "Read the changed files." },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save skill" }));
  await waitFor(() => assert.equal(requests.length, 1));
  assert.deepEqual(requests[0], {
    kind: "skill",
    title: "Review code",
    filePath: null,
    content: "Read the changed files.",
  });

  view.unmount();
  render(<ResourceForm kind="skills" onClose={() => {}} onSaved={() => {}} />);
  fireEvent.click(screen.getByRole("combobox", { name: "Source" }));
  const file = await screen.findByRole("option", { name: "Use a local file" });

  fireEvent.pointerDown(file);
  fireEvent.click(file);
  assert.equal(Boolean(screen.getByLabelText("Skill file")), true);
  assert.equal(Boolean(screen.queryByLabelText("Skill instructions")), false);
});
