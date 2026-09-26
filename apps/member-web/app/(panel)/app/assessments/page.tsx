import Link from 'next/link';
import { ClipboardList, Plus } from 'lucide-react';
import { authed, requireSession } from '@mettlo/web-core';
import { CreateTemplateBtn } from './create-template-btn';

type Template = { id: string; title: string; description?: string; isRecurring: boolean; questions: { id: string }[]; createdAt: string };

export default async function AssessmentsPage() {
  await requireSession('/app', ['CREATOR']);
  const templates = await authed<Template[]>('/coaching/assessments').catch(() => [] as Template[]);

  return (
    <main style={{ maxWidth: 860, margin: '0 auto', padding: '28px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}><ClipboardList size={22} /> Değerlendirme Formları</h1>
        <CreateTemplateBtn />
      </div>

      {templates.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--color-text-2)' }}>
          <ClipboardList size={36} style={{ marginBottom: 12, opacity: 0.4 }} />
          <div style={{ fontSize: 14 }}>Henüz form şablonu yok</div>
          <div style={{ fontSize: 12, marginTop: 6 }}>Müşterilerinize gönderebileceğiniz değerlendirme formları oluşturun.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {templates.map((t) => (
            <div key={t.id} style={{ padding: '16px 20px', borderRadius: 12, background: 'var(--color-surface-1)', border: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{t.title}</div>
                  {t.description && <div style={{ fontSize: 12, color: 'var(--color-text-2)', marginTop: 2 }}>{t.description}</div>}
                  <div style={{ fontSize: 11, color: 'var(--color-text-3)', marginTop: 6, display: 'flex', gap: 10 }}>
                    <span>{t.questions.length} soru</span>
                    {t.isRecurring && <span style={{ color: '#3b82f6' }}>Periyodik</span>}
                    <span>{new Date(t.createdAt).toLocaleDateString('tr-TR')}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
