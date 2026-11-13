import { TooltipProvider } from "@posthog/quill";
import posthog from "posthog-js";
import { createRoot } from "react-dom/client";
import { App } from "./App.js";
import "./styles.css";

if (import.meta.env.VITE_PUBLIC_POSTHOG_KEY) {
  posthog.init(import.meta.env.VITE_PUBLIC_POSTHOG_KEY, {
    api_host:
      import.meta.env.VITE_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
    defaults: "2025-11-30",
  });
}

const root = document.getElementById("root");

if (root)
  createRoot(root).render(
    <TooltipProvider>
      <App />
    </TooltipProvider>,
  );
