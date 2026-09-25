export default function Loading() {
  return <div className="container section" aria-busy="true" aria-live="polite"><div className="progress" style={{ maxWidth: 240, margin: '0 auto' }}><i style={{ width: '40%', animation: 'pulse 1.2s ease-in-out infinite' }} /></div><span className="sr-only">Yükleniyor</span></div>;
}
