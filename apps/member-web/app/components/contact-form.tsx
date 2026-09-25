'use client';
import Link from 'next/link';
import { useActionState } from 'react';
import { CheckCircle2, Send } from 'lucide-react';
import { Alert, PhoneInput, Select, noResetSubmit } from '@mettlo/ui';
import { submitContactAction, type FormState } from '@/app/actions/forms';

export const CONTACT_CATEGORIES: Array<[string, string]> = [
  ['general', 'Genel soru'], ['coach', 'Koç olmak / koç hesabı'], ['partnership', 'İş ortaklığı'], ['press', 'Basın ve medya'], ['legal', 'Hukuki / KVKK talebi'], ['other', 'Diğer'],
];
const err = (s: FormState, k: string) => s.fieldErrors?.[k];

export function ContactForm({ initialCategory = 'general' }: { initialCategory?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(submitContactAction, {});
  if (state.ok) {
    return (
      <div className="card card-featured" style={{ textAlign: 'center', padding: 48 }}>
        <CheckCircle2 size={44} className="text-primary-c" aria-hidden style={{ margin: '0 auto 16px' }} />
        <h3 className="h3">Mesajın bize ulaştı</h3>
        <p className="text-secondary" style={{ margin: '10px auto 0', maxWidth: 440 }}>Teşekkürler! Mesajını inceleyip en kısa sürede, genellikle 2 iş günü içinde e-posta ile dönüş yapacağız.</p>
      </div>
    );
  }
  const v = state.values ?? {};
  return (
    <form onSubmit={noResetSubmit(action)} className="card contact-form stack" style={{ ['--stack' as string]: '18px' }} noValidate>
      {state.error && <Alert kind="error">{state.error}</Alert>}
      <div className="grid grid-2">
        <div className="field"><label htmlFor="c-name">Ad soyad</label><input id="c-name" name="name" className="input" autoComplete="name" required minLength={2} maxLength={120} defaultValue={v.name} aria-invalid={!!err(state, 'name')} />{err(state, 'name') && <p className="field-error" role="alert">{err(state, 'name')}</p>}</div>
        <div className="field"><label htmlFor="c-email">E-posta</label><input id="c-email" name="email" type="email" className="input" autoComplete="email" required defaultValue={v.email} aria-invalid={!!err(state, 'email')} />{err(state, 'email') && <p className="field-error" role="alert">{err(state, 'email')}</p>}</div>
      </div>
      <div className="grid grid-2">
        <PhoneInput error={err(state, 'phone')} defaultValue={v.phone} />
        <div className="field"><label htmlFor="c-company">Şirket / kurum <span className="text-tertiary">(isteğe bağlı)</span></label><input id="c-company" name="company" className="input" autoComplete="organization" maxLength={200} defaultValue={v.company} /></div>
      </div>
      <div className="grid grid-2">
        <div className="field"><label htmlFor="c-cat">Kategori</label><Select id="c-cat" name="category" defaultValue={v.category ?? initialCategory}>{CONTACT_CATEGORIES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</Select></div>
        <div className="field"><label htmlFor="c-subject">Konu</label><input id="c-subject" name="subject" className="input" required minLength={2} maxLength={200} defaultValue={v.subject} aria-invalid={!!err(state, 'subject')} />{err(state, 'subject') && <p className="field-error" role="alert">{err(state, 'subject')}</p>}</div>
      </div>
      <div className="field"><label htmlFor="c-msg">Mesajın</label><textarea id="c-msg" name="message" className="textarea" rows={6} required minLength={10} maxLength={4000} defaultValue={v.message} aria-invalid={!!err(state, 'message')} />{err(state, 'message') ? <p className="field-error" role="alert">{err(state, 'message')}</p> : <p className="field-hint">En az 10 karakter. Şifre veya kart bilgisi yazmayın.</p>}</div>
      {/* Bot tuzağı: gerçek kullanıcılar görmez */}
      <div aria-hidden style={{ position: 'absolute', left: -9999, height: 0, overflow: 'hidden' }}><label>Web sitesi<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <label className="check"><input type="checkbox" name="acceptKvkk" required /><span><Link href="/data-protection" target="_blank" className="text-coral">KVKK Aydınlatma Metni</Link>’ni okudum; mesajımın yanıtlanması amacıyla verilerimin işlenmesini kabul ediyorum.</span></label>
      {err(state, 'acceptKvkk') && <p className="field-error" role="alert">{err(state, 'acceptKvkk')}</p>}
      <button className="btn btn-primary btn-pill" style={{ alignSelf: 'flex-start' }} type="submit" disabled={pending}>{pending ? 'Gönderiliyor…' : <>Mesajı Gönder <Send size={16} aria-hidden /></>}</button>
    </form>
  );
}
