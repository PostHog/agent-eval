export function redactText(text: string, secrets: string[]): string {
  return secrets.reduce(
    (value, secret) => value.replaceAll(secret, "[redacted]"),
    text,
  );
}

export function redactEvent(event: unknown, secrets: string[]): unknown {
  if (!secrets.length || event === undefined) return event;

  return JSON.parse(
    JSON.stringify(event, (_key, value) =>
      typeof value === "string" ? redactText(value, secrets) : value,
    ),
  );
}
