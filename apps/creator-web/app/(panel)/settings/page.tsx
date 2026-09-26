import { redirect } from 'next/navigation';
import { requireSession } from '@mettlo/web-core';

export default async function CreatorSettingsRedirect() {
  await requireSession('/creator/settings', ['CREATOR']);
  redirect('/app/settings');
}
