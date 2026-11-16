import "./dom.js";
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { InlineDockerfile } from "../src/resources/InlineDockerfile.js";

const { act, cleanup, fireEvent, render, screen } = await import(
  "@testing-library/react"
);

afterEach(cleanup);

test("an inline Dockerfile opens in a focused code editor", async () => {
  let applied = "";

  render(
    <InlineDockerfile
      value={"FROM node:22-bookworm-slim\nRUN node --version\n"}
      onChange={(value) => {
        applied = value;
      }}
    />,
  );
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Edit Dockerfile" }));
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  assert.ok(screen.getByRole("textbox", { name: "Dockerfile contents" }));
  assert.equal(screen.getAllByText("3 lines").length, 2);
  fireEvent.click(screen.getByRole("button", { name: "Apply Dockerfile" }));
  assert.equal(applied, "FROM node:22-bookworm-slim\nRUN node --version\n");
});
