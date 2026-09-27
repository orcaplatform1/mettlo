import { redirect } from 'next/navigation';
import { getSession } from '@mettlo/web-core';

export default async function ApplyCoachPage() {
  const session = await getSession();
  if (!session) redirect('/login?next=/apply/coach');
  redirect('/app/become-coach');
}
