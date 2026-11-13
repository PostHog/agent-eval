import {
  Button,
  Empty,
  EmptyContent,
  EmptyHeader,
  EmptyTitle,
} from "@posthog/quill";
import type { ReactNode } from "react";
import { Notice } from "./components.js";
import { StatusIcon } from "./status/StatusIcon.js";

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <output className="loading-state">
      <StatusIcon name="spinner" />
      {label}
    </output>
  );
}

export function RequestState({
  error,
  retry,
}: {
  error?: string;
  retry: () => void;
}) {
  return error ? (
    <div className="request-state">
      <Notice error={error} />
      <Button type="button" onClick={retry}>
        Try again
      </Button>
    </div>
  ) : (
    <LoadingState />
  );
}

export function EmptyState({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyTitle>{title}</EmptyTitle>
      </EmptyHeader>
      <EmptyContent>{children}</EmptyContent>
    </Empty>
  );
}

export function Feedback({ message }: { message: string }) {
  return message ? (
    <output className="feedback">
      <StatusIcon name="check" />
      <span>{message}</span>
    </output>
  ) : null;
}
