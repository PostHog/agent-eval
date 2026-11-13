![Agent eval](images/agent-eval-logo.png)

# agent-eval

Run coding agents against copies of a project. Compare their results against saved criteria in a local web application. Requires Node.js 22.19 or later.

agent-eval allows you to see how coding agents behave in specific environments and with specific prompts. At the core, you have evals, which allow you to specify a set of criteria of what agents are supposed to. Then you select which models and harnesses you'd like to test on, and which environment (project, repository, folder, etc...). Then, upon running, it spawns isolated agents on a copy of the provided workspace, and a judge evaluates whether the agent fulfilled the acceptance criteria.

## Start

```sh
npm ci
cp .env.example .env
npm run build
npm start
```

The CLI starts NestJS at http://127.0.0.1:3100 and opens the app. Use the same command to view previous sessions. Press Ctrl+C to stop.

```sh
npm start -- --port 3200 --data ./.agent-eval --no-open
node dist/cli.js serve --help
```

Evals, resources, sessions, traces, files, judgments, and usage are saved in SQLite under `.agent-eval/`. The CLI applies committed Prisma migrations on startup. The old YAML runner and file report viewer have been removed. Existing `runs/` folders remain unchanged and are not imported.

## Workflow

1. Open **API keys**. Save the provider keys, or set them in `.env`.
2. Open **Environments**. Add a local project folder. Use `examples/sample-app` for the included Next.js storefront.
3. Add personas, skill folders, and stdio MCP servers as needed.
4. Open **Evals**, then **New eval**. Add the prompt, criteria, environment, and optional resources.
5. Select a harness, model, effort, count, timeout, and turn limit for each model profile. Select the judge harness and model.
6. Save the eval, then select **Run eval**.

The app runs up to two sessions at a time. Each session gets a separate temporary workspace. All sessions in a batch use the same saved project and skill inputs. Agents do not edit the source folder.

The eval page compares acceptance by model and criterion. Select a previous batch to view its saved configuration. Editing an eval creates a new revision. Previous sessions keep their original settings.

The **Sessions** page lists executions. Open a session to view its prompt, persona, harness, model, usage, duration, logs, input files, output files, runtime files, and judge feedback. Active pages refresh automatically. You can cancel an active or queued session.

## Harnesses

| Harness | Model catalog | Key | Requirement |
| --- | --- | --- | --- |
| Pi | OpenRouter | `OPENROUTER_API_KEY` | Included SDK |
| OpenCode | OpenRouter | `OPENROUTER_API_KEY` | OpenCode v2 on PATH (supports `--standalone`) |
| Codex | OpenAI | `OPENAI_API_KEY` | `codex` on PATH |
| Claude Code | Anthropic | `ANTHROPIC_API_KEY` | `claude` on PATH |

The **Harnesses** screen shows executable availability and model choices. Catalogs come from the installed Pi model registry. A listed model can still be unavailable to your account. Native harnesses use their own provider protocols and permissions.

Pi provides file tools, shell tools, HTTP fetching, and configured stdio MCP tools. Native harnesses use their own tools. Skills are copied into each harness's skill directory. A persona is added to the session instructions. MCP configuration supports stdio commands and argument lists.

Timeouts use **seconds**. Effort support depends on the model and harness. Native turn limits count events exposed by each harness and are not directly comparable. Codex exposes task turns, so its turn cap does not bound every internal model request. Use a timeout as well.

## Data and credentials

UI keys are encrypted with AES-256-GCM. The encryption key is stored in `.agent-eval/credential.key`. Back up this file with the database. The UI never returns saved key values. A saved key overrides its environment variable. Removing it restores the environment fallback.

Agent tools run with local process permissions. Project copies are not a security sandbox. Use projects without credentials. Input copies omit dependencies, Git metadata, local agent state, `.env` files, and application data. Other sensitive files can still be copied. Symbolic links cause an error.

Stopping the app cancels queued and active jobs. On restart, unfinished sessions are marked as failed. Native processes do not resume.

## Judging and metrics

Each session has its own judge call. The judge receives its final response, transcript, tool evidence, criteria, and resource context. Judges receive no skills or MCP servers. Pi and Claude tools are disabled. OpenCode tool permissions are denied. Codex uses a read-only sandbox; its built-in read tools remain available. Session content is evidence, not instructions.

The judge must return one pass/fail decision and a reason for each criterion. Missing evidence counts as failure. The app validates criterion IDs and rejects missing, duplicate, or extra decisions. A malformed response gets one correction attempt within the original judge timeout. Both attempts count toward usage and remain in the saved traces. A second malformed response marks the session as failed. Provider and execution errors are not retried. A valid assessment can complete with failed criteria.

Criterion acceptance is passed decisions divided by sessions in the selected batch. Model acceptance requires every criterion to pass. Failed and unjudged sessions remain in the denominator.

Reports separate agent and judge usage. They show total and per-model input, output, cache tokens, cost, and elapsed time. Cost is an SDK or harness estimate, not a billing statement. Missing native costs are shown as unavailable. Coverage shows which calls supplied usage and cost.

Saved inputs and effective settings support repeatable comparisons. Provider routing, model updates, sampling, and network responses can change results. Identical inputs do not guarantee identical outputs.

## Architecture

- `src/evaluations/domain`: Eval aggregate, Criterion and ModelSettings value objects, repository port.
- `src/sessions/domain`: Session state transitions, judgments, workspace and session ports.
- `src/catalog/domain`: Environment, persona, skill, and MCP resources.
- `src/harnesses/domain`: Harness execution contract and registry port.
- `application` folders: use cases that coordinate domain objects and ports.
- `infrastructure` folders: Prisma repositories, file copies, SDK and process adapters.
- `src/http`: HTTP entry points with input validation.
- `src/application.module.ts`: Nest dependency wiring.
- `web/src`: React screens, Vite, and Tailwind styles.
- `prisma/migrations`: SQLite schema history.

Execution: HTTP request → StartSessions → saved input snapshot → SessionWorker → selected Harness → individual judge → validated Session judgment → SQLite. Comments at these boundaries explain execution and ownership.

Pi SDK execution, tools, limits, and trace formatting are contained in `src/harnesses/infrastructure/pi`. All harnesses share the execution contracts in `src/harnesses/domain`. Pi sends events to the session repository and returns its result to the worker. It does not write duplicate prompt, result, or JSONL report files.

## Development

```sh
npm run dev
npm run check
```

For separate processes, build once, then run `npm run dev:server` and `npm run dev:web` in separate terminals.

`check` runs strict TypeScript checks, Biome, tests, and the production build. Tests use temporary SQLite databases and controlled harnesses. They do not make paid model requests.

The Next.js sample has product filters, dynamic pages, a persistent cart, checkout APIs, account preferences, and journal pages. Run `npm ci` and `npm run dev` in `examples/sample-app` to start it.
