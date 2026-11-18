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
  assert.match(
    (screen.getByLabelText("Skill instructions") as HTMLTextAreaElement).value,
    /^---\nname: .*\ndescription: .*\n---/,
  );
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
  fireEvent.click(screen.getByRole("tab", { name: "File" }));
  assert.equal(Boolean(screen.getByLabelText("Skill file")), true);
  assert.equal(Boolean(screen.queryByLabelText("Skill instructions")), false);
});

test("an environment can clone a repository into a Docker workspace", async () => {
  let request: Record<string, unknown> | undefined;

  globalThis.fetch = async (input, init) => {
    if (String(input).includes("default-dockerfile"))
      return new Response(JSON.stringify({ content: "FROM node:22\n" }), {
        headers: { "content-type": "application/json" },
      });

    request = JSON.parse(String(init?.body));

    return new Response(
      JSON.stringify({ id: crypto.randomUUID(), ...request }),
      {
        headers: { "content-type": "application/json" },
      },
    );
  };

  render(
    <ResourceForm kind="environments" onClose={() => {}} onSaved={() => {}} />,
  );
  fireEvent.change(screen.getByLabelText("Title"), {
    target: { value: "Hog CLI" },
  });
  assert.equal(Boolean(screen.queryByLabelText("Description")), false);
  fireEvent.click(screen.getByRole("tab", { name: "Git repository" }));
  fireEvent.change(screen.getByLabelText("Repository URL"), {
    target: { value: "https://github.com/PostHog/posthog.git" },
  });
  fireEvent.click(screen.getByRole("tab", { name: "Docker" }));
  fireEvent.click(screen.getByRole("combobox", { name: "Image definition" }));
  const localDockerfile = await screen.findByRole("option", {
    name: "Use a local Dockerfile",
  });

  fireEvent.pointerDown(localDockerfile);
  fireEvent.click(localDockerfile);
  fireEvent.change(screen.getByLabelText("Dockerfile path"), {
    target: { value: "/tmp/Dockerfile.hog" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save environment" }));

  await waitFor(() => assert.ok(request));
  assert.deepEqual(request, {
    kind: "environment",
    title: "Hog CLI",
    workspacePath: null,
    repositoryUrl: "https://github.com/PostHog/posthog.git",
    executionMode: "docker",
    dockerfilePath: "/tmp/Dockerfile.hog",
    dockerfileContent: null,
  });
});

test("an MCP URL uses the URL tab and saves without a command", async () => {
  let request: Record<string, unknown> | undefined;
  globalThis.fetch = async (_input, init) => {
    request = JSON.parse(String(init?.body));
    return Response.json({ id: crypto.randomUUID(), ...request });
  };

  render(<ResourceForm kind="mcps" onClose={() => {}} onSaved={() => {}} />);
  fireEvent.change(screen.getByLabelText("Title"), {
    target: { value: "Docs" },
  });
  fireEvent.click(screen.getByRole("tab", { name: "MCP URL" }));
  assert.equal(screen.queryByLabelText("MCP command"), null);
  fireEvent.change(screen.getByRole("textbox", { name: "MCP URL" }), {
    target: { value: "https://example.com/mcp" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save MCP server" }));
  await waitFor(() => assert.equal(request?.url, "https://example.com/mcp"));
  assert.equal(request?.command, "");
  assert.deepEqual(request?.arguments, []);
});

test("an MCP command accepts a pasted npx command with quoted arguments", async () => {
  let request: Record<string, unknown> | undefined;
  globalThis.fetch = async (_input, init) => {
    request = JSON.parse(String(init?.body));
    return Response.json({ id: crypto.randomUUID(), ...request });
  };

  render(<ResourceForm kind="mcps" onClose={() => {}} onSaved={() => {}} />);
  fireEvent.change(screen.getByLabelText("Title"), {
    target: { value: "Docs" },
  });
  fireEvent.change(screen.getByLabelText("MCP command"), {
    target: { value: 'npx -y example-mcp-server --name="My server"' },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save MCP server" }));
  await waitFor(() => assert.equal(request?.command, "npx"));
  assert.deepEqual(request?.arguments, [
    "-y",
    "example-mcp-server",
    "--name=My server",
  ]);
  assert.equal(request?.url, null);
});
