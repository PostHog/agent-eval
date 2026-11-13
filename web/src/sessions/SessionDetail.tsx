import { useState } from "react";
import { api, useApi } from "../api.js";
import { Notice, PageTitle, Status } from "../components.js";
import { HarnessIcon, ModelReference } from "../models/ModelReference.js";
import { RequestState } from "../PageState.js";
import { StatusIcon } from "../status/StatusIcon.js";
import type { Session } from "../types.js";
import { ConfigurationPanel } from "./ConfigurationPanel.js";
import { FilesPanel } from "./FilesPanel.js";
import { LogPanel } from "./LogPanel.js";
import { SessionJudgment } from "./SessionJudgment.js";
import { SessionMetadata } from "./SessionMetadata.js";
import { isActive } from "./session-filters.js";

export function SessionDetail({ id }: { id: string }) {
  const {
    data: session,
    error,
    refresh,
  } = useApi<Session>(`/sessions/${id}`, true);
  const [tab, setTab] = useState("logs");
  const [failure, setFailure] = useState("");
  const [cancelling, setCancelling] = useState(false);

  async function cancel() {
    if (
      !confirm(
        "Cancel this session? The current work will stop. Usage already incurred will still be charged.",
      )
    )
      return;

    setCancelling(true);
    setFailure("");

    try {
      await api(`/sessions/${id}/cancel`, { method: "POST" });
      refresh();
    } catch (error) {
      setFailure(String(error));
    } finally {
      setCancelling(false);
    }
  }

  if (!session) return <RequestState error={error} retry={refresh} />;

  const active = isActive(session);
  const snapshot = session.snapshot;

  return (
    <>
      <a className="back-link" href={`#evals/${session.evalId}`}>
        {session.eval.title}
      </a>
      <div className="session-heading">
        <HarnessIcon harness={session.harness} />
        <PageTitle
          title={`${session.harness === "opencode" ? "OpenCode" : session.harness === "claude" ? "Claude Code" : session.harness === "codex" ? "Codex" : "Pi"} session`}
        >
          <Status value={session.status} />
          {active && (
            <button
              type="button"
              disabled={cancelling}
              onClick={() => void cancel()}
            >
              {cancelling && <StatusIcon name="spinner" />}
              {cancelling ? "Cancelling…" : "Cancel session"}
            </button>
          )}
        </PageTitle>
        <ModelReference harness={session.harness} model={session.model} />
      </div>
      <Notice error={error || failure || session.error || undefined} />
      <p className="prompt-block">{snapshot.evaluation.prompt}</p>
      <SessionMetadata session={session} />
      <div className="session-layout">
        <section>
          <div className="tabs section-tabs">
            <button
              type="button"
              aria-pressed={tab === "logs"}
              onClick={() => setTab("logs")}
            >
              Logs
            </button>
            <button
              type="button"
              aria-pressed={tab === "files"}
              onClick={() => setTab("files")}
            >
              Files
            </button>
            <button
              type="button"
              aria-pressed={tab === "configuration"}
              onClick={() => setTab("configuration")}
            >
              Configuration
            </button>
          </div>
          {tab === "logs" ? (
            <LogPanel session={session} active={active} />
          ) : tab === "files" ? (
            <FilesPanel id={id} active={active} />
          ) : (
            <ConfigurationPanel session={session} />
          )}
        </section>
        <SessionJudgment session={session} />
      </div>
    </>
  );
}
