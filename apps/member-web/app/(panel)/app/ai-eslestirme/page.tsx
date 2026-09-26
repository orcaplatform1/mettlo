import { AiMatchingForm } from './matching-form';

export const metadata = {
  title: 'AI Koç Eşleştirme',
  robots: { index: false, follow: false },
};

export default function AiEslestirmePage() {
  return (
    <div className="stack" style={{ ['--stack' as string]: '24px', maxWidth: '640px' }}>
      <div>
        <h1 className="h2">AI Koç Eşleştirme</h1>
        <p className="text-secondary" style={{ fontSize: '14px', marginTop: '4px' }}>
          Hedeflerinizi ve tercihlerinizi girerek size en uygun koç profilini yapay zeka ile bulun.
        </p>
      </div>
      <AiMatchingForm />
    </div>
  );
}
