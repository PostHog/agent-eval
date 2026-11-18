import { StreamLanguage } from "@codemirror/language";
import { css } from "@codemirror/legacy-modes/mode/css";
import { dockerFile } from "@codemirror/legacy-modes/mode/dockerfile";
import {
  javascript,
  json,
  typescript,
} from "@codemirror/legacy-modes/mode/javascript";
import { python } from "@codemirror/legacy-modes/mode/python";
import { shell } from "@codemirror/legacy-modes/mode/shell";
import { standardSQL } from "@codemirror/legacy-modes/mode/sql";
import { html, xml } from "@codemirror/legacy-modes/mode/xml";
import { yaml } from "@codemirror/legacy-modes/mode/yaml";
import CodeMirror, { EditorView } from "@uiw/react-codemirror";
import { useMemo } from "react";

const modes = new Map(
  Object.entries({
    js: javascript,
    jsx: javascript,
    mjs: javascript,
    cjs: javascript,
    ts: typescript,
    tsx: typescript,
    mts: typescript,
    cts: typescript,
    json,
    css,
    html,
    xml,
    svg: xml,
    py: python,
    sh: shell,
    bash: shell,
    sql: standardSQL,
    yml: yaml,
    yaml,
  }),
);

export function FilePreview({ path, text }: { path: string; text: string }) {
  const extensions = useMemo(() => {
    const name = path.split("/").at(-1)?.toLowerCase() ?? "";
    const mode = /^dockerfile(?:\.|$)/.test(name)
      ? dockerFile
      : modes.get(name.split(".").at(-1) ?? "");
    return [
      EditorView.contentAttributes.of({ "aria-label": path }),
      ...(mode ? [StreamLanguage.define(mode)] : []),
    ];
  }, [path]);

  return (
    <CodeMirror
      value={text}
      className="session-file-preview"
      theme="dark"
      height="100%"
      readOnly
      basicSetup={{
        lineNumbers: true,
        highlightActiveLine: false,
        highlightActiveLineGutter: false,
      }}
      extensions={extensions}
    />
  );
}
