import { z } from "zod";

const judgmentSchema = z
  .object({
    summary: z.string().trim().min(1),
    decisions: z.array(
      z
        .object({
          criterionId: z.string().uuid(),
          passed: z.boolean(),
          feedback: z.string().trim().min(1),
        })
        .strict(),
    ),
  })
  .strict();

export type Judgment = z.infer<typeof judgmentSchema>;

export function parseJudgment(
  input: unknown,
  criterionIds: string[],
): Judgment {
  const parsed = judgmentSchema.safeParse(input);

  if (!parsed.success) {
    const issue = parsed.error.issues[0];

    throw new Error(
      `Invalid judge response: ${issue?.path.join(".")}: ${issue?.message}`,
    );
  }

  const expected = new Set(criterionIds);
  const received = new Set(
    parsed.data.decisions.map((decision) => decision.criterionId),
  );

  if (
    parsed.data.decisions.length !== expected.size ||
    received.size !== expected.size ||
    [...received].some((id) => !expected.has(id))
  )
    throw new Error(
      "The judge must assess every session criterion exactly once.",
    );

  return parsed.data;
}
