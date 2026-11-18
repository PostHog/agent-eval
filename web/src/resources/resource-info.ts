export const resourceInfo = {
  environments: {
    kind: "environment",
    title: "Environments",
    singular: "environment",
    description:
      "Choose the codebase and execution boundary for each agent. Every session gets an independent workspace.",
    hint: "Start empty, copy a local folder, or clone a Git repository. Run the agent on this computer or in Docker.",
  },
  personas: {
    kind: "persona",
    title: "Personas",
    singular: "persona",
    description:
      "Define how an agent should approach the task. Persona instructions are included with the evaluation prompt.",
    hint: "Describe the role, experience level, and constraints the agent should follow.",
  },
  skills: {
    kind: "skill",
    title: "Skills",
    singular: "skill",
    description:
      "Make reusable instructions available to the agent. Select the skills to include in each evaluation.",
    hint: "Write the instructions here, or choose one local file. Each session receives its own saved copy.",
  },
  mcps: {
    kind: "mcp",
    title: "MCP servers",
    singular: "MCP server",
    description: "Give agents tools from local or remote MCP servers.",
    hint: "Enter a command and its arguments, or enter an MCP URL.",
  },
} as const;

export type ResourceKind = keyof typeof resourceInfo;
