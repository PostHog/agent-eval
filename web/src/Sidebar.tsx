import { Button } from "@posthog/quill";
import brandLogo from "../../images/agent-eval-logo-brand.png";

export const navigationGroups: { title: string; links: [string, string][] }[] =
  [
    {
      title: "Workspace",
      links: [
        ["evals", "Evals"],
        ["sessions", "Coding sessions"],
      ],
    },
    {
      title: "Resources",
      links: [
        ["environments", "Environments"],
        ["skills", "Skills"],
        ["personas", "Personas"],
        ["mcps", "MCP servers"],
      ],
    },
    {
      title: "Settings",
      links: [
        ["harnesses", "Harnesses"],
        ["credentials", "API keys"],
      ],
    },
  ];

export function Sidebar({ page }: { page?: string }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <a className="brand" href="#evals">
          <img src={brandLogo} alt="agent-eval" width="800" height="300" />
        </a>
        <Button
          variant="primary"
          className="sidebar-create"
          render={
            <a href="#evals/new">
              <span aria-hidden="true">+</span> New eval
            </a>
          }
        />
      </div>
      <nav aria-label="Main navigation" className="sidebar-navigation">
        {navigationGroups.map((group) => (
          <section
            key={group.title}
            aria-label={group.title}
            className="nav-group"
          >
            <h2>{group.title}</h2>
            <ul>
              {group.links.map(([path, title]) => (
                <li key={path}>
                  <a
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
                </li>
              ))}
            </ul>
          </section>
        ))}
      </nav>
      <footer className="sidebar-footer">
        <div className="workspace-note">
          <img src="/brand/research.svg" alt="" width="44" height="44" />
          <p>
            <strong>Local workspace</strong>
            <span>Saved on this computer</span>
          </p>
        </div>
        <img
          className="sidebar-posthog"
          src="/brand/posthog-logo-white.svg"
          alt="PostHog"
          width="92"
          height="17"
        />
      </footer>
    </aside>
  );
}
