import { readdir, realpath, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { Controller, Get, Query } from "@nestjs/common";
import { z } from "zod";

@Controller("api/filesystem")
export class FilesystemController {
  @Get()
  async browse(
    @Query("kind") inputKind: string,
    @Query("path") inputPath?: string,
  ) {
    const kind = z.enum(["directory", "file"]).parse(inputKind);
    const requested = await realpath(resolve(inputPath || process.cwd()));
    const entry = await stat(requested);
    const directory = entry.isDirectory() ? requested : dirname(requested);
    const entries = (await readdir(directory, { withFileTypes: true }))
      .filter(
        (item) => item.isDirectory() || (kind === "file" && item.isFile()),
      )
      .sort(
        (left, right) =>
          Number(right.isDirectory()) - Number(left.isDirectory()) ||
          left.name.localeCompare(right.name),
      )
      .slice(0, 500)
      .map((item) => ({
        name: item.name,
        path: join(directory, item.name),
        kind: item.isDirectory() ? "directory" : "file",
      }));
    const parent = dirname(directory);

    return {
      path: directory,
      parent: parent === directory ? null : parent,
      entries,
    };
  }
}
