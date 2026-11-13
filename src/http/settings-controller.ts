import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Put,
} from "@nestjs/common";
import { z } from "zod";
import { KeyVault } from "../credentials/key-vault.js";
import { HarnessRegistry } from "../harnesses/domain/harness-registry.js";

const providerSchema = z.enum(["openrouter", "openai", "anthropic"]);

@Controller("api")
export class SettingsController {
  constructor(
    @Inject(KeyVault) private readonly keys: KeyVault,
    @Inject(HarnessRegistry) private readonly harnesses: HarnessRegistry,
  ) {}

  @Get("harnesses")
  catalog() {
    return this.harnesses.catalog();
  }

  @Get("credentials")
  credentials() {
    return this.keys.list();
  }

  @Put("credentials/:provider")
  async save(@Param("provider") provider: string, @Body() input: unknown) {
    const { key } = z
      .object({ key: z.string().trim().min(1) })
      .strict()
      .parse(input);

    await this.keys.save(providerSchema.parse(provider), key);

    return { saved: true };
  }

  @Delete("credentials/:provider")
  async remove(@Param("provider") provider: string) {
    await this.keys.remove(providerSchema.parse(provider));

    return { deleted: true };
  }
}
