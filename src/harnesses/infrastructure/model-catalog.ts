import { ModelRuntime } from "@earendil-works/pi-coding-agent";
import type { Provider } from "../../credentials/provider.js";

let runtime: Promise<ModelRuntime> | undefined;

// The bundled SDK catalog supplies model IDs without spending credits or reading user logins.
export async function providerModels(provider: Provider) {
  runtime ??= ModelRuntime.create({
    authPath: `${process.env.AGENT_EVAL_DATA_DIR ?? ".agent-eval"}/catalog-auth.json`,
    modelsPath: null,
    allowModelNetwork: false,
  });

  return (await runtime)
    .getModels(provider)
    .map((model) => ({ id: model.id, name: model.name }));
}
