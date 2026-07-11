export default function Logo({ size = 'md', showTagline = false, className = '' }) {
  const sizes = {
    sm: { imgSize: 40, text: 'text-lg', tagline: 'text-xs' },
    md: { imgSize: 64, text: 'text-2xl', tagline: 'text-sm' },
    lg: { imgSize: 96, text: 'text-3xl', tagline: 'text-base' },
    xl: { imgSize: 128, text: 'text-4xl', tagline: 'text-lg' },
  }

  const s = sizes[size]
  const greenColor = '#1a6b3a'

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Prastav Logo: Open book with circular exchange arrows */}
      <svg
        width={s.imgSize}
        height={s.imgSize}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Book left page */}
        <path
          d="M60 22 C60 22 38 18 22 26 L22 72 C38 64 60 68 60 68 Z"
          fill={greenColor}
          opacity="0.95"
        />
        {/* Book right page */}
        <path
          d="M60 22 C60 22 82 18 98 26 L98 72 C82 64 60 68 60 68 Z"
          fill={greenColor}
          opacity="0.85"
        />
        {/* Book spine highlight */}
        <path
          d="M60 22 L60 68"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Book top left curve */}
        <path
          d="M22 26 C30 18 46 14 60 22"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        {/* Book top right curve */}
        <path
          d="M98 26 C90 18 74 14 60 22"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        {/* Left page vertical border */}
        <path
          d="M22 26 L22 72"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Right page vertical border */}
        <path
          d="M98 26 L98 72"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Page bottom area fills (v-shape at bottom) */}
        <path
          d="M22 72 C38 64 60 68 60 68 L60 75 C46 73 34 77 22 72 Z"
          fill={greenColor}
        />
        <path
          d="M98 72 C82 64 60 68 60 68 L60 75 C74 73 86 77 98 72 Z"
          fill={greenColor}
        />

        {/* Circular exchange arrows */}
        {/* Left arrow - going counterclockwise at bottom */}
        <path
          d="M30 88 Q20 82 22 72"
          stroke={greenColor}
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
        {/* Left arrowhead */}
        <polygon
          points="30,84 26,92 34,92"
          fill={greenColor}
          transform="rotate(-30, 30, 88)"
        />

        {/* Right arrow - going clockwise at bottom */}
        <path
          d="M90 88 Q100 82 98 72"
          stroke={greenColor}
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
        {/* Right arrowhead */}
        <polygon
          points="90,84 86,92 94,92"
          fill={greenColor}
          transform="rotate(30, 90, 88)"
        />

        {/* Bottom arc connecting both arrows */}
        <path
          d="M30 92 Q60 104 90 92"
          stroke={greenColor}
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />

        {/* Top arc at front - circular arrow going over the book base */}
        <path
          d="M28 76 Q60 86 92 76"
          stroke={greenColor}
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.7"
        />
      </svg>
      <span className={`mt-2 font-bold ${s.text}`} style={{ color: greenColor }}>Prastav</span>
      {showTagline && (
        <span className={`mt-1 text-gray-500 ${s.tagline}`}>
          Student Book Exchange &amp; Recommendations
        </span>
      )}
    </div>
  )
}
