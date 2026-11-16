import { useApi } from "../api.js";
import { Notice } from "../components.js";
import { ResourceIcon } from "./ResourceIcon.js";

export function DefaultDockerfile() {
  const { data, error } = useApi<{ content: string }>(
    "/resources/default-dockerfile",
  );

  return (
    <div className="docker-default">
      <div>
        <span className="docker-default-title">
          <ResourceIcon name="container" />
          <strong>Built-in agent image</strong>
        </span>
        <p>node:22-bookworm-slim · Git · curl · ripgrep</p>
      </div>
      <details>
        <summary>Inspect Dockerfile</summary>
        <Notice error={error} />
        <pre>{data?.content ?? "Loading Dockerfile…"}</pre>
      </details>
    </div>
  );
}
