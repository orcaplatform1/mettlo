import type { Metadata } from 'next';
import { LegalDoc } from '@/app/components/legal';
import { sections } from '@/app/lib/legal-content/terms';

export const metadata: Metadata = { title: 'Kullanım Koşulları', description: 'Mettlo platformunun kullanım koşulları: üyelik, koç ve abone hakları, yasaklı davranışlar, ödeme, içerik ve sorumluluklar.', alternates: { canonical: '/terms' } };

export default function Terms() {
  return <LegalDoc current="/terms" title="Kullanım Koşulları" lead="Mettlo’yu kullanırken uyacağımız kurallar, haklarımız ve sorumluluklarımız. Lütfen üye olmadan önce dikkatle okuyun." sections={sections} />;
}
