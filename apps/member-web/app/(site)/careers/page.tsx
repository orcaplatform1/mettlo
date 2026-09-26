import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Clock, MapPin, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { ROLES } from '@/app/lib/careers-data';

export const metadata: Metadata = { title: 'Kariyer', description: 'Mettlo ekibine katılın: Topluluk Kontrolörü ve Müşteri İlişkileri Uzmanı pozisyonları için görev tanımları ve başvuru formu.', alternates: { canonical: '/careers' } };

export default function Careers() {
  return (
    <>
      <section className="about-hero">
        <div className="container">
          <span className="overline text-coral">KARİYER</span>
          <h1 className="display" style={{ margin: '14px 0 20px', maxWidth: 820 }}>Sağlıklı yaşamın <span className="text-gradient">geleceğini</span> birlikte kuralım.</h1>
          <p className="text-secondary body-lg" style={{ maxWidth: 700 }}>Mettlo; koçları ve insanları güvenli bir platformda buluşturuyor. Bu topluluğu büyütmek, korumak ve anlatmak için ekibimize katılacak yeni arkadaşlar arıyoruz.</p>
          <div className="hero-cta"><a href="#roles" className="btn btn-primary btn-pill">Açık pozisyonlar <ArrowRight size={16} aria-hidden /></a></div>
        </div>
      </section>

      <section className="section-sm">
        <div className="container grid grid-3">
          {[[Users, 'Anlamlı iş', 'Yaptığın iş, insanların daha sağlıklı yaşamasına ve koçların emeğinin karşılığını almasına dokunur.'], [ShieldCheck, 'Güvenli ve şeffaf', 'Rol bazlı yetkiler, denetim kayıtları ve gizlilik ilkeleri ile net sınırlar içinde çalışırsın.'], [Sparkles, 'Esnek ve gelişen', 'Uzaktan/esnek çalışma, öğrenme ve yeni sorumluluklar alma fırsatı.']].map(([I, t, d]: any) => (
            <div key={t} className="card about-value"><span className="about-icon"><I size={22} aria-hidden /></span><h2 className="h5">{t}</h2><p className="text-secondary body-sm">{d}</p></div>
          ))}
        </div>
      </section>

      <section id="roles" className="section" style={{ paddingTop: 24 }}>
        <div className="container">
          <div className="section-head"><div><span className="overline">AÇIK POZİSYONLAR</span><h2 className="h2" style={{ marginTop: 8 }}>Ekibimize katıl</h2></div></div>
          <div className="grid grid-2">
            {ROLES.map((r) => (
              <Link key={r.key} href={`/careers/${r.key}`} prefetch={false} className="card card-hover role-card">
                <span className="badge badge-live">{r.team}</span>
                <h3 className="h3">{r.title}</h3>
                <p className="text-secondary">{r.summary}</p>
                <div className="row row-wrap text-tertiary body-sm" style={{ gap: 18 }}><span className="row" style={{ gap: 6 }}><Clock size={15} aria-hidden /> {r.type}</span><span className="row" style={{ gap: 6 }}><MapPin size={15} aria-hidden /> {r.location}</span></div>
                <span className="text-coral row" style={{ gap: 8, fontWeight: 600 }}>Görev tanımı ve başvuru <ArrowRight size={16} aria-hidden /></span>
              </Link>
            ))}
          </div>
          <div className="card" style={{ marginTop: 40, padding: 28 }}>
            <h3 className="h5">Başvuru süreci</h3>
            <ol className="role-process">{['Formu doldur ve gönder', 'Ekibimiz başvuruyu inceler (ön eleme)', 'Uygun adaylarla görüşme yapılır', 'Sonuç e-posta veya telefonla bildirilir'].map((s, i) => <li key={s}><span>{i + 1}</span>{s}</li>)}</ol>
            <p className="text-tertiary body-sm" style={{ marginTop: 14 }}>Başvurunuz yalnızca yetkili yönetici tarafından görüntülenir. Kişisel verileriniz <Link href="/data-protection" className="text-coral">KVKK Aydınlatma Metni</Link> kapsamında işlenir.</p>
          </div>
        </div>
      </section>
    </>
  );
}
