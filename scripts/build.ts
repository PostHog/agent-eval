import { spawn } from "node:child_process";
import { rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { prismaEnvironment } from "../src/infrastructure/prisma-environment.js";

async function run(script: string, args: string[], env = process.env) {
  const child = spawn(process.execPath, [script, ...args], {
    stdio: "inherit",
    env,
  });
  const code = await new Promise<number | null>((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", resolve);
  });

  if (code !== 0) throw new Error(`Build step failed with exit code ${code}.`);
}

// Clear only generated server files so removed legacy modules cannot remain in a build.
await run(
  fileURLToPath(
    new URL("../node_modules/prisma/build/index.js", import.meta.url),
  ),
  ["generate"],
  await prismaEnvironment(),
);

await rm(new URL("../dist", import.meta.url), { recursive: true, force: true });
await run(
  fileURLToPath(new URL("../node_modules/typescript/bin/tsc", import.meta.url)),
  ["-p", "tsconfig.build.json"],
);
await run(
  fileURLToPath(new URL("../node_modules/vite/bin/vite.js", import.meta.url)),
  ["build", "--config", "web/vite.config.ts"],
);
