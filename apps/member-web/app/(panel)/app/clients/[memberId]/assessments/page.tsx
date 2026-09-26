import Link from 'next/link';
import { ArrowLeft, ClipboardList, Send } from 'lucide-react';
import { authed, requireSession } from '@mettlo/web-core';
import { SendAssessmentBtn } from './send-assessment-btn';

type Template = { id: string; title: string; description?: string; questions: { id: string; label: string; type: string }[] };
type Response = { id: string; status: string; periodLabel?: string; template: { title: string }; createdAt: string; items: { id: string; valueText?: string; valueNumber?: number; question: { label: string; type: string } }[] };

export default async function ClientAssessmentsPage({ params }: { params: { memberId: string } }) {
  await requireSession('/app', ['CREATOR']);
  const [templates, responses] = await Promise.all([
    authed<Template[]>('/coaching/assessments').catch(() => [] as Template[]),
    authed<Response[]>(`/coaching/clients/${params.memberId}/assessments`).catch(() => [] as Response[]),
  ]);

  const STATUS_LABEL: Record<string, string> = { PENDING: 'Bekliyor', DRAFT: 'Taslak', SUBMITTED: 'Gönderildi', REVIEWED: 'İncelendi' };
  const STATUS_COLOR: Record<string, string> = { PENDING: '#f59e0b', DRAFT: '#94a3b8', SUBMITTED: '#3b82f6', REVIEWED: '#22c55e' };

  return (
    <main style={{ maxWidth: 860, margin: '0 auto', padding: '28px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
        <Link href={`/app/clients/${params.memberId}`} style={{ color: 'var(--color-text-2)', display: 'flex' }}><ArrowLeft size={20} /></Link>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}><ClipboardList size={20} /> Değerlendirmeler</h1>
      </div>

      {/* Şablon seçip gönder */}
      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Form Gönder</h2>
        {templates.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <p style={{ fontSize: 13, color: 'var(--color-text-2)', margin: 0 }}>Henüz şablon yok.</p>
            <Link href="/app/assessments" style={{ fontSize: 13, color: 'var(--color-primary)' }}>Şablon oluştur →</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {templates.map((t) => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 10, background: 'var(--color-surface-1)', border: '1px solid var(--color-border)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{t.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-2)' }}>{t.questions.length} soru</div>
                </div>
                <SendAssessmentBtn memberId={params.memberId} templateId={t.id} templateTitle={t.title} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Gönderilen formlar */}
      <section>
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Gönderilen Formlar</h2>
        {responses.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--color-text-2)' }}>Henüz yanıt yok.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {responses.map((r) => (
              <div key={r.id} style={{ padding: '14px 18px', borderRadius: 10, background: 'var(--color-surface-1)', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: r.items.length > 0 ? 10 : 0 }}>
                  <span style={{ flex: 1, fontWeight: 600, fontSize: 14 }}>{r.template.title}</span>
                  {r.periodLabel && <span style={{ fontSize: 11, color: 'var(--color-text-2)' }}>{r.periodLabel}</span>}
                  <span style={{ fontSize: 11, fontWeight: 700, color: STATUS_COLOR[r.status] ?? '#94a3b8' }}>{STATUS_LABEL[r.status] ?? r.status}</span>
                </div>
                {r.items.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {r.items.map((item) => (
                      <div key={item.id} style={{ fontSize: 12 }}>
                        <span style={{ fontWeight: 600, color: 'var(--color-text-2)' }}>{item.question.label}: </span>
                        {item.valueText ?? (item.valueNumber != null ? String(item.valueNumber) : '—')}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
