/** Lightweight inline SVG (no network request) standing in for a hero photo. Swap for a licensed image later. */
export function HeroIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 520 460" role="img" aria-label="Phone showing matched loan offers" className={className}>
      <defs>
        <linearGradient id="hero-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e9f0ff" />
          <stop offset="1" stopColor="#f3fbf6" />
        </linearGradient>
        <linearGradient id="hero-phone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#14213d" />
          <stop offset="1" stopColor="#0b1530" />
        </linearGradient>
        <filter id="hero-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="12" stdDeviation="14" floodColor="#0b40b8" floodOpacity="0.16" />
        </filter>
      </defs>
      <circle cx="285" cy="230" r="205" fill="url(#hero-bg)" />
      <circle cx="455" cy="85" r="26" fill="#1f9d55" opacity="0.12" />
      <circle cx="95" cy="380" r="18" fill="#0b40b8" opacity="0.1" />

      {/* Phone */}
      <g filter="url(#hero-shadow)">
        <rect x="190" y="40" width="190" height="380" rx="32" fill="url(#hero-phone)" />
        <rect x="201" y="52" width="168" height="356" rx="24" fill="#ffffff" />
        <rect x="258" y="60" width="54" height="8" rx="4" fill="#14213d" />
      </g>
      <g fontFamily="inherit">
        <text x="216" y="100" fontSize="11" fill="#5b6478">Matched lenders</text>
        <text x="216" y="120" fontSize="14" fontWeight="700" fill="#0f2d6b">₹1,00,000 · 24 mo</text>
        {[0, 1, 2].map((i) => (
          <g key={i} transform={`translate(214 ${140 + i * 74})`}>
            <rect width="142" height="62" rx="12" fill={i === 0 ? '#eef3fd' : '#f8fafc'} stroke="#e3e8f2" />
            <rect x="10" y="12" width="30" height="30" rx="8" fill={['#0b40b8', '#1f9d55', '#7c3aed'][i]} opacity="0.9" />
            <rect x="48" y="15" width="60" height="8" rx="4" fill="#0f2d6b" opacity="0.85" />
            <rect x="48" y="30" width="78" height="6" rx="3" fill="#94a3b8" opacity="0.6" />
            <rect x="48" y="42" width="44" height="6" rx="3" fill="#94a3b8" opacity="0.45" />
            {i === 0 && <circle cx="128" cy="14" r="5" fill="#1f9d55" />}
          </g>
        ))}
        <rect x="214" y="364" width="142" height="30" rx="10" fill="#0b40b8" />
        <rect x="248" y="376" width="74" height="6" rx="3" fill="#ffffff" opacity="0.9" />
      </g>

      {/* Approved badge */}
      <g transform="translate(372 150)" filter="url(#hero-shadow)">
        <rect width="128" height="56" rx="14" fill="#ffffff" />
        <circle cx="28" cy="28" r="14" fill="#1f9d55" />
        <path d="M21 28.5l5 5 9-10" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="50" y="18" width="58" height="8" rx="4" fill="#0f2d6b" opacity="0.85" />
        <rect x="50" y="32" width="40" height="6" rx="3" fill="#94a3b8" opacity="0.6" />
      </g>

      {/* Shield */}
      <g transform="translate(92 120)" filter="url(#hero-shadow)">
        <rect width="86" height="86" rx="20" fill="#ffffff" />
        <path d="M43 18l22 8v16c0 14-9.5 24-22 28-12.5-4-22-14-22-28V26z" fill="#0b40b8" opacity="0.92" />
        <path d="M34 44l6.5 6.5L53 38" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* Rupee coin */}
      <g transform="translate(118 278)" filter="url(#hero-shadow)">
        <circle cx="34" cy="34" r="34" fill="#ffffff" />
        <circle cx="34" cy="34" r="25" fill="#e8f7ee" />
        <text x="34" y="44" textAnchor="middle" fontSize="28" fontWeight="800" fill="#1f9d55">₹</text>
      </g>
    </svg>
  )
}
