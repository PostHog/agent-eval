import { type ReactNode, useId, useState } from "react";
import { createPortal } from "react-dom";

export function Tooltip({
  text,
  children,
}: {
  text: string;
  children: ReactNode;
}) {
  const id = useId();
  const [anchor, setAnchor] = useState<DOMRect>();

  return (
    <button
      type="button"
      className="tooltip-trigger"
      aria-label={text}
      aria-describedby={anchor ? id : undefined}
      onMouseEnter={(event) =>
        setAnchor(event.currentTarget.getBoundingClientRect())
      }
      onMouseLeave={() => setAnchor(undefined)}
      onFocus={(event) =>
        setAnchor(event.currentTarget.getBoundingClientRect())
      }
      onBlur={() => setAnchor(undefined)}
      onClick={(event) =>
        setAnchor(
          anchor ? undefined : event.currentTarget.getBoundingClientRect(),
        )
      }
      onKeyDown={(event) => {
        if (event.key === "Escape") setAnchor(undefined);
      }}
    >
      {children}
      {anchor &&
        createPortal(
          <span
            role="tooltip"
            id={id}
            className="tooltip"
            style={{
              left: Math.max(
                12,
                Math.min(anchor.left, window.innerWidth - 332),
              ),
              top: anchor.bottom + 8,
            }}
          >
            {text}
          </span>,
          document.body,
        )}
    </button>
  );
}
