'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  eventId: string;
  slug: string;
  isFree: boolean;
  priceKurus: number;
}

export function EventRegisterButton({ eventId, slug, isFree, priceKurus }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const router = useRouter();

  const fmtTL = (k: number) =>
    new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 }).format(k / 100);

  const handleRegister = async () => {
    if (!isFree) {
      router.push(`/checkout/event/${slug}`);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/events/${eventId}/register`, { method: 'POST' });
      if (res.status === 401) {
        router.push(`/login?next=/events`);
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.message || 'Kayıt başarısız.');
        return;
      }
      setDone(true);
    } catch {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div style={{ padding: '14px 20px', background: 'var(--success-light, #d1fae5)', borderRadius: '10px', textAlign: 'center', color: '#065f46', fontSize: '14px', fontWeight: 500 }}>
        Kaydınız alındı! Etkinliğe başarıyla kaydoldunuz.
      </div>
    );
  }

  return (
    <div>
      {error && <p style={{ color: 'var(--danger)', fontSize: '13px', marginBottom: '8px' }}>{error}</p>}
      <button
        onClick={handleRegister}
        disabled={loading}
        className="btn btn-primary"
        style={{ width: '100%', padding: '14px', fontSize: '15px', fontWeight: 600 }}
      >
        {loading ? 'İşleniyor…' : isFree ? 'Ücretsiz Kayıt Ol' : `Bilet Al — ${fmtTL(priceKurus)}`}
      </button>
      {!isFree && (
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px', textAlign: 'center' }}>
          Ödeme sayfasına yönlendirileceksiniz.
        </p>
      )}
    </div>
  );
}
