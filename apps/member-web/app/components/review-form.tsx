'use client';
import { useActionState, useState } from 'react';
import { Star } from 'lucide-react';
import { Alert, noResetSubmit } from '@mettlo/ui';
import { submitReviewAction, type ReviewState } from '../actions/reviews';

export function ReviewForm({ username }: { username: string }) {
  const [state, action, pending] = useActionState<ReviewState, FormData>(submitReviewAction.bind(null, username), {});
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  if (state.ok) return <Alert kind="success">{(state as any).pending ? 'Değerlendirmen incelemeye alındı, onaylanınca yayınlanacak. Teşekkürler!' : 'Değerlendirmen yayınlandı, teşekkürler!'}</Alert>;
  return (
    <form onSubmit={noResetSubmit(action)} className="stack" style={{ ['--stack' as string]: '14px' }} noValidate>
      {state.error && <Alert kind="error">{state.error}</Alert>}
      <div>
        <span className="label" id="rate-l">Puanın</span>
        <div className="star-input" role="radiogroup" aria-labelledby="rate-l" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} yıldız`} className={(hover || rating) >= n ? 'on' : ''}
              onMouseEnter={() => setHover(n)} onClick={() => setRating(n)}><Star size={28} fill="currentColor" aria-hidden /></button>
          ))}
        </div>
        <input type="hidden" name="rating" value={rating} />
        {state.fieldErrors?.rating && <p className="field-error" role="alert">{state.fieldErrors.rating}</p>}
      </div>
      <div className="field">
        <label htmlFor="rbody">Yorumun</label>
        <textarea id="rbody" name="body" className="textarea" maxLength={1000} placeholder="Koç, programlar ve derslerle ilgili deneyimini paylaş…" aria-invalid={!!state.fieldErrors?.body} />
        {state.fieldErrors?.body ? <p className="field-error" role="alert">{state.fieldErrors.body}</p> : <p className="field-hint">Sosyal medya hesabı, bağlantı veya iletişim bilgisi paylaşılamaz.</p>}
      </div>
      <button className="btn btn-primary" type="submit" disabled={pending || rating === 0}>{pending ? 'Gönderiliyor…' : 'Değerlendirmeyi Gönder'}</button>
    </form>
  );
}
