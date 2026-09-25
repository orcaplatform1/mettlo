import type { Metadata } from 'next';
import { LegalDoc } from '@/app/components/legal';
import { sections } from '@/app/lib/legal-content/data-protection';

export const metadata: Metadata = { title: 'KVKK Aydınlatma Metni', description: '6698 sayılı KVKK kapsamında Mettlo aydınlatma metni: veri sorumlusu, işleme amaçları, hukuki sebepler, aktarım, saklama ve haklarınız.', alternates: { canonical: '/data-protection' } };

export default function DataProtection() {
  return <LegalDoc current="/data-protection" title="KVKK Aydınlatma Metni" lead="6698 sayılı Kanun’un 10. maddesi uyarınca, kişisel verilerinizin hangi amaçla ve hangi hukuki sebeplere dayanarak işlendiğini bu metinle bildiriyoruz." sections={sections} />;
}
