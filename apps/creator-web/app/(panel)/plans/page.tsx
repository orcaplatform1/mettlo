import { authed } from '@mettlo/web-core';
import { PlanCards } from './plan-cards';
import { PlanForm } from './plan-form';

export default async function PlansPage() {
  const plans = await authed<any[]>('/creators/me/plans');
  return (
    <div className="stack" style={{ ['--stack' as string]: '24px' }}>
      <h1 className="h2">Abonelik Planları</h1>
      <p className="text-secondary body-sm">Fiyatı sen belirlersin. Mettlo tüm koç satışlarından sabit %20 komisyon alır. Aboneler planına göre içeriklerine, programlarına ve canlı derslerine erişir.</p>
      <PlanCards plans={plans ?? []} />
      <PlanForm />
    </div>
  );
}
