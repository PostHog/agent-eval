import { execFile } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { prismaEnvironment } from "./prisma-environment.js";

// Apply committed migrations before repositories or workers start.
export async function migrateDatabase(dataDirectory: string): Promise<void> {
  const directory = resolve(dataDirectory);

  await mkdir(directory, { recursive: true });

  process.env.AGENT_EVAL_DATA_DIR = directory;
  process.env.DATABASE_URL = `file:${resolve(directory, "agent-eval.db")}`;

  await promisify(execFile)(
    process.execPath,
    [
      fileURLToPath(
        new URL("../../node_modules/prisma/build/index.js", import.meta.url),
      ),
      "migrate",
      "deploy",
      "--schema",
      fileURLToPath(new URL("../../prisma/schema.prisma", import.meta.url)),
    ],
    { env: await prismaEnvironment(), maxBuffer: 2_000_000 },
  );
}
