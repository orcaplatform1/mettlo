import { Shield } from 'lucide-react';
import { Avatar } from '@mettlo/ui';
import { authed, requireSession } from '@mettlo/web-core';
import { unblockUserAction } from '@/app/actions/blocks';

export default async function BlocksPage() {
  await requireSession('/app/settings/blocks');
  const blocks = await authed<any[]>('/blocks').catch(() => []);

  return (
    <div className="stack" style={{ ['--stack' as string]: '20px', maxWidth: 760 }}>
      <div>
        <h1 className="h2 row" style={{ gap: 10 }}><Shield aria-hidden /> Engellenen Kullanıcılar</h1>
        <p className="text-secondary body-sm">Engellediğiniz kullanıcılar size mesaj gönderemez, profilinizi göremez.</p>
      </div>

      {blocks.length === 0 ? (
        <div className="card" style={{ padding: '40px 24px', textAlign: 'center' }}>
          <Shield size={36} style={{ color: 'var(--color-tertiary)', margin: '0 auto 12px' }} aria-hidden />
          <p className="body-sm text-secondary">Engellediğiniz kullanıcı yok.</p>
        </div>
      ) : (
        <div className="stack" style={{ ['--stack' as string]: '8px' }}>
          {blocks.map((b: any) => (
            <div key={b.id} className="card row between row-wrap" style={{ gap: 12, padding: '14px 16px' }}>
              <div className="row" style={{ gap: 12 }}>
                <Avatar name={b.blocked?.name ?? b.blocked?.username ?? '?'} src={b.blocked?.avatarUrl} size={48} />
                <div>
                  <b>{b.blocked?.name ?? b.blocked?.username}</b>
                  <p className="caption text-tertiary">@{b.blocked?.username}</p>
                  {b.reason && <p className="caption text-secondary" style={{ marginTop: 2, maxWidth: 300 }}>{b.reason}</p>}
                </div>
              </div>
              <form action={unblockUserAction.bind(null, b.blocked?.username ?? '')}>
                <button className="btn btn-secondary btn-sm" type="submit">Engeli Kaldır</button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
