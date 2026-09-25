import { authed } from '@mettlo/web-core';
import { deleteSubCategoryAction, updateSubCategoryAction } from '../../actions';
import { CreateForm, RenameForm } from './forms';

export default async function SubCategoriesPage() {
  const branches = await authed<any[]>('/admin/sub-categories');
  return (
    <div className="stack" style={{ ['--stack' as string]: '22px', maxWidth: 900 }}>
      <h1 className="h2">Alt Kategoriler</h1>
      <p className="text-secondary body-sm">Branşlara bağlı alt kategorileri yalnızca süper admin yönetir. Yeni kategori eklemek için yazılım güncellemesi gerekmez. Pasif kategori keşif filtresinde ve koç panelinde görünmez; silmek koçlardaki seçimleri de kaldırır.</p>
      <CreateForm branches={branches.map((b) => ({ slug: b.slug, name: b.name }))} />
      {branches.filter((b) => b.subCategories.length > 0).map((b) => (
        <section key={b.slug} className="card stack" style={{ ['--stack' as string]: '10px' }}>
          <h2 className="h5">{b.name} {!b.isActive && <span className="badge">Yakında</span>}</h2>
          {b.subCategories.map((s: any) => (
            <div key={s.id} className="row row-wrap between" style={{ padding: '10px 0', borderTop: '1px solid var(--border-soft)', gap: 12 }}>
              <div className="row row-wrap" style={{ gap: 12 }}><RenameForm id={s.id} name={s.name} sortOrder={s.sortOrder} /><span className="caption text-tertiary">{s.coachCount} koç · /{s.slug}</span></div>
              <div className="row" style={{ gap: 8 }}>
                <form action={updateSubCategoryAction.bind(null, s.id, { isActive: !s.isActive })}><button className={`btn btn-sm ${s.isActive ? 'btn-secondary' : 'btn-primary'}`} type="submit">{s.isActive ? 'Pasif yap' : 'Aktif yap'}</button></form>
                <form action={deleteSubCategoryAction.bind(null, s.id)}><button className="btn btn-danger btn-sm" type="submit">Sil</button></form>
              </div>
            </div>
          ))}
        </section>
      ))}
      <p className="caption text-tertiary">Alt kategorisi olmayan branşlarda koç paneli alt kategori seçicisi göstermez.</p>
    </div>
  );
}
