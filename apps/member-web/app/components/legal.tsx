import type { ReactNode } from 'react';
import Link from 'next/link';
import { FileText, Info } from 'lucide-react';
import { COMPANY, LEGAL_UPDATED } from '@/app/lib/company';

export interface LegalSection { id: string; title: string; body: ReactNode }

const LEGAL_LINKS: Array<[string, string]> = [
  ['/terms', 'Kullanım Koşulları'], ['/privacy', 'Gizlilik Politikası'], ['/data-protection', 'KVKK Aydınlatma Metni'],
  ['/cookie-policy', 'Çerez Politikası'], ['/distance-sales-agreement', 'Mesafeli Satış Sözleşmesi'], ['/disclaimer', 'Sorumluluk Reddi'],
];

/** Şirket kimliği kutusu: yalnızca doldurulmuş alanlar görünür. */
export function CompanyBox() {
  const rows: Array<[string, string | null]> = [
    ['Unvan', COMPANY.legalName], ['MERSİS No', COMPANY.mersis], ['Vergi Dairesi / No', COMPANY.taxOffice && COMPANY.taxNo ? `${COMPANY.taxOffice} / ${COMPANY.taxNo}` : COMPANY.taxNo],
    ['Ticaret Sicil No', COMPANY.tradeRegistry], ['Adres', COMPANY.address], ['KEP', COMPANY.kep], ['Telefon', COMPANY.phone],
  ];
  const filled = rows.filter(([, v]) => v);
  return (
    <div className="legal-company">
      <b>Mettlo — bir Traders.TR ticari markasıdır</b>
      {filled.length > 0 ? <dl>{filled.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
        : <p>Şirket unvanı, MERSİS numarası ve tebligat adresi, platformun yayına alınma sürecinde bu bölüme eklenecektir.</p>}
    </div>
  );
}

/** Premium yasal sayfa iskeleti: başlık alanı, sabit içindekiler, numaralı bölümler, diğer yasal metinlere geçiş. */
export function LegalDoc({ overline = 'YASAL', title, lead, sections, current, children }: { overline?: string; title: string; lead: string; sections: LegalSection[]; current: string; children?: ReactNode }) {
  return (
    <>
      <div className="legal-hero">
        <div className="container">
          <span className="overline text-coral">{overline}</span>
          <h1 className="h1" style={{ margin: '10px 0 14px' }}>{title}</h1>
          <p className="text-secondary body-lg" style={{ maxWidth: 760 }}>{lead}</p>
          <div className="legal-meta">
            <span className="badge badge-live"><FileText size={12} aria-hidden /> Yürürlük: {LEGAL_UPDATED}</span>
            <span className="text-tertiary body-sm">Son güncelleme: {LEGAL_UPDATED}</span>
          </div>
        </div>
      </div>
      <div className="container legal-layout">
        <aside className="legal-toc" aria-label="İçindekiler">
          <p className="overline">İçindekiler</p>
          <ol>{sections.map((s, i) => <li key={s.id}><a href={`#${s.id}`}><span>{i + 1}</span>{s.title}</a></li>)}</ol>
          <p className="overline" style={{ marginTop: 22 }}>Diğer yasal metinler</p>
          <ul>{LEGAL_LINKS.filter(([h]) => h !== current).map(([h, l]) => <li key={h}><Link href={h} prefetch={false}>{l}</Link></li>)}</ul>
        </aside>
        <article className="legal-body">
          {children}
          {sections.map((s, i) => (
            <section key={s.id} id={s.id} className="legal-sec">
              <h2><span>{String(i + 1).padStart(2, '0')}</span>{s.title}</h2>
              <div className="legal-text">{s.body}</div>
            </section>
          ))}
          <div className="legal-foot">
            <Info size={16} aria-hidden />
            <p>Bu metne ilişkin sorularınız için <Link href="/contact" className="text-coral">iletişim formunu</Link> kullanabilir veya <a className="text-coral" href="mailto:iletisim@mettlo.tr">iletisim@mettlo.tr</a> adresine yazabilirsiniz.</p>
          </div>
        </article>
      </div>
    </>
  );
}

