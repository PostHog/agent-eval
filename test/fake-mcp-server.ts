// A stdio MCP server with one read tool and one write tool, for MCP tool filtering tests.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new McpServer({ name: "fake", version: "1.0.0" });

server.registerTool("read_doc", { description: "Read a doc." }, async () => ({
  content: [{ type: "text", text: "doc" }],
}));
server.registerTool(
  "delete_doc",
  { description: "Delete a doc." },
  async () => ({ content: [{ type: "text", text: "deleted" }] }),
);

await server.connect(new StdioServerTransport());
