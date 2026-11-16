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
  fireEvent.click(screen.getByRole("combobox", { name: "Workspace source" }));
  const repository = await screen.findByRole("option", {
    name: "Git repository",
  });

  fireEvent.pointerDown(repository);
  fireEvent.click(repository);
  fireEvent.change(screen.getByLabelText("Repository URL"), {
    target: { value: "https://github.com/PostHog/posthog.git" },
  });
  fireEvent.click(screen.getByRole("combobox", { name: "Execution target" }));
  const docker = await screen.findByRole("option", {
    name: "Docker container",
  });

  fireEvent.pointerDown(docker);
  fireEvent.click(docker);
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
