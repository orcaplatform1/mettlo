import { HeartPulse } from 'lucide-react';
import { authed } from '@mettlo/web-core';
import { HealthForms } from './health-forms';

const d = (v: unknown) => new Date(String(v)).toLocaleDateString('tr-TR');

export default async function HealthPage() {
  const h = await authed<any>('/me/health/summary?days=30');
  return (
    <div className="stack" style={{ ['--stack' as string]: '24px' }}>
      <h1 className="h2 row" style={{ gap: 10 }}><HeartPulse className="text-primary-c" aria-hidden /> Sağlık &amp; İlerleme</h1>
      <p className="text-secondary body-sm">Mobil uygulama Apple Health / Health Connect verilerini otomatik senkronlar. Buradan elle de girebilirsin. Verilerini yalnızca izin verdiğin koçla paylaşırsın (Ayarlar).</p>
      <div className="stat-grid">
        <div className="stat-tile"><span className="n">{h.averages.steps ?? '—'}</span><span className="l">Ort. günlük adım (30 gün)</span></div>
        <div className="stat-tile"><span className="n">{h.averages.activeCalories ?? '—'}</span><span className="l">Ort. aktif kalori</span></div>
        <div className="stat-tile"><span className="n">{h.averages.sleepMin ? `${Math.floor(h.averages.sleepMin / 60)} sa ${h.averages.sleepMin % 60} dk` : '—'}</span><span className="l">Ort. uyku</span></div>
        <div className="stat-tile"><span className="n">{h.measurements[0]?.weightKg ? `${h.measurements[0].weightKg} kg` : '—'}</span><span className="l">Son kilo</span></div>
      </div>
      <HealthForms />
      <section><h2 className="h4" style={{ marginBottom: 10 }}>Son aktiviteler</h2><div className="table-wrap"><table className="table"><thead><tr><th>Tarih</th><th>Adım</th><th>Aktif kalori</th><th>Egzersiz (dk)</th><th>Nabız</th></tr></thead><tbody>{h.activity.length === 0 && <tr><td colSpan={5} className="text-muted">Kayıt yok.</td></tr>}{h.activity.slice(0, 14).map((a: any) => <tr key={a.id}><td>{d(a.date)}</td><td>{a.steps ?? '—'}</td><td>{a.activeCalories ?? '—'}</td><td>{a.exerciseMin ?? '—'}</td><td>{a.avgHeartRate ?? '—'}</td></tr>)}</tbody></table></div></section>
    </div>
  );
}
