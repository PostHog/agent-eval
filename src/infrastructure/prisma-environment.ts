import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// Reuse installed engines so generation and migrations do not need a writable global Prisma cache.
export async function prismaEnvironment(): Promise<NodeJS.ProcessEnv> {
  const directory = fileURLToPath(
    new URL("../../node_modules/@prisma/engines", import.meta.url),
  );
  const files = await readdir(directory);
  const library = files.find((name) =>
    /^(lib)?query_engine-.*\.node$/.test(name),
  );
  const schema = files.find((name) =>
    /^schema-engine-(?!.*\.sha256)/.test(name),
  );

  return {
    ...process.env,
    ...(library && !process.env.PRISMA_QUERY_ENGINE_LIBRARY
      ? { PRISMA_QUERY_ENGINE_LIBRARY: join(directory, library) }
      : {}),
    ...(schema && !process.env.PRISMA_SCHEMA_ENGINE_BINARY
      ? { PRISMA_SCHEMA_ENGINE_BINARY: join(directory, schema) }
      : {}),
  };
}
