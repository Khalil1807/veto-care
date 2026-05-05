import React from "react"

export function BrandLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Dr Paws logo"
    >
      {/* Circle frame */}
      <circle cx="32" cy="32" r="28" stroke="#16A34A" strokeWidth="3" fill="#ECFDF3" />

      {/* Green vet cross in top-right */}
      <rect x="40" y="10" width="12" height="4" rx="1.5" fill="#16A34A" />
      <rect x="44" y="6" width="4" height="12" rx="1.5" fill="#16A34A" />

      {/* Stylised hand/leaf arc */}
      <path
        d="M10 38C13.5 45 19.5 50 28 52.5C34 54.3 40.5 54 46 51"
        stroke="#22C55E"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Cat silhouette (front) */}
      <path
        d="M22 42C22 36.5 22 33 24.5 30.5C25.8 29.2 27.5 28.5 29.5 28.5C31.5 28.5 33.2 29.2 34.5 30.5C37 33 37 36.5 37 42"
        fill="#16A34A"
      />
      <circle cx="26" cy="24" r="4" fill="#16A34A" />

      {/* Dog silhouette (back) */}
      <path
        d="M30 44C30 35 33 29 39 27C42 26 45 26.5 47.5 28.5C49.5 30 50.5 32 51 34.5"
        fill="#22C55E"
      />
      <path
        d="M36 22C38 21 40 21 42 22.5C43.5 23.5 44.5 25 45 26.5"
        stroke="#22C55E"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

