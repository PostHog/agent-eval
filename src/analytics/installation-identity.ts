import { randomUUID } from "node:crypto";
import type { Database } from "../infrastructure/database.js";

export async function loadInstallationId(database: Database): Promise<string> {
  // SQLite arbitrates first launch so concurrent servers share the same identity.
  const installation = await database.installation.upsert({
    where: { id: 1 },
    create: { id: 1, distinctId: randomUUID() },
    update: { id: 1 },
  });
  return installation.distinctId;
}
