import { authed } from '@mettlo/web-core';
import { ProfileForm } from './profile-form';
import { SubCategoriesForm } from './sub-categories-form';

export default async function ProfilePage() {
  const [me, subs] = await Promise.all([authed<any>('/creators/me'), authed<any[]>('/creators/me/sub-categories')]);
  return (
    <div className="stack" style={{ ['--stack' as string]: '20px', maxWidth: 760 }}>
      <h1 className="h2">Profilim</h1>
      <p className="text-secondary body-sm">Ziyaretçiler ve abone olmayanlar koçları bu bilgilere bakarak seçer. Bağlantı, sosyal medya hesabı, telefon veya e-posta paylaşılamaz.</p>
      <ProfileForm me={me} />
      <SubCategoriesForm groups={subs} />
    </div>
  );
}
