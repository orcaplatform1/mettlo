'use client';
import { useActionState } from 'react';
import { Alert, Select, noResetSubmit } from '@mettlo/ui';
import { createSubCategoryAction, renameSubCategoryAction, type FormState } from '../../actions';

export function CreateForm({ branches }: { branches: Array<{ slug: string; name: string }> }) {
  const [state, action, pending] = useActionState<FormState, FormData>(createSubCategoryAction, {});
  return (
    <form onSubmit={noResetSubmit(action)} className="card stack" style={{ ['--stack' as string]: '12px' }}>
      <h2 className="h5">Yeni alt kategori</h2>
      {state.ok && <Alert kind="success">{state.ok}</Alert>}{state.error && <Alert kind="error">{state.error}</Alert>}
      <div className="grid grid-2">
        <div className="field"><label htmlFor="sc-b">Branş</label><Select id="sc-b" name="branchSlug" defaultValue={branches[0]?.slug}>{branches.map((b) => <option key={b.slug} value={b.slug}>{b.name}</option>)}</Select></div>
        <div className="field"><label htmlFor="sc-n">Ad</label><input id="sc-n" name="name" className="input" required minLength={2} maxLength={140} placeholder="ör. Kettlebell" /></div>
      </div>
      <button className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start' }} type="submit" disabled={pending}>{pending ? 'Ekleniyor…' : 'Ekle'}</button>
    </form>
  );
}

export function RenameForm({ id, name, sortOrder }: { id: string; name: string; sortOrder: number }) {
  const [state, action, pending] = useActionState<FormState, FormData>(renameSubCategoryAction.bind(null, id), {});
  return (
    <form onSubmit={noResetSubmit(action)} className="row" style={{ gap: 8 }}>
      <input name="name" className="input" style={{ height: 36, minWidth: 320 }} defaultValue={name} maxLength={140} aria-label="Ad" />
      <input name="sortOrder" className="input" style={{ height: 36, width: 70 }} type="number" min={0} max={999} defaultValue={sortOrder} aria-label="Sıra" />
      <button className="btn btn-secondary btn-sm" type="submit" disabled={pending}>{pending ? '…' : state.ok ? '✓' : 'Kaydet'}</button>
    </form>
  );
}
