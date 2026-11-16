export const DEFAULT_DOCKERFILE = `FROM node:22-bookworm-slim

RUN apt-get update \\
    && apt-get install --yes --no-install-recommends ca-certificates curl git ripgrep \\
    && rm -rf /var/lib/apt/lists/*
`;
