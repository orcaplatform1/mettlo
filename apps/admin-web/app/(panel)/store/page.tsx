import { formatTRY } from '@mettlo/utils';
import { StatusBadge } from '@mettlo/ui';
import { apiTry, authed } from '@mettlo/web-core';
import { toggleProductAction } from '../../actions';
import { StoreForms } from './store-forms';

export default async function StorePage() {
  const [products, brands, cats] = await Promise.all([authed<any[]>('/admin/products'), apiTry<any[]>('/public/brands'), apiTry<any[]>('/public/product-categories')]);
  return (
    <div className="stack" style={{ ['--stack' as string]: '24px' }}>
      <h1 className="h2">Mettlo Mağaza</h1>
      <p className="text-secondary body-sm">Ürünler yalnızca Mettlo tarafından satılır. Koçlar ürün satmaz. Ürün sayfalarında sağlık/tedavi iddiası kullanma.</p>
      <div className="table-wrap"><table className="table"><thead><tr><th>Ürün</th><th>Marka / kategori</th><th>Fiyat</th><th>Stok</th><th>Durum</th><th /></tr></thead><tbody>
        {products.length === 0 && <tr><td colSpan={6} className="text-muted">Ürün yok.</td></tr>}
        {products.map((p) => (<tr key={p.id}><td>{p.name}<br /><code className="caption">/product/{p.slug}</code></td><td>{p.brand?.name ?? '—'} / {p.category?.name ?? '—'}</td><td>{formatTRY(p.price, { fractionDigits: 2 })}</td><td>{p.variants.reduce((n: number, v: any) => n + v.stock, 0)}</td><td><StatusBadge status={p.isPublished ? 'PUBLISHED' : 'DRAFT'} /></td>
          <td><form action={toggleProductAction.bind(null, p.id, !p.isPublished)}><button className="btn btn-secondary btn-sm" type="submit">{p.isPublished ? 'Yayından kaldır' : 'Yayınla'}</button></form></td></tr>))}
      </tbody></table></div>
      <StoreForms brands={brands ?? []} cats={cats ?? []} />
    </div>
  );
}
