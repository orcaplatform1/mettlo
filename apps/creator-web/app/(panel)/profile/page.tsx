import { authed, requireSession } from '@mettlo/web-core';
import { ProfileForm } from './profile-form';
import { SubCategoriesForm } from './sub-categories-form';
import { CoverUpload } from './cover-upload';
import { AvatarUpload } from './avatar-upload';

export default async function ProfilePage() {
  const [s, me, subs] = await Promise.all([requireSession('/creator/profile', ['CREATOR']), authed<any>('/creators/me'), authed<any[]>('/creators/me/sub-categories')]);
  return (
    <div className="stack" style={{ ['--stack' as string]: '28px', maxWidth: 760 }}>
      <div>
        <h1 className="h2">Profilim</h1>
        <p className="text-secondary body-sm" style={{ marginTop: 6 }}>Ziyaretçiler ve abone olmayanlar koçları bu bilgilere bakarak seçer. Bağlantı, sosyal medya hesabı, telefon veya e-posta paylaşılamaz.</p>
      </div>

      <section className="card stack" style={{ ['--stack' as string]: '16px' }}>
        <h2 className="h4">Kapak Fotoğrafı</h2>
        <p className="body-sm text-secondary">Profilinin üst kısmında görünür. Seni en iyi yansıtan bir görsel seç.</p>
        <CoverUpload currentCover={me.coverUrl ?? null} />
      </section>

      <section className="card stack" style={{ ['--stack' as string]: '16px' }}>
        <h2 className="h4">Profil Fotoğrafı</h2>
        <AvatarUpload name={me.displayName} currentAvatar={s.avatarUrl ?? null} />
      </section>

      <section className="card stack" style={{ ['--stack' as string]: '16px' }}>
        <h2 className="h4">Profil Bilgileri</h2>
        <ProfileForm me={me} />
      </section>

      <SubCategoriesForm groups={subs} />
    </div>
  );
}
