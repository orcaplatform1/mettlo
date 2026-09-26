import { redirect } from 'next/navigation';
import { authed, requireSession } from '@mettlo/web-core';
import { can } from '@mettlo/types';

export default async function TaxDocPage({ params }: { params: Promise<{ verificationId: string }> }) {
  const s = await requireSession('/admin/businesses');
  if (!can(s.role, 'business:verify')) {
    return <p className="text-secondary">Bu belgeyi görme yetkiniz yok.</p>;
  }

  const { verificationId } = await params;
  // Backend şifreli URL'yi çözer, denetim kaydeder ve URL döner
  const result = await authed<{ url: string }>(`/admin/businesses/verification/${verificationId}/tax-doc`);
  redirect(result.url);
}
