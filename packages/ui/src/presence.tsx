'use client';
import { useEffect, useState } from 'react';
import { OnlineDot } from './online-dot';

type Status = 'online' | 'offline' | null;
const base = () => (typeof location !== 'undefined' ? (['/creator', '/admin'].find((p) => location.pathname.startsWith(p)) ?? '') : '');

/** Sitede açık olan her sekme 45 sn'de bir nabız gönderir (sekme gizliyken durur). Giriş yapmamış ziyaretçi yalnızca anonim sayılır. */
export function PresenceBeacon() {
  useEffect(() => {
    const ping = () => { if (!document.hidden) void fetch(`${base()}/presence-ping`, { method: 'POST', keepalive: true, cache: 'no-store' }).catch(() => {}); };
    ping();
    const t = setInterval(ping, 45_000);
    document.addEventListener('visibilitychange', ping);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', ping); };
  }, []);
  return null;
}

// Aynı sayfadaki tüm noktalar tek istekte sorgulanır
const cache = new Map<string, Status>();
const subs = new Set<() => void>();
const wanted = new Set<string>();
let timer: ReturnType<typeof setTimeout> | undefined;
async function flush() {
  timer = undefined;
  const names = [...wanted]; wanted.clear();
  if (!names.length) return;
  try {
    const r = await fetch(`${base()}/presence-status?usernames=${encodeURIComponent(names.join(','))}`, { cache: 'no-store' });
    const j = (await r.json()) as Record<string, Status>;
    for (const n of names) cache.set(n, j[n] ?? null);
  } catch { /* önceki değer kalsın */ }
  subs.forEach((f) => f());
}
const want = (n: string) => { wanted.add(n); if (!timer) timer = setTimeout(flush, 60); };

/** Kullanıcının yeşil (çevrimiçi) / kırmızı (çevrimdışı) noktası. Ziyaretçiye ve durumunu gizleyen kullanıcıya hiçbir şey çizilmez. */
export function OnlineStatus({ username, label = false, size = 10 }: { username: string; label?: boolean; size?: number }) {
  const [, tick] = useState(0);
  useEffect(() => {
    const f = () => tick((n) => n + 1);
    subs.add(f); want(username);
    const t = setInterval(() => want(username), 30_000);
    return () => { subs.delete(f); clearInterval(t); };
  }, [username]);
  return <OnlineDot status={cache.get(username)} label={label} size={size} />;
}
