import { providers } from "../../../src/credentials/provider.js";

export const providerInfo: Record<
  string,
  { name: string; harnesses: string; variable: string }
> = {
  openrouter: {
    name: "OpenRouter",
    harnesses: "Pi and OpenCode",
    variable: providers.openrouter,
  },
  openai: { name: "OpenAI", harnesses: "Codex", variable: providers.openai },
  anthropic: {
    name: "Anthropic",
    harnesses: "Claude Code",
    variable: providers.anthropic,
  },
};
