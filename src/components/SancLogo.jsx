export default function SancLogo({ size = 72, className = '' }) {
  return (
    <img
      src="/SANC_LOGO_-_Black.png"
      alt="SANC"
      width={size}
      height={size}
      className={className}
      style={{ objectFit: 'contain' }}
    />
  )
}
