'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

function maskIban(raw: string) {
  const clean = raw.replace(/\s/g, '').toUpperCase();
  if (clean.length < 8) return clean;
  return `${clean.slice(0, 4)} ${'**** '.repeat(3).trim()} ${clean.slice(-4)}`;
}

export function AddBankAccountForm() {
  const router = useRouter();
  const [iban, setIban] = useState('');
  const [holder, setHolder] = useState('');
  const [bank, setBank] = useState('');
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();

  function handleIbanChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/[^TR0-9 ]/gi, '').toUpperCase();
    setIban(raw);
    const clean = raw.replace(/\s/g, '');
    setPreview(clean.length >= 8 ? maskIban(clean) : '');
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const clean = iban.replace(/\s/g, '').toUpperCase();
    if (!/^TR\d{24}$/.test(clean)) { setError('Geçersiz IBAN. TR ile başlayan 26 karakterli (TR + 24 hane) IBAN girin.'); return; }
    if (!holder.trim()) { setError('Hesap sahibi adı zorunludur.'); return; }
    setError('');
    startTransition(async () => {
      try {
        const res = await fetch('/api/payout-accounts', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ iban: clean, accountHolderName: holder.trim(), bankName: bank.trim() || undefined }),
        });
        const d = await res.json().catch(() => ({}));
        if (!res.ok) { setError(d.message || 'Hesap eklenemedi.'); return; }
        router.push('/app/earnings');
      } catch {
        setError('Bağlantı hatası. Lütfen tekrar deneyin.');
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="stack" style={{ ['--stack' as string]: '14px' }}>
      <div className="field">
        <label htmlFor="iban">IBAN <span className="text-secondary">(TR ile başlayan 26 karakter)</span></label>
        <input
          id="iban"
          className="input"
          placeholder="TR00 0000 0000 0000 0000 0000 00"
          value={iban}
          onChange={handleIbanChange}
          autoComplete="off"
          spellCheck={false}
          maxLength={33}
          required
        />
        {preview && <p className="field-hint">Maskelenmiş: <strong>{preview}</strong></p>}
      </div>
      <div className="field">
        <label htmlFor="holder">Hesap Sahibi Adı Soyadı <span className="text-secondary">(tam isim)</span></label>
        <input id="holder" className="input" value={holder} onChange={e => setHolder(e.target.value)} maxLength={80} required placeholder="Ad Soyad" />
      </div>
      <div className="field">
        <label htmlFor="bank">Banka Adı <span className="text-secondary">(isteğe bağlı)</span></label>
        <input id="bank" className="input" value={bank} onChange={e => setBank(e.target.value)} maxLength={60} placeholder="Örn. Ziraat Bankası" />
      </div>
      {error && <p className="field-error" role="alert">{error}</p>}
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? 'Kaydediliyor...' : 'Hesabı Kaydet'}
      </button>
    </form>
  );
}
