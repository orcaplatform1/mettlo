'use client';
import { useActionState, useEffect, useRef } from 'react';
import { Alert, noResetSubmit } from '@mettlo/ui';
import { commentAction, createPostAction, type FormState } from '@/app/actions/panel';

export function PostForm({ slug }: { slug: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(createPostAction.bind(null, slug), {});
  const ref = useRef<HTMLFormElement>(null); useEffect(() => { if (state.ok) ref.current?.reset(); }, [state]);
  return (
    <form ref={ref} onSubmit={noResetSubmit(action)} className="card stack" style={{ ['--stack' as string]: '10px' }}>
      {state.error && <Alert kind="error">{state.error}</Alert>}
      <textarea name="body" className="textarea" rows={3} maxLength={2000} placeholder="Topluluğa bir şeyler yaz…" required aria-label="Paylaşım" />
      <div className="row between"><label className="check"><input type="checkbox" name="isAnnouncement" />Duyuru (yalnızca koç)</label><button className="btn btn-primary btn-sm" type="submit" disabled={pending}>Paylaş</button></div>
    </form>
  );
}
export function CommentForm({ slug, postId }: { slug: string; postId: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(commentAction.bind(null, slug, postId), {});
  const ref = useRef<HTMLFormElement>(null); useEffect(() => { if (state.ok) ref.current?.reset(); }, [state]);
  return (<form ref={ref} onSubmit={noResetSubmit(action)} className="row" style={{ gap: 8 }}><input name="body" className="input" style={{ height: 40 }} placeholder="Yorum yaz…" maxLength={1000} required aria-label="Yorum" /><button className="btn btn-secondary btn-sm" type="submit" disabled={pending}>Gönder</button>{state.error && <span className="text-error caption">{state.error}</span>}</form>);
}
