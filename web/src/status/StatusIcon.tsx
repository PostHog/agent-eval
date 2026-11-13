import { Spinner } from "@posthog/quill";
export type StatusIconName =
  | "spinner"
  | "check"
  | "error"
  | "clock"
  | "cancel"
  | "info";

export function StatusIcon({ name }: { name: StatusIconName }) {
  if (name === "spinner")
    return (
      <Spinner
        className="status-icon motion-reduce:animate-none"
        aria-hidden="true"
      />
    );

  return (
    <svg
      className="status-icon"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="8" cy="8" r="6" />
      {name === "check" && <path d="m5 8 2 2 4-4" />}
      {name === "error" && <path d="M8 4.5v4M8 11h.01" />}
      {name === "clock" && <path d="M8 4.5V8l2 1.5" />}
      {name === "cancel" && <path d="m6 6 4 4m0-4-4 4" />}
      {name === "info" && <path d="M8 7v4M8 4.5h.01" />}
    </svg>
  );
}
