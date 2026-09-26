'use client';
import { useTransition } from 'react';
import { deleteStoryAction } from '../../actions';

export function StoryDeleteBtn({ storyId }: { storyId: string }) {
  const [pending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!confirm('Bu hikayeyi silmek istediğinizden emin misiniz?')) return;
    startTransition(() => deleteStoryAction(storyId));
  };

  return (
    <button
      className="btn btn-sm"
      style={{ background: 'rgba(239,68,68,.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,.25)', gap: 4, display: 'flex', alignItems: 'center', fontSize: 12 }}
      onClick={handleDelete}
      disabled={pending}
    >
      {pending ? '…' : 'Sil'}
    </button>
  );
}
