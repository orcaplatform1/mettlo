'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { BookOpen, ChevronDown, Dumbbell, CreditCard, HeartPulse, MessageCircle, Rocket, Search, ShieldCheck, ShoppingBag, User, Wrench, ArrowRight, X } from 'lucide-react';
import { CATEGORIES, FAQS, GUIDES, type HelpCategory } from '@/app/lib/help-data';
import { FaqAccordion as Accordion } from './faq-accordion';

const ICONS: Record<HelpCategory['icon'], typeof Rocket> = { rocket: Rocket, user: User, dumbbell: Dumbbell, card: CreditCard, message: MessageCircle, heart: HeartPulse, shield: ShieldCheck, bag: ShoppingBag, wrench: Wrench };
export const CatIcon = ({ name, size = 22 }: { name: HelpCategory['icon']; size?: number }) => { const I = ICONS[name]; return <I size={size} aria-hidden />; };

const norm = (s: string) => s.toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i');
const matches = (hay: string, q: string) => { const n = norm(hay); return norm(q).split(/\s+/).filter(Boolean).every((t) => n.includes(t)); };

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="help-search">
      <Search size={20} aria-hidden />
      <input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label="Ara" autoComplete="off" />
      {value && <button type="button" onClick={() => onChange('')} aria-label="Aramayı temizle"><X size={18} /></button>}
    </div>
  );
}

/** /faq: arama + kategori sekmeleri + akordeon. */
export function FaqExplorer() {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const list = useMemo(() => FAQS.filter((f) => (cat === 'all' || f.cat === cat) && (!q.trim() || matches(f.q + ' ' + f.a, q))), [q, cat]);
  return (
    <div className="stack" style={{ ['--stack' as string]: '24px' }}>
      <SearchBox value={q} onChange={setQ} placeholder="Sorunu yaz: ör. iptal, şifre, iade, sağlık verisi…" />
      <div className="chip-row" role="tablist" aria-label="Kategoriler">
        <button type="button" className="chip" aria-pressed={cat === 'all'} onClick={() => setCat('all')}>Tümü <b>{FAQS.length}</b></button>
        {CATEGORIES.map((c) => <button key={c.key} type="button" className="chip" aria-pressed={cat === c.key} onClick={() => setCat(c.key)}>{c.title}</button>)}
      </div>
      {list.length === 0
        ? <div className="card help-empty"><Search size={28} aria-hidden /><h3 className="h5">Sonuç bulunamadı</h3><p className="text-secondary body-sm">Farklı bir kelime dene veya <Link href="/contact" className="text-coral">bize yaz</Link>.</p></div>
        : <Accordion items={list} />}
      <p className="text-tertiary body-sm">{list.length} soru gösteriliyor.</p>
    </div>
  );
}

/** /help: büyük arama; yazınca SSS + rehber sonuçları, yazmayınca kategori kartları. */
export function HelpSearch() {
  const [q, setQ] = useState('');
  const active = q.trim().length > 0;
  const guides = useMemo(() => GUIDES.filter((g) => matches(g.title + ' ' + g.summary + ' ' + g.steps.join(' '), q)), [q]);
  const faqs = useMemo(() => FAQS.filter((f) => matches(f.q + ' ' + f.a, q)), [q]);
  return (
    <>
      <SearchBox value={q} onChange={setQ} placeholder="Yardım ara: hesap, abonelik, iade, sağlık verisi…" />
      {active ? (
        <div className="stack" style={{ ['--stack' as string]: '28px', marginTop: 28 }}>
          <section>
            <h2 className="h4" style={{ marginBottom: 14 }}>Rehberler <span className="text-tertiary body-sm">({guides.length})</span></h2>
            {guides.length === 0 ? <p className="text-secondary body-sm">Eşleşen rehber yok.</p> : <div className="grid grid-2">{guides.map((g) => <GuideCard key={g.slug} slug={g.slug} title={g.title} summary={g.summary} />)}</div>}
          </section>
          <section>
            <h2 className="h4" style={{ marginBottom: 14 }}>Sık sorulan sorular <span className="text-tertiary body-sm">({faqs.length})</span></h2>
            {faqs.length === 0 ? <p className="text-secondary body-sm">Eşleşen soru yok. <Link href="/contact" className="text-coral">Bize yazın</Link> veya üyeysen destek talebi aç.</p> : <Accordion items={faqs.slice(0, 12)} />}
          </section>
        </div>
      ) : (
        <>
          <div className="help-cats">
            {CATEGORIES.map((c) => (
              <Link key={c.key} href={`/help/category/${c.key}`} prefetch={false} className="card card-hover help-cat">
                <span className="help-cat-icon"><CatIcon name={c.icon} /></span>
                <h3 className="h5">{c.title}</h3>
                <p className="text-secondary body-sm">{c.desc}</p>
                <span className="caption text-tertiary">{[GUIDES.filter((g) => g.cat === c.key).length && `${GUIDES.filter((g) => g.cat === c.key).length} rehber`, `${FAQS.filter((f) => f.cat === c.key).length} soru`].filter(Boolean).join(' · ')}</span>
              </Link>
            ))}
          </div>
        </>
      )}
    </>
  );
}

export function GuideCard({ slug, title, summary }: { slug: string; title: string; summary: string }) {
  return (
    <Link href={`/help/${slug}`} prefetch={false} className="card card-hover guide-card">
      <BookOpen size={20} className="text-primary-c" aria-hidden />
      <div><h3 className="h5">{title}</h3><p className="text-secondary body-sm">{summary}</p></div>
      <ArrowRight size={18} aria-hidden className="text-coral" />
    </Link>
  );
}
