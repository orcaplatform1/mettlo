import { authed, requireSession } from '@mettlo/web-core';
import { can } from '@mettlo/types';
import { FeatureFlagToggle } from './feature-flag-toggle';

export default async function FeaturesSettingsPage() {
  const s = await requireSession('/admin/settings/features');
  if (!can(s.role, 'system:settings')) {
    return <p className="text-secondary">Bu sayfayı görme yetkiniz yok.</p>;
  }

  let items: any[] = [];
  try { items = await authed<any[]>('/admin/platform-config'); } catch { /* boş */ }

  const LABELS: Record<string, string> = {
    ENABLE_FOOD_BUSINESS: 'Sağlıklı Beslenme İşletmesi Modülü',
    ENABLE_EVENTS: 'Etkinlik Modülü',
    ENABLE_COACH_JOBS: 'Koç İş İlanı Panosu',
    ENABLE_AI_MATCHING: 'AI Eşleştirme (Claude Haiku)',
    AUTO_PAYOUT_ENABLED: 'Otomatik Para Çekme',
    PAYOUT_MIN_AMOUNT_KURUS: 'Minimum Para Çekme (kuruş)',
    PAYOUT_SETTLEMENT_DAYS: 'Settlement Bekleme Süresi (gün)',
  };

  const boolFlags = ['ENABLE_FOOD_BUSINESS', 'ENABLE_EVENTS', 'ENABLE_COACH_JOBS', 'ENABLE_AI_MATCHING', 'AUTO_PAYOUT_ENABLED'];

  return (
    <div className="stack" style={{ ['--stack' as string]: '20px', maxWidth: 640 }}>
      <h1 className="page-title">Özellik Bayrakları & Platform Ayarları</h1>
      <p className="text-secondary body-sm">Her değişiklik denetim kaydına yazılır. false/true için anahtar değerini değiştirin.</p>

      <div className="stack" style={{ ['--stack' as string]: '8px' }}>
        {items.map((c: any) => (
          <div key={c.key} className="card" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div>
              <p><strong>{LABELS[c.key] ?? c.key}</strong></p>
              <p className="body-sm text-secondary"><code>{c.key}</code></p>
              {c.description && <p className="body-sm text-secondary">{c.description}</p>}
            </div>
            <FeatureFlagToggle
              configKey={c.key}
              value={c.value}
              isBool={boolFlags.includes(c.key)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
