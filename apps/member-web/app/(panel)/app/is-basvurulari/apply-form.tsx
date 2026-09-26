'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function ApplyJobForm({ jobId }: { jobId: string }) {
  const [coverLetter, setCoverLetter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/job-applications/${jobId}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ coverLetter: coverLetter.trim() || undefined }),
      });
      if (res.status === 401) { router.push('/login?next=/app/is-basvurulari'); return; }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.message || 'Başvuru gönderilemedi.');
        return;
      }
      setDone(true);
      router.replace('/app/is-basvurulari');
    } catch {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div style={{ padding: '16px 20px', background: 'var(--success-light, #d1fae5)', borderRadius: '10px', color: '#065f46', fontSize: '14px' }}>
        Başvurunuz başarıyla gönderildi!
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ background: 'var(--surface-2)', borderRadius: '12px', padding: '20px', border: '1px solid var(--border)' }}>
      <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>İlan Başvurusu</h3>
      {error && <p style={{ color: 'var(--danger)', fontSize: '13px', marginBottom: '10px' }}>{error}</p>}
      <label style={{ fontSize: '13px', display: 'block', marginBottom: '6px' }}>Ön yazı (isteğe bağlı)</label>
      <textarea
        value={coverLetter}
        onChange={(e) => setCoverLetter(e.target.value)}
        rows={4}
        style={{ width: '100%', resize: 'vertical', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', fontSize: '14px', fontFamily: 'inherit' }}
        placeholder="Kendinizi tanıtın, neden bu pozisyon için uygun olduğunuzu belirtin…"
      />
      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
        <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: '8px 20px' }}>
          {loading ? 'Gönderiliyor…' : 'Başvur'}
        </button>
        <a href="/app/is-basvurulari" className="btn btn-ghost" style={{ padding: '8px 16px' }}>İptal</a>
      </div>
    </form>
  );
}
