'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { BookOpen, Check, CheckCircle, CreditCard, Loader, X } from 'lucide-react';

interface Props {
  event: { id: string; title: string; ticketPriceKurus: number; slug: string };
  initCheckout: () => Promise<{ checkoutFormContent?: string; paymentId?: string; error?: string }>;
}

function DsaGate({ onAccepted }: { onAccepted: () => void }) {
  const [accepted, setAccepted] = useState(false);
  const [open, setOpen] = useState(false);
  const [atEnd, setAtEnd] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);

  const check = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10) setAtEnd(true);
  }, []);

  if (accepted) {
    return (
      <div className="row" style={{ gap: '6px', color: 'var(--success)', fontSize: '13px', marginBottom: '8px' }}>
        <Check size={15} aria-hidden /> Mesafeli Satış Sözleşmesi okundu ve kabul edildi.
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}
        onClick={() => setOpen(true)}
      >
        <BookOpen size={14} aria-hidden /> Mesafeli Satış Sözleşmesini oku
      </button>
      {open && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--card-bg, #fff)', borderRadius: '16px', width: '100%', maxWidth: '560px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="h5" style={{ margin: 0 }}>Mesafeli Satış Sözleşmesi</h3>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} aria-hidden /></button>
            </div>
            <div ref={scroller} onScroll={check} style={{ overflowY: 'auto', padding: '24px', flex: 1, fontSize: '13px', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
              <p>Bu mesafeli satış sözleşmesi ("Sözleşme"), <strong>Mettlo Dijital Hizmetler A.Ş.</strong> ile etkinlik biletini satın alan tüketici ("Alıcı") arasında akdedilmiştir. Bilet satışı Mettlo platformu üzerinden gerçekleştirilmekte olup, Mettlo doğrudan satıcı sıfatıyla işlem yapmaktadır.</p>
              <p style={{ marginTop: '12px' }}><strong>1. Konu:</strong> Sözleşme konusu, Alıcı'nın Mettlo platformu üzerinden satın aldığı etkinlik biletine ilişkin hak ve yükümlülükleri düzenlemektedir.</p>
              <p style={{ marginTop: '12px' }}><strong>2. Cayma Hakkı:</strong> 6502 sayılı Kanun uyarınca elektronik ortamda sunulan etkinlik biletleri için, etkinlik tarihinden en az 48 saat önce iptal talebinde bulunulması halinde ücretin tamamı iade edilir. Etkinlik tarihine 48 saatten az süre kalmışsa iade yapılmaz.</p>
              <p style={{ marginTop: '12px' }}><strong>3. Teslimat:</strong> Bilet, ödeme onayı ardından kayıtlı e-posta adresinize ve Mettlo hesabınıza dijital olarak iletilir.</p>
              <p style={{ marginTop: '12px' }}><strong>4. Ödeme:</strong> Ödeme, 256-bit SSL şifrelemesi ile güvence altına alınmış Iyzico altyapısı üzerinden gerçekleştirilir. Kart bilgileriniz Mettlo sunucularında saklanmaz.</p>
              <p style={{ marginTop: '12px' }}><strong>5. Kişisel Veri:</strong> Ödeme sürecinde işlenen kişisel veriler KVKK kapsamında korunmakta olup Gizlilik Politikamız'da açıklanmaktadır.</p>
              <p style={{ marginTop: '12px' }}>Sipariş tamamlandığında bu sözleşmeyi kabul etmiş sayılırsınız.</p>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)' }}>
              <button
                className="btn btn-primary"
                style={{ width: '100%' }}
                disabled={!atEnd}
                onClick={() => { setAccepted(true); setOpen(false); onAccepted(); }}
              >
                {atEnd ? 'Okudum, Kabul Ediyorum' : 'Lütfen sona kadar okuyun…'}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

export function EventCheckoutClient({ event, initCheckout }: Props) {
  const iframeRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<'consent' | 'loading' | 'form' | 'success' | 'error'>('consent');
  const [error, setError] = useState('');
  const [dsaAccepted, setDsaAccepted] = useState(false);

  const startPayment = useCallback(async () => {
    if (!dsaAccepted) return;
    setStep('loading');
    const result = await initCheckout();
    if (result.error) { setError(result.error); setStep('error'); return; }
    if (!result.checkoutFormContent) {
      setError('Ödeme formu yüklenemedi. Lütfen tekrar deneyin.');
      setStep('error');
      return;
    }
    setStep('form');
    setTimeout(() => {
      if (!iframeRef.current) return;
      iframeRef.current.innerHTML = result.checkoutFormContent!;
      const scripts = iframeRef.current.querySelectorAll('script');
      scripts.forEach((s) => {
        const ns = document.createElement('script');
        if (s.src) ns.src = s.src; else ns.textContent = s.textContent;
        document.body.appendChild(ns);
      });
    }, 0);
  }, [dsaAccepted, initCheckout]);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.status === 'success') setStep('success');
      if (e.data?.status === 'failure') { setError('Ödeme başarısız.'); setStep('error'); }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  if (step === 'success') {
    return (
      <div style={{ padding: '32px', textAlign: 'center' }}>
        <CheckCircle size={48} color="var(--success)" style={{ margin: '0 auto 16px' }} aria-hidden />
        <h2 className="h3">Biletiniz onaylandı!</h2>
        <p className="body-sm text-secondary" style={{ marginTop: '8px' }}>
          Bilet bilgileri e-posta adresinize gönderildi. İyi eğlenceler!
        </p>
        <a href={`/events/${event.slug}`} className="btn btn-primary" style={{ marginTop: '20px', display: 'inline-block' }}>
          Etkinliğe Dön
        </a>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <p style={{ color: 'var(--error)', marginBottom: '16px' }}>{error}</p>
        <button className="btn btn-secondary" onClick={() => { setStep('consent'); setError(''); }}>Tekrar Dene</button>
      </div>
    );
  }

  if (step === 'form') {
    return (
      <div>
        <p className="body-sm text-secondary" style={{ marginBottom: '12px' }}>
          Güvenli ödeme formu aşağıda yüklendi.
        </p>
        <div ref={iframeRef} />
      </div>
    );
  }

  if (step === 'loading') {
    return (
      <div style={{ padding: '32px', textAlign: 'center' }}>
        <Loader size={32} style={{ margin: '0 auto 12px', animation: 'spin 1s linear infinite' }} aria-hidden />
        <p className="body-sm text-secondary">Ödeme formu hazırlanıyor…</p>
      </div>
    );
  }

  return (
    <div className="stack" style={{ ['--stack' as string]: '16px' }}>
      <DsaGate onAccepted={() => setDsaAccepted(true)} />
      <button
        className="btn btn-primary"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '14px', fontSize: '15px', fontWeight: 600 }}
        disabled={!dsaAccepted}
        onClick={startPayment}
      >
        <CreditCard size={18} aria-hidden />
        Ödemeye Geç
      </button>
      {!dsaAccepted && (
        <p className="caption text-secondary" style={{ textAlign: 'center' }}>
          Devam etmek için lütfen Mesafeli Satış Sözleşmesi'ni okuyun ve kabul edin.
        </p>
      )}
    </div>
  );
}
