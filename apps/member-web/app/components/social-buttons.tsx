import Link from 'next/link';

const Google = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden><path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8z" /><path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24z" /><path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8l4-3.1z" /><path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1C6.2 6.9 8.9 4.8 12 4.8z" /></svg>
);
const Apple = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden><path fill="currentColor" d="M16.37 1.43c0 1.14-.42 2.22-1.14 3-.78.86-2.04 1.53-3.09 1.44-.13-1.1.4-2.24 1.1-2.96.78-.84 2.13-1.47 3.13-1.48zM20.9 17.1c-.55 1.26-.82 1.82-1.53 2.93-1 1.55-2.4 3.48-4.14 3.5-1.55.02-1.95-1-4.05-.99-2.1.01-2.54 1.01-4.09.99-1.74-.02-3.07-1.76-4.07-3.3C-.02 15.9-.33 11.06 1.4 8.52c1.23-1.8 3.17-2.86 5-2.86 1.86 0 3.03 1.02 4.57 1.02 1.5 0 2.4-1.02 4.55-1.02 1.63 0 3.36.89 4.6 2.42-4.04 2.22-3.38 8 .78 9.02z" /></svg>
);

/** Üye girişi / kaydı için "Google ile devam et" ve "Apple ile devam et" (koç ve yönetim girişinde gösterilmez). */
export function SocialButtons({ next, label = 'devam et' }: { next?: string; label?: string }) {
  const q = next ? `?next=${encodeURIComponent(next)}` : '';
  return (
    <div className="stack" style={{ ['--stack' as string]: '10px' }}>
      <Link href={`/auth/social/google/start${q}`} prefetch={false} className="btn btn-secondary btn-pill btn-block social-btn"><Google /> Google ile {label}</Link>
      <Link href={`/auth/social/apple/start${q}`} prefetch={false} className="btn btn-secondary btn-pill btn-block social-btn"><Apple /> Apple ile {label}</Link>
      <div className="or-divider"><span>veya kullanıcı adınla</span></div>
    </div>
  );
}
