import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const shared = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function CartIcon(props: IconProps) {
  return (
    <svg {...shared} {...props}>
      <title>Cart</title>
      <path d="M4 5h2l1.5 9h9l2-6H7" />
      <circle cx="9" cy="18" r="1" />
      <circle cx="17" cy="18" r="1" />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg {...shared} {...props}>
      <title>Search</title>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...shared} {...props}>
      <title>Close</title>
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

export function ArrowIcon(props: IconProps) {
  return (
    <svg {...shared} {...props}>
      <title>Continue</title>
      <path d="M5 12h14M14 7l5 5-5 5" />
    </svg>
  );
}
