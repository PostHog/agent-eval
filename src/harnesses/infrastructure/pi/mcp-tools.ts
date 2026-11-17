import type { ToolDefinition } from "@earendil-works/pi-coding-agent";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { TSchema } from "typebox";
import { z } from "zod";
import type { HarnessRequest, ProcessCommand } from "../../domain/execution.js";

export async function connectMcpTools(request: HarnessRequest) {
  const clients: Client[] = [];
  const tools: ToolDefinition[] = [];
  const close = async () => {
    await Promise.allSettled(clients.map((client) => client.close()));
  };

  try {
    for (const [index, server] of (request.mcps ?? []).entries()) {
      const client = new Client({ name: "agent-eval", version: "1.0.0" });

      clients.push(client);

      const localCommand: ProcessCommand = {
        binary: server.command,
        args: server.arguments,
        env: process.env,
      };
      const command = request.runtime
        ? await request.runtime.process(localCommand, request.workspace)
        : localCommand;
      const transport = new StdioClientTransport({
        command: command.binary,
        args: command.args,
        env: Object.fromEntries(
          Object.entries(command.env).filter(
            (entry): entry is [string, string] => entry[1] !== undefined,
          ),
        ),
        ...(request.runtime ? {} : { cwd: request.workspace }),
        stderr: "pipe",
      });

      await client.connect(transport, {
        signal: request.signal,
        timeout: 30_000,
      });

      let cursor: string | undefined;

      do {
        const page = await client.listTools(cursor ? { cursor } : {}, {
          signal: request.signal,
          timeout: 30_000,
        });

        // Judges get only the tools the evaluation author allowed. Agents get every tool.
        const allowed = server.allowedTools
          ? page.tools.filter((tool) =>
              server.allowedTools?.includes(tool.name),
            )
          : page.tools;

        for (const tool of allowed) {
          tools.push({
            name: `mcp_${index}_${tools.length}_${tool.name.replaceAll(/[^a-zA-Z0-9_]/g, "_")}`.slice(
              0,
              64,
            ),
            label: `${server.title}: ${tool.name}`,
            description: tool.description ?? tool.name,
            parameters: tool.inputSchema as TSchema,
            execute: async (_id, args, signal) => {
              const result = await client.callTool(
                {
                  name: tool.name,
                  arguments: z.record(z.unknown()).parse(args),
                },
                undefined,
                { ...(signal ? { signal } : {}), timeout: 30_000 },
              );

              return {
                content: [{ type: "text", text: JSON.stringify(result) }],
                details: {},
                isError: result.isError === true,
              };
            },
          });
        }

        cursor = page.nextCursor;
      } while (cursor);
    }

    return { tools, close };
  } catch (error) {
    await close();

    throw error;
  }
}
