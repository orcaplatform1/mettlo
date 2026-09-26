'use client';

import { useState } from 'react';
import { Sparkles, Search, X } from 'lucide-react';
import Link from 'next/link';

const FITNESS_LEVELS = [
  { value: 'BEGINNER', label: 'Başlangıç' },
  { value: 'INTERMEDIATE', label: 'Orta' },
  { value: 'ADVANCED', label: 'İleri' },
];

const BRANCHES = [
  { slug: 'fitness', name: 'Fitness' },
  { slug: 'yoga-mobility', name: 'Yoga & Mobility' },
  { slug: 'pilates', name: 'Pilates' },
  { slug: 'hiit-cardio', name: 'HIIT & Kardiyo' },
  { slug: 'nutrition', name: 'Beslenme' },
  { slug: 'meditation', name: 'Meditasyon' },
  { slug: 'boxing-kickboxing', name: 'Boks' },
  { slug: 'running', name: 'Koşu' },
  { slug: 'dance', name: 'Dans' },
];

const WORK_MODES = [
  { value: 'ONLINE', label: 'Online' },
  { value: 'IN_PERSON', label: 'Yüz yüze' },
  { value: 'HYBRID', label: 'Her ikisi de' },
];

interface MatchResult {
  idealCoachProfile: {
    specializations: string[];
    experienceLevel: string;
    recommendedBranches: string[];
    coachingStyle: string;
    keyQualities: string[];
  };
  searchKeywords: string[];
  priorityFactors: string[];
  reasoning: string;
}

export function AiMatchingForm() {
  const [goalInput, setGoalInput] = useState('');
  const [goals, setGoals] = useState<string[]>([]);
  const [fitnessLevel, setFitnessLevel] = useState('');
  const [branches, setBranches] = useState<string[]>([]);
  const [workMode, setWorkMode] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<MatchResult | null>(null);

  const addGoal = () => {
    const g = goalInput.trim();
    if (!g || goals.includes(g)) return;
    setGoals((p) => [...p, g]);
    setGoalInput('');
  };

  const toggleBranch = (slug: string) => {
    setBranches((p) => p.includes(slug) ? p.filter((b) => b !== slug) : [...p, slug]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (goals.length === 0) { setError('En az bir hedef ekleyin.'); return; }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/ai/match-coach', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          goals,
          fitnessLevel: fitnessLevel || undefined,
          branchPreferences: branches.length ? branches : undefined,
          preferredWorkMode: workMode || undefined,
          additionalContext: additionalContext.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.message || 'Eşleştirme yapılamadı.');
        return;
      }
      const data = await res.json();
      setResult(data.result as MatchResult);
    } catch {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const EXP_TR: Record<string, string> = { beginner: 'Başlangıç Seviyesi', intermediate: 'Orta Seviye', advanced: 'İleri Seviye' };

  return (
    <div>
      {!result ? (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Hedefler */}
          <div>
            <label style={{ fontSize: '14px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>Hedefleriniz *</label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addGoal(); } }}
                placeholder="Örn: 10 kg kilo vermek, koşu hızımı artırmak…"
                style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', fontSize: '14px' }}
              />
              <button type="button" onClick={addGoal} className="btn btn-primary" style={{ padding: '8px 14px' }}>Ekle</button>
            </div>
            {goals.length > 0 && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {goals.map((g) => (
                  <span key={g} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: 'var(--accent)', color: '#fff', borderRadius: '20px', fontSize: '13px' }}>
                    {g}
                    <button type="button" onClick={() => setGoals((p) => p.filter((x) => x !== g))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.8)', padding: 0, display: 'flex' }}>
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Fitness seviyesi */}
          <div>
            <label style={{ fontSize: '14px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>Fitness Seviyeniz</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {FITNESS_LEVELS.map((lvl) => (
                <button
                  key={lvl.value}
                  type="button"
                  onClick={() => setFitnessLevel(fitnessLevel === lvl.value ? '' : lvl.value)}
                  style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '13px', border: 'none', cursor: 'pointer', background: fitnessLevel === lvl.value ? 'var(--accent)' : 'var(--surface-2)', color: fitnessLevel === lvl.value ? '#fff' : 'inherit' }}
                >
                  {lvl.label}
                </button>
              ))}
            </div>
          </div>

          {/* Branş tercihleri */}
          <div>
            <label style={{ fontSize: '14px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>Branş Tercihleri</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {BRANCHES.map((b) => (
                <button
                  key={b.slug}
                  type="button"
                  onClick={() => toggleBranch(b.slug)}
                  style={{ padding: '5px 12px', borderRadius: '20px', fontSize: '12px', border: '1px solid var(--border)', cursor: 'pointer', background: branches.includes(b.slug) ? 'var(--accent)' : 'var(--surface-2)', color: branches.includes(b.slug) ? '#fff' : 'inherit' }}
                >
                  {b.name}
                </button>
              ))}
            </div>
          </div>

          {/* Çalışma şekli */}
          <div>
            <label style={{ fontSize: '14px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>Çalışma Şekli</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {WORK_MODES.map((wm) => (
                <button
                  key={wm.value}
                  type="button"
                  onClick={() => setWorkMode(workMode === wm.value ? '' : wm.value)}
                  style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '13px', border: 'none', cursor: 'pointer', background: workMode === wm.value ? 'var(--accent)' : 'var(--surface-2)', color: workMode === wm.value ? '#fff' : 'inherit' }}
                >
                  {wm.label}
                </button>
              ))}
            </div>
          </div>

          {/* Ek bilgi */}
          <div>
            <label style={{ fontSize: '14px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>Ek Bilgi</label>
            <textarea
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
              rows={3}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical' }}
              placeholder="Sağlık durumunuz, özel tercihleriniz, bütçeniz vb…"
            />
          </div>

          {error && <p style={{ color: 'var(--danger)', fontSize: '13px' }}>{error}</p>}

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: '12px', fontSize: '15px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Sparkles size={16} />
            {loading ? 'Yapay zeka analiz ediyor…' : 'AI ile Koç Eşleştir'}
          </button>
        </form>
      ) : (
        <div>
          <div style={{ background: 'var(--surface-2)', borderRadius: '12px', padding: '20px', border: '1px solid var(--border)', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Sparkles size={18} color="var(--accent)" aria-hidden />
              <h2 style={{ fontSize: '16px', fontWeight: 700 }}>Size Özel Koç Profili</h2>
            </div>

            {result.idealCoachProfile && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {result.idealCoachProfile.experienceLevel && (
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Deneyim Seviyesi</div>
                    <span style={{ padding: '4px 10px', borderRadius: '20px', background: 'var(--accent)', color: '#fff', fontSize: '13px' }}>
                      {EXP_TR[result.idealCoachProfile.experienceLevel] || result.idealCoachProfile.experienceLevel}
                    </span>
                  </div>
                )}
                {result.idealCoachProfile.coachingStyle && (
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Koçluk Stili</div>
                    <p style={{ fontSize: '14px', margin: 0 }}>{result.idealCoachProfile.coachingStyle}</p>
                  </div>
                )}
                {result.idealCoachProfile.keyQualities?.length > 0 && (
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Temel Özellikler</div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {result.idealCoachProfile.keyQualities.map((q) => (
                        <span key={q} style={{ padding: '3px 10px', borderRadius: '20px', background: 'var(--surface)', border: '1px solid var(--border)', fontSize: '12px' }}>{q}</span>
                      ))}
                    </div>
                  </div>
                )}
                {result.idealCoachProfile.recommendedBranches?.length > 0 && (
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Önerilen Branşlar</div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {result.idealCoachProfile.recommendedBranches.map((b) => (
                        <span key={b} style={{ padding: '3px 10px', borderRadius: '20px', background: 'var(--accent)', color: '#fff', fontSize: '12px' }}>{b}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {result.reasoning && (
              <div style={{ marginTop: '16px', padding: '12px', background: 'var(--surface)', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>AI Analizi</div>
                <p style={{ fontSize: '13px', lineHeight: 1.6, margin: 0, color: 'var(--text)' }}>{result.reasoning}</p>
              </div>
            )}
          </div>

          {/* Koçlara yönlendir */}
          {result.searchKeywords?.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Bu anahtar kelimelerle koç arayabilirsiniz:</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {result.searchKeywords.map((kw) => (
                  <Link key={kw} href={`/coaches?q=${encodeURIComponent(kw)}`} style={{ padding: '4px 12px', borderRadius: '20px', background: 'var(--surface-2)', border: '1px solid var(--border)', fontSize: '12px', textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Search size={11} /> {kw}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px' }}>
            <Link href="/coaches" className="btn btn-primary" style={{ padding: '10px 18px' }}>Koçları Keşfet</Link>
            <button onClick={() => setResult(null)} className="btn btn-ghost" style={{ padding: '10px 16px' }}>Yeniden Ara</button>
          </div>
        </div>
      )}
    </div>
  );
}
