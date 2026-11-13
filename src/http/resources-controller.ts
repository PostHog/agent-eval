import { realpath, stat } from "node:fs/promises";
import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Put,
} from "@nestjs/common";
import { z } from "zod";
import { Resource } from "../catalog/domain/resource.js";
import { ResourceRepository } from "../catalog/domain/resource-repository.js";

@Controller("api/resources")
export class ResourcesController {
  constructor(
    @Inject(ResourceRepository) private readonly catalog: ResourceRepository,
  ) {}

  @Get()
  list() {
    return this.catalog.list();
  }

  @Post()
  async create(@Body() input: unknown) {
    const resource = Resource.create(input);

    await this.validatePath(resource);
    await this.catalog.save(resource);

    return resource.value;
  }

  @Put(":id")
  async update(@Param("id") id: string, @Body() input: unknown) {
    const resource = Resource.restore({
      ...z.record(z.unknown()).parse(input),
      id,
    });

    await this.validatePath(resource);
    await this.catalog.save(resource);

    return resource.value;
  }

  @Delete(":kind/:id")
  async remove(@Param("kind") kind: string, @Param("id") id: string) {
    await this.catalog.delete(
      z.enum(["environment", "persona", "skill", "mcp"]).parse(kind),
      z.string().uuid().parse(id),
    );

    return { deleted: true };
  }

  private async validatePath(resource: Resource): Promise<void> {
    const value = resource.value;
    const path =
      value.kind === "environment"
        ? value.workspacePath
        : value.kind === "skill"
          ? value.filePath
          : null;

    if (!path) return;

    const entry = await stat(await realpath(path));

    if (value.kind === "skill" && !entry.isFile())
      throw new Error("Choose an existing skill file.");
    if (value.kind === "environment" && !entry.isDirectory())
      throw new Error("Choose an existing workspace folder.");
  }
}
