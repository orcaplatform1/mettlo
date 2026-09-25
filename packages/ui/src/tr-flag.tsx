/** Türkiye bayrağı (satır içi SVG; görsel dosyası gerektirmez). */
export function TrFlag({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={(size * 2) / 3} viewBox="0 0 30 20" role="img" aria-label="Türkiye bayrağı" style={{ borderRadius: 3, flexShrink: 0, display: 'block' }}>
      <rect width="30" height="20" fill="#E30A17" />
      <circle cx="11.2" cy="10" r="5" fill="#fff" />
      <circle cx="12.6" cy="10" r="4" fill="#E30A17" />
      <polygon fill="#fff" points="16.6,10 19.6,9 17.8,11.5 17.8,8.5 19.6,11" />
    </svg>
  );
}
