const generate = Bun.spawn([process.execPath, "run", "db:generate"], {
  stdout: "inherit",
  stderr: "inherit",
});
if ((await generate.exited) !== 0) process.exit(generate.exitCode ?? 1);

const children = [
  [process.execPath, "--watch", "src/cli.ts", "serve", "--no-open"],
  [
    process.execPath,
    "node_modules/vite/bin/vite.js",
    "--config",
    "web/vite.config.ts",
    "--open",
  ],
].map((command) =>
  Bun.spawn(command, { stdout: "inherit", stderr: "inherit" }),
);

const stop = () => {
  for (const child of children) child.kill();
};
process.once("SIGINT", stop);
process.once("SIGTERM", stop);
process.exitCode = await Promise.race(children.map((child) => child.exited));
stop();
await Promise.all(children.map((child) => child.exited));
