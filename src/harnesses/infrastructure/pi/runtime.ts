import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import {
  createAgentSession,
  createBashToolDefinition,
  createEditToolDefinition,
  createLsToolDefinition,
  createReadToolDefinition,
  createWriteToolDefinition,
  ModelRuntime,
  SessionManager,
  SettingsManager,
  type ToolDefinition,
} from "@earendil-works/pi-coding-agent";
import type { HarnessRequest } from "../../domain/execution.js";
import { writeJson } from "./json-file.js";
import { connectMcpTools } from "./mcp-tools.js";
import { createResources } from "./resources.js";
import { webFetchTool } from "./web.js";

export async function createSession(request: HarnessRequest) {
  const agentDir = join(request.directory, "pi");

  await mkdir(agentDir, { recursive: true });

  const settingsManager = SettingsManager.inMemory({
    compaction: { enabled: false },
    retry: { enabled: false },
  });

  const resourceLoader = await createResources(
    request,
    agentDir,
    settingsManager,
  );

  const modelRuntime = await ModelRuntime.create({
    authPath: join(agentDir, "auth.json"),
    modelsPath: null,
    allowModelNetwork: false,
  });

  const model = modelRuntime.getModel("openrouter", request.model);

  if (request.apiKey)
    await modelRuntime.setRuntimeApiKey("openrouter", request.apiKey);

  if (!model) throw new Error(`Unknown OpenRouter model: ${request.model}`);

  const mcp = await connectMcpTools(request);
  const dockerTools: ToolDefinition[] =
    request.runtime?.kind === "docker"
      ? ([
          createReadToolDefinition(request.workspace),
          createBashToolDefinition(request.workspace, {
            operations: { exec: request.runtime.shell.bind(request.runtime) },
          }),
          createEditToolDefinition(request.workspace),
          createWriteToolDefinition(request.workspace),
          createLsToolDefinition(request.workspace),
        ] as unknown as ToolDefinition[])
      : [];
  const selectedTools =
    request.runtime?.kind === "docker"
      ? request.tools.filter((tool) => tool !== "grep" && tool !== "find")
      : request.tools;

  const { session } = await createAgentSession({
    cwd: request.workspace,
    agentDir,
    modelRuntime,
    model,
    thinkingLevel: request.effort,
    ...(dockerTools.length ? { noTools: "builtin" as const } : {}),
    tools: [...selectedTools, ...mcp.tools.map((tool) => tool.name)],
    customTools: [
      ...dockerTools,
      ...(selectedTools.includes("web_fetch") ? [webFetchTool] : []),
      ...mcp.tools,
    ],
    settingsManager,
    resourceLoader,
    sessionManager: SessionManager.create(
      request.workspace,
      join(request.directory, "sessions"),
    ),
  }).catch(async (error: unknown) => {
    await mcp.close();

    throw error;
  });

  try {
    await writeJson(join(request.directory, "effective.json"), {
      model,
      effort: session.thinkingLevel,
      tools: session.getActiveToolNames(),
      systemPrompt: session.systemPrompt,
      skills: resourceLoader.getSkills().skills,
      settings: settingsManager.getSettings(),
    });

    return Object.assign(session, { closeMcp: mcp.close });
  } catch (error) {
    session.dispose();

    await mcp.close();

    throw error;
  }
}
