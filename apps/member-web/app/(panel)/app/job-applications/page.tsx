import { authed, requireSession } from '@mettlo/web-core';
import { Briefcase, Send } from 'lucide-react';
import Link from 'next/link';
import { ApplyJobForm } from './apply-form';

const STATUS_TR: Record<string, string> = {
  APPLIED: 'Başvuruldu', VIEWED: 'Görüntülendi', SHORTLISTED: 'Kısa Listede', REJECTED: 'Reddedildi', HIRED: 'Kabul Edildi',
};
const STATUS_CLASS: Record<string, string> = {
  APPLIED: '', VIEWED: 'badge-live', SHORTLISTED: 'badge-ok', REJECTED: 'badge-danger', HIRED: 'badge-ok',
};

const dtFmt = (s: string) =>
  new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(s));

export default async function IsBasvurulariPage({ searchParams }: { searchParams: Promise<{ apply?: string }> }) {
  const s = await requireSession('/app/job-applications');
  const { apply } = await searchParams;

  const [applications, offers] = await Promise.all([
    authed<any[]>('/my-job-applications').catch(() => []),
    authed<any[]>('/my-job-applications/offers').catch(() => []),
  ]);

  return (
    <div className="stack" style={{ ['--stack' as string]: '32px' }}>
      <div>
        <h1 className="h2">İş Başvurularım</h1>
        <p className="text-secondary" style={{ fontSize: '14px', marginTop: '4px' }}>
          <Link href="/jobs" style={{ color: 'var(--accent)' }}>İş ilanlarına göz at →</Link>
        </p>
      </div>

      {/* Hızlı başvuru formu (URL'den ilan ID'si geliyorsa) */}
      {apply && <ApplyJobForm jobId={apply} />}

      {/* Gelen teklifler */}
      {offers.length > 0 && (
        <section>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Send size={16} aria-hidden /> Gelen Teklifler
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {offers.map((offer: any) => (
              <div key={offer.id} style={{ background: 'var(--surface-2)', borderRadius: '10px', padding: '16px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>{offer.business?.name}</div>
                    {offer.jobPost && <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{offer.jobPost.title}</div>}
                    {offer.message && <p style={{ fontSize: '13px', marginTop: '8px', color: 'var(--text)' }}>{offer.message}</p>}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{dtFmt(offer.sentAt)}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Başvurular */}
      <section>
        <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Briefcase size={16} aria-hidden /> Başvurularım ({applications.length})
        </h2>
        {applications.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)', background: 'var(--surface-2)', borderRadius: '12px' }}>
            Henüz bir iş ilanına başvurmadınız. <Link href="/jobs" style={{ color: 'var(--accent)' }}>İlanları incele</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {applications.map((app: any) => (
              <div key={app.id} style={{ background: 'var(--surface-2)', borderRadius: '10px', padding: '16px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>{app.jobPost?.title}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{app.jobPost?.business?.name}</div>
                    {app.coverLetter && (
                      <p style={{ fontSize: '13px', marginTop: '8px', color: 'var(--text-secondary)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {app.coverLetter}
                      </p>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span className={`badge ${STATUS_CLASS[app.status] || ''}`} style={{ fontSize: '11px' }}>
                      {STATUS_TR[app.status] || app.status}
                    </span>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{dtFmt(app.appliedAt)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
