import type { ReactNode } from 'react';
import { Info } from 'lucide-react';
import { PageHead } from './list';

export function StaticPage({ overline, title, lead, draft, children }: { overline: string; title: string; lead?: string; draft?: boolean; children: ReactNode }) {
  return (
    <>
      <PageHead overline={overline} title={title}>{lead}</PageHead>
      <div className="container section-sm" style={{ maxWidth: 860 }}>
        {draft && <div className="alert alert-info" style={{ marginBottom: 28 }}><Info size={18} aria-hidden style={{ flex: 'none', marginTop: 2 }} /><div>Bu metin taslaktır; hukuk danışmanlığı sonrasında nihai haliyle yayımlanacaktır.</div></div>}
        <div className="stack text-secondary" style={{ ['--stack' as string]: '16px' }}>{children}</div>
      </div>
    </>
  );
}
