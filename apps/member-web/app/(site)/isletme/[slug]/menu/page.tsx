import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Utensils, ArrowLeft } from 'lucide-react';
import { apiTry } from '@mettlo/web-core';
import { FoodMenuClient } from './menu-client';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const ba = await apiTry<{ name: string }>(`/business/${encodeURIComponent(slug)}`);
  if (!ba) return { title: 'Menü bulunamadı' };
  return {
    title: `${ba.name} — Menü | Mettlo`,
    description: `${ba.name} yemek menüsünü keşfet ve online sipariş ver.`,
    alternates: { canonical: `/isletme/${slug}/menu` },
  };
}

export default async function BusinessMenuPage({ params }: Props) {
  const { slug } = await params;
  const ba = await apiTry<{ id: string; name: string; logoUrl?: string }>(`/business/${encodeURIComponent(slug)}`);
  if (!ba) notFound();

  const menuData = await apiTry<{ categories: any[]; items: any[] }>(`/business/${ba.id}/menu`).catch(() => null);
  if (!menuData) {
    return (
      <div className="container section-sm" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <Link href={`/isletme/${slug}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '14px', textDecoration: 'none', marginBottom: '24px' }}>
          <ArrowLeft size={14} /> {ba.name}
        </Link>
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
          <Utensils size={40} aria-hidden style={{ display: 'block', margin: '0 auto 16px', opacity: 0.4 }} />
          <p>Bu işletmenin henüz menüsü bulunmuyor.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container section-sm" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <Link href={`/isletme/${slug}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '14px', textDecoration: 'none', marginBottom: '24px' }}>
        <ArrowLeft size={14} /> {ba.name}
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        {ba.logoUrl && <img src={ba.logoUrl} alt={ba.name} style={{ width: '48px', height: '48px', borderRadius: '10px', objectFit: 'cover' }} />}
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700 }}>{ba.name}</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Utensils size={12} aria-hidden /> Yemek Menüsü
          </p>
        </div>
      </div>

      <FoodMenuClient businessId={ba.id} categories={menuData.categories} items={menuData.items} />
    </div>
  );
}
