/**
 * SancLogo — inline SVG reconstruction of the SANC gear/gauge mark.
 * A blue cog ring surrounds a white dial face with a red needle and a
 * red "SANC" banner across the centre. Scales cleanly at any size.
 *
 * Swap this component out for the official logo asset when available
 * (drop the file into src/assets and replace the <svg> with an <img>).
 */
export default function SancLogo({ size = 72, className = '' }) {
  // 24 gear teeth around the rim
  const teeth = Array.from({ length: 24 }, (_, i) => i)
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className={className}
      role="img"
      aria-label="SANC logo"
    >
      <defs>
        <linearGradient id="sanc-gear" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="55%" stopColor="#1d4ed8" />
          <stop offset="100%" stopColor="#1e3a8a" />
        </linearGradient>
        <radialGradient id="sanc-dial" cx="50%" cy="42%" r="65%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#e8eefc" />
        </radialGradient>
      </defs>

      {/* Gear teeth */}
      <g fill="url(#sanc-gear)">
        {teeth.map((i) => {
          const angle = (i * 360) / teeth.length
          return (
            <rect
              key={i}
              x="94"
              y="2"
              width="12"
              height="26"
              rx="3"
              transform={`rotate(${angle} 100 100)`}
            />
          )
        })}
      </g>

      {/* Gear body */}
      <circle cx="100" cy="100" r="84" fill="url(#sanc-gear)" />
      {/* Inner dial face */}
      <circle cx="100" cy="100" r="62" fill="url(#sanc-dial)" />
      <circle cx="100" cy="100" r="62" fill="none" stroke="#1e3a8a" strokeWidth="3" />

      {/* Dial tick marks (top arc) */}
      <g stroke="#1e3a8a" strokeWidth="2.5" strokeLinecap="round">
        {Array.from({ length: 11 }, (_, i) => {
          const a = (-150 + i * 30) * (Math.PI / 180)
          const r1 = 54
          const r2 = i % 5 === 0 ? 44 : 48
          return (
            <line
              key={i}
              x1={100 + r1 * Math.cos(a)}
              y1={100 + r1 * Math.sin(a)}
              x2={100 + r2 * Math.cos(a)}
              y2={100 + r2 * Math.sin(a)}
            />
          )
        })}
      </g>

      {/* Red SANC banner */}
      <rect x="46" y="88" width="108" height="26" rx="4" fill="#e11d2a" />
      <text
        x="100"
        y="106"
        textAnchor="middle"
        fontFamily="Poppins, system-ui, sans-serif"
        fontWeight="800"
        fontSize="20"
        letterSpacing="2"
        fill="#ffffff"
      >
        SANC
      </text>

      {/* Needle + hub */}
      <line x1="100" y1="100" x2="132" y2="74" stroke="#e11d2a" strokeWidth="4" strokeLinecap="round" />
      <circle cx="100" cy="100" r="6" fill="#1e3a8a" />

      {/* Registered mark */}
      <text x="178" y="34" fontFamily="Poppins" fontSize="12" fill="#1e3a8a">®</text>
    </svg>
  )
}
