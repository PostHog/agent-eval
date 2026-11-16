export type ResourceIconName =
  | "container"
  | "file"
  | "folder"
  | "runtime"
  | "workspace";

export function ResourceIcon({ name }: { name: ResourceIconName }) {
  return (
    <svg
      className="resource-icon"
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {name === "workspace" && (
        <>
          <path d="M2.5 5.5h5l1.5 2h6.5v7h-13z" />
          <path d="M2.5 5.5V3.8h4.2l1.2 1.7" />
        </>
      )}
      {name === "runtime" && (
        <>
          <rect x="2.5" y="3" width="13" height="12" rx="1.5" />
          <path d="m5.5 7 2 2-2 2M9.5 11h3" />
        </>
      )}
      {name === "container" && (
        <>
          <path d="m9 2.5 6 3.2v6.6l-6 3.2-6-3.2V5.7z" />
          <path d="m3 5.7 6 3.2 6-3.2M9 8.9v6.6" />
        </>
      )}
      {name === "folder" && <path d="M2.5 5.5h5l1.5 2h6.5v7h-13z" />}
      {name === "file" && (
        <>
          <path d="M4.5 2.5h6l3 3v10h-9z" />
          <path d="M10.5 2.5v3h3" />
        </>
      )}
    </svg>
  );
}
