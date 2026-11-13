import { Inject, Injectable } from "@nestjs/common";
import { z } from "zod";
import { Database } from "../../infrastructure/database.js";
import type { Resource, ResourceKind } from "../domain/resource.js";
import { ResourceRepository } from "../domain/resource-repository.js";

@Injectable()
export class PrismaCatalog extends ResourceRepository {
  constructor(@Inject(Database) private readonly db: Database) {
    super();
  }

  async list() {
    const [environments, personas, skills, mcps] = await Promise.all([
      this.db.environment.findMany(),
      this.db.persona.findMany(),
      this.db.skill.findMany(),
      this.db.mcp.findMany(),
    ]);

    return {
      environments,
      personas,
      skills,
      mcps: mcps.map((mcp) => ({
        ...mcp,
        arguments: z.array(z.string()).parse(mcp.arguments),
      })),
    };
  }

  async save(resource: Resource): Promise<void> {
    const { kind, ...data } = resource.value;

    switch (kind) {
      case "environment":
        await this.db.environment.upsert({
          where: { id: data.id },
          create: data as Extract<Resource["value"], { kind: "environment" }>,
          update: data,
        });
        break;
      case "persona":
        await this.db.persona.upsert({
          where: { id: data.id },
          create: data,
          update: data,
        });
        break;
      case "skill": {
        const value = resource.value;

        if (value.kind === "skill")
          await this.db.skill.upsert({
            where: { id: value.id },
            create: {
              id: value.id,
              title: value.title,
              description: value.description,
              directory: value.directory,
            },
            update: {
              title: value.title,
              description: value.description,
              directory: value.directory,
            },
          });

        break;
      }
      case "mcp": {
        const value = resource.value;

        if (value.kind === "mcp")
          await this.db.mcp.upsert({
            where: { id: value.id },
            create: {
              id: value.id,
              title: value.title,
              description: value.description,
              command: value.command,
              arguments: value.arguments,
            },
            update: {
              title: value.title,
              description: value.description,
              command: value.command,
              arguments: value.arguments,
            },
          });

        break;
      }
    }
  }

  async delete(kind: ResourceKind, id: string) {
    switch (kind) {
      case "environment":
        return this.db.environment.delete({ where: { id } });
      case "persona":
        return this.db.persona.delete({ where: { id } });
      case "skill":
        return this.db.skill.delete({ where: { id } });
      case "mcp":
        return this.db.mcp.delete({ where: { id } });
    }
  }
}
