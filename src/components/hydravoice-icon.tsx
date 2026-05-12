'use client'

import React from 'react'

interface HydravoiceIconProps {
  className?: string
  size?: number
}

export function HydravoiceIcon({ className = '', size = 32 }: HydravoiceIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="hydravoice-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2dd4bf" />
          <stop offset="50%" stopColor="#14b8a6" />
          <stop offset="100%" stopColor="#0d9488" />
        </linearGradient>
        <linearGradient id="hydravoice-wave" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#5eead4" />
          <stop offset="100%" stopColor="#0d9488" />
        </linearGradient>
      </defs>
      {/* Outer circle background */}
      <circle cx="20" cy="20" r="19" fill="oklch(0.17 0.015 170)" stroke="url(#hydravoice-grad)" strokeWidth="1.5" />
      {/* Sound wave bars */}
      <rect x="8" y="14" width="2.5" height="12" rx="1.25" fill="url(#hydravoice-wave)" opacity="0.6" />
      <rect x="12.5" y="10" width="2.5" height="20" rx="1.25" fill="url(#hydravoice-wave)" opacity="0.8" />
      <rect x="17" y="7" width="2.5" height="26" rx="1.25" fill="url(#hydravoice-grad)" />
      <rect x="21.5" y="11" width="2.5" height="18" rx="1.25" fill="url(#hydravoice-wave)" opacity="0.9" />
      <rect x="26" y="13" width="2.5" height="14" rx="1.25" fill="url(#hydravoice-wave)" opacity="0.7" />
      <rect x="30.5" y="15" width="2.5" height="10" rx="1.25" fill="url(#hydravoice-wave)" opacity="0.5" />
    </svg>
  )
}
