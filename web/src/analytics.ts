import posthog from "posthog-js";

const token = import.meta.env.VITE_PUBLIC_POSTHOG_KEY;
const host = import.meta.env.VITE_PUBLIC_POSTHOG_HOST;

export const analyticsEnabled = Boolean(token && host);

if (analyticsEnabled) {
  posthog.init(token, {
    api_host: host,
    defaults: "2026-08-30",
    capture_exceptions: true,
    logs: { captureConsoleLogs: true, serviceName: "agent-eval-frontend" },
  });
}

export function analyticsHeaders(): Record<string, string> {
  return analyticsEnabled
    ? {
        "X-POSTHOG-DISTINCT-ID": posthog.get_distinct_id(),
        "X-POSTHOG-SESSION-ID": posthog.get_session_id(),
      }
    : {};
}

export { posthog };
