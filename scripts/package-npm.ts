import {
  chmod,
  copyFile,
  mkdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repository = fileURLToPath(new URL("../", import.meta.url));
const { binaries } = createRequire(import.meta.url)(
  "../npm/agent-eval.cjs",
) as {
  binaries: Record<string, string>;
};

export async function packageNpm(
  assetDirectory: string,
  outputDirectory: string,
  releaseTag?: string,
) {
  const { version } = JSON.parse(
    await readFile(join(repository, "package.json"), "utf8"),
  ) as { version: string };
  if (releaseTag && releaseTag !== `v${version}`) {
    throw new Error(
      `Release tag ${releaseTag} does not match version ${version}.`,
    );
  }

  const checksums: Record<string, string> = {};
  for (const name of Object.values(binaries)) {
    const archive = name.endsWith(".exe")
      ? name.replace(/\.exe$/, ".zip")
      : `${name}.tar.gz`;
    const checksum = (
      await readFile(join(assetDirectory, `${archive}.sha256`), "utf8")
    )
      .trim()
      .split(/\s+/)[0];
    if (!checksum || !/^[a-f0-9]{64}$/i.test(checksum))
      throw new Error(`Invalid checksum for ${archive}`);
    checksums[archive] = checksum.toLowerCase();
  }
  await rm(outputDirectory, { recursive: true, force: true });
  await mkdir(join(outputDirectory, "bin"), { recursive: true });
  for (const file of ["agent-eval.cjs", "install.cjs"])
    await copyFile(
      join(repository, "npm", file),
      join(outputDirectory, "bin", file),
    );
  await chmod(join(outputDirectory, "bin/agent-eval.cjs"), 0o755);
  await writeFile(
    join(outputDirectory, "bin/checksums.json"),
    JSON.stringify(checksums),
  );
  const readme = await readFile(join(repository, "README.md"), "utf8");
  await writeFile(
    join(outputDirectory, "README.md"),
    readme.replaceAll(
      "](images/",
      `](https://raw.githubusercontent.com/PostHog/agent-eval/v${version}/images/`,
    ),
  );
  await writeFile(
    join(outputDirectory, "package.json"),
    `${JSON.stringify(
      {
        name: "@posthog/agent-eval",
        version,
        description:
          "Evaluate coding agents in isolated workspaces with a local web app.",
        bin: { "agent-eval": "bin/agent-eval.cjs" },
        files: ["bin"],
        scripts: { postinstall: "node bin/install.cjs" },
        engines: { node: ">=22" },
        os: ["darwin", "linux", "win32"],
        cpu: ["arm64", "x64"],
        repository: {
          type: "git",
          url: "git+https://github.com/PostHog/agent-eval.git",
        },
        homepage: "https://github.com/PostHog/agent-eval#readme",
        bugs: { url: "https://github.com/PostHog/agent-eval/issues" },
        publishConfig: { access: "public" },
      },
      null,
      2,
    )}\n`,
  );
}

if (import.meta.main) {
  const source = process.argv[2];
  if (!source)
    throw new Error("Usage: bun run package:npm <release-assets-directory>");
  await packageNpm(
    resolve(source),
    resolve("release/npm"),
    process.env.GITHUB_REF_TYPE === "tag"
      ? process.env.GITHUB_REF_NAME
      : undefined,
  );
  console.log("npm package prepared in release/npm");
}
