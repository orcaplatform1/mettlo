import type { Metadata } from 'next';
import Link from 'next/link';
import { Briefcase, MapPin, Monitor } from 'lucide-react';
import { EmptyState } from '@mettlo/ui';
import { getJobs, getCities } from '@/app/lib/data';
import { PageHead, Pagination, pageOf, LIMIT } from '@/app/components/list';
import { AdBanner } from '@/app/components/ad-banner';

export const metadata: Metadata = {
  title: 'Koç İş İlanları — Fitness ve Spor Sektörü',
  description: 'Fitness, yoga, pilates ve spor sektöründe koçluk iş ilanlarını keşfet. Yüz yüze ve online çalışma fırsatları.',
  alternates: { canonical: '/is-ilanlari' },
};

const WORK_MODE_TR: Record<string, string> = {
  ONLINE: 'Online', BUSINESS: 'İşletmede', HYBRID: 'Hibrit', OUTDOOR: 'Açık Hava',
};

const dtFmt = (s: string) =>
  new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(s));

type Props = { searchParams: Promise<{ cityId?: string; workMode?: string; branch?: string; page?: string }> };

export default async function IsIlanlariPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = pageOf(sp.page);
  const qs = new URLSearchParams();
  qs.set('page', String(page));
  if (sp.cityId) qs.set('cityId', sp.cityId);
  if (sp.workMode) qs.set('workMode', sp.workMode);
  if (sp.branch) qs.set('branch', sp.branch);

  const [data, cities] = await Promise.all([
    getJobs(`?${qs}`),
    getCities(),
  ]);

  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  const workModes = ['', 'ONLINE', 'BUSINESS', 'HYBRID', 'OUTDOOR'];

  const filterLink = (patch: Record<string, string | undefined>) => {
    const p: Record<string, string> = {};
    if (sp.cityId) p.cityId = sp.cityId;
    if (sp.workMode) p.workMode = sp.workMode;
    if (sp.branch) p.branch = sp.branch;
    Object.assign(p, patch);
    Object.keys(p).forEach((k) => { if (!p[k]) delete p[k]; });
    const q = new URLSearchParams(p).toString();
    return `/is-ilanlari${q ? `?${q}` : ''}`;
  };

  return (
    <>
      <PageHead overline="İŞ İLANLARI" title="Koçluk iş fırsatları">
        Fitness sektöründe sana uygun koçluk pozisyonlarını bul.
      </PageHead>

      <div className="container section-sm">
        {/* Filtreler */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
          {/* Çalışma şekli */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {workModes.map((wm) => (
              <Link
                key={wm}
                href={filterLink({ workMode: wm || undefined, page: '1' })}
                style={{
                  padding: '4px 12px', borderRadius: '20px', fontSize: '12px', textDecoration: 'none',
                  background: (sp.workMode || '') === wm ? 'var(--accent)' : 'var(--surface-2)',
                  color: (sp.workMode || '') === wm ? '#fff' : 'inherit',
                }}
              >
                {wm ? WORK_MODE_TR[wm] : 'Tüm Modlar'}
              </Link>
            ))}
          </div>

          {/* Şehir */}
          {cities && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <Link href={filterLink({ cityId: undefined, page: '1' })} style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', textDecoration: 'none', background: !sp.cityId ? 'var(--surface-3, var(--surface-2))' : 'var(--surface-2)', border: '1px solid var(--border)' }}>
                Tüm Şehirler
              </Link>
              {cities.slice(0, 10).map((c: any) => (
                <Link
                  key={c.id}
                  href={filterLink({ cityId: String(c.id), page: '1' })}
                  style={{
                    padding: '4px 12px', borderRadius: '20px', fontSize: '12px', textDecoration: 'none',
                    background: sp.cityId === String(c.id) ? 'var(--surface-3, var(--surface-2))' : 'var(--surface-2)',
                    border: `1px solid ${sp.cityId === String(c.id) ? 'var(--accent)' : 'var(--border)'}`,
                  }}
                >
                  {c.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        <p className="text-secondary" style={{ fontSize: '13px', marginBottom: '16px' }}>
          <strong>{total}</strong> ilan bulundu
        </p>

        {items.length === 0 ? (
          <EmptyState icon={<Briefcase size={36} aria-hidden />} title="Henüz ilan yok">
            Bu kriterlere uygun iş ilanı bulunamadı.
          </EmptyState>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {items.map((job: any) => (
              <div key={job.id} style={{ background: 'var(--surface-2)', borderRadius: '12px', padding: '20px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 6px', lineHeight: 1.4 }}>{job.title}</h3>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Briefcase size={12} aria-hidden /> {job.business?.name || '—'}
                      </span>
                      {job.city && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={12} aria-hidden /> {job.city.name}
                        </span>
                      )}
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Monitor size={12} aria-hidden /> {WORK_MODE_TR[job.workMode] || job.workMode}
                      </span>
                    </div>
                    {job.branchSlugs?.length > 0 && (
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {job.branchSlugs.slice(0, 4).map((b: string) => (
                          <span key={b} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', background: 'var(--surface-3, var(--surface))', border: '1px solid var(--border)' }}>{b}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{dtFmt(job.createdAt)}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{job._count?.applications ?? 0} başvuru</div>
                    {job.expiresAt && (
                      <div style={{ fontSize: '11px', color: 'var(--warning, orange)', marginTop: '4px' }}>Son: {dtFmt(job.expiresAt)}</div>
                    )}
                  </div>
                </div>
                {job.requirements && (
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '10px', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {job.requirements}
                  </p>
                )}
                <div style={{ marginTop: '14px', display: 'flex', gap: '8px' }}>
                  <Link
                    href={`/app/is-basvurulari?apply=${job.id}`}
                    className="btn btn-primary"
                    style={{ padding: '8px 18px', fontSize: '13px' }}
                  >
                    Başvur
                  </Link>
                  {job.business?.slug && (
                    <Link
                      href={`/isletme/${job.business.slug}`}
                      className="btn btn-ghost"
                      style={{ padding: '8px 18px', fontSize: '13px' }}
                    >
                      İşletme Profili
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <AdBanner placement="FEED" style={{ margin: '24px 0 0' }} />
        <Pagination base="/is-ilanlari" page={page} total={total} params={{ cityId: sp.cityId, workMode: sp.workMode, branch: sp.branch }} />
      </div>
    </>
  );
}
