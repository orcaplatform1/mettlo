import { redirect } from 'next/navigation';

export default async function EventCheckoutRedirect({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(`/checkout/event-checkout/${slug}`);
}
