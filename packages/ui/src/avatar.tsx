import { VerifiedBadge } from './verified-badge';

export function Avatar({ name, src, size = 48, className = '', verified = false }: { name: string; src?: string | null; size?: number; className?: string; verified?: boolean }) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toLocaleUpperCase('tr-TR')).join('');
  const style = { width: size, height: size, fontSize: Math.round(size * 0.38) };
  const inner = src
    // eslint-disable-next-line @next/next/no-img-element
    ? <img className={`avatar ${className}`} src={src} alt={name} style={style} loading="lazy" />
    : <span className={`avatar ${className}`} style={style} aria-label={name}>{initials || '?'}</span>;
  if (!verified) return inner;
  // Profil fotoğrafının yanında mavi doğrulama rozeti (Instagram / Meta Verified gibi)
  return <span className="avatar-wrap">{inner}<VerifiedBadge size={Math.max(18, Math.round(size * 0.3))} /></span>;
}
