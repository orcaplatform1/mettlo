import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { Alert } from '@mettlo/ui';
import { ApiError, apiFetch } from '@mettlo/web-core';
import { requireSuperAdmin } from '@/app/lib/admin';

export const metadata: Metadata = { title: 'Sağlık Verileri', robots: { index: false, follow: false } };

const d = (v: unknown) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v) ? new Date(v).toLocaleDateString('tr-TR') : v ?? '—');

function T({ title, rows, cols }: { title: string; rows: any[]; cols: Array<[string, string]> }) {
  return (
    <section className="stack" style={{ ['--stack' as string]: '8px' }}>
      <h2 className="h5">{title} <span className="badge">{rows.length}</span></h2>
      {rows.length ? (
        <div className="table-wrap"><table className="table"><thead><tr>{cols.map(([h]) => <th key={h}>{h}</th>)}</tr></thead>
          <tbody>{rows.map((r, i) => <tr key={i}>{cols.map(([h, k]) => <td key={h}>{String(d(r[k]))}</td>)}</tr>)}</tbody></table></div>
      ) : <p className="body-sm text-muted">Kayıt yok.</p>}
    </section>
  );
}

/** Bireysel sağlık verisi (özel nitelikli): yalnızca SUPER_ADMIN, her açılış AYRICA denetlenir. */
export default async function HealthPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const auth = await requireSuperAdmin();
  if (!auth) notFound();
  let data: any;
  try { data = await apiFetch(`/admin/profiles/${encodeURIComponent(username)}/health`, { token: auth.token }); }
  catch (e) { if (e instanceof ApiError) notFound(); throw e; }

  return (
    <div className="container" style={{ paddingBlock: 40 }}>
      <Link href={`/profile/${username}`} className="body-sm text-secondary row" style={{ gap: 6 }}><ArrowLeft size={16} aria-hidden /> @{username} profiline dön</Link>
      <h1 className="h2" style={{ margin: '16px 0 12px' }}>Sağlık Verileri</h1>
      <Alert kind="info"><ShieldAlert size={14} style={{ display: 'inline', marginRight: 6 }} aria-hidden />Bu veriler KVKK kapsamında özel nitelikli kişisel veridir. Bu görüntüleme <b>ayrıca</b> denetim kaydına yazıldı.</Alert>
      <div className="stack" style={{ ['--stack' as string]: '28px', marginTop: 24 }}>
        <T title="Günlük aktivite" rows={data.activity} cols={[['Tarih', 'date'], ['Adım', 'steps'], ['Mesafe (m)', 'distanceM'], ['Aktif kalori', 'activeCalories'], ['Egzersiz (dk)', 'exerciseMin'], ['Ort. nabız', 'avgHeartRate']]} />
        <T title="Uyku" rows={data.sleep} cols={[['Tarih', 'date'], ['Süre (dk)', 'durationMin'], ['Kalite', 'quality']]} />
        <T title="Ölçümler" rows={data.measurements} cols={[['Tarih', 'measuredAt'], ['Kilo', 'weightKg'], ['Yağ %', 'bodyFatPct'], ['Göğüs', 'chestCm'], ['Bel', 'waistCm'], ['Kalça', 'hipCm']]} />
        <T title="İlerleme kayıtları" rows={data.progress} cols={[['Tarih', 'recordedAt'], ['Tür', 'kind'], ['Değer', 'value'], ['Birim', 'unit']]} />
        <T title="Beslenme günlüğü" rows={data.nutrition} cols={[['Tarih', 'date'], ['Öğün', 'label'], ['Kalori', 'calories'], ['Protein', 'proteinG'], ['Karb.', 'carbG'], ['Yağ', 'fatG']]} />
        <T title="Sağlık kayıtları (cihaz)" rows={data.records} cols={[['Zaman', 'recordedAt'], ['Metrik', 'metric'], ['Değer', 'value'], ['Birim', 'unit'], ['Kaynak', 'source']]} />
        <T title="İlerleme fotoğrafları" rows={data.photos} cols={[['Tarih', 'takenAt'], ['Açı', 'angle'], ['Medya', 'mediaId']]} />
      </div>
    </div>
  );
}
