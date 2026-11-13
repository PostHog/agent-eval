import { randomUUID } from "node:crypto";
import { z } from "zod";

const common = {
  id: z.string().uuid(),
  title: z.string().trim().min(1),
};

export const resourceSchema = z
  .discriminatedUnion("kind", [
    z
      .object({
        ...common,
        kind: z.literal("environment"),
        description: z.string().default(""),
        workspacePath: z.string().trim().min(1).nullable(),
      })
      .strict(),
    z
      .object({
        ...common,
        kind: z.literal("persona"),
        description: z.string().trim().min(1),
      })
      .strict(),
    z
      .object({
        ...common,
        kind: z.literal("skill"),
        filePath: z.string().trim().min(1).nullable(),
        content: z.string().trim().min(1).nullable(),
      })
      .strict(),
    z
      .object({
        ...common,
        kind: z.literal("mcp"),
        description: z.string().default(""),
        command: z.string().trim().min(1),
        arguments: z.array(z.string()),
      })
      .strict(),
  ])
  .superRefine((resource, context) => {
    if (
      resource.kind === "skill" &&
      Number(Boolean(resource.filePath)) + Number(Boolean(resource.content)) !==
        1
    )
      context.addIssue({
        code: "custom",
        message: "Choose either a skill file or inline instructions.",
      });
  });

export type ResourceData = z.infer<typeof resourceSchema>;
export type ResourceKind = ResourceData["kind"];

export class Resource {
  private constructor(readonly value: ResourceData) {}

  static create(input: unknown): Resource {
    const object = z.record(z.unknown()).parse(input);

    return Resource.restore({ ...object, id: randomUUID() });
  }

  static restore(input: unknown): Resource {
    return new Resource(Object.freeze(resourceSchema.parse(input)));
  }
}
