export default function Logo({ size = 'md', showTagline = false, className = '' }) {
  const sizes = {
    sm: { circle: 'h-10 w-10', text: 'text-lg', tagline: 'text-xs' },
    md: { circle: 'h-16 w-16', text: 'text-2xl', tagline: 'text-sm' },
    lg: { circle: 'h-24 w-24', text: 'text-3xl', tagline: 'text-base' },
    xl: { circle: 'h-32 w-32', text: 'text-4xl', tagline: 'text-lg' },
  }

  const s = sizes[size]

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div
        className={`${s.circle} flex items-center justify-center rounded-full bg-white shadow-lg`}
      >
        <svg viewBox="0 0 64 64" className="h-3/5 w-3/5" fill="none">
          <path
            d="M16 20h14v28H16c-2 0-3-1-3-3V23c0-2 1-3 3-3z"
            fill="#166534"
            opacity="0.9"
          />
          <path
            d="M34 20h14c2 0 3 1 3 3v22c0 2-1 3-3 3H34V20z"
            fill="#22c55e"
          />
          <path
            d="M32 20v28"
            stroke="#14532d"
            strokeWidth="1.5"
          />
          <path
            d="M20 52c4-6 8-8 12-8s8 2 12 8"
            stroke="#16a34a"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M44 14a12 12 0 0 1 0 20M20 14a12 12 0 0 0 0 20"
            stroke="#4ade80"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <span className={`mt-3 font-bold text-prastav-800 ${s.text}`}>Prastav</span>
      {showTagline && (
        <span className={`mt-1 text-gray-500 ${s.tagline}`}>
          Student Book Exchange & Recommendations
        </span>
      )}
    </div>
  )
}
