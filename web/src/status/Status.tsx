import { StatusIcon, type StatusIconName } from "./StatusIcon.js";

const states: Record<
  string,
  { label: string; icon: StatusIconName; description: string }
> = {
  queued: {
    label: "Queued",
    icon: "clock",
    description: "Waiting for an execution slot.",
  },
  running: {
    label: "Running",
    icon: "spinner",
    description: "The agent is working on the task.",
  },
  judging: {
    label: "Judging",
    icon: "spinner",
    description: "The judge is checking the session against the criteria.",
  },
  completed: {
    label: "Completed",
    icon: "check",
    description:
      "Execution and judgment finished. Check the criteria for acceptance.",
  },
  failed: {
    label: "Failed",
    icon: "error",
    description: "The agent or judge failed. Open the session for details.",
  },
  cancelled: {
    label: "Cancelled",
    icon: "cancel",
    description: "The session was stopped before completion.",
  },
};

export function Status({ value }: { value: string }) {
  const state = states[value];

  return (
    <span
      className={`status ${state ? value : "unknown"}`}
      title={state?.description}
    >
      <StatusIcon name={state?.icon ?? "info"} />
      {state?.label ?? value}
    </span>
  );
}
