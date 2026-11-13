import { useState } from "react";
import { Dialog } from "../Dialog.js";
import { ResourceForm } from "../resources/ResourceForm.js";
import { type ResourceKind, resourceInfo } from "../resources/resource-info.js";
import type { Resource } from "../types.js";

export function ResourceDialog({
  kind,
  onSaved,
  onClose,
}: {
  kind: ResourceKind;
  onSaved: (resource: Resource) => void;
  onClose: () => void;
}) {
  const [saving, setSaving] = useState(false);

  return (
    <Dialog
      title={`Create ${resourceInfo[kind].singular}`}
      onClose={onClose}
      busy={saving}
    >
      <p className="muted">
        This resource will be saved to your library and selected for this eval.
      </p>
      <ResourceForm
        kind={kind}
        hideTitle
        onClose={onClose}
        onSaved={onSaved}
        onSavingChange={setSaving}
      />
    </Dialog>
  );
}
