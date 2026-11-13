import {
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Dialog as QuillDialog,
} from "@posthog/quill";
import type { ReactNode } from "react";

export function Dialog({
  title,
  children,
  onClose,
  busy = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  busy?: boolean;
}) {
  return (
    <QuillDialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <DialogContent
        size="wide"
        showCloseButton={!busy}
        // Portal events still reach the eval form through the React tree.
        onSubmit={(event) => event.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="dialog-body">{children}</div>
        </DialogBody>
      </DialogContent>
    </QuillDialog>
  );
}
