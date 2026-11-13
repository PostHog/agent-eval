import { randomUUID } from "node:crypto";
import { z } from "zod";

const schema = z
  .object({
    id: z.string().uuid(),
    description: z.string().trim().min(1),
  })
  .strict();

export class Criterion {
  private constructor(
    readonly id: string,
    readonly description: string,
  ) {
    Object.freeze(this);
  }

  static create(description: string): Criterion {
    return Criterion.restore({ id: randomUUID(), description });
  }

  static restore(input: unknown): Criterion {
    const value = schema.parse(input);

    return new Criterion(value.id, value.description);
  }
}
