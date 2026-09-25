'use client';
import { useActionState } from 'react';
import { Alert, noResetSubmit } from '@mettlo/ui';
import { saveSubCategoriesAction, type FormState } from '../../actions';

interface Group { branch: { slug: string; name: string }; items: Array<{ id: string; name: string; selected: boolean }> }

/** Koçun kendi branşlarındaki alt kategoriler (çoklu seçim; 0 veya daha fazla). Alt kategorisi olmayan branşta bu bölüm görünmez. */
export function SubCategoriesForm({ groups }: { groups: Group[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveSubCategoriesAction, {});
  if (!groups.length) return null;
  return (
    <form onSubmit={noResetSubmit(action)} className="card stack" style={{ ['--stack' as string]: '16px' }}>
      <div><h2 className="h4">Alt kategoriler</h2><p className="text-secondary body-sm" style={{ marginTop: 4 }}>Uzmanlık alanlarını seç; keşif ekranında bu kategorilerde filtreleyen üyeler seni bulur. Birden fazla seçebilirsin.</p></div>
      {state.ok && <Alert kind="success">{state.ok}</Alert>}{state.error && <Alert kind="error">{state.error}</Alert>}
      {groups.map((g) => (
        <fieldset key={g.branch.slug} className="apply-group"><legend>{g.branch.name}</legend>
          <div className="chip-row">
            {g.items.map((i) => (
              <label key={i.id} className="sub-chip"><input type="checkbox" name="sub" value={i.id} defaultChecked={i.selected} /><span>{i.name}</span></label>
            ))}
          </div>
        </fieldset>
      ))}
      <button className="btn btn-primary" type="submit" disabled={pending} style={{ alignSelf: 'flex-start' }}>{pending ? 'Kaydediliyor…' : 'Alt kategorileri kaydet'}</button>
    </form>
  );
}
