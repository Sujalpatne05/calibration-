/**
 * SancLogo — Uses the official SANC logo PNG image
 * Displays the actual logo file from public folder
 */
export default function SancLogo({ size = 72, className = '' }) {
  return (
    <img
      src="/SANC_LOGO_-_Black.png"
      alt="SANC logo"
      width={size}
      height={size}
      className={className}
      style={{
        objectFit: 'contain'
      }}
    />
  );
}
