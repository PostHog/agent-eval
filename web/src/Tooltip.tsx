import {
  Tooltip as QuillTooltip,
  TooltipContent,
  TooltipTrigger,
} from "@posthog/quill";
import type { ReactNode } from "react";

export function Tooltip({
  text,
  children,
}: {
  text: string;
  children: ReactNode;
}) {
  return (
    <QuillTooltip>
      <TooltipTrigger className="tooltip-trigger" aria-label={text}>
        {children}
      </TooltipTrigger>
      <TooltipContent>{text}</TooltipContent>
    </QuillTooltip>
  );
}
