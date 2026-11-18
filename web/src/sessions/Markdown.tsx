import DOMPurify from "dompurify";
import { marked } from "marked";
import { useMemo } from "react";
import { highlightParts, type MatchRanges } from "./transcript/search.js";

function sanitizeMarkdown(text: string) {
  return DOMPurify.sanitize(marked.parse(text, { async: false }), {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ["img", "input", "form", "style"],
  });
}

function markdownTemplate(html: string) {
  const template = document.createElement("template");
  template.innerHTML = html;
  return template;
}

export function markdownText(text: string) {
  return markdownTemplate(sanitizeMarkdown(text)).content.textContent ?? "";
}

export function Markdown({
  text,
  matches,
}: {
  text: string;
  matches?: MatchRanges | undefined;
}) {
  const html = useMemo(() => {
    const sanitized = sanitizeMarkdown(text);
    if (!matches?.length) return sanitized;

    // Match offsets refer to rendered text. Add marks without changing Markdown structure.
    const template = markdownTemplate(sanitized);
    const walker = document.createTreeWalker(template.content, 4);
    const nodes: Node[] = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    let offset = 0;
    for (const node of nodes) {
      const value = node.textContent ?? "";
      const parts = highlightParts(value, matches, offset);
      offset += value.length;
      if (!parts.some((part) => part.match)) continue;

      const replacement = document.createDocumentFragment();
      for (const part of parts) {
        if (part.match) {
          const mark = document.createElement("mark");
          mark.textContent = part.text;
          replacement.append(mark);
        } else replacement.append(part.text);
      }
      node.parentNode?.replaceChild(replacement, node);
    }
    return template.innerHTML;
  }, [text, matches]);

  return (
    <div
      className="transcript-markdown"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: DOMPurify sanitizes the markup before text nodes receive highlights.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
