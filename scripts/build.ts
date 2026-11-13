import { spawn } from "node:child_process";
import { rm } from "node:fs/promises";

async function run(args: string[]) {
  const child = spawn(process.execPath, args, {
    stdio: "inherit",
  });
  const code = await new Promise<number | null>((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", resolve);
  });

  if (code !== 0) throw new Error(`Build step failed with exit code ${code}.`);
}

// Clear only generated server files so removed legacy modules cannot remain in a build.
await run(["x", "prisma", "generate"]);

await rm(new URL("../dist", import.meta.url), { recursive: true, force: true });
await run(["x", "tsc", "-p", "tsconfig.build.json"]);
await run(["x", "vite", "build", "--config", "web/vite.config.ts"]);
