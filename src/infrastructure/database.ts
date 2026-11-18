import { randomUUID } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { Injectable, type OnApplicationShutdown } from "@nestjs/common";
import { Prisma, PrismaClient } from "@prisma/client";

import { resolveDataDirectory } from "./data-directory.js";
import { runtimePath } from "./runtime-path.js";

@Injectable()
export class Database extends PrismaClient implements OnApplicationShutdown {
  constructor() {
    // Prisma cannot discover the engine inside the standalone executable.
    if (
      Bun.isStandaloneExecutable &&
      !process.env.PRISMA_QUERY_ENGINE_LIBRARY
    ) {
      const directory = runtimePath("node_modules/.prisma/client");
      const engine = readdirSync(directory).find((name) =>
        name.endsWith(".node"),
      );
      if (!engine)
        throw new Error(
          "The executable does not contain the Prisma query engine.",
        );
      let enginePath = join(directory, engine);
      if (process.platform === "win32") {
        // Windows LoadLibrary needs a physical file instead of a Bun embedded path.
        const cached = join(
          resolveDataDirectory(),
          "engines",
          Prisma.prismaVersion.client,
          engine,
        );
        if (!existsSync(cached)) {
          mkdirSync(dirname(cached), { recursive: true });
          const temporary = `${cached}.${randomUUID()}.tmp`;
          try {
            writeFileSync(temporary, readFileSync(enginePath));
            try {
              renameSync(temporary, cached);
            } catch (error) {
              if (!existsSync(cached)) throw error;
            }
          } finally {
            rmSync(temporary, { force: true });
          }
        }
        enginePath = cached;
      }
      process.env.PRISMA_QUERY_ENGINE_LIBRARY = enginePath;
    }
    super();
  }

  // Workers finish their shutdown hooks before this connection closes.
  async onApplicationShutdown(): Promise<void> {
    await this.$disconnect();
  }
}
