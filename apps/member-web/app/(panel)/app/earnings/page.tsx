import { authed, requireSession } from '@mettlo/web-core';
import Link from 'next/link';
import { PayoutRequestForm } from './payout-form';

const fmt = (kurus: number) =>
  (kurus / 100).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' });

export default async function KazanclarPage() {
  const s = await requireSession('/app/earnings');
  if (s.role !== 'CREATOR') {
    return (
      <div className="stack">
        <h1 className="h2">Kazançlarım</h1>
        <p className="text-secondary">Bu sayfa yalnızca koçlar için geçerlidir.</p>
      </div>
    );
  }

  const [balance, history, accounts] = await Promise.all([
    authed<any>('/earnings').catch(() => null),
    authed<any>('/earnings/history?limit=10').catch(() => ({ items: [], total: 0 })),
    authed<any[]>('/payout-accounts').catch(() => []),
  ]);

  const activeAccount = (accounts ?? []).find((a: any) => a.isActive && a.status === 'VERIFIED');

  return (
    <div className="stack" style={{ ['--stack' as string]: '24px', maxWidth: 720 }}>
      <h1 className="h2">Kazançlarım</h1>

      {/* Bakiye kartları */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        {[
          { label: 'Toplam Kazanç', value: balance?.totalEarnings ?? 0 },
          { label: 'Bekleyen', value: balance?.pending ?? 0 },
          { label: 'Çekilebilir', value: balance?.available ?? 0 },
          { label: 'Toplam Ödenen', value: balance?.totalPaidOut ?? 0 },
        ].map(({ label, value }) => (
          <div key={label} className="card" style={{ padding: '14px 16px' }}>
            <p className="body-sm text-secondary">{label}</p>
            <p className="h4" style={{ marginTop: 4 }}>{fmt(Math.round(value * 100))}</p>
          </div>
        ))}
      </div>

      {/* Para çekme */}
      <section className="card stack" style={{ ['--stack' as string]: '14px', padding: 20 }}>
        <h2 className="h4">Para Çek</h2>
        {!activeAccount ? (
          <div className="stack" style={{ ['--stack' as string]: '8px' }}>
            <p className="text-secondary body-sm">Para çekebilmek için doğrulanmış bir banka hesabı eklemeniz gerekiyor.</p>
            <Link href="/app/earnings/bank-account" className="btn btn-primary btn-sm">Banka Hesabı Ekle</Link>
          </div>
        ) : (
          <PayoutRequestForm
            availableKurus={Math.round((balance?.available ?? 0) * 100)}
            account={activeAccount}
          />
        )}
      </section>

      {/* Banka hesapları */}
      <section className="card stack" style={{ ['--stack' as string]: '12px', padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="h4">Banka Hesaplarım</h2>
          <Link href="/app/earnings/bank-account" className="btn btn-sm">+ Yeni Hesap</Link>
        </div>
        {(accounts ?? []).length === 0 ? (
          <p className="text-secondary body-sm">Henüz banka hesabı eklenmedi.</p>
        ) : (
          (accounts ?? []).map((a: any) => (
            <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p className="body-sm"><strong>{a.accountHolderName}</strong></p>
                <p className="body-sm text-secondary">{a.maskedIban}</p>
                {a.bankName && <p className="body-sm text-secondary">{a.bankName}</p>}
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {a.isActive && <span className="badge badge-ok">Aktif</span>}
                <span className={`badge ${a.status === 'VERIFIED' ? 'badge-ok' : a.status === 'REJECTED' ? 'badge-danger' : ''}`}>
                  {a.status === 'VERIFIED' ? 'Doğrulandı' : a.status === 'PENDING_VERIFICATION' ? 'Doğrulama Bekleniyor' : a.status === 'REJECTED' ? 'Reddedildi' : a.status}
                </span>
              </div>
            </div>
          ))
        )}
      </section>

      {/* Son ödemeler */}
      <section className="card stack" style={{ ['--stack' as string]: '10px', padding: 20 }}>
        <h2 className="h4">Son Kazançlar</h2>
        {history?.items?.length === 0 ? (
          <p className="text-secondary body-sm">Henüz kazanç kaydı yok.</p>
        ) : (
          history?.items?.map((e: any) => (
            <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: 8 }}>
              <div>
                <p className="body-sm"><strong>{fmt(Math.round(e.creatorShare * 100))}</strong></p>
                <p className="body-sm text-secondary">{e.type} · {e.period}</p>
              </div>
              <p className="body-sm text-secondary" style={{ textAlign: 'right' }}>
                {new Date(e.createdAt).toLocaleDateString('tr-TR')}
                {e.commissionRate !== null && <><br /><span>%{e.commissionRate} komisyon</span></>}
              </p>
            </div>
          ))
        )}
        {history?.total > 10 && (
          <Link href="/app/earnings/gecmis" className="body-sm text-secondary">Tümünü gör ({history.total})</Link>
        )}
      </section>
    </div>
  );
}
