'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Upload, Store, UtensilsCrossed, ChevronRight, ChevronLeft } from 'lucide-react';

const FITNESS_CATEGORIES: { value: string; label: string }[] = [
  { value: 'FITNESS_GYM', label: 'Fitness / Spor Salonu' },
  { value: 'PILATES_STUDIO', label: 'Pilates Stüdyosu' },
  { value: 'YOGA_STUDIO', label: 'Yoga Stüdyosu' },
  { value: 'DANCE_STUDIO', label: 'Dans Stüdyosu' },
  { value: 'HIIT_STUDIO', label: 'HIIT Stüdyosu' },
  { value: 'BOXING_GYM', label: 'Boks Salonu' },
  { value: 'RUNNING_CLUB', label: 'Koşu Kulübü' },
  { value: 'WELLNESS_CENTER', label: 'Wellness Merkezi' },
  { value: 'NUTRITION_CLINIC', label: 'Beslenme Kliniği' },
  { value: 'RECOVERY_STUDIO', label: 'Recovery Stüdyosu' },
  { value: 'SPORTS_CLUB', label: 'Spor Kulübü' },
];

const FOOD_CATEGORIES: { value: string; label: string }[] = [
  { value: 'HEALTHY_FOOD', label: 'Sağlıklı Yemek' },
  { value: 'HEALTHY_CAFE', label: 'Sağlıklı Kafe' },
  { value: 'SMOOTHIE_BAR', label: 'Smoothie Bar' },
  { value: 'VEGAN', label: 'Vegan Restoran' },
  { value: 'VEGETARIAN', label: 'Vejetaryen' },
  { value: 'MEAL_PREP', label: 'Meal Prep' },
  { value: 'PROTEIN_BAR', label: 'Protein Bar' },
  { value: 'GLUTEN_FREE', label: 'Glutensiz' },
  { value: 'RAW_FOOD', label: 'Raw Food' },
  { value: 'FUNCTIONAL_NUTRITION', label: 'Fonksiyonel Beslenme' },
  { value: 'FUNCTIONAL_BEVERAGES', label: 'Fonksiyonel İçecekler' },
  { value: 'SPORTS_NUTRITION', label: 'Spor Beslenmesi' },
  { value: 'SPECIAL_DIET', label: 'Özel Diyet' },
];

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const DAY_LABELS: Record<string, string> = { mon: 'Pzt', tue: 'Sal', wed: 'Çar', thu: 'Per', fri: 'Cum', sat: 'Cmt', sun: 'Paz' };

type BusinessType = 'fitness' | 'food';
type Step = 1 | 2 | 3;

function SlugChecker({ slug }: { slug: string }) {
  const [status, setStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [message, setMessage] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (!slug || slug.length < 3) { setStatus('idle'); setMessage(''); return; }
    setStatus('checking');
    timer.current = setTimeout(async () => {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3301/v1';
        const r = await fetch(`${apiBase}/public/check-slug?slug=${encodeURIComponent(slug)}`);
        const d = await r.json();
        setStatus(d.available ? 'available' : 'taken');
        setMessage(d.message ?? '');
      } catch { setStatus('idle'); }
    }, 400);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [slug]);

  if (status === 'checking') return <p style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>Kontrol ediliyor…</p>;
  if (status === 'taken') return <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>⊘ {message}</p>;
  if (status === 'available') return <p style={{ color: '#22c55e', fontSize: 12, marginTop: 4 }}>✓ {message}</p>;
  return <p style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>mettlo.tr/business/{slug || 'isletme-adi'}</p>;
}

export function BusinessApplyForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [businessType, setBusinessType] = useState<BusinessType | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [slug, setSlug] = useState('');
  const [hours, setHours] = useState<Record<string, { open: string; close: string; closed: boolean }>>({
    mon: { open: '09:00', close: '22:00', closed: false },
    tue: { open: '09:00', close: '22:00', closed: false },
    wed: { open: '09:00', close: '22:00', closed: false },
    thu: { open: '09:00', close: '22:00', closed: false },
    fri: { open: '09:00', close: '22:00', closed: false },
    sat: { open: '10:00', close: '20:00', closed: false },
    sun: { open: '10:00', close: '18:00', closed: true },
  });
  const [cities, setCities] = useState<{ id: number; name: string }[]>([]);
  const [districts, setDistricts] = useState<{ id: number; name: string }[]>([]);
  const [cityId, setCityId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3301/v1';
    fetch(`${apiBase}/location/cities`).then(r => r.json()).then(setCities).catch(() => {});
  }, []);

  useEffect(() => {
    if (!cityId) { setDistricts([]); return; }
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3301/v1';
    fetch(`${apiBase}/location/districts/${cityId}`).then(r => r.json()).then(setDistricts).catch(() => {});
  }, [cityId]);

  const toggleCategory = (v: string) => {
    setSelectedCategories(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);
  };

  const handleSlugInput = (v: string) => setSlug(v.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/--+/g, '-'));

  const buildHoursJson = () => {
    const out: Record<string, { open: string; close: string } | null> = {};
    DAYS.forEach(d => { out[d] = hours[d].closed ? null : { open: hours[d].open, close: hours[d].close }; });
    return out;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    if (selectedCategories.length === 0) { setError('En az bir kategori seçmelisiniz.'); return; }
    if (!slug || slug.length < 3) { setError('İşletme URL adresi en az 3 karakter olmalı.'); return; }

    const fd = new FormData(e.currentTarget);
    const taxDocFile = fd.get('taxDoc') as File;
    if (!taxDocFile || taxDocFile.size === 0) { setError('Vergi levhası yüklemek zorunludur.'); return; }

    setSubmitting(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3301/v1';

      // 1. İşletme oluştur
      const createRes = await fetch(`${apiBase}/business`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: fd.get('name'),
          slug,
          category: selectedCategories[0],
          shortDesc: fd.get('shortDesc') || undefined,
          description: fd.get('description') || undefined,
          website: fd.get('website') || undefined,
          phonePublic: fd.get('phonePublic') || undefined,
          cityId: cityId ? parseInt(cityId) : undefined,
          districtId: fd.get('districtId') ? parseInt(fd.get('districtId') as string) : undefined,
        }),
      });
      if (!createRes.ok) { const d = await createRes.json(); throw new Error(d.message ?? 'İşletme oluşturulamadı.'); }
      const { id: businessId } = await createRes.json();

      // 2. İşletme bilgilerini güncelle (saatler + branşlar)
      await fetch(`${apiBase}/business/${businessId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ businessHours: buildHoursJson(), fitnessBranches: selectedCategories }),
      });

      // 3. Vergi levhası yükle (base64 data URL olarak)
      const reader = new FileReader();
      const taxDocUrl = await new Promise<string>((res, rej) => {
        reader.onload = () => res(reader.result as string);
        reader.onerror = rej;
        reader.readAsDataURL(taxDocFile);
      });

      const verRes = await fetch(`${apiBase}/business/${businessId}/verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ taxDocUrl }),
      });
      if (!verRes.ok) { const d = await verRes.json(); throw new Error(d.message ?? 'Vergi levhası yüklenemedi.'); }

      setDone(true);
    } catch (e: any) {
      setError(e.message ?? 'Bir hata oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <CheckCircle2 size={56} style={{ color: '#22c55e', marginBottom: 16 }} />
        <h2 className="h3" style={{ marginBottom: 12 }}>Başvurunuz Alındı!</h2>
        <p className="text-secondary" style={{ marginBottom: 24 }}>
          Ekibimiz vergi levhanızı inceleyecek. Onaylandıktan sonra işletme profiliniz yayına alınacak ve bilgilendirileceksiniz.
        </p>
        <button className="btn btn-primary" onClick={() => router.push('/')}>Ana Sayfaya Dön</button>
      </div>
    );
  }

  // ─── Step 1: Tür Seçimi ───────────────────────────────────────────────
  if (step === 1) {
    return (
      <div>
        <p className="body-sm text-secondary" style={{ marginBottom: 24 }}>İşletme türünüzü seçin:</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
          {([['fitness', Store, 'Spor & Fitness', 'Spor salonu, yoga, pilates, boks, wellness ve benzeri fiziksel aktivite işletmeleri'], ['food', UtensilsCrossed, 'Yiyecek & Restoran', 'Sağlıklı yemek, vegan, smoothie, meal prep ve sağlık odaklı yiyecek işletmeleri']] as const).map(([type, Icon, title, desc]) => (
            <button key={type} type="button" onClick={() => setBusinessType(type as BusinessType)}
              style={{ padding: '24px 20px', borderRadius: 12, border: `2px solid ${businessType === type ? 'var(--color-primary, #f97316)' : 'var(--border-soft)'}`, background: businessType === type ? 'rgba(249,115,22,0.07)' : 'var(--surface1, transparent)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
              <Icon size={32} style={{ color: businessType === type ? '#f97316' : 'var(--text-secondary)', marginBottom: 12 }} />
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{desc}</div>
            </button>
          ))}
        </div>
        <button className="btn btn-primary" disabled={!businessType} onClick={() => businessType && setStep(2)}>
          Devam Et <ChevronRight size={16} aria-hidden />
        </button>
      </div>
    );
  }

  // ─── Step 2: Kategori Seçimi ──────────────────────────────────────────
  if (step === 2) {
    const cats = businessType === 'fitness' ? FITNESS_CATEGORIES : FOOD_CATEGORIES;
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setStep(1)} style={{ padding: '4px 10px' }}><ChevronLeft size={14} /> Geri</button>
          <span className="body-sm text-secondary">
            {businessType === 'fitness' ? 'Fitness & Spor' : 'Yiyecek & Restoran'} — Kategoriler
          </span>
        </div>
        <p className="body-sm text-secondary" style={{ marginBottom: 16 }}>İşletmenize uyan tüm kategorileri seçin <span style={{ color: '#94a3b8' }}>(birden fazla seçilebilir)</span>:</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 28 }}>
          {cats.map(c => {
            const selected = selectedCategories.includes(c.value);
            return (
              <button key={c.value} type="button" onClick={() => toggleCategory(c.value)}
                style={{ padding: '8px 14px', borderRadius: 20, border: `1.5px solid ${selected ? '#f97316' : 'var(--border-soft)'}`, background: selected ? 'rgba(249,115,22,0.1)' : 'transparent', color: selected ? '#f97316' : 'var(--text-secondary)', fontSize: 13, cursor: 'pointer', fontWeight: selected ? 600 : 400, transition: 'all 0.12s' }}>
                {selected && '✓ '}{c.label}
              </button>
            );
          })}
        </div>
        {selectedCategories.length === 0 && <p style={{ color: '#94a3b8', fontSize: 12, marginBottom: 12 }}>En az bir kategori seçmelisiniz.</p>}
        <button className="btn btn-primary" disabled={selectedCategories.length === 0} onClick={() => selectedCategories.length > 0 && setStep(3)}>
          Devam Et <ChevronRight size={16} aria-hidden />
        </button>
      </div>
    );
  }

  // ─── Step 3: İşletme Detayları ────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setStep(2)} style={{ padding: '4px 10px' }}><ChevronLeft size={14} /> Geri</button>
        <span className="body-sm text-secondary">İşletme Bilgileri</span>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 20 }}>{error}</div>}

      <div style={{ display: 'grid', gap: 20 }}>
        {/* İşletme Adı */}
        <div className="field">
          <label htmlFor="ba-name">İşletme Adı <span style={{ color: '#ef4444' }}>*</span></label>
          <input id="ba-name" name="name" className="input" required maxLength={100} placeholder="Örn: X Fitness Center" />
        </div>

        {/* Slug */}
        <div className="field">
          <label htmlFor="ba-slug">İşletme URL Adresi <span style={{ color: '#ef4444' }}>*</span></label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 14, pointerEvents: 'none' }}>mettlo.tr/business/</span>
            <input id="ba-slug" className="input" value={slug} onChange={e => handleSlugInput(e.target.value)}
              style={{ paddingLeft: 172 }} required minLength={3} maxLength={50} placeholder="isletme-adiniz" />
          </div>
          <SlugChecker slug={slug} />
        </div>

        {/* Kısa Açıklama */}
        <div className="field">
          <label htmlFor="ba-shortdesc">Kısa Açıklama <span style={{ color: '#94a3b8', fontWeight: 400 }}>(maks. 160 karakter)</span></label>
          <input id="ba-shortdesc" name="shortDesc" className="input" maxLength={160} placeholder="İşletmenizi tek cümleyle tanıtın" />
        </div>

        {/* Açıklama */}
        <div className="field">
          <label htmlFor="ba-desc">Detaylı Açıklama</label>
          <textarea id="ba-desc" name="description" className="input" rows={4} style={{ resize: 'vertical' }} placeholder="Hizmetleriniz, özellikleriniz, ekipmanlarınız…" />
        </div>

        {/* Web sitesi */}
        <div className="field">
          <label htmlFor="ba-website">Web Sitesi <span style={{ color: '#94a3b8', fontWeight: 400 }}>(isteğe bağlı)</span></label>
          <input id="ba-website" name="website" className="input" type="url" placeholder="https://isletmeniz.com" />
        </div>

        {/* Telefon */}
        <div className="field">
          <label htmlFor="ba-phone">Telefon <span style={{ color: '#94a3b8', fontWeight: 400 }}>(herkese açık)</span></label>
          <input id="ba-phone" name="phonePublic" className="input" type="tel" placeholder="0212 000 00 00" maxLength={30} />
        </div>

        {/* Şehir / İlçe */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="field">
            <label htmlFor="ba-city">Şehir <span style={{ color: '#ef4444' }}>*</span></label>
            <select id="ba-city" name="cityId" className="input" required value={cityId} onChange={e => setCityId(e.target.value)}>
              <option value="">Seçin</option>
              {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          {districts.length > 0 && (
            <div className="field">
              <label htmlFor="ba-district">İlçe</label>
              <select id="ba-district" name="districtId" className="input">
                <option value="">Seçin</option>
                {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          )}
        </div>

        {/* Çalışma Saatleri */}
        <div className="field">
          <label>Çalışma Saatleri</label>
          <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
            {DAYS.map(day => (
              <div key={day} style={{ display: 'grid', gridTemplateColumns: '48px 80px 1fr 1fr', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>{DAY_LABELS[day]}</span>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                  <input type="checkbox" checked={!hours[day].closed} onChange={e => setHours(h => ({ ...h, [day]: { ...h[day], closed: !e.target.checked } }))} />
                  <span>{hours[day].closed ? 'Kapalı' : 'Açık'}</span>
                </label>
                {!hours[day].closed && (
                  <>
                    <input type="time" className="input" value={hours[day].open} onChange={e => setHours(h => ({ ...h, [day]: { ...h[day], open: e.target.value } }))} style={{ fontSize: 13 }} />
                    <input type="time" className="input" value={hours[day].close} onChange={e => setHours(h => ({ ...h, [day]: { ...h[day], close: e.target.value } }))} style={{ fontSize: 13 }} />
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Vergi Levhası */}
        <div className="field">
          <label htmlFor="ba-taxdoc">
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Upload size={14} />
              Vergi Levhası <span style={{ color: '#ef4444' }}>*</span>
            </span>
          </label>
          <input id="ba-taxdoc" name="taxDoc" type="file" className="input" accept="image/*,application/pdf" required />
          <p className="field-hint">PDF veya görsel (JPG/PNG) — Maks 10 MB. Vergi levhası olmadan başvuru işleme alınmaz.</p>
        </div>

        {/* Seçilen Kategoriler Özeti */}
        <div style={{ padding: '14px 16px', borderRadius: 8, background: 'var(--surface1, rgba(255,255,255,0.04))', border: '1px solid var(--border-soft)' }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>SEÇİLEN KATEGORİLER</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {selectedCategories.map(v => {
              const cats = businessType === 'fitness' ? FITNESS_CATEGORIES : FOOD_CATEGORIES;
              const cat = cats.find(c => c.value === v);
              return <span key={v} style={{ fontSize: 12, padding: '3px 10px', borderRadius: 12, background: 'rgba(249,115,22,0.1)', color: '#f97316', border: '1px solid rgba(249,115,22,0.3)' }}>{cat?.label ?? v}</span>;
            })}
          </div>
        </div>

        <button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
          {submitting ? 'Başvuru gönderiliyor…' : 'Başvuruyu Tamamla'}
        </button>
        <p className="body-sm text-secondary" style={{ textAlign: 'center' }}>
          Başvurunuz onaylanmadan profil yayına alınmaz. Ortalama inceleme süresi 1–3 iş günüdür.
        </p>
      </div>
    </form>
  );
}
