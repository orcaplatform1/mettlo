'use client';
import { useTransition } from 'react';
import { bookClassAction } from '@/app/actions/panel';

export function BookButton({ classId, path, full }: { classId: string; path: string; full: boolean }) {
  const [pending, start] = useTransition();
  return <button type="button" className="btn btn-primary btn-sm" disabled={pending} onClick={() => start(() => bookClassAction(classId, path))}>{pending ? '…' : full ? 'Bekleme listesine katıl' : 'Rezervasyon yap'}</button>;
}
