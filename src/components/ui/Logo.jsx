export default function Logo({ size = 'md', showTagline = false, className = '' }) {
  const sizes = {
    sm: { imgSize: 44, text: 'text-base', tagline: 'text-xs' },
    md: { imgSize: 64, text: 'text-xl', tagline: 'text-xs' },
    lg: { imgSize: 96, text: 'text-2xl', tagline: 'text-sm' },
    xl: { imgSize: 130, text: 'text-4xl', tagline: 'text-base' },
  }

  const s = sizes[size]
  const G = '#1a6b3a' // brand dark green

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/*
        SVG reproduces the uploaded Prastav logo:
        – Open book (two pages, white interior, green fill/outline)
        – Circular exchange arrows below the book
      */}
      <svg
        width={s.imgSize}
        height={s.imgSize}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* ── LEFT PAGE ── */}
        <path
          d="M100 40 C85 35 60 32 35 42 L35 118 C60 108 85 112 100 118 Z"
          fill={G}
        />
        {/* left page white interior */}
        <path
          d="M100 50 C86 45 63 43 40 52 L40 112 C63 103 86 107 100 112 Z"
          fill="white"
          opacity="0.25"
        />

        {/* ── RIGHT PAGE ── */}
        <path
          d="M100 40 C115 35 140 32 165 42 L165 118 C140 108 115 112 100 118 Z"
          fill={G}
        />
        {/* right page white interior */}
        <path
          d="M100 50 C114 45 137 43 160 52 L160 112 C137 103 114 107 100 112 Z"
          fill="white"
          opacity="0.15"
        />

        {/* ── SPINE ── */}
        <line x1="100" y1="40" x2="100" y2="118" stroke="white" strokeWidth="3" strokeLinecap="round" />

        {/* ── BOOK OUTLINE (top curves + sides) ── */}
        {/* top-left curve */}
        <path d="M35 42 C55 28 80 26 100 40" stroke="white" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        {/* top-right curve */}
        <path d="M165 42 C145 28 120 26 100 40" stroke="white" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        {/* left outer edge */}
        <path d="M35 42 L35 118" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        {/* right outer edge */}
        <path d="M165 42 L165 118" stroke="white" strokeWidth="2.5" strokeLinecap="round" />

        {/* ── CIRCULAR EXCHANGE ARROWS ── */}
        {/*
          Two arcs that together form a wide ellipse around the book base,
          each capped with an arrowhead — mimicking the recycle/swap symbol.
        */}

        {/* Top arc (left-to-right, above centre) */}
        <path
          d="M55 128 Q100 108 145 128"
          stroke={G}
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />
        {/* Arrowhead on right end of top arc → pointing right-down */}
        <polygon
          points="145,118 155,130 140,138"
          fill={G}
        />

        {/* Bottom arc (right-to-left, below centre) */}
        <path
          d="M145 140 Q100 162 55 140"
          stroke={G}
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />
        {/* Arrowhead on left end of bottom arc → pointing left-up */}
        <polygon
          points="55,150 45,138 60,130"
          fill={G}
        />
      </svg>

      <span
        className={`mt-2 font-extrabold tracking-tight ${s.text}`}
        style={{ color: G, fontFamily: 'inherit' }}
      >
        Prastav
      </span>

      {showTagline && (
        <span className={`mt-0.5 text-center text-gray-500 ${s.tagline}`}>
          Student Book Exchange &amp; Recommendations
        </span>
      )}
    </div>
  )
}
