import "./dom.js";
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { CredentialsPage } from "../src/resources/CredentialsPage.js";
import type { Credential } from "../src/types.js";

const { cleanup, fireEvent, render, screen, within, waitFor } = await import(
  "@testing-library/react"
);
const originalFetch = globalThis.fetch;
const credentials: Credential[] = [
  { provider: "openrouter", configured: true, source: "environment" },
  { provider: "openai", configured: false, source: null },
  { provider: "anthropic", configured: true, source: "database" },
];

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
});

test("provider rows distinguish environment, saved, and missing keys without showing input fields", async () => {
  globalThis.fetch = async () => Response.json(credentials);

  render(<CredentialsPage />);

  const router = await screen.findByRole("region", { name: "OpenRouter" });
  const openai = screen.getByRole("region", { name: "OpenAI" });
  const anthropic = screen.getByRole("region", { name: "Anthropic" });

  assert.ok(within(router).getByText("OPENROUTER_API_KEY"));
  assert.ok(within(router).getByRole("button", { name: "Override key" }));
  assert.equal(
    Boolean(within(router).queryByRole("button", { name: "Remove" })),
    false,
  );
  assert.ok(within(openai).getByRole("button", { name: "Add key" }));
  assert.ok(within(anthropic).getByRole("button", { name: "Replace key" }));
  assert.equal(document.querySelectorAll('input[type="password"]').length, 0);
});

test("saving an environment override uses a masked field and keeps failed edits available for retry", async () => {
  const writes: RequestInit[] = [];

  globalThis.fetch = async (_url, options) => {
    if (options?.method !== "PUT") return Response.json(credentials);

    writes.push(options);

    return writes.length === 1
      ? Response.json({ message: "Save failed. Try again." }, { status: 500 })
      : Response.json({ saved: true });
  };

  render(<CredentialsPage />);
  fireEvent.click(await screen.findByRole("button", { name: "Override key" }));

  const input = screen.getByLabelText("OpenRouter API key") as HTMLInputElement;

  assert.equal(input.type, "password");
  assert.equal(input.value, "");
  fireEvent.change(input, { target: { value: " test-only-key " } });
  fireEvent.click(screen.getByRole("button", { name: "Save key" }));
  await screen.findByRole("alert");
  assert.equal(input.value, " test-only-key ");
  fireEvent.click(screen.getByRole("button", { name: "Save key" }));
  await waitFor(() =>
    assert.equal(Boolean(screen.queryByRole("dialog")), false),
  );
  assert.equal(writes.length, 2);
  assert.deepEqual(JSON.parse(String(writes[1]?.body)), {
    key: "test-only-key",
  });
});

test("removal requires confirmation and targets only the selected saved provider", async () => {
  const deleted: string[] = [];

  globalThis.fetch = async (url, options) => {
    if (options?.method !== "DELETE") return Response.json(credentials);

    deleted.push(String(url));

    return Response.json({ deleted: true });
  };

  render(<CredentialsPage />);
  fireEvent.click(await screen.findByRole("button", { name: "Remove" }));
  assert.ok(screen.getByRole("dialog", { name: "Remove Anthropic key" }));
  assert.equal(deleted.length, 0);
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  assert.equal(deleted.length, 0);
  fireEvent.click(screen.getByRole("button", { name: "Remove" }));
  fireEvent.click(screen.getByRole("button", { name: "Remove saved key" }));
  await waitFor(() =>
    assert.equal(Boolean(screen.queryByRole("dialog")), false),
  );
  assert.deepEqual(deleted, ["/api/credentials/anthropic"]);
});
