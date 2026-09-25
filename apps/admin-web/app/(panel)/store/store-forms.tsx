'use client';
import { useActionState } from 'react';
import { Alert, noResetSubmit, Select } from '@mettlo/ui';
import { createBrandAction, createCategoryAction, createProductAction, type FormState } from '../../actions';

function Msg({ s }: { s: FormState }) { return <>{s.ok && <Alert kind="success">{s.ok}</Alert>}{s.error && <Alert kind="error">{s.error}</Alert>}</>; }

export function StoreForms({ brands, cats }: { brands: any[]; cats: any[] }) {
  const [ps, pa, pp] = useActionState<FormState, FormData>(createProductAction, {});
  const [bs, ba, bp] = useActionState<FormState, FormData>(createBrandAction, {});
  const [cs, ca, cp] = useActionState<FormState, FormData>(createCategoryAction, {});
  return (
    <div className="grid grid-2" style={{ alignItems: 'start' }}>
      <form onSubmit={noResetSubmit(pa)} className="card stack" style={{ ['--stack' as string]: '12px' }}>
        <h2 className="h4">Yeni ürün</h2><Msg s={ps} />
        <div className="field"><label htmlFor="pn">Ürün adı</label><input id="pn" name="name" className="input" required maxLength={140} /></div>
        <div className="field"><label htmlFor="pd">Açıklama</label><textarea id="pd" name="description" className="textarea" rows={3} maxLength={5000} /></div>
        <div className="grid grid-2"><div className="field"><label htmlFor="pb">Marka</label><Select id="pb" name="brandSlug" className="select"><option value="">—</option>{brands.map((b) => <option key={b.slug} value={b.slug}>{b.name}</option>)}</Select></div>
          <div className="field"><label htmlFor="pc">Kategori</label><Select id="pc" name="categorySlug" className="select"><option value="">—</option>{cats.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</Select></div>
          <div className="field"><label htmlFor="pp">Fiyat (₺, KDV dahil)</label><input id="pp" name="price" type="number" step="0.01" min={0} className="input" required /></div>
          <div className="field"><label htmlFor="pcp">Liste fiyatı (₺)</label><input id="pcp" name="compareAtPrice" type="number" step="0.01" min={0} className="input" /></div>
          <div className="field"><label htmlFor="ps">Stok</label><input id="ps" name="stock" type="number" min={0} defaultValue={0} className="input" /></div>
          <div className="field"><label htmlFor="pi">Görsel adresi</label><input id="pi" name="image" type="url" className="input" placeholder="https://…" /></div></div>
        <label className="check"><input type="checkbox" name="isPublished" />Hemen yayınla</label>
        <button className="btn btn-primary" type="submit" disabled={pp} style={{ alignSelf: 'flex-start' }}>Ürünü Kaydet</button>
      </form>
      <div className="stack" style={{ ['--stack' as string]: '20px' }}>
        <form onSubmit={noResetSubmit(ba)} className="card stack" style={{ ['--stack' as string]: '12px' }}><h2 className="h4">Yeni marka</h2><Msg s={bs} /><div className="field"><label htmlFor="bn">Marka adı</label><input id="bn" name="name" className="input" required maxLength={80} /></div><button className="btn btn-secondary" type="submit" disabled={bp} style={{ alignSelf: 'flex-start' }}>Marka Ekle</button></form>
        <form onSubmit={noResetSubmit(ca)} className="card stack" style={{ ['--stack' as string]: '12px' }}><h2 className="h4">Yeni kategori</h2><Msg s={cs} /><div className="field"><label htmlFor="cn">Kategori adı</label><input id="cn" name="name" className="input" required maxLength={80} /></div><button className="btn btn-secondary" type="submit" disabled={cp} style={{ alignSelf: 'flex-start' }}>Kategori Ekle</button></form>
      </div>
    </div>
  );
}
