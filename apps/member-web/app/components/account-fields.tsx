'use client';
import { useState, useEffect } from 'react';
import { PasswordInput, PhoneInput, DateField } from '@mettlo/ui';
import { ConsentGate } from './consent-gate';

export interface FieldState { fieldErrors?: Record<string, string>; values?: Record<string, string> }
const err = (s: FieldState, k: string) => s.fieldErrors?.[k];

/** Üyelik hesabı alanları (kayıt ve koç başvurusu formlarında ortak). */
export function AccountFields({ state }: { state: FieldState }) {
  const [username, setUsername] = useState(state.values?.username ?? '');
  const today = new Date();
  const maxBirth = new Date(today.getFullYear() - 13, today.getMonth(), today.getDate()).toISOString().slice(0, 10);
  return (
    <>
      <div className="field">
        <label htmlFor="name">Ad Soyad</label>
        <input id="name" name="name" className="input" autoComplete="name" minLength={2} maxLength={80} required defaultValue={state.values?.name} aria-invalid={!!err(state, 'name')} />
        {err(state, 'name') && <p className="field-error" role="alert">{err(state, 'name')}</p>}
      </div>
      <div className="field">
        <label htmlFor="username">Kullanıcı adı</label>
        <input id="username" name="username" className="input" autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false}
          minLength={3} maxLength={30} required value={username} aria-invalid={!!err(state, 'username')}
          onChange={(e) => setUsername(e.currentTarget.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} />
        {err(state, 'username')
          ? <p className="field-error" role="alert">{err(state, 'username')}</p>
          : <p className="field-hint">Profil adresin: <b className="text-secondary">mettlo.tr/profile/{username || 'kullaniciadi'}</b> · Girişte de bunu kullanacaksın. Yalnızca a-z, 0-9 ve _</p>}
      </div>
      <PasswordInput name="password" label="Şifre" autoComplete="new-password" required error={err(state, 'password')} hint="En az 6, en fazla 20 karakter" />
      <PasswordInput name="passwordConfirm" label="Şifre (tekrar)" autoComplete="new-password" required error={err(state, 'passwordConfirm')} />
      <div className="field">
        <label htmlFor="email">E-posta</label>
        <input id="email" name="email" type="email" className="input" autoComplete="email" inputMode="email" required pattern="[^@\s]+@[^@\s]+\.[^@\s]+"
          title="E-posta @ işareti içermeli" defaultValue={state.values?.email} placeholder="ornek@eposta.com" aria-invalid={!!err(state, 'email')} />
        {err(state, 'email') && <p className="field-error" role="alert">{err(state, 'email')}</p>}
      </div>
      <PhoneInput error={err(state, 'phone')} defaultValue={state.values?.phone} />
      <CityDistrictFields state={state} />
      <div className="field">
        <label htmlFor="birthDate">Doğum tarihi</label>
        <DateField id="birthDate" name="birthDate" max={maxBirth} required defaultValue={state.values?.birthDate} aria-invalid={!!err(state, 'birthDate')} />
        {err(state, 'birthDate')
          ? <p className="field-error" role="alert">{err(state, 'birthDate')}</p>
          : <p className="field-hint">Mettlo 18 yaş ve üzeri içindir. 18 yaşından küçükler yalnızca ebeveyn / yasal vasi kaydı ile üye olabilir.</p>}
      </div>
    </>
  );
}

function CityDistrictFields({ state }: { state: FieldState }) {
  const [cities, setCities] = useState<Array<{ id: number; name: string }>>([]);
  const [districts, setDistricts] = useState<Array<{ id: number; name: string }>>([]);
  const [cityId, setCityId] = useState('');

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3301/v1';
    fetch(`${apiBase}/location/cities`).then(r => r.json()).then(setCities).catch(() => {});
  }, []);

  useEffect(() => {
    if (!cityId) { setDistricts([]); return; }
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3301/v1';
    fetch(`${apiBase}/location/districts/${cityId}`).then(r => r.json()).then(setDistricts).catch(() => {});
  }, [cityId]);

  if (cities.length === 0) return null;

  return (
    <div className="row" style={{ gap: 12 }}>
      <div className="field" style={{ flex: 1 }}>
        <label htmlFor="cityId">Şehir</label>
        <select id="cityId" name="cityId" className="input" value={cityId} onChange={e => { setCityId(e.target.value); }} aria-invalid={!!err(state, 'cityId')}>
          <option value="">Seçin</option>
          {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {err(state, 'cityId') && <p className="field-error" role="alert">{err(state, 'cityId')}</p>}
      </div>
      {districts.length > 0 && (
        <div className="field" style={{ flex: 1 }}>
          <label htmlFor="districtId">İlçe</label>
          <select id="districtId" name="districtId" className="input" aria-invalid={!!err(state, 'districtId')}>
            <option value="">Seçin</option>
            {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
      )}
    </div>
  );
}

export interface ConsentDocs { terms: React.ReactNode; kvkk: React.ReactNode }

/** Kullanım Koşulları ve KVKK ayrı ayrı: her biri pencerede açılır, sonuna kadar okununca otomatik işaretlenir (elle işaretlenemez). */
export function ConsentFields({ state, docs }: { state: FieldState; docs: ConsentDocs }) {
  return (
    <div className="stack" style={{ ['--stack' as string]: '14px' }}>
      <ConsentGate name="acceptTerms" title="Kullanım Koşulları" doc={docs.terms} error={err(state, 'acceptTerms')} label={<><b>Kullanım Koşulları</b>&apos;nı okudum, anladım ve kabul ediyorum.</>} />
      <ConsentGate name="acceptKvkk" title="KVKK Aydınlatma Metni" doc={docs.kvkk} error={err(state, 'acceptKvkk')} label={<><b>KVKK Aydınlatma Metni</b>&apos;ni okudum ve anladım.</>} />
      <p className="field-hint">Kutucuklar elle işaretlenemez. Her iki metni de açın, en alta kadar okuyup <b>“Okudum, anladım, kabul ediyorum”</b> düğmesine basın; kutucuklar otomatik işaretlenecektir.</p>
      <label className="check"><input type="checkbox" name="marketingConsent" /><span>Kampanya ve duyurular için e-posta / SMS almak istiyorum. <span className="text-tertiary">(isteğe bağlı)</span></span></label>
    </div>
  );
}
