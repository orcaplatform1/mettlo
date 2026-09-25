import { formatTRY } from '@mettlo/utils';
import { StatusBadge } from '@mettlo/ui';
import { authed } from '@mettlo/web-core';
import { togglePlanAction } from '../../actions';
import { PlanForm } from './plan-form';

export default async function PlansPage() {
  const plans = await authed<any[]>('/creators/me/plans');
  return (
    <div className="stack" style={{ ['--stack' as string]: '24px' }}>
      <h1 className="h2">Abonelik Planları</h1>
      <p className="text-secondary body-sm">Fiyatı sen belirlersin. Mettlo tüm koç satışlarından sabit %20 komisyon alır. Aboneler planına göre içeriklerine, programlarına ve canlı derslerine erişir.</p>
      <div className="grid grid-3">{plans.map((p) => (
        <div key={p.id} className="card stack" style={{ ['--stack' as string]: '8px' }}>
          <div className="row between"><h2 className="h5">{p.name}</h2><StatusBadge status={p.isActive ? 'ACTIVE' : 'CLOSED'} /></div>
          <p className="h3">{formatTRY(p.priceWeb)} <span className="body-sm text-tertiary">/ {p.interval === 'ANNUAL' ? 'yıl' : 'ay'}</span></p>
          {p.priceMobile && <p className="caption text-tertiary">Mobil fiyat: {formatTRY(p.priceMobile)}</p>}{p.isPremiumLive && <span className="badge badge-premium">Premium Live</span>}
          <form action={togglePlanAction.bind(null, p.id, !p.isActive)}><button className="btn btn-secondary btn-sm" type="submit">{p.isActive ? 'Pasife al' : 'Aktifleştir'}</button></form>
        </div>))}</div>
      <PlanForm />
    </div>
  );
}
