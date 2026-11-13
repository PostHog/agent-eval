import DOMPurify from "dompurify";
import { marked } from "marked";
import { useMemo } from "react";

export function Markdown({ text }: { text: string }) {
  const html = useMemo(
    () =>
      DOMPurify.sanitize(marked.parse(text, { async: false }), {
        USE_PROFILES: { html: true },
        FORBID_TAGS: ["img", "input", "form", "style"],
      }),
    [text],
  );

  // Agent output is untrusted. Sanitize parsed Markdown before inserting it.
  return (
    <div
      className="transcript-markdown"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: DOMPurify sanitizes the Markdown above.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
