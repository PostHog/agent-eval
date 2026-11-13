import { useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Harness } from "../types.js";
import { searchModels } from "./model-search.js";

export function ModelSelect({
  id,
  harness,
  value,
  onChange,
}: {
  id?: string;
  harness?: Harness;
  value: string;
  onChange: (model: string) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const results = useRef<HTMLUListElement>(null);
  const titleId = useId();
  const searchId = useId();
  const [query, setQuery] = useState("");
  const models = searchModels(harness?.models ?? [], query);
  const selected = harness?.models.find((model) => model.id === value);

  function open() {
    setQuery("");
    dialog.current?.showModal();
    search.current?.focus();
  }

  function choose(model: string) {
    onChange(model);
    dialog.current?.close();
  }

  return (
    <>
      <button
        type="button"
        id={id}
        className="model-select"
        aria-haspopup="dialog"
        disabled={!harness}
        onClick={open}
      >
        <span>{selected?.name ?? (value || "Choose a model")}</span>
        <span className="muted">Search</span>
      </button>
      {createPortal(
        <dialog ref={dialog} className="model-dialog" aria-labelledby={titleId}>
          <header>
            <div>
              <h2 id={titleId}>Choose a model</h2>
              <p className="muted">Models available in {harness?.title}</p>
            </div>
            <button type="button" onClick={() => dialog.current?.close()}>
              Close
            </button>
          </header>
          <label htmlFor={searchId}>Search by name or model ID</label>
          <input
            ref={search}
            id={searchId}
            type="search"
            placeholder="e.g. GPT, Sonnet, or openai/…"
            autoComplete="off"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.nativeEvent.isComposing) return;

              if (event.key === "Enter" && models[0]) {
                event.preventDefault();
                choose(models[0].id);
              }

              if (event.key === "ArrowDown") {
                event.preventDefault();
                results.current?.querySelector("button")?.focus();
              }
            }}
          />
          <output className="model-result-count">
            {models.length} {models.length === 1 ? "model" : "models"}
          </output>
          <ul className="model-results" ref={results}>
            {models.map((model) => (
              <li key={model.id}>
                <button
                  type="button"
                  aria-pressed={model.id === value}
                  onClick={() => choose(model.id)}
                >
                  <span>
                    <strong>{model.name}</strong>
                    <code>{model.id}</code>
                  </span>
                  {model.id === value && <span>Selected</span>}
                </button>
              </li>
            ))}
          </ul>
          {models.length === 0 && (
            <p className="model-no-results">
              {harness?.models.length
                ? "No models match your search. Try another name or model ID."
                : "No models are available for this harness. Check its API key and model catalog."}
            </p>
          )}
          <footer className="muted">
            Enter selects the first match. Escape closes this dialog.
          </footer>
        </dialog>,
        document.body,
      )}
    </>
  );
}
