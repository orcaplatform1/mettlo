import type { CSSProperties } from 'react';

/** METTLO işareti + harf aralıklı wordmark. Dosyalar: /logo-128.png (şeffaf arka planlı işaret) */
export function Logo({ size = 34, showWordmark = true, style }: { size?: number; showWordmark?: boolean; style?: CSSProperties }) {
  return (
    <span className="brand" style={style}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-128.png" alt={showWordmark ? '' : 'Mettlo'} width={size} height={size} style={{ width: size, height: size }} />
      {showWordmark && <span aria-label="Mettlo">METTLO</span>}
    </span>
  );
}
