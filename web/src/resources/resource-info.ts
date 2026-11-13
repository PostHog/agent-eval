export const resourceInfo = {
  environments: {
    kind: "environment",
    title: "Environments",
    singular: "environment",
    description:
      "Choose the codebase each agent will work on. Every session gets its own copy; the source folder stays unchanged.",
    hint: "Use an absolute folder path, or leave it empty to start with no files.",
  },
  personas: {
    kind: "persona",
    title: "Personas",
    singular: "persona",
    description:
      "Define how an agent should approach the task. Persona instructions are included with the eval prompt.",
    hint: "Describe the role, experience level, and constraints the agent should follow.",
  },
  skills: {
    kind: "skill",
    title: "Skills",
    singular: "skill",
    description:
      "Make reusable instructions available to the agent. Select the skills to include in each eval.",
    hint: "Write the instructions here, or choose one local file. Each session receives its own saved copy.",
  },
  mcps: {
    kind: "mcp",
    title: "MCP servers",
    singular: "MCP server",
    description:
      "Give agents tools through local MCP servers. Each configuration launches an executable with the arguments below.",
    hint: "Enter the executable separately from its arguments. Each argument is passed exactly as entered; do not add shell quotes.",
  },
} as const;

export type ResourceKind = keyof typeof resourceInfo;
