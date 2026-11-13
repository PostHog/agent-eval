import type { ZodType } from "zod";

export function readStoredValue<T>(
  key: string,
  schema: ZodType<T>,
  fallback: T,
): T {
  const stored = localStorage.getItem(key);

  if (!stored) return fallback;

  try {
    const result = schema.safeParse(JSON.parse(stored));

    return result.success ? result.data : fallback;
  } catch {
    return fallback;
  }
}
