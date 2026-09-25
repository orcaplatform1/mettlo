'use client';
import { useCallback, useEffect, useState } from 'react';
import { BarChart3, Cookie, Megaphone, Settings2, ShieldCheck, SlidersHorizontal } from 'lucide-react';

export const CONSENT_KEY = 'mettlo-cookie-consent';
export const CONSENT_EVENT_OPEN = 'mettlo:open-cookie-settings';
export const CONSENT_EVENT_CHANGE = 'mettlo:cookie-consent';

export interface CookiePrefs { necessary: true; functional: boolean; analytics: boolean; marketing: boolean; savedAt?: string; version: number }
const VERSION = 1;

export function readConsent(): CookiePrefs | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    const p = raw ? (JSON.parse(raw) as CookiePrefs) : null;
    return p && p.version === VERSION ? p : null;
  } catch { return null; }
}

function Switch({ checked, onChange, disabled, label }: { checked: boolean; onChange?: (v: boolean) => void; disabled?: boolean; label: string }) {
  return <button type="button" role="switch" className="switch" aria-checked={checked} aria-label={label} disabled={disabled} onClick={() => onChange?.(!checked)} />;
}

/**
 * Çerez onayı (kriptobeyan şablonundan uyarlandı): ilk ziyarette sorar.
 *  - Tüm Çerezleri Kabul Et / Zorunlu Olmayanları Reddet / Tercihleri Yönet
 *  - Tercih localStorage'da + `mettlo_consent` çerezinde saklanır; footer'daki "Çerez Tercihleri" ile değiştirilebilir.
 *  - Analitik/pazarlama betikleri yalnızca ilgili izin verilmişse yüklenmelidir (mettlo:cookie-consent olayını dinleyin).
 */
export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [manage, setManage] = useState(false);
  const [functional, setFunctional] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  const open = useCallback(() => {
    const p = readConsent();
    setFunctional(!!p?.functional); setAnalytics(!!p?.analytics); setMarketing(!!p?.marketing);
    setManage(!!p); setVisible(true);
  }, []);

  useEffect(() => {
    if (!readConsent()) setVisible(true);
    const handler = () => open();
    window.addEventListener(CONSENT_EVENT_OPEN, handler);
    return () => window.removeEventListener(CONSENT_EVENT_OPEN, handler);
  }, [open]);

  function save(p: Omit<CookiePrefs, 'necessary' | 'version' | 'savedAt'>) {
    const prefs: CookiePrefs = { necessary: true, ...p, savedAt: new Date().toISOString(), version: VERSION };
    try { localStorage.setItem(CONSENT_KEY, JSON.stringify(prefs)); } catch { /* özel mod */ }
    // Sunucu tarafı da bilsin diye birinci taraf çerez (6 ay); kişisel veri içermez
    const secure = location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `mettlo_consent=${prefs.functional ? 'f' : ''}${prefs.analytics ? 'a' : ''}${prefs.marketing ? 'm' : ''}n; Path=/; Max-Age=${60 * 60 * 24 * 180}; SameSite=Lax${secure}`;
    window.dispatchEvent(new CustomEvent(CONSENT_EVENT_CHANGE, { detail: prefs }));
    setVisible(false); setManage(false);
  }

  if (!visible) return null;

  return (
    <div className="cookie-banner" role="dialog" aria-modal="false" aria-labelledby="cookie-title" aria-describedby="cookie-desc">
      <div className="cookie-card">
        {!manage ? (
          <>
            <div className="row" style={{ alignItems: 'flex-start', gap: 14 }}>
              <span style={{ flex: 'none', width: 40, height: 40, borderRadius: 12, background: 'var(--gradient-sunrise-soft)', border: '1px solid var(--border-hover)', display: 'grid', placeItems: 'center' }}>
                <Cookie size={20} className="text-primary-c" aria-hidden />
              </span>
              <div id="cookie-desc" className="body-sm text-secondary">
                <p id="cookie-title" className="h5" style={{ color: 'var(--color-text-primary)', marginBottom: 6 }}>Çerez tercihlerin</p>
                <p>Mettlo, sitenin çalışması, güvenli giriş ve deneyimini geliştirmek için çerezler kullanır. Zorunlu çerezler her zaman aktiftir; performans, işlevsellik ve pazarlama çerezlerini dilediğin gibi seçebilirsin. Verilerin KVKK&apos;ya uygun işlenir.</p>
                <p style={{ marginTop: 8 }}>Ayrıntılar için <a href="/cookie-policy" className="text-coral">Çerez Politikası</a>&apos;nı, <a href="/privacy" className="text-coral">Gizlilik Politikası</a>&apos;nı ve <a href="/data-protection" className="text-coral">KVKK Aydınlatma Metni</a>&apos;ni inceleyebilirsin.</p>
              </div>
            </div>
            <div className="cookie-actions">
              <button type="button" className="btn btn-secondary btn-pill btn-sm" onClick={() => { setManage(true); }}><Settings2 size={16} aria-hidden /> Tercihleri Yönet</button>
              <button type="button" className="btn btn-secondary btn-pill btn-sm" onClick={() => save({ functional: false, analytics: false, marketing: false })}>Zorunlu Olmayanları Reddet</button>
              <button type="button" className="btn btn-primary btn-pill btn-sm" onClick={() => save({ functional: true, analytics: true, marketing: true })}>Tüm Çerezleri Kabul Et</button>
            </div>
          </>
        ) : (
          <>
            <p id="cookie-title" className="h5">Çerez tercihleri</p>
            <p className="body-sm text-secondary" style={{ marginTop: 4 }}>Hangi çerez kategorilerine izin vereceğini seç. Tercihini istediğin zaman footer&apos;daki &quot;Çerez Tercihleri&quot; bağlantısından değiştirebilirsin.</p>
            <div style={{ marginTop: 8 }}>
              <div className="cookie-row">
                <div><h4 className="row" style={{ gap: 8 }}><ShieldCheck size={16} className="text-success" aria-hidden /> Zorunlu Çerezler <span className="badge badge-ok">Her zaman aktif</span></h4><p>Oturum açma, güvenlik, form ve ödeme akışlarının çalışması için gereklidir. Kapatılamaz.</p></div>
                <Switch checked disabled label="Zorunlu çerezler (her zaman aktif)" />
              </div>
              <div className="cookie-row">
                <div><h4 className="row" style={{ gap: 8 }}><SlidersHorizontal size={16} className="text-primary-c" aria-hidden /> İşlevsellik Çerezleri</h4><p>Dil, arayüz ve panel tercihlerini hatırlar; daha kişisel bir deneyim sunar.</p></div>
                <Switch checked={functional} onChange={setFunctional} label="İşlevsellik çerezlerini aç/kapat" />
              </div>
              <div className="cookie-row">
                <div><h4 className="row" style={{ gap: 8 }}><BarChart3 size={16} className="text-primary-c" aria-hidden /> Performans ve Analiz Çerezleri</h4><p>Sitenin nasıl kullanıldığını anonim olarak ölçerek programlar, koç sayfaları ve uygulama akışlarını geliştirmemize yardımcı olur.</p></div>
                <Switch checked={analytics} onChange={setAnalytics} label="Performans ve analiz çerezlerini aç/kapat" />
              </div>
              <div className="cookie-row">
                <div><h4 className="row" style={{ gap: 8 }}><Megaphone size={16} className="text-primary-c" aria-hidden /> Pazarlama Çerezleri</h4><p>İlgi alanına uygun kampanya, challenge ve koç önerilerini göstermek için kullanılır.</p></div>
                <Switch checked={marketing} onChange={setMarketing} label="Pazarlama çerezlerini aç/kapat" />
              </div>
            </div>
            <div className="cookie-actions">
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setManage(false)}>Geri</button>
              <button type="button" className="btn btn-secondary btn-pill btn-sm" onClick={() => save({ functional: false, analytics: false, marketing: false })}>Zorunlu Olmayanları Reddet</button>
              <button type="button" className="btn btn-primary btn-pill btn-sm" onClick={() => save({ functional, analytics, marketing })}>Tercihleri Kaydet</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/** Footer için: çerez penceresini yeniden açar */
export function CookieSettingsButton({ className = '' }: { className?: string }) {
  return <button type="button" className={className} style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', font: 'inherit', color: 'inherit' }} onClick={() => window.dispatchEvent(new Event(CONSENT_EVENT_OPEN))}>Çerez Tercihleri</button>;
}
