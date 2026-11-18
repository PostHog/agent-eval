import { readdirSync } from "node:fs";
import { join } from "node:path";
import { Injectable, type OnApplicationShutdown } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

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
      process.env.PRISMA_QUERY_ENGINE_LIBRARY = join(directory, engine);
    }
    super();
  }

  // Workers finish their shutdown hooks before this connection closes.
  async onApplicationShutdown(): Promise<void> {
    await this.$disconnect();
  }
}
