import type { Metadata } from 'next';
import Link from 'next/link';
import { Avatar } from '@mettlo/ui';
import { getTeam } from '@/app/lib/data';

export const metadata: Metadata = {
  title: 'Ekibimiz — Mettlo',
  description: 'Mettlo\'yu kuran ve büyüten ekiple tanış.',
  alternates: { canonical: '/team' },
};

const ROLE_LABEL: Record<string, string> = {
  founder: 'Kurucu',
  admin: 'Yönetici',
  moderator: 'Moderatör',
  support: 'Destek',
};

const STAR_COLOR: Record<string, string> = {
  founder: '#ef4444',
  admin: '#3b82f6',
  moderator: '#8b5cf6',
  support: '#10b981',
};

const BIOS: Record<string, string> = {
  mertdagdeviren: 'Merhaba ben Mert, Traders.TR başta olmak üzere farklı dijital hizmetler geliştiren, markalar yaratan ve bunları işleten bir girişimciyim. Mettlo\'yu, fitness ve wellness dünyasında koçlar ile üyeler arasındaki deneyimi daha profesyonel, kişisel ve sürdürülebilir bir yapıya taşımak amacıyla hayata geçirdim.\n\nMettlo ile hedefim; Türkiye\'de boşluk olan bu alanda, uzman koçların kendi sistemlerini özgürce tek bir alandan yönetebildiği, üyelerin ise ihtiyaçlarına uygun koçluk ve gelişim deneyimine tek bir platform üzerinden ulaşabildiği, yeni nesil bir ekosistem oluşturmaktır.',
  ozgurferik: 'Merhaba ben Özgür, Mettlo\'nun operasyonel ve stratejik süreçlerinde aktif rol alan bir yöneticiyim. Koçluk ekosisteminin ihtiyaçlarını yakından takip ediyor, Mettlo\'nun gelişim sürecinde işleyişin, kullanıcı deneyiminin ve büyüme süreçlerinin koordinasyonuna katkı sağlıyorum.\n\nMettlo\'nun operasyonlarından iş süreçlerine kadar farklı alanlarda ekibin koordinasyonunu destekleyerek, platformun büyüme sürecinde ölçeklenebilir ve güçlü bir organizasyon yapısının oluşturulmasına odaklanıyorum.',
};

function StarDot({ role }: { role: string }) {
  const color = STAR_COLOR[role] ?? '#6b7280';
  return (
    <span style={{ position: 'absolute', bottom: 4, right: 4, width: 22, height: 22, borderRadius: '50%', background: color, border: '2px solid var(--color-bg)', display: 'grid', placeItems: 'center', boxShadow: `0 0 8px ${color}88` }}>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#fff' }}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
    </span>
  );
}

export default async function TeamPage() {
  const team = await getTeam();
  const members = team ?? [];
  const ordered = [
    ...members.filter((m) => m.staffRole === 'founder'),
    ...members.filter((m) => m.staffRole !== 'founder'),
  ];

  return (
    <main>
      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, rgba(249,115,22,.08) 0%, transparent 60%)', borderBottom: '1px solid var(--border-soft)', padding: '80px 0 64px' }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: 640 }}>
          <h1 className="display gradient-text" style={{ marginBottom: 16 }}>Mettlo Ekibi</h1>
          <p className="lead text-secondary">Sağlık ve spor alışkanlıklarını herkese erişilebilir kılmak için azimle çalışan, kararlı bir ekibiz.</p>
        </div>
      </section>

      {/* Ekip kartları */}
      <section className="section-sm">
        <div className="container" style={{ maxWidth: 900 }}>
          <div className="stack" style={{ ['--stack' as string]: '28px' }}>
            {ordered.map((m) => {
              const bio = BIOS[m.username];
              const avatarSize = m.staffRole === 'founder' ? 120 : 96;
              return (
                <div key={m.username} className="card" style={{ padding: '36px 44px' }}>
                  {/* Masaüstü: yan yana | Mobil: dikey ortalı */}
                  <div className="team-member-card" style={{ display: 'flex', gap: 44, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    {/* Avatar + isim + rozet — mobilde tam ortalı */}
                    <div className="team-avatar-col" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, minWidth: 130, flex: '0 0 auto', textAlign: 'center', maxWidth: 160 }}>
                      <div style={{ position: 'relative', display: 'inline-block' }}>
                        <Avatar name={m.name} src={m.avatarUrl ?? undefined} size={avatarSize} />
                        <StarDot role={m.staffRole} />
                      </div>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: 15 }}>{m.name}</p>
                        <p className="caption text-tertiary">@{m.username}</p>
                      </div>
                      <span className={`badge badge-${m.staffRole === 'founder' ? 'founder' : m.staffRole === 'admin' ? 'admin' : ''}`}>{ROLE_LABEL[m.staffRole] ?? 'Ekip'}</span>
                    </div>

                    {/* Bio */}
                    {bio && (
                      <div style={{ flex: 1, minWidth: 240 }}>
                        {bio.split('\n\n').map((para, i) => (
                          <p key={i} className="body-sm text-secondary" style={{ lineHeight: 1.75, marginBottom: 12, fontSize: 14 }}>{para}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
