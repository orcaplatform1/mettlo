import Link from 'next/link';
import { ShieldCheck, UserCog } from 'lucide-react';
import { StatusBadge } from '@mettlo/ui';
import { staffLiftSanctionAction } from '@/app/actions/staff';
import { getStaffSummary } from '@/app/lib/admin';
import { CoachDecisionForm, DeleteForm, EditProfileForm, SanctionForms } from './staff-forms';

const fmt = (d?: string) => (d ? new Date(d).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' }) : '');
const ROLE: Record<string, string> = { SUPER_ADMIN: 'süper admin', ADMIN: 'admin' };

/** Üye / abone / koç profilinde admin ve süper admine görünen yönetim paneli: düzenle, askıya al, yasakla, sil, koç başvurusu kararı. */
export async function StaffPanel({ username }: { username: string }) {
  const u = await getStaffSummary(username);
  if (!u) return null;
  const c = u.creatorProfile;
  const isCoach = u.role === 'CREATOR' || !!c;
  return (
    <section className="container" style={{ paddingBlock: 32 }} aria-label="Yönetim paneli">
      <div className="staff-panel stack" style={{ ['--stack' as string]: '16px' }}>
        <div className="title"><UserCog size={18} aria-hidden /> Yönetim — yalnızca admin ve süper admine görünür · Her işlem denetim kaydına yazılır</div>
        <div className="row row-wrap" style={{ gap: 10 }}>
          <span className="badge">{u.role === 'CREATOR' ? 'Koç' : c ? 'Koç adayı' : 'Üye / abone'}</span><StatusBadge status={u.status} />
          {c && <StatusBadge status={c.status} />}
        </div>

        {c && (
          <div className="card stack" style={{ ['--stack' as string]: '10px', background: 'rgba(255,255,255,.03)' }}>
            <h3 className="h5 row" style={{ gap: 8 }}><ShieldCheck size={16} aria-hidden /> Koç başvurusu</h3>
            {c.approvedBy && <p className="body-sm"><b>@{c.approvedBy.username}</b> ({ROLE[c.approvedBy.role] ?? c.approvedBy.role}) tarafından başvurusu onaylandı · {fmt(c.approvedAt)}</p>}
            {c.rejectedBy && <p className="body-sm text-error"><b>@{c.rejectedBy.username}</b> ({ROLE[c.rejectedBy.role] ?? c.rejectedBy.role}) tarafından başvurusu reddedildi · {fmt(c.rejectedAt)}{c.rejectionReason ? ` — ${c.rejectionReason}` : ''}</p>}
            {!c.approvedBy && !c.rejectedBy && <p className="body-sm text-secondary">Başvuru henüz karara bağlanmadı.</p>}
            <CoachDecisionForm userId={u.id} username={u.username} status={c.status} />
          </div>
        )}

        {u.accountSanctions.length > 0 && (
          <div className="stack" style={{ ['--stack' as string]: '8px' }}>
            {u.accountSanctions.map((s: any) => (
              <div key={s.id} className="row between row-wrap" style={{ gap: 8 }}>
                <span className="body-sm"><b>{s.type === 'SUSPENSION' ? 'Süreli askı' : s.type === 'BAN' ? 'Kalıcı yasak' : 'Uyarı'}</b>{s.endsAt ? ` · ${fmt(s.endsAt)} tarihine kadar` : ''} · {s.reason}</span>
                <form action={staffLiftSanctionAction.bind(null, s.id, u.username)}><button className="btn btn-secondary btn-sm" type="submit">Kaldır</button></form>
              </div>
            ))}
          </div>
        )}

        <EditProfileForm userId={u.id} username={u.username} isCoach={isCoach} u={u} />
        <SanctionForms userId={u.id} username={u.username} canBan maxDays={90} />
        <DeleteForm userId={u.id} />
        <p className="caption text-tertiary">Tam kayıt geçmişi için <Link className="text-coral" href="/admin/audit">Denetim Kayıtları</Link> (süper admin tümünü, admin ekip loglarını görür).</p>
      </div>
    </section>
  );
}
