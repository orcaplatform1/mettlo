import { redirect } from 'next/navigation';

export default function OldBusinessSlugPage({ params }: { params: { slug: string } }) {
  redirect(`/business/${params.slug}`);
}
