import { notFound } from 'next/navigation';
import { StatusBadge } from '@mettlo/ui';
import { ApiError, authed } from '@mettlo/web-core';
import { POSITION } from '../page';
import { StatusForm } from './status-form';

const EDU: Record<string, string> = { high_school: 'Lise', associate: 'Ön lisans', bachelor: 'Lisans', master: 'Yüksek lisans', phd: 'Doktora' };
const WM: Record<string, string> = { remote: 'Uzaktan', hybrid: 'Hibrit', onsite: 'Ofiste' };
const QA: Array<[string, string]> = [['currentStatus', 'Şu anki durum'], ['relevantExperience', 'İlgili deneyim'], ['tools', 'Kullandığı araçlar'], ['languages', 'Diller'], ['whyMettlo', 'Neden Mettlo, neden bu rol?'], ['scenarioOne', 'Senaryo 1'], ['scenarioTwo', 'Senaryo 2']];

export default async function ApplicationDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let a: any;
  try { a = await authed(`/admin/applications/${encodeURIComponent(id)}`); } catch (e) { if (e instanceof ApiError && (e.status === 404)) notFound(); throw e; }
  const ans = (a.answers ?? {}) as Record<string, string>;
  const info: Array<[string, string]> = [
    ['E-posta', a.email], ['Telefon', a.phone], ['Şehir', a.city], ['Doğum yılı', String(a.birthYear)], ['Eğitim', `${EDU[a.education] ?? a.education}${ans.educationField ? ` · ${ans.educationField}` : ''}`],
    ['Deneyim', `${a.experienceYears} yıl`], ['Çalışma modeli', WM[a.workModel] ?? a.workModel], ['Haftalık süre', a.weeklyHours ? `${a.weeklyHours} saat` : '—'], ['Başlayabileceği zaman', a.availableFrom || '—'], ['LinkedIn / portföy', a.linkedinUrl || '—'],
  ];
  return (
    <div className="stack" style={{ ['--stack' as string]: '18px', maxWidth: 860 }}>
      <a href="/admin/careers" className="body-sm text-secondary">← Başvurular</a>
      <div className="row between row-wrap"><div><h1 className="h3">{a.fullName}</h1><p className="text-secondary">{POSITION[a.positionKey] ?? a.positionKey} başvurusu · {new Date(a.createdAt).toLocaleString('tr-TR')}</p></div><StatusBadge status={a.status} /></div>
      <div className="card"><div className="grid grid-2">{info.map(([k, v]) => <p key={k}><span className="caption text-tertiary">{k}</span><br /><b style={{ overflowWrap: 'anywhere' }}>{v}</b></p>)}</div></div>
      {QA.filter(([k]) => ans[k]).map(([k, l]) => <div key={k} className="card"><span className="caption text-tertiary">{l}</span><p style={{ whiteSpace: 'pre-line', lineHeight: 1.7, marginTop: 6 }}>{ans[k]}</p></div>)}
      <StatusForm id={id} status={a.status} note={a.note ?? ''} />
    </div>
  );
}
