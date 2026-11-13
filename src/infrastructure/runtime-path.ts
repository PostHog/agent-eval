import { existsSync } from "node:fs";
import { basename, resolve } from "node:path";

export function runtimePath(path: string): string {
  const candidates = [
    resolve(import.meta.dir, path),
    resolve(import.meta.dir, basename(path)),
    resolve(import.meta.dir, "..", path),
    resolve(import.meta.dir, "../..", path),
  ];
  const found = candidates.find(existsSync);

  if (!found) throw new Error(`Application asset not found: ${path}`);

  return found;
}
