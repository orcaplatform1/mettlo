import { Logo } from './logo';

/** Markalı 404 (her uygulamanın kök not-found.tsx dosyası kullanır). Düz <a> ile basePath'ten bağımsız. */
export function NotFoundView() {
  return (
    <main style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: 24, textAlign: 'center', background: 'var(--color-bg)' }}>
      <div style={{ maxWidth: 480 }}>
        <a href="/" aria-label="Mettlo ana sayfa" style={{ display: 'inline-block', marginBottom: 28 }}><Logo /></a>
        <p className="overline text-coral">404</p>
        <h1 className="h2" style={{ margin: '8px 0 12px' }}>Sayfa bulunamadı</h1>
        <p className="text-secondary" style={{ marginBottom: 24 }}>Aradığın sayfa taşınmış, kaldırılmış ya da bu sayfaya erişim yetkin yok.</p>
        <div className="row" style={{ justifyContent: 'center' }}><a href="/" className="btn btn-primary btn-pill">Ana Sayfa</a><a href="/explore" className="btn btn-secondary btn-pill">Keşfet</a></div>
      </div>
    </main>
  );
}
