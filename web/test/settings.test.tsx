import "./dom.js";
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { SettingsPage } from "../src/settings/SettingsPage.js";

const { cleanup, fireEvent, render, screen } = await import(
  "@testing-library/react"
);
const originalFetch = globalThis.fetch;

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
});

test("session concurrency loads and saves from the settings page", async () => {
  let saved: unknown;

  globalThis.fetch = async (_url, options) => {
    if (options?.method === "PUT") {
      saved = JSON.parse(String(options.body));
      return Response.json(saved);
    }

    return Response.json({ sessionConcurrency: 2 });
  };

  render(<SettingsPage />);

  const input = (await screen.findByLabelText(
    "Concurrent agent sessions",
  )) as HTMLInputElement;

  assert.equal(input.value, "2");
  fireEvent.change(input, { target: { value: "6" } });
  fireEvent.click(screen.getByRole("button", { name: "Save settings" }));
  await screen.findByText(/new limit now applies/);
  assert.deepEqual(saved, { sessionConcurrency: 6 });
});
