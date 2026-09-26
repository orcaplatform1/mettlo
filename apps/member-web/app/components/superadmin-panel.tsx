import Link from 'next/link';
import type { ReactNode } from 'react';
import { HeartPulse, Inbox, ShieldAlert } from 'lucide-react';
import { formatTRY } from '@mettlo/utils';

const fmt = (v: unknown): ReactNode => {
  if (v === null || v === undefined || v === '') return <span className="text-muted">—</span>;
  if (typeof v === 'boolean') return v ? 'Evet' : 'Hayır';
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v)) return new Date(v).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' });
  if (typeof v === 'object') return <code className="caption">{JSON.stringify(v).slice(0, 140)}</code>;
  return String(v);
};

function Rows({ rows, cols }: { rows: any[]; cols: Array<[string, (r: any) => ReactNode]> }) {
  if (!rows?.length) return <p className="body-sm text-muted">Kayıt yok.</p>;
  return (
    <div className="table-wrap">
      <table className="table">
        <thead><tr>{cols.map(([h]) => <th key={h}>{h}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={r.id ?? i}>{cols.map(([h, f]) => <td key={h}>{f(r)}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

function Block({ title, count, children }: { title: string; count?: number; children: ReactNode }) {
  return (
    <details className="card" style={{ padding: 0 }}>
      <summary style={{ padding: '14px 20px', cursor: 'pointer', fontWeight: 600 }}>{title}{count !== undefined && <span className="badge" style={{ marginLeft: 10 }}>{count}</span>}</summary>
      <div style={{ padding: '0 20px 20px' }}>{children}</div>
    </details>
  );
}

/** Koç Mesaj Kutusu butonu — yalnızca SUPER_ADMIN için dolu `data` gelir. */
export function CoachInboxButton({ username, data }: { username: string; data: any }) {
  if (!data?.coachInbox?.available) return null;
  return (
    <Link href={`/profile/${username}/inbox`} className="btn btn-primary btn-pill">
      <Inbox size={18} aria-hidden /> {data.coachInbox.label ?? 'Koç Mesaj Kutusu'}
    </Link>
  );
}

export function SuperAdminPanel({ username, data }: { username: string; data: any }) {
  if (!data?.personalInfoVisible) return null;
  const p = data.personal ?? {};
  const a = data.activity ?? {};
  const coachOf = (c: any) => c.with?.find((w: any) => w.role === 'CREATOR')?.username;

  return (
    <section className="container" style={{ paddingBlock: 40 }} aria-label="Süper admin görünümü">
      <div className="staff-panel stack" style={{ ['--stack' as string]: '20px' }}>
        <div className="title"><ShieldAlert size={18} aria-hidden /> SÜPER ADMIN GÖRÜNÜMÜ</div>

        <div className="row row-wrap">
          <CoachInboxButton username={username} data={data} />
          <Link href={`/profile/${username}/health`} className="btn btn-secondary btn-pill"><HeartPulse size={18} aria-hidden /> Sağlık Verileri</Link>
        </div>

        <details>
          <summary style={{ cursor: 'pointer', fontWeight: 600, paddingBlock: 4 }}>Kişisel Bilgiler</summary>
          <dl className="kv" style={{ marginTop: 12 }}>
            <dt>Ad Soyad</dt><dd>{fmt(p.fullName ?? data.name)}</dd>
            <dt>Kullanıcı adı</dt><dd>@{data.username}</dd>
            <dt>E-posta</dt><dd>{fmt(data.email)} {data.emailVerifiedAt ? <span className="badge badge-ok">doğrulanmış</span> : <span className="badge">doğrulanmamış</span>}</dd>
            <dt>Telefon</dt><dd>{fmt(p.phone)}</dd>
            <dt>Adres</dt><dd>{fmt(p.address)}</dd>
            <dt>Şehir / İlçe / Posta kodu</dt><dd>{fmt([p.city, p.district, p.postalCode].filter(Boolean).join(' / '))}</dd>
            <dt>Doğum tarihi</dt><dd>{data.birthDate ? new Date(data.birthDate).toLocaleDateString('tr-TR') : '—'}</dd>
            <dt>Cinsiyet</dt><dd>{fmt(p.gender)}</dd>
            <dt>Acil durum kişisi</dt><dd>{fmt(p.emergencyContact)}</dd>
            <dt>Rol / Durum</dt><dd><span className="badge">{data.role}</span> <span className={`badge ${data.status === 'ACTIVE' ? 'badge-ok' : 'badge-danger'}`}>{data.status}</span> {data.statusReason && <span className="text-tertiary">({data.statusReason})</span>}</dd>
            <dt>2FA</dt><dd>{fmt(data.twoFactorEnabled)}</dd>
            <dt>Kayıt tarihi / Son giriş</dt><dd>{fmt(data.createdAt)} · {fmt(data.lastLoginAt)}</dd>
            <dt>Kayıt IP / cihaz</dt><dd>{fmt(p.registrationIp)} · <span className="caption text-tertiary">{p.registrationUserAgent}</span></dd>
            {data.deletionRequest && (<><dt>Silme talebi</dt><dd><span className="badge badge-danger">{data.deletionRequest.status}</span> · uygulanma: {fmt(data.deletionRequest.executeAfter)}</dd></>)}
          </dl>
        </details>

        {data.creatorProfile && (
          <>
            <hr className="divider" />
            <h2 className="h4">Koç Profili</h2>
            <dl className="kv">
              <dt>Görünen ad</dt><dd>{data.creatorProfile.displayName}</dd>
              <dt>Durum</dt><dd><span className="badge">{data.creatorProfile.status}</span> {data.creatorProfile.isPublic ? <span className="badge badge-ok">yayında</span> : <span className="badge">gizli</span>}</dd>
              <dt>Beyan edilen öğrenci / kullanılan davet</dt><dd>{data.creatorProfile.inviteQuotaDeclared} / {data.creatorProfile.inviteQuotaUsed}</dd>
              <dt>Abone / takipçi / puan</dt><dd>{data.creatorProfile.subscribersCount} · {data.creatorProfile.followersCount} · {String(data.creatorProfile.ratingAvg)} ({data.creatorProfile.ratingCount})</dd>
            </dl>
          </>
        )}

        <hr className="divider" />
        <h2 className="h4">Hesap Verileri</h2>
        <div className="stack" style={{ ['--stack' as string]: '10px' }}>
          <Block title="Abonelikler" count={data.subscriptions?.length}>
            <Rows rows={data.subscriptions} cols={[['Plan', (r) => r.plan?.name], ['Fiyat', (r) => r.plan && formatTRY(r.plan.priceWeb)], ['Durum', (r) => r.status], ['Kanal', (r) => r.channel], ['Dönem sonu', (r) => fmt(r.currentPeriodEnd)]]} />
          </Block>
          <Block title="Erişim hakları (entitlement)" count={data.entitlements?.length}>
            <Rows rows={data.entitlements} cols={[['Kaynak', (r) => r.source], ['Durum', (r) => r.status], ['Başlangıç', (r) => fmt(r.startsAt)], ['Bitiş', (r) => fmt(r.endsAt)]]} />
          </Block>
          <Block title="Ödemeler" count={data.payments?.length}>
            <Rows rows={data.payments} cols={[['Tür', (r) => r.kind], ['Kanal', (r) => r.channel], ['Durum', (r) => r.status], ['Tutar', (r) => formatTRY(r.amount, { fractionDigits: 2 })], ['Tarih', (r) => fmt(r.createdAt)]]} />
          </Block>
          <Block title="Siparişler" count={data.orders?.length}>
            <Rows rows={data.orders} cols={[['No', (r) => r.number], ['Durum', (r) => r.status], ['Tutar', (r) => formatTRY(r.total, { fractionDigits: 2 })], ['Teslimat adresi', (r) => fmt(r.shippingAddress)], ['Tarih', (r) => fmt(r.createdAt)]]} />
          </Block>
          <Block title="Faturalar" count={data.invoices?.length}>
            <Rows rows={data.invoices} cols={[['No', (r) => r.number], ['Durum', (r) => r.status], ['Tutar', (r) => formatTRY(r.total, { fractionDigits: 2 })], ['Kesim', (r) => fmt(r.issuedAt)]]} />
          </Block>
          <Block title="Antrenman kayıtları" count={a.workoutLogs?.length}>
            <Rows rows={a.workoutLogs} cols={[['Başlangıç', (r) => fmt(r.startedAt)], ['Tamamlandı', (r) => fmt(r.completedAt)], ['Süre (sn)', (r) => fmt(r.durationSec)], ['Set/tekrar', (r) => fmt(r.entries)], ['Not', (r) => fmt(r.notes)]]} />
          </Block>
          <Block title="Programlar" count={a.programs?.length}>
            <Rows rows={a.programs} cols={[['Program', (r) => r.program?.title], ['Başlangıç', (r) => fmt(r.startedAt)], ['Gün', (r) => r.currentDay], ['İlerleme', (r) => `%${r.progressPct}`]]} />
          </Block>
          <Block title="Challenge katılımı" count={a.challenges?.length}>
            <Rows rows={a.challenges} cols={[['Challenge', (r) => r.challenge?.title], ['Katılım', (r) => fmt(r.joinedAt)], ['Puan', (r) => r.score], ['Tamamlandı', (r) => fmt(r.completedAt)]]} />
          </Block>
          <Block title="Rezervasyonlar" count={a.bookings?.length}>
            <Rows rows={a.bookings} cols={[['Ders', (r) => r.session?.title], ['Zaman', (r) => fmt(r.session?.startsAt)], ['Durum', (r) => r.status]]} />
          </Block>
          <Block title="Canlı ders katılımı" count={a.liveAttendance?.length}>
            <Rows rows={a.liveAttendance} cols={[['Ders', (r) => r.session?.title], ['Giriş', (r) => fmt(r.joinedAt)], ['Dakika', (r) => r.minutes]]} />
          </Block>
          <Block title="Koçluk ilişkileri" count={(data.coaching?.asMember?.length ?? 0) + (data.coaching?.asCoach?.length ?? 0)}>
            <p className="label" style={{ marginBottom: 8 }}>Üye olarak (koçları)</p>
            <Rows rows={data.coaching?.asMember} cols={[['Koç', (r) => <Link className="text-coral" href={`/profile/${r.creator.username}`}>@{r.creator.username}</Link>], ['Durum', (r) => r.status], ['Hedef', (r) => fmt(r.goal)], ['Başlangıç', (r) => fmt(r.startedAt)]]} />
            <p className="label" style={{ margin: '16px 0 8px' }}>Koç olarak (öğrencileri)</p>
            <Rows rows={data.coaching?.asCoach} cols={[['Üye', (r) => <Link className="text-coral" href={`/profile/${r.member.username}`}>@{r.member.username}</Link>], ['Durum', (r) => r.status], ['Hedef', (r) => fmt(r.goal)]]} />
          </Block>
          <Block title="Check-in'ler" count={a.checkins?.length}>
            <Rows rows={a.checkins} cols={[['Tarih', (r) => fmt(r.createdAt)], ['Hafta', (r) => fmt(r.weekNo)], ['Kilo', (r) => fmt(r.weightKg)], ['Cevaplar', (r) => fmt(r.answers)], ['Koç yanıtı', (r) => fmt(r.coachReply)]]} />
          </Block>
          <Block title="Yorumlar" count={a.reviews?.length}>
            <Rows rows={a.reviews} cols={[['Hedef', (r) => r.targetType], ['Puan', (r) => r.rating], ['Yorum', (r) => fmt(r.body)], ['Durum', (r) => r.status]]} />
          </Block>
          <Block title="Konuşmalar (üst veri)" count={data.conversations?.length}>
            <Rows rows={data.conversations} cols={[
              ['Karşı taraf', (r) => r.with?.map((w: any) => `@${w.username} (${w.role})`).join(', ')],
              ['Mesaj', (r) => r.messageCount], ['Son mesaj', (r) => fmt(r.lastMessageAt)],
              ['İçerik', (r) => coachOf(r) ? <Link className="text-coral" href={`/profile/${coachOf(r)}/inbox/${r.id}`}>Oku</Link> : (data.role === 'CREATOR' ? <Link className="text-coral" href={`/profile/${username}/inbox/${r.id}`}>Oku</Link> : '—')],
            ]} />
          </Block>
          <Block title="Sağlık paylaşım rızaları" count={data.healthSharing?.length}>
            <Rows rows={data.healthSharing} cols={[['Koç', (r) => r.creator?.username && `@${r.creator.username}`], ['Verildi', (r) => fmt(r.grantedAt)], ['Geri alındı', (r) => fmt(r.revokedAt)]]} />
          </Block>
          <Block title="KVKK / iletişim rızaları" count={data.consents?.length}>
            <Rows rows={data.consents} cols={[['Tür', (r) => r.type], ['Sürüm', (r) => r.textVersion], ['Tarih', (r) => fmt(r.createdAt)], ['IP', (r) => fmt(r.ip)]]} />
          </Block>
          <Block title="Yaptırımlar" count={data.sanctions?.length}>
            <Rows rows={data.sanctions} cols={[['Tür', (r) => r.type], ['Durum', (r) => r.status], ['Sebep', (r) => r.reason], ['Bitiş', (r) => fmt(r.endsAt)]]} />
          </Block>
          <Block title="Cihazlar ve oturumlar" count={(data.devices?.length ?? 0) + (data.sessions?.length ?? 0)}>
            <Rows rows={data.devices} cols={[['Platform', (r) => r.platform], ['Model', (r) => fmt(r.model)], ['Son görülme', (r) => fmt(r.lastSeenAt)]]} />
            <div style={{ height: 12 }} />
            <Rows rows={data.sessions} cols={[['IP', (r) => fmt(r.ip)], ['Tarayıcı', (r) => <span className="caption">{r.userAgent}</span>], ['Son kullanım', (r) => fmt(r.lastUsedAt)], ['İptal', (r) => fmt(r.revokedAt)]]} />
          </Block>
          <Block title="Engellenen Kullanıcılar" count={data.blocks?.length}>
            <Rows rows={data.blocks ?? []} cols={[
              ['Engellenen', (r) => <Link className="text-coral" href={`/profile/${r.blocked?.username}`}>@{r.blocked?.username}</Link>],
              ['Neden', (r) => fmt(r.reason)],
              ['Tarih', (r) => fmt(r.createdAt)],
            ]} />
          </Block>
          <Block title="Sosyal etkinlik">
            <dl className="kv"><dt>Paylaşım / yorum / mesaj</dt><dd>{data.social?.posts} / {data.social?.comments} / {data.social?.messagesSent}</dd><dt>Takip edilen / takipçi</dt><dd>{data.social?.following} / {data.social?.followers}</dd><dt>Toplam XP</dt><dd>{data.social?.xp}</dd></dl>
          </Block>
        </div>
      </div>
    </section>
  );
}
