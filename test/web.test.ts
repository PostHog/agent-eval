import assert from "node:assert/strict";
import { test } from "node:test";
import { fetchPage } from "../src/harnesses/infrastructure/pi/web.js";

test("web fetch returns evidence and handles errors, truncation, and cancellation", async () => {
  const originalFetch = globalThis.fetch;

  try {
    globalThis.fetch = async () => new Response("Installation documentation");

    assert.match(
      await fetchPage("https://example.com/docs"),
      /Installation documentation/,
    );

    await assert.rejects(fetchPage("file:///etc/passwd"), /HTTP or HTTPS/);

    globalThis.fetch = async () => new Response("Unavailable", { status: 503 });

    await assert.rejects(fetchPage("https://example.com"), /HTTP 503/);

    globalThis.fetch = async () => new Response("a".repeat(60_000));

    assert.match(await fetchPage("https://example.com"), /Response truncated/);

    globalThis.fetch = async (_url, options) => {
      options?.signal?.throwIfAborted();

      return new Response("Unexpected");
    };

    await assert.rejects(
      fetchPage("https://example.com", AbortSignal.abort()),
      /abort/i,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
