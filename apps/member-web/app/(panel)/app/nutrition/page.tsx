import { Apple } from 'lucide-react';
import { ActionForm, DateField } from '@mettlo/ui';
import { authed, requireSession } from '@mettlo/web-core';
import { addNutritionLogAction, deleteNutritionLogAction, updateNutritionProfileAction } from '@/app/actions/sports';

export const metadata = { title: 'Beslenme Günlüğüm' };
const today = () => new Date().toISOString().slice(0, 10);

export default async function NutritionPage() {
  await requireSession('/app/nutrition');
  const o = await authed<any>('/nutrition/overview').catch(() => ({ profile: null, todayTotals: { calories: 0, proteinG: 0, carbG: 0, fatG: 0, waterMl: 0 }, logs: [] }));
  const p = o.profile;
  const t = o.todayTotals;

  const pct = (val: number, target: number | null) => target && target > 0 ? Math.min(100, Math.round((val / target) * 100)) : null;
  const calPct = pct(t.calories, p?.calorieTarget);
  const proPct = pct(t.proteinG, p?.proteinG);
  const carbPct = pct(t.carbG, p?.carbG);
  const fatPct = pct(t.fatG, p?.fatG);
  const watPct = pct(t.waterMl, p?.waterMl);

  return (
    <div className="stack" style={{ ['--stack' as string]: '24px', maxWidth: 960 }}>
      <div>
        <h1 className="h2 row" style={{ gap: 10 }}><Apple className="text-primary-c" aria-hidden /> Beslenme Günlüğüm</h1>
        <p className="text-secondary body-sm">Öğünlerini, kalori ve makro besin değerlerini kaydet. Korun beslenme geçmişini görebilir.</p>
      </div>

      <div className="stat-grid">
        <div className="stat-tile"><span className="n">{t.calories}{p?.calorieTarget ? `/${p.calorieTarget}` : ''}</span><span className="l">Bugün kalori{calPct !== null ? ` (${calPct}%)` : ''}</span></div>
        <div className="stat-tile"><span className="n">{t.proteinG}g{p?.proteinG ? `/${p.proteinG}g` : ''}</span><span className="l">Protein{proPct !== null ? ` (${proPct}%)` : ''}</span></div>
        <div className="stat-tile"><span className="n">{t.carbG}g{p?.carbG ? `/${p.carbG}g` : ''}</span><span className="l">Karbonhidrat{carbPct !== null ? ` (${carbPct}%)` : ''}</span></div>
        <div className="stat-tile"><span className="n">{t.fatG}g{p?.fatG ? `/${p.fatG}g` : ''}</span><span className="l">Yağ{fatPct !== null ? ` (${fatPct}%)` : ''}</span></div>
        <div className="stat-tile"><span className="n">{t.waterMl}ml{p?.waterMl ? `/${p.waterMl}ml` : ''}</span><span className="l">Su{watPct !== null ? ` (${watPct}%)` : ''}</span></div>
      </div>

      <div className="grid grid-2">
        <section className="card stack">
          <h2 className="h5">Öğün / Besin Ekle</h2>
          <ActionForm action={addNutritionLogAction} submit="Kaydet">
            <div className="grid grid-2">
              <div className="field"><label htmlFor="n-date">Tarih</label><DateField id="n-date" name="date" required max={today()} defaultValue={today()} /></div>
              <div className="field"><label htmlFor="n-label">Öğün / Besin adı</label><input id="n-label" name="label" className="input" required maxLength={100} placeholder="Öğle yemeği" /></div>
            </div>
            <div className="grid grid-3">
              <div className="field"><label htmlFor="n-cal">Kalori (kcal)</label><input id="n-cal" name="calories" className="input" type="number" min="0" max="5000" placeholder="500" /></div>
              <div className="field"><label htmlFor="n-pro">Protein (g)</label><input id="n-pro" name="proteinG" className="input" type="number" min="0" max="300" inputMode="decimal" placeholder="30" /></div>
              <div className="field"><label htmlFor="n-carb">Karbonhidrat (g)</label><input id="n-carb" name="carbG" className="input" type="number" min="0" max="500" inputMode="decimal" placeholder="60" /></div>
            </div>
            <div className="grid grid-2">
              <div className="field"><label htmlFor="n-fat">Yağ (g)</label><input id="n-fat" name="fatG" className="input" type="number" min="0" max="300" inputMode="decimal" placeholder="15" /></div>
              <div className="field"><label htmlFor="n-water">Su (ml)</label><input id="n-water" name="waterMl" className="input" type="number" min="0" max="3000" placeholder="500" /></div>
            </div>
          </ActionForm>
        </section>

        <section className="card stack">
          <h2 className="h5">Bugünkü Kayıtlar</h2>
          {o.logs.filter((l: any) => l.date === today()).length === 0
            ? <p className="text-tertiary body-sm">Bugün henüz öğün eklenmedi.</p>
            : o.logs.filter((l: any) => l.date === today()).map((l: any) => (
              <div key={l.id} className="row between" style={{ borderTop: '1px solid var(--border-soft)', paddingTop: 6 }}>
                <div>
                  <b className="body-sm">{l.label}</b>
                  <p className="caption text-tertiary">{[l.calories && `${l.calories} kcal`, l.proteinG && `P: ${l.proteinG}g`, l.carbG && `K: ${l.carbG}g`, l.fatG && `Y: ${l.fatG}g`, l.waterMl && `Su: ${l.waterMl}ml`].filter(Boolean).join(' · ')}</p>
                </div>
                <form action={deleteNutritionLogAction.bind(null, l.id)}><button className="btn btn-ghost btn-sm" type="submit">Sil</button></form>
              </div>
            ))
          }
        </section>
      </div>

      <section className="card stack">
        <h2 className="h5">Günlük Hedefler</h2>
        <p className="body-sm text-secondary">Koçun hedefleri belirleyebilir ya da kendin aşağıdan ayarlayabilirsin.</p>
        <ActionForm action={updateNutritionProfileAction} submit="Hedefleri Güncelle">
          <div className="grid grid-3">
            <div className="field"><label htmlFor="np-cal">Kalori hedefi</label><input id="np-cal" name="calorieTarget" className="input" type="number" min="500" max="8000" placeholder="2000" defaultValue={p?.calorieTarget ?? ''} /></div>
            <div className="field"><label htmlFor="np-pro">Protein (g)</label><input id="np-pro" name="proteinG" className="input" type="number" min="0" max="400" placeholder="150" defaultValue={p?.proteinG ?? ''} /></div>
            <div className="field"><label htmlFor="np-carb">Karbonhidrat (g)</label><input id="np-carb" name="carbG" className="input" type="number" min="0" max="800" placeholder="250" defaultValue={p?.carbG ?? ''} /></div>
          </div>
          <div className="grid grid-2">
            <div className="field"><label htmlFor="np-fat">Yağ (g)</label><input id="np-fat" name="fatG" className="input" type="number" min="0" max="300" placeholder="70" defaultValue={p?.fatG ?? ''} /></div>
            <div className="field"><label htmlFor="np-water">Su (ml)</label><input id="np-water" name="waterMl" className="input" type="number" min="0" max="5000" placeholder="2500" defaultValue={p?.waterMl ?? ''} /></div>
          </div>
        </ActionForm>
      </section>

      <section className="card stack">
        <h2 className="h5">Son 14 Gün Kayıtları</h2>
        {o.logs.length === 0 ? <p className="text-tertiary body-sm">Kayıt bulunamadı.</p> : o.logs.slice(0, 40).map((l: any) => (
          <div key={l.id} className="row between" style={{ borderTop: '1px solid var(--border-soft)', paddingTop: 6 }}>
            <div>
              <span className="body-sm"><b>{new Date(l.date).toLocaleDateString('tr-TR')}</b> · {l.label}</span>
              <p className="caption text-tertiary">{[l.calories && `${l.calories} kcal`, l.proteinG && `P: ${l.proteinG}g`, l.carbG && `K: ${l.carbG}g`, l.fatG && `Y: ${l.fatG}g`, l.waterMl && `Su: ${l.waterMl}ml`].filter(Boolean).join(' · ')}</p>
            </div>
            <form action={deleteNutritionLogAction.bind(null, l.id)}><button className="btn btn-ghost btn-sm" type="submit">Sil</button></form>
          </div>
        ))}
      </section>
    </div>
  );
}
