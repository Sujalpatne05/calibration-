/**
 * SancLogo — New SANC gear/gauge mark matching the updated design.
 * Features prominent blue gear teeth, white dial face, red banner, and scale indicators.
 */
export default function SancLogo({ size = 72, className = '' }) {
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
        <linearGradient id="gear-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1E90FF" />
          <stop offset="50%" stopColor="#0066CC" />
          <stop offset="100%" stopColor="#003D7A" />
        </linearGradient>
        <radialGradient id="dial-gradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F0F0F0" />
        </radialGradient>
      </defs>

      {/* Outer gear teeth - 12 prominent teeth */}
      <g id="teeth">
        {/* Top */}
        <polygon points="100,8 110,28 90,28" fill="url(#gear-gradient)" />
        {/* Top-Right 1 */}
        <polygon points="143,29 158,44 145,55" fill="url(#gear-gradient)" />
        {/* Top-Right 2 */}
        <polygon points="172,58 187,73 172,85" fill="url(#gear-gradient)" />
        {/* Right */}
        <polygon points="192,100 172,110 172,90" fill="url(#gear-gradient)" />
        {/* Bottom-Right 2 */}
        <polygon points="172,115 187,127 172,142" fill="url(#gear-gradient)" />
        {/* Bottom-Right 1 */}
        <polygon points="158,156 143,171 145,145" fill="url(#gear-gradient)" />
        {/* Bottom */}
        <polygon points="100,192 90,172 110,172" fill="url(#gear-gradient)" />
        {/* Bottom-Left 1 */}
        <polygon points="42,171 57,156 55,145" fill="url(#gear-gradient)" />
        {/* Bottom-Left 2 */}
        <polygon points="13,127 28,115 13,142" fill="url(#gear-gradient)" />
        {/* Left */}
        <polygon points="8,100 28,90 28,110" fill="url(#gear-gradient)" />
        {/* Top-Left 2 */}
        <polygon points="13,73 28,58 13,85" fill="url(#gear-gradient)" />
        {/* Top-Left 1 */}
        <polygon points="57,44 42,29 55,55" fill="url(#gear-gradient)" />
      </g>

      {/* Outer blue ring */}
      <circle cx="100" cy="100" r="88" fill="url(#gear-gradient)" />

      {/* White dial face */}
      <circle cx="100" cy="100" r="72" fill="url(#dial-gradient)" />
      <circle cx="100" cy="100" r="72" fill="none" stroke="#FFFFFF" strokeWidth="3" />

      {/* Blue clock marks on top half */}
      <g stroke="#1E90FF" strokeWidth="2.5" strokeLinecap="round">
        {/* 12 o'clock */}
        <line x1="100" y1="32" x2="100" y2="42" />
        {/* 1 o'clock area */}
        <line x1="125" y1="36" x2="120" y2="45" />
        {/* 2 o'clock area */}
        <line x1="145" y1="47" x2="137" y2="54" />
        {/* 3 o'clock */}
        <line x1="168" y1="100" x2="158" y2="100" />
        {/* 4 o'clock area */}
        <line x1="145" y1="153" x2="137" y2="146" />
        {/* 5 o'clock area */}
        <line x1="125" y1="164" x2="120" y2="155" />
      </g>

      {/* Red banner background */}
      <rect x="35" y="88" width="130" height="36" rx="5" fill="#E11D2A" />

      {/* White text "SANC" */}
      <text
        x="100"
        y="115"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="bold"
        fontSize="28"
        letterSpacing="3"
        fill="#FFFFFF"
      >
        SANC
      </text>

      {/* Dark blue bottom section with scale marks */}
      <ellipse cx="100" cy="135" rx="68" ry="20" fill="#003D7A" opacity="0.9" />

      {/* White scale marks on dark section */}
      <g stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round">
        <line x1="48" y1="132" x2="48" y2="138" />
        <line x1="61" y1="132" x2="61" y2="138" />
        <line x1="74" y1="132" x2="74" y2="138" />
        <line x1="87" y1="132" x2="87" y2="138" />
        <line x1="100" y1="132" x2="100" y2="138" />
        <line x1="113" y1="132" x2="113" y2="138" />
        <line x1="126" y1="132" x2="126" y2="138" />
        <line x1="139" y1="132" x2="139" y2="138" />
        <line x1="152" y1="132" x2="152" y2="138" />
      </g>

      {/* Gauge needle - blue */}
      <line x1="100" y1="100" x2="138" y2="62" stroke="#1E90FF" strokeWidth="3" strokeLinecap="round" />
      
      {/* Needle hub - dark blue center */}
      <circle cx="100" cy="100" r="8" fill="#003D7A" />
      {/* Needle hub - white center dot */}
      <circle cx="100" cy="100" r="4" fill="#FFFFFF" />

      {/* Registered trademark symbol */}
      <text x="175" y="30" fontFamily="Arial" fontSize="12" fontWeight="bold" fill="#666666">
        ®
      </text>
    </svg>
  )
}
