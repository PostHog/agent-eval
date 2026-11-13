import { Database as SQLite } from "bun:sqlite";
import { mkdir, readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { runtimePath } from "./runtime-path.js";

// Apply committed migrations before repositories or workers start.
export async function migrateDatabase(dataDirectory: string): Promise<void> {
  const directory = resolve(dataDirectory);

  await mkdir(directory, { recursive: true });

  process.env.AGENT_EVAL_DATA_DIR = directory;
  const databasePath = resolve(directory, "agent-eval.db");

  process.env.DATABASE_URL = `file:${databasePath}`;

  const database = new SQLite(databasePath, { create: true });

  try {
    database.exec("PRAGMA foreign_keys = OFF");
    database.exec(`
      CREATE TABLE IF NOT EXISTS "_agent_eval_migrations" (
        "name" TEXT NOT NULL PRIMARY KEY,
        "appliedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const prismaHistory = database
      .query<{ name: string }, []>(
        `SELECT "name" FROM "sqlite_master"
         WHERE "type" = 'table' AND "name" = '_prisma_migrations'`,
      )
      .get();

    if (prismaHistory)
      database.exec(`
        INSERT OR IGNORE INTO "_agent_eval_migrations" ("name")
        SELECT "migration_name" FROM "_prisma_migrations"
        WHERE "finished_at" IS NOT NULL AND "rolled_back_at" IS NULL
      `);

    const migrations = runtimePath("prisma/migrations");
    const applied = database
      .query<{ name: string }, []>(
        'SELECT "name" FROM "_agent_eval_migrations"',
      )
      .all();
    const completed = new Set(applied.map(({ name }) => name));
    const entries = (await readdir(migrations, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory())
      .sort((left, right) => left.name.localeCompare(right.name));

    for (const entry of entries) {
      if (completed.has(entry.name)) continue;

      const sql = await readFile(
        join(migrations, entry.name, "migration.sql"),
        "utf8",
      );
      const apply = database.transaction(() => {
        database.exec(sql);
        database
          .query('INSERT INTO "_agent_eval_migrations" ("name") VALUES (?)')
          .run(entry.name);
      });

      apply();
    }
  } finally {
    database.exec("PRAGMA foreign_keys = ON");
    database.close();
  }
}
