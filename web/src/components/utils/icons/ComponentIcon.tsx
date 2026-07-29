import React from "react";
import { ComponentType } from "../../../typings";

const PATHS: Record<ComponentType, React.ReactNode> = {
  flashlight: (
    <>
      <rect x="8" y="2" width="8" height="5" rx="1" />
      <rect x="9" y="7" width="6" height="14" rx="1" />
    </>
  ),
  muzzle: (
    <>
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
  barrel: (
    <>
      <rect x="4" y="10" width="16" height="4" rx="1" />
      <path d="M4 10v4M20 10v4" />
    </>
  ),
  grip: (
    <>
      <path d="M9 3h6v11a3 3 0 0 1-3 3v0a3 3 0 0 1-3-3z" />
      <path d="M9 7h6M9 10.5h6M9 14h6" />
    </>
  ),
  magazine: <path d="M9 2h6l2 9a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2z" />,
  sight: (
    <>
      <circle cx="12" cy="12" r="7" />
      <path d="M12 5v3M12 16v3M5 12h3M16 12h3" />
    </>
  ),
  skin: (
    <>
      <path d="M12 3l9 5-9 5-9-5z" />
      <path d="M3 13l9 5 9-5" />
    </>
  ),
};

const ComponentIcon: React.FC<{ type: ComponentType }> = ({ type }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {PATHS[type]}
  </svg>
);

export default ComponentIcon;
