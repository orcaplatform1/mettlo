import type { LegalSection } from './legal';

/** Yasal metnin düz (kenar çubuğu/başlık alanı olmayan) hâli: onay penceresinde gösterilir. */
export function LegalBody({ title, sections }: { title: string; sections: LegalSection[] }) {
  return (
    <div className="consent-doc">
      <h2 className="h4" style={{ marginBottom: 14 }}>{title}</h2>
      {sections.map((s, i) => (
        <section key={s.id} style={{ marginBottom: 22 }}>
          <h3 className="consent-h">{i + 1}. {s.title}</h3>
          <div className="legal-text">{s.body}</div>
        </section>
      ))}
      <p className="caption text-tertiary" style={{ marginTop: 28 }}>— Metnin sonu —</p>
    </div>
  );
}
