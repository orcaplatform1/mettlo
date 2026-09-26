'use client';
import { useState } from 'react';
import { formatTRY } from '@mettlo/utils';
import { StatusBadge } from '@mettlo/ui';
import { togglePlanAction, deletePlanAction } from '../../actions';
import { EditPlanForm } from './plan-form';

export function PlanCards({ plans }: { plans: any[] }) {
  const [editing, setEditing] = useState<string | null>(null);

  if (plans.length === 0) return <p className="body-sm text-muted">Henüz plan yok.</p>;

  return (
    <div className="stack" style={{ ['--stack' as string]: '12px' }}>
      {plans.map((p) =>
        editing === p.id ? (
          <EditPlanForm key={p.id} plan={p} onClose={() => setEditing(null)} />
        ) : (
          <div key={p.id} className="card stack" style={{ ['--stack' as string]: '8px' }}>
            <div className="row between">
              <h2 className="h5">{p.name}</h2>
              <StatusBadge status={p.isActive ? 'ACTIVE' : 'CLOSED'} />
            </div>
            <p className="h3">{formatTRY(p.priceWeb)} <span className="body-sm text-tertiary">/ {p.interval === 'ANNUAL' ? 'yıl' : 'ay'}</span></p>
            {p.priceMobile && <p className="caption text-tertiary">Mobil fiyat: {formatTRY(p.priceMobile)} <span style={{ fontSize: 10, opacity: .7 }}>(AppStore/PlayStore komisyonu dahil)</span></p>}
            {p.isPremiumLive && <span className="badge badge-premium">Premium Live</span>}
            <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
              <form action={togglePlanAction.bind(null, p.id, !p.isActive)}>
                <button className="btn btn-secondary btn-sm" type="submit">{p.isActive ? 'Pasife Al' : 'Aktifleştir'}</button>
              </form>
              <button className="btn btn-secondary btn-sm" type="button" onClick={() => setEditing(p.id)}>Düzenle</button>
              <form action={deletePlanAction.bind(null, p.id)} onSubmit={(e) => { if (!confirm(`"${p.name}" planını silmek istediğinize emin misiniz?`)) e.preventDefault(); }}>
                <button className="btn btn-danger btn-sm" type="submit">Sil</button>
              </form>
            </div>
          </div>
        )
      )}
    </div>
  );
}
