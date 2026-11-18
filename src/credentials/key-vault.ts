import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { Inject, Injectable } from "@nestjs/common";
import { resolveDataDirectory } from "../infrastructure/data-directory.js";
import { Database } from "../infrastructure/database.js";
import { CredentialStore, type Provider, providers } from "./provider.js";

@Injectable()
export class KeyVault extends CredentialStore {
  constructor(@Inject(Database) private readonly db: Database) {
    super();
  }

  private async encryptionKey(): Promise<Buffer> {
    const path = join(resolveDataDirectory(), "credential.key");

    await mkdir(dirname(path), { recursive: true });

    try {
      await writeFile(path, randomBytes(32), { flag: "wx", mode: 0o600 });
    } catch (error) {
      if (
        !(
          error &&
          typeof error === "object" &&
          "code" in error &&
          error.code === "EEXIST"
        )
      )
        throw error;
    }

    const key = await readFile(path);

    if (key.length !== 32)
      throw new Error("The credential encryption key is invalid.");

    return key;
  }

  async list() {
    const saved = await this.db.credential.findMany({
      select: { provider: true, updatedAt: true },
    });

    return Object.entries(providers).map(([provider, variable]) => ({
      provider,
      configured:
        saved.some((entry) => entry.provider === provider) ||
        Boolean(process.env[variable]),
      source: saved.some((entry) => entry.provider === provider)
        ? "database"
        : process.env[variable]
          ? "environment"
          : null,
    }));
  }

  async save(provider: Provider, secret: string): Promise<void> {
    return this.saveSecret(provider, secret);
  }

  async hasSecret(provider: string): Promise<boolean> {
    return Boolean(await this.db.credential.count({ where: { provider } }));
  }

  async saveSecret(provider: string, secret: string): Promise<void> {
    const iv = randomBytes(12);
    const cipher = createCipheriv(
      "aes-256-gcm",
      await this.encryptionKey(),
      iv,
    );
    const encrypted = Buffer.concat([
      cipher.update(secret, "utf8"),
      cipher.final(),
    ]);
    const encryptedValue = Buffer.concat([
      iv,
      cipher.getAuthTag(),
      encrypted,
    ]).toString("base64");

    await this.db.credential.upsert({
      where: { provider },
      create: { provider, encryptedValue },
      update: { encryptedValue },
    });
  }

  async read(provider: Provider): Promise<string | undefined> {
    return (
      (await this.readSecret(provider)) ?? process.env[providers[provider]]
    );
  }

  async readSecret(provider: string): Promise<string | undefined> {
    const saved = await this.db.credential.findUnique({ where: { provider } });

    if (!saved) return undefined;

    const encrypted = Buffer.from(saved.encryptedValue, "base64");
    const decipher = createDecipheriv(
      "aes-256-gcm",
      await this.encryptionKey(),
      encrypted.subarray(0, 12),
    );

    decipher.setAuthTag(encrypted.subarray(12, 28));

    return Buffer.concat([
      decipher.update(encrypted.subarray(28)),
      decipher.final(),
    ]).toString("utf8");
  }

  async remove(provider: Provider): Promise<void> {
    await this.db.credential.deleteMany({ where: { provider } });
  }
}
