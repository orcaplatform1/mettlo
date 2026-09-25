/** Çevrimiçi (yeşil) / çevrimdışı (kırmızı) göstergesi. `status` null ise (gizli) hiçbir şey çizilmez. */
export function OnlineDot({ status, label = true, size = 10 }: { status: 'online' | 'offline' | null | undefined; label?: boolean; size?: number }) {
  if (!status) return null;
  const on = status === 'online';
  return (
    <span className={`online-dot ${on ? 'is-on' : 'is-off'}`} title={on ? 'Çevrimiçi' : 'Çevrimdışı'}>
      <i style={{ width: size, height: size }} aria-hidden />
      {label ? <span>{on ? 'Çevrimiçi' : 'Çevrimdışı'}</span> : <span className="sr-only">{on ? 'Çevrimiçi' : 'Çevrimdışı'}</span>}
    </span>
  );
}
