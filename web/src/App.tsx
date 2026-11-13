import { type ReactNode, useEffect, useState } from "react";
import { EvalDetail } from "./evals/EvalDetail.js";
import { EvalEditor } from "./evals/EvalEditor.js";
import { EvalList } from "./evals/EvalList.js";
import { ModelCatalog } from "./models/ModelReference.js";
import { CredentialsPage } from "./resources/CredentialsPage.js";
import { HarnessesPage } from "./resources/HarnessesPage.js";
import { ResourcePage } from "./resources/ResourcePage.js";
import { SessionDetail } from "./sessions/SessionDetail.js";
import { SessionList } from "./sessions/SessionList.js";

const navigation = [
  ["evals", "Evals"],
  ["sessions", "Coding sessions"],
  ["environments", "Environments"],
  ["skills", "Skills"],
  ["personas", "Personas"],
  ["mcps", "MCP servers"],
  ["harnesses", "Harnesses"],
  ["credentials", "API keys"],
];

export function App() {
  const [route, setRoute] = useState(location.hash.slice(1) || "evals");

  useEffect(() => {
    const change = () => setRoute(location.hash.slice(1) || "evals");
    window.addEventListener("hashchange", change);
    return () => window.removeEventListener("hashchange", change);
  }, []);

  const [page, id, action] = route.split("/");
  let content: ReactNode;

  if (page === "evals")
    content =
      id === "new" ? (
        <EvalEditor />
      ) : id && action === "edit" ? (
        <EvalEditor id={id} />
      ) : id ? (
        <EvalDetail id={id} />
      ) : (
        <EvalList />
      );
  else if (page === "sessions")
    content = id ? <SessionDetail id={id} /> : <SessionList />;
  else if (page === "credentials") content = <CredentialsPage />;
  else if (page === "harnesses") content = <HarnessesPage />;
  else if (["environments", "skills", "personas", "mcps"].includes(page ?? ""))
    content = (
      <ResourcePage
        key={page}
        kind={page as "environments" | "skills" | "personas" | "mcps"}
      />
    );
  else
    content = (
      <p>
        Page not found. <a href="#evals">Return to evals</a>.
      </p>
    );

  return (
    <ModelCatalog>
      <div className="app">
        <aside className="sidebar">
          <a className="brand" href="#evals">
            <img
              src="/brand/posthog-logo-white.svg"
              alt="PostHog"
              width="134"
              height="24"
            />
            <span>Agent eval</span>
          </a>
          <nav aria-label="Main navigation">
            {navigation.map(([path, title]) => (
              <a
                key={path}
                href={`#${path}`}
                aria-current={page === path ? "page" : undefined}
              >
                <span
                  className="nav-icon"
                  aria-hidden="true"
                  style={{ maskImage: `url(/brand/${path}.svg)` }}
                />
                {title}
              </a>
            ))}
          </nav>
          <p className="sidebar-note">
            <img src="/brand/research.svg" alt="" width="76" height="76" />
            <strong>Local research workspace</strong>
            Your evals, sessions, and reports stay on this computer.
          </p>
        </aside>
        <div className="main-shell">
          <header className="topbar">
            <a className="breadcrumb-link" href="#evals">
              Agent eval
            </a>{" "}
            <span>/</span>{" "}
            {navigation.find(([path]) => path === page)?.[1] ?? "Report"}
            <span className="local-badge">Local</span>
          </header>
          <main key={route}>{content}</main>
        </div>
      </div>
    </ModelCatalog>
  );
}
