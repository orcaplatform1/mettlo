import { authed, requireSession } from '@mettlo/web-core';
import { can } from '@mettlo/types';
import { CommissionEditForm } from './commission-form';

export default async function CommissionSettingsPage() {
  const s = await requireSession('/admin/settings/commission');
  if (!can(s.role, 'system:settings')) {
    return <p className="text-secondary">Bu sayfayı görme yetkiniz yok.</p>;
  }

  let items: any[] = [];
  try { items = await authed<any[]>('/admin/commission'); } catch { /* boş */ }

  const LABELS: Record<string, string> = {
    default: 'Varsayılan', SUBSCRIPTION_PLAN: 'İçerik Aboneliği', ONE_TO_ONE_COACHING: '1:1 Koçluk',
    PROGRAM: 'Program', CHALLENGE: 'Challenge', SESSION: 'Oturum Seansı',
    live_credit: 'Canlı Kredi', EVENT_TICKET: 'Etkinlik Bileti', FOOD_ORDER: 'Yiyecek Siparişi',
  };

  return (
    <div className="stack" style={{ ['--stack' as string]: '20px', maxWidth: 640 }}>
      <h1 className="page-title">Komisyon Oranları</h1>
      <p className="text-secondary body-sm">Tüm oranlar yüzde (%) cinsinden. platformPct + creatorPct = 100 olmalı. Her değişiklik denetim kaydına yazılır.</p>

      <div className="stack" style={{ ['--stack' as string]: '10px' }}>
        {items.map((c: any) => (
          <div key={c.key} className="card" style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div>
                <p><strong>{LABELS[c.key] ?? c.key}</strong></p>
                <p className="body-sm text-secondary">Anahtar: <code>{c.key}</code></p>
                {c.description && <p className="body-sm text-secondary">{c.description}</p>}
                <p className="body-sm">
                  Platform: <strong>%{Number(c.platformPct)}</strong> &nbsp;·&nbsp;
                  Koç/İşletme: <strong>%{Number(c.creatorPct)}</strong>
                </p>
              </div>
              <CommissionEditForm commissionKey={c.key} platformPct={Number(c.platformPct)} creatorPct={Number(c.creatorPct)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
