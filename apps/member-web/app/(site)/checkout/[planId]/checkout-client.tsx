'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, BookOpen, Check, CheckCircle, CreditCard, Loader, X } from 'lucide-react';
import { DsaContent } from './dsa-content';

interface Plan {
  id: string;
  name: string;
  priceWeb: string;
  interval: string;
  description?: string;
  features?: unknown;
  isPremiumLive?: boolean;
  creator: { username: string; displayName?: string; verified?: boolean };
}

interface Props {
  plan: Plan;
  initCheckout: () => Promise<{ checkoutFormContent?: string; paymentId?: string; error?: string }>;
}

/** ConsentGate kopyası: checkout akışına özel (internal state → onAccepted callback) */
function DsaGate({ onAccepted }: { onAccepted: () => void }) {
  const [accepted, setAccepted] = useState(false);
  const [open, setOpen] = useState(false);
  const [atEnd, setAtEnd] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);

  const check = useCallback(() => {
    const el = scroller.current; if (!el) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight <= 6) setAtEnd(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    setAtEnd(false);
    const t = setTimeout(check, 80);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { clearTimeout(t); document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [open, check]);

  const handleAccept = () => { setAccepted(true); setOpen(false); onAccepted(); };

  return (
    <div className="consent-gate">
      <div className="consent-row">
        <span className={`consent-box${accepted ? ' is-on' : ''}`} role="checkbox" aria-checked={accepted} aria-readonly="true" tabIndex={-1}>{accepted && <Check size={14} aria-hidden />}</span>
        <div className="consent-label">
          <span>Mesafeli Satış Sözleşmesi&#39;ni okudum, anladım ve kabul ediyorum. Dijital içeriklere ödeme anında erişim açıldığından cayma hakkımı kullanamayacağımı beyan ederim.</span>
          <button type="button" className="consent-open" onClick={() => setOpen(true)}><BookOpen size={14} aria-hidden /> {accepted ? 'Sözleşmeyi tekrar oku' : 'Sözleşmeyi aç ve oku'}</button>
        </div>
      </div>
      {!accepted && <p className="caption text-tertiary" style={{ marginLeft: 28, marginTop: 4 }}>Sözleşmeyi okuyarak kabul etmeden ödemeye geçemezsiniz.</p>}
      {open && typeof document !== 'undefined' && createPortal(
        <div className="consent-overlay" role="dialog" aria-modal="true" aria-label="Mesafeli Satış Sözleşmesi" onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div className="consent-modal">
            <div className="consent-head"><b>Mesafeli Satış Sözleşmesi</b><button type="button" className="consent-x" onClick={() => setOpen(false)} aria-label="Kapat"><X size={18} /></button></div>
            <div className="consent-scroll" ref={scroller} onScroll={check} tabIndex={0}>
              {/* Plan bilgileri DsaContent'e iletilmez burada — prop drilling olmadan genel metin */}
              <div className="legal-body" style={{ fontSize: 14, lineHeight: 1.7 }}>
                <DsaContent />
              </div>
            </div>
            <div className="consent-foot">
              <p className="caption text-tertiary">{atEnd ? 'Metnin sonuna geldin.' : 'Düğmenin aktifleşmesi için metni en alta kadar kaydır.'}</p>
              <button type="button" className="btn btn-primary btn-pill" disabled={!atEnd} onClick={handleAccept}>Okudum, anladım, kabul ediyorum</button>
            </div>
          </div>
        </div>, document.body)}
    </div>
  );
}

export function CheckoutClient({ plan, initCheckout }: Props) {
  const [dsaAccepted, setDsaAccepted] = useState(false);
  const [step, setStep] = useState<'consent' | 'loading' | 'form' | 'error'>('consent');
  const [errorMsg, setErrorMsg] = useState('');
  const formRef = useRef<HTMLDivElement>(null);

  const priceStr = `${Number(plan.priceWeb).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL`;
  const intervalLabel = plan.interval === 'ANNUAL' ? 'yıl' : 'ay';
  const creatorName = plan.creator.displayName ?? `@${plan.creator.username}`;
  const features = Array.isArray(plan.features) ? (plan.features as string[]) : [];

  const handleProceed = async () => {
    if (!dsaAccepted) return;
    setStep('loading');
    try {
      const result = await initCheckout();
      if (result.error || !result.checkoutFormContent) {
        setErrorMsg(result.error ?? 'Ödeme formu alınamadı. Lütfen tekrar deneyin.');
        setStep('error');
        return;
      }
      setStep('form');
      requestAnimationFrame(() => {
        if (!formRef.current) return;
        formRef.current.innerHTML = result.checkoutFormContent!;
        formRef.current.querySelectorAll('script').forEach((old) => {
          const s = document.createElement('script');
          Array.from(old.attributes).forEach((a) => s.setAttribute(a.name, a.value));
          s.textContent = old.textContent;
          old.parentNode?.replaceChild(s, old);
        });
      });
    } catch {
      setErrorMsg('Bağlantı hatası. Lütfen tekrar deneyin.');
      setStep('error');
    }
  };

  return (
    <div className="stack" style={{ ['--stack' as string]: '24px', maxWidth: 560, margin: '0 auto' }}>
      {/* Plan özeti */}
      <div className="card">
        <div className="row between">
          <div>
            <p className="body-sm text-secondary">{creatorName}</p>
            <h2 className="h4">{plan.name}</h2>
            {plan.isPremiumLive && <span className="badge badge-premium" style={{ marginTop: 6 }}>Premium Live</span>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <p className="h3">{priceStr}</p>
            <p className="caption text-tertiary">/ {intervalLabel}</p>
          </div>
        </div>
        {plan.description && <p className="body-sm text-secondary" style={{ marginTop: 10 }}>{plan.description}</p>}
        {features.length > 0 && (
          <ul className="stack" style={{ ['--stack' as string]: '6px', marginTop: 12 }}>
            {features.map((f) => (
              <li key={f} className="row body-sm" style={{ gap: 8 }}><CheckCircle size={14} className="text-ok" aria-hidden />{f}</li>
            ))}
          </ul>
        )}
      </div>

      {/* Adım 1: Sözleşme + devam butonu */}
      {(step === 'consent' || step === 'loading') && (
        <div className="card stack" style={{ ['--stack' as string]: '16px' }}>
          <DsaGate onAccepted={() => setDsaAccepted(true)} />
          <button
            type="button"
            className="btn btn-primary btn-block"
            disabled={!dsaAccepted || step === 'loading'}
            onClick={handleProceed}
          >
            {step === 'loading' ? (
              <span className="row" style={{ gap: 8, justifyContent: 'center' }}><Loader size={16} className="spin" aria-hidden /> Ödeme formu hazırlanıyor…</span>
            ) : (
              <span className="row" style={{ gap: 8, justifyContent: 'center' }}><CreditCard size={16} aria-hidden /> Ödemeye geç — {priceStr} / {intervalLabel}</span>
            )}
          </button>
        </div>
      )}

      {/* Adım 2: iyzico form */}
      {step === 'form' && (
        <div className="card">
          <h3 className="h5" style={{ marginBottom: 8 }}>Ödeme bilgilerini gir</h3>
          <p className="caption text-tertiary" style={{ marginBottom: 16 }}>Kart bilgileriniz Mettlo&#39;ya iletilmez; güvenli iyzico altyapısı üzerinden şifreli olarak işlenir.</p>
          <div id="iyzipay-checkout-form" className="responsive" ref={formRef} style={{ minHeight: 400 }} />
        </div>
      )}

      {/* Hata */}
      {step === 'error' && (
        <div className="card stack" style={{ ['--stack' as string]: '12px' }}>
          <div className="row" style={{ gap: 10, color: 'var(--red, #e53e3e)' }}><AlertCircle size={20} aria-hidden /><b>Ödeme başlatılamadı</b></div>
          <p className="body-sm text-secondary">{errorMsg}</p>
          <button type="button" className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => { setStep('consent'); setErrorMsg(''); }}>Tekrar dene</button>
        </div>
      )}

      <p className="caption text-tertiary" style={{ textAlign: 'center' }}>
        <a href="/distance-sales-agreement" className="text-coral">Mesafeli Satış Sözleşmesi</a> · <a href="/terms" className="text-coral">Kullanım Koşulları</a> · <a href="/privacy" className="text-coral">Gizlilik Politikası</a>
      </p>
    </div>
  );
}
