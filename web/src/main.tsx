import { Button, TooltipProvider } from "@posthog/quill";
import { PostHogErrorBoundary, PostHogProvider } from "@posthog/react";
import { createRoot } from "react-dom/client";
import { App } from "./App.js";
import { analyticsEnabled, posthog } from "./analytics.js";
import "./styles.css";

const root = document.getElementById("root");

if (root) {
  const app = (
    <TooltipProvider>
      <PostHogErrorBoundary
        fallback={({ resetError }) => (
          <main className="empty">
            <h1>Something went wrong</h1>
            <p>The error was reported. Reload the screen to try again.</p>
            <Button onClick={resetError}>Try again</Button>
          </main>
        )}
      >
        <App />
      </PostHogErrorBoundary>
    </TooltipProvider>
  );

  createRoot(root).render(
    analyticsEnabled ? (
      <PostHogProvider client={posthog}>{app}</PostHogProvider>
    ) : (
      app
    ),
  );
}
