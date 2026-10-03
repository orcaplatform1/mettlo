import React, { useState } from 'react';
import { ActivityIndicator, Alert, Platform, KeyboardAvoidingView, ScrollView, StyleSheet, Switch, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MettloText } from '../../components/ui/MettloText';
import { MettloLoadingState } from '../../components/ui/MettloLoadingState';
import { Colors, Radius, Space } from '../../constants/tokens';
import { api } from '../../services/api';

/* ─── Genel ────────────────────────────────────────── */
const today = () => new Date().toISOString().slice(0, 10);
const fmtDate = (s: string) => new Date(s).toLocaleDateString('tr-TR');

/* ─── Koşu sabitleri ─────────────────────────────── */
const RUN_TYPES = [
  ['EASY', 'Kolay koşu'], ['TEMPO', 'Tempo'],
  ['INTERVAL', 'İnterval'], ['LONG', 'Uzun koşu'], ['RACE', 'Yarış'],
] as const;
const RUN_TYPE_LABEL = Object.fromEntries(RUN_TYPES);
const DIST_OPTS = [
  ['FIVE_K', '5K'], ['TEN_K', '10K'],
  ['HALF_MARATHON', 'Yarı maraton'], ['MARATHON', 'Maraton'], ['OTHER', 'Diğer'],
] as const;
const DIST_LABEL = Object.fromEntries(DIST_OPTS);

/* ─── Boks sabitleri ──────────────────────────────── */
const TECH_CAT: Record<string, string> = {
  JAB: 'Jab', CROSS: 'Cross', HOOK: 'Hook', UPPERCUT: 'Uppercut',
  BODY_SHOT: 'Gövde vuruşları', COMBINATION: 'Kombinler',
  DEFENSE: 'Savunma', FOOTWORK: 'Ayak çalışması',
};
const TECH_STATUS: Record<string, string> = {
  NOT_STARTED: 'Başlanmadı', IN_PROGRESS: 'Çalışılıyor', MASTERED: 'Öğrenildi',
};
const TECH_STATUS_COLOR: Record<string, string> = {
  NOT_STARTED: Colors.textMuted, IN_PROGRESS: Colors.primary, MASTERED: Colors.success,
};
const BOX_SESS: Record<string, string> = {
  TECHNICAL: 'Teknik', SPARRING: 'Sparring', CONDITIONING: 'Kondisyon', BAG_WORK: 'Torba',
};

/* ─── Practice sabitleri ─────────────────────────── */
const PRACTICE_BRANCH_MAP: Record<string, string> = {
  yoga: 'yoga-mobility', pilates: 'pilates', hiit: 'hiit',
  meditation: 'meditation', dance: 'dance',
};
const YOGA_SESSION_TYPES = ['Vinyasa', 'Hatha', 'Yin', 'Restorative', 'Ashtanga', 'Mobility', 'Breathwork', 'Diğer'];
const PILATES_SESSION_TYPES = ['Mat Pilates', 'Reformer', 'Kadans', 'Güçlendirme', 'Esneklik', 'Diğer'];
const HIIT_SESSION_TYPES = ['Tabata', 'AMRAP', 'EMOM', 'Circuit', 'Karışık', 'Diğer'];
const MEDITATION_SESSION_TYPES = ['Nefes', 'Vizualizasyon', 'Farkındalık', 'Rehberli', 'Diğer'];
const DANCE_SESSION_TYPES = ['Zumba', 'Samba', 'Vals', 'Salsa', 'Tango', 'HipHop', 'Diğer'];
function getPracticeSessionTypes(branch: string) {
  if (branch === 'yoga') return YOGA_SESSION_TYPES;
  if (branch === 'pilates') return PILATES_SESSION_TYPES;
  if (branch === 'hiit') return HIIT_SESSION_TYPES;
  if (branch === 'meditation') return MEDITATION_SESSION_TYPES;
  return DANCE_SESSION_TYPES;
}

/* ─── Branch config ──────────────────────────────── */
const BRANCH_CONFIG: Record<string, { title: string; icon: string }> = {
  running: { title: 'Koşu Günlüğüm', icon: '🏃' },
  boxing: { title: 'Boks & Kickboks Günlüğüm', icon: '🥊' },
  yoga: { title: 'Yoga & Esneklik Günlüğüm', icon: '🧘' },
  pilates: { title: 'Pilates Günlüğüm', icon: '💪' },
  hiit: { title: 'HIIT Günlüğüm', icon: '⚡' },
  meditation: { title: 'Meditasyon Günlüğüm', icon: '🧠' },
  dance: { title: 'Dans Günlüğüm', icon: '💃' },
};

/* ─── Küçük yardımcı bileşenler ──────────────────── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: Space.s4 }}>
      <MettloText style={fieldStyles.label}>{label}</MettloText>
      {children}
    </View>
  );
}
function Inp(props: React.ComponentProps<typeof TextInput>) {
  return <TextInput style={fieldStyles.input} placeholderTextColor={Colors.textMuted} {...props} />;
}
function Chips({ options, value, onChange }: { options: string[][]; value: string; onChange: (v: string) => void }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Space.s6 }}>
      {options.map(([v, l]) => (
        <TouchableOpacity key={v} style={[fieldStyles.chip, value === v && fieldStyles.chipActive]} onPress={() => onChange(v)}>
          <MettloText style={[fieldStyles.chipText, value === v && fieldStyles.chipTextActive] as any}>{l}</MettloText>
        </TouchableOpacity>
      ))}
    </View>
  );
}
function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={cardStyles.card}>
      <MettloText style={cardStyles.title}>{title}</MettloText>
      {children}
    </View>
  );
}
function SaveBtn({ onPress, saving, label = 'Kaydet' }: { onPress: () => void; saving: boolean; label?: string }) {
  return (
    <TouchableOpacity style={[fieldStyles.saveBtn, saving && { opacity: 0.5 }]} onPress={onPress} disabled={saving}>
      {saving ? <ActivityIndicator color="#fff" size="small" /> : <MettloText style={{ color: '#fff', fontWeight: '700' }}>{label}</MettloText>}
    </TouchableOpacity>
  );
}

/* ═══════════════ RUNNING ════════════════════════════ */
function RunningScreen({ data, qc }: { data: any; qc: any }) {
  const [runType, setRunType] = useState('EASY');
  const [date, setDate] = useState(today());
  const [distKm, setDistKm] = useState('');
  const [duration, setDuration] = useState('');
  const [avgHr, setAvgHr] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const [shoesBrand, setShoesBrand] = useState('');
  const [shoesModel, setShoesModel] = useState('');
  const [shoesSaving, setShoesSaving] = useState(false);

  const [injArea, setInjArea] = useState('');
  const [injSeverity, setInjSeverity] = useState('2');
  const [injStarted, setInjStarted] = useState(today());
  const [injPause, setInjPause] = useState(false);
  const [injSaving, setInjSaving] = useState(false);

  const [goalName, setGoalName] = useState('');
  const [goalDist, setGoalDist] = useState('TEN_K');
  const [goalDate, setGoalDate] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalSaving, setGoalSaving] = useState(false);

  async function addRun() {
    if (!distKm || !duration) { Alert.alert('Eksik', 'Mesafe ve süre zorunlu'); return; }
    setSaving(true);
    try {
      await api.post('/running/logs', {
        date, runType, distanceKm: parseFloat(distKm), duration: duration.trim(),
        avgHeartRate: avgHr ? parseInt(avgHr) : undefined,
        notes: notes.trim() || undefined,
      });
      qc.invalidateQueries({ queryKey: ['sports', 'running'] });
      setDistKm(''); setDuration(''); setAvgHr(''); setNotes('');
    } catch (e: any) { Alert.alert('Hata', e?.response?.data?.message ?? 'Kaydedilemedi'); }
    finally { setSaving(false); }
  }

  async function addShoe() {
    if (!shoesBrand || !shoesModel) { Alert.alert('Eksik', 'Marka ve model zorunlu'); return; }
    setShoesSaving(true);
    try {
      await api.post('/running/shoes', { brand: shoesBrand.trim(), model: shoesModel.trim() });
      qc.invalidateQueries({ queryKey: ['sports', 'running'] });
      setShoesBrand(''); setShoesModel('');
    } catch (e: any) { Alert.alert('Hata', e?.response?.data?.message ?? 'Eklenemedi'); }
    finally { setShoesSaving(false); }
  }

  async function addInjury() {
    if (!injArea) { Alert.alert('Eksik', 'Yaralanma bölgesi zorunlu'); return; }
    setInjSaving(true);
    try {
      await api.post('/running/injuries', {
        area: injArea.trim(), severity: parseInt(injSeverity),
        startedOn: injStarted, pauseTraining: injPause,
      });
      qc.invalidateQueries({ queryKey: ['sports', 'running'] });
      setInjArea(''); setInjSeverity('2'); setInjPause(false);
    } catch (e: any) { Alert.alert('Hata', e?.response?.data?.message ?? 'Eklenemedi'); }
    finally { setInjSaving(false); }
  }

  async function addGoal() {
    if (!goalName || !goalDate) { Alert.alert('Eksik', 'Yarış adı ve tarihi zorunlu'); return; }
    setGoalSaving(true);
    try {
      await api.post('/running/goals', {
        name: goalName.trim(), distance: goalDist, raceDate: goalDate,
        targetTime: goalTarget.trim() || undefined,
      });
      qc.invalidateQueries({ queryKey: ['sports', 'running'] });
      setGoalName(''); setGoalDate(''); setGoalTarget('');
    } catch (e: any) { Alert.alert('Hata', e?.response?.data?.message ?? 'Eklenemedi'); }
    finally { setGoalSaving(false); }
  }

  const km = data?.weekly?.at(-1);
  const logs = data?.logs ?? [];
  const zones = data?.zones ?? [];
  const shoes = data?.shoes ?? [];
  const injuries = data?.injuries ?? [];
  const goals = data?.goals ?? [];
  const plan = data?.plan ?? [];

  return (
    <>
      {/* Stat tiles */}
      <View style={styles.statsGrid}>
        <View style={styles.statTile}>
          <MettloText style={styles.statVal}>{km?.actualKm ?? 0}<MettloText style={styles.statUnit}> km</MettloText></MettloText>
          <MettloText style={styles.statLbl}>Bu hafta{km?.plannedKm ? ` · plan ${km.plannedKm} km` : ''}</MettloText>
        </View>
        <View style={styles.statTile}>
          <MettloText style={styles.statVal}>{logs.length}</MettloText>
          <MettloText style={styles.statLbl}>Son 8 haftada koşu</MettloText>
        </View>
        {data?.countdown && (
          <View style={styles.statTile}>
            <MettloText style={styles.statVal}>{data.countdown.days}<MettloText style={styles.statUnit}> gün</MettloText></MettloText>
            <MettloText style={styles.statLbl}>{data.countdown.name}</MettloText>
          </View>
        )}
      </View>

      {/* Koşu ekle */}
      <SectionCard title="Koşu Ekle">
        <Field label="Tür">
          <Chips options={RUN_TYPES.map(([v, l]) => [v, l])} value={runType} onChange={setRunType} />
        </Field>
        <Field label="Tarih"><Inp value={date} onChangeText={setDate} placeholder="YYYY-AA-GG" /></Field>
        <View style={styles.row2}>
          <View style={{ flex: 1 }}>
            <Field label="Mesafe (km)"><Inp value={distKm} onChangeText={setDistKm} keyboardType="decimal-pad" placeholder="10,5" /></Field>
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Süre"><Inp value={duration} onChangeText={setDuration} placeholder="52:30" /></Field>
          </View>
        </View>
        <Field label="Ort. nabız (isteğe bağlı)"><Inp value={avgHr} onChangeText={setAvgHr} keyboardType="numeric" placeholder="150" /></Field>
        <Field label="Not (isteğe bağlı)"><Inp value={notes} onChangeText={setNotes} placeholder="Not…" multiline /></Field>
        <SaveBtn onPress={addRun} saving={saving} />
      </SectionCard>

      {/* Pace zone tablosu */}
      {zones.length > 0 && (
        <SectionCard title="Pace Zone'ları">
          <View style={styles.tableHeader}>
            <MettloText style={[styles.th, { flex: 1 }]}>Zone</MettloText>
            <MettloText style={[styles.th, { width: 90 }]}>Nabız</MettloText>
            <MettloText style={[styles.th, { width: 90 }]}>Pace</MettloText>
          </View>
          {zones.map((z: any) => (
            <View key={z.zone} style={styles.tableRow}>
              <MettloText style={[styles.td, { flex: 1 }]}>Z{z.zone} · {z.label}</MettloText>
              <MettloText style={[styles.td, { width: 90 }]}>{z.hrMin ? `${z.hrMin}–${z.hrMax}` : '—'}</MettloText>
              <MettloText style={[styles.td, { width: 90 }]}>{z.paceMinSec || z.paceMaxSec ? '—' : '—'}</MettloText>
            </View>
          ))}
        </SectionCard>
      )}

      {/* Koçun planı */}
      {plan.length > 0 && (
        <SectionCard title="Koçunun Planı">
          {plan.slice(0, 10).map((p: any) => (
            <View key={p.id} style={styles.planRow}>
              <MettloText style={{ fontWeight: '600', flex: 1 }}>
                Hafta {p.weekNumber} · {p.runType === 'REST' ? 'Dinlenme' : RUN_TYPE_LABEL[p.runType] ?? p.runType}
              </MettloText>
              {p.targetDistanceKm && <MettloText style={styles.caption}>{p.targetDistanceKm} km</MettloText>}
            </View>
          ))}
        </SectionCard>
      )}

      {/* Yarış hedefleri */}
      <SectionCard title="Yarış Hedefleri">
        {goals.length === 0 && <MettloText style={styles.mutedText}>Henüz hedef yok.</MettloText>}
        {goals.map((g: any) => (
          <View key={g.id} style={styles.goalRow}>
            <View style={{ flex: 1 }}>
              <MettloText style={{ fontWeight: '600' }}>{g.name} · {DIST_LABEL[g.distance] ?? g.distance}</MettloText>
              <MettloText style={styles.caption}>{fmtDate(g.raceDate)}{g.targetTimeSec ? ` · hedef ${g.targetTimeSec}sn` : ''}</MettloText>
            </View>
            <View style={[styles.badge, { backgroundColor: g.status === 'COMPLETED' ? 'rgba(34,197,94,0.15)' : 'rgba(249,115,22,0.15)' }]}>
              <MettloText style={[styles.badgeText, { color: g.status === 'COMPLETED' ? Colors.success : Colors.primary }]}>
                {g.status === 'COMPLETED' ? 'Tamamlandı' : 'Aktif'}
              </MettloText>
            </View>
          </View>
        ))}
        <View style={styles.divider} />
        <Field label="Yarış adı"><Inp value={goalName} onChangeText={setGoalName} placeholder="İstanbul Maratonu" /></Field>
        <Field label="Mesafe">
          <Chips options={DIST_OPTS.map(([v, l]) => [v, l])} value={goalDist} onChange={setGoalDist} />
        </Field>
        <Field label="Tarih"><Inp value={goalDate} onChangeText={setGoalDate} placeholder="YYYY-AA-GG" /></Field>
        <Field label="Hedef süre (isteğe bağlı)"><Inp value={goalTarget} onChangeText={setGoalTarget} placeholder="48:30" /></Field>
        <SaveBtn onPress={addGoal} saving={goalSaving} label="Hedef Ekle" />
      </SectionCard>

      {/* Ayakkabılar */}
      <SectionCard title="Ayakkabılarım">
        {shoes.length === 0 && <MettloText style={styles.mutedText}>Ayakkabı ekleyip ömrünü takip edebilirsin.</MettloText>}
        {shoes.map((s: any) => (
          <View key={s.id} style={[styles.goalRow, s.retired && { opacity: 0.6 }]}>
            <View style={{ flex: 1 }}>
              <MettloText style={{ fontWeight: '600' }}>{s.brand} {s.model}</MettloText>
              <MettloText style={styles.caption}>
                {s.totalKm} km{s.totalKm >= 700 ? ' · ömrünü doldurmuş olabilir' : s.totalKm >= 500 ? ' · yaklaşıyor' : ''}
              </MettloText>
            </View>
            <TouchableOpacity
              style={styles.smallBtn}
              onPress={async () => {
                try { await api.patch(`/running/shoes/${s.id}/retire`, { retired: !s.retired }); qc.invalidateQueries({ queryKey: ['sports', 'running'] }); }
                catch { Alert.alert('Hata', 'İşlem başarısız'); }
              }}
            >
              <MettloText style={styles.smallBtnText}>{s.retired ? 'Geri Al' : 'Emekli Et'}</MettloText>
            </TouchableOpacity>
          </View>
        ))}
        <View style={styles.divider} />
        <View style={styles.row2}>
          <View style={{ flex: 1 }}><Field label="Marka"><Inp value={shoesBrand} onChangeText={setShoesBrand} placeholder="Nike" /></Field></View>
          <View style={{ flex: 1 }}><Field label="Model"><Inp value={shoesModel} onChangeText={setShoesModel} placeholder="Pegasus" /></Field></View>
        </View>
        <SaveBtn onPress={addShoe} saving={shoesSaving} label="Ayakkabı Ekle" />
      </SectionCard>

      {/* Yaralanma günlüğü */}
      <SectionCard title="Yaralanma / Mola Günlüğü">
        {injuries.length === 0 && <MettloText style={styles.mutedText}>Aktif yaralanma yok.</MettloText>}
        {injuries.map((i: any) => (
          <View key={i.id} style={styles.goalRow}>
            <View style={{ flex: 1 }}>
              <MettloText style={{ fontWeight: '600' }}>{i.area} · Şiddet {i.severity}/5</MettloText>
              <MettloText style={styles.caption}>
                {fmtDate(i.startedOn)}{i.endedOn ? ` – ${fmtDate(i.endedOn)}` : ' – devam ediyor'}
              </MettloText>
            </View>
            {!i.endedOn && (
              <TouchableOpacity
                style={styles.smallBtn}
                onPress={async () => {
                  try { await api.patch(`/running/injuries/${i.id}/end`); qc.invalidateQueries({ queryKey: ['sports', 'running'] }); }
                  catch { Alert.alert('Hata', 'İşlem başarısız'); }
                }}
              >
                <MettloText style={styles.smallBtnText}>İyileştim</MettloText>
              </TouchableOpacity>
            )}
          </View>
        ))}
        <View style={styles.divider} />
        <Field label="Bölge"><Inp value={injArea} onChangeText={setInjArea} placeholder="Sağ diz" /></Field>
        <Field label="Şiddet (1–5)">
          <Chips options={[['1','1'],['2','2'],['3','3'],['4','4'],['5','5']]} value={injSeverity} onChange={setInjSeverity} />
        </Field>
        <Field label="Başlangıç tarihi"><Inp value={injStarted} onChangeText={setInjStarted} placeholder="YYYY-AA-GG" /></Field>
        <View style={styles.switchRow}>
          <MettloText style={styles.caption}>Antrenmana ara verdim</MettloText>
          <Switch value={injPause} onValueChange={setInjPause} trackColor={{ true: Colors.primary }} />
        </View>
        <SaveBtn onPress={addInjury} saving={injSaving} label="Yaralanma Bildir" />
      </SectionCard>

      {/* Son koşular */}
      <SectionCard title="Son Koşular">
        {logs.length === 0 ? (
          <MettloText style={styles.mutedText}>Henüz koşu kaydı yok.</MettloText>
        ) : (
          logs.slice(0, 20).map((l: any) => (
            <View key={l.id} style={styles.logRow}>
              <View style={{ flex: 1 }}>
                <MettloText style={{ fontWeight: '600' }}>
                  {fmtDate(l.date)} · {RUN_TYPE_LABEL[l.runType] ?? l.runType}
                </MettloText>
                <MettloText style={styles.caption}>
                  {l.distanceKm} km · {l.durationSec ? `${Math.floor(l.durationSec / 60)} dk` : l.duration ?? ''}
                  {l.avgHeartRate ? ` · ${l.avgHeartRate} bpm` : ''}
                </MettloText>
                {l.notes && <MettloText style={styles.caption}>{l.notes}</MettloText>}
              </View>
              <TouchableOpacity
                onPress={() => Alert.alert('Sil', 'Bu kaydı silmek istediğine emin misin?', [
                  { text: 'İptal', style: 'cancel' },
                  { text: 'Sil', style: 'destructive', onPress: async () => {
                    try { await api.delete(`/running/logs/${l.id}`); qc.invalidateQueries({ queryKey: ['sports', 'running'] }); }
                    catch { Alert.alert('Hata', 'Silinemedi'); }
                  }},
                ])}
              >
                <MettloText style={[styles.smallBtnText, { color: Colors.error }]}>Sil</MettloText>
              </TouchableOpacity>
            </View>
          ))
        )}
      </SectionCard>
    </>
  );
}

/* ═══════════════ BOXING ═════════════════════════════ */
function BoxingScreen({ data, qc }: { data: any; qc: any }) {
  const [weighDate, setWeighDate] = useState(today());
  const [weighKg, setWeighKg] = useState('');
  const [weighSaving, setWeighSaving] = useState(false);

  const [sessDate, setSessDate] = useState(today());
  const [sessType, setSessType] = useState('TECHNICAL');
  const [rounds, setRounds] = useState('6');
  const [roundSec, setRoundSec] = useState('180');
  const [restSec, setRestSec] = useState('60');
  const [sessSaving, setSessSaving] = useState(false);

  async function addWeighIn() {
    if (!weighKg) { Alert.alert('Eksik', 'Kilo zorunlu'); return; }
    setWeighSaving(true);
    try {
      await api.post('/boxing/weigh-ins', { date: weighDate, weightKg: parseFloat(weighKg) });
      qc.invalidateQueries({ queryKey: ['sports', 'boxing'] });
      setWeighKg('');
    } catch (e: any) { Alert.alert('Hata', e?.response?.data?.message ?? 'Kaydedilemedi'); }
    finally { setWeighSaving(false); }
  }

  async function addSession() {
    setSessSaving(true);
    try {
      await api.post('/boxing/sessions', {
        date: sessDate, sessionType: sessType,
        rounds: parseInt(rounds), roundSec: parseInt(roundSec), restSec: parseInt(restSec),
      });
      qc.invalidateQueries({ queryKey: ['sports', 'boxing'] });
    } catch (e: any) { Alert.alert('Hata', e?.response?.data?.message ?? 'Kaydedilemedi'); }
    finally { setSessSaving(false); }
  }

  const techniques = data?.techniques ?? [];
  const sessions = data?.sessions ?? [];
  const weighIns = data?.weighIns ?? [];

  const byCat = new Map<string, any[]>();
  for (const t of techniques) byCat.set(t.category, [...(byCat.get(t.category) ?? []), t]);

  return (
    <>
      {/* Stat tiles */}
      <View style={styles.statsGrid}>
        <View style={styles.statTile}>
          <MettloText style={styles.statVal}>{data?.currentCategory ? `${data.currentCategory.weightKg} kg` : '—'}</MettloText>
          <MettloText style={styles.statLbl}>Kilo kategorisi</MettloText>
        </View>
        <View style={styles.statTile}>
          <MettloText style={styles.statVal}>{data?.mastered ?? 0}/{techniques.length}</MettloText>
          <MettloText style={styles.statLbl}>Öğrenilen teknik</MettloText>
        </View>
        <View style={styles.statTile}>
          <MettloText style={styles.statVal}>{data?.totals?.rounds ?? 0}</MettloText>
          <MettloText style={styles.statLbl}>Son 90 günde round</MettloText>
        </View>
      </View>

      {/* Teknik ilerleme haritası */}
      {techniques.length > 0 && (
        <SectionCard title="Teknik İlerleme Haritası">
          {[...byCat.entries()].map(([cat, list]) => (
            <View key={cat} style={{ gap: Space.s6, marginBottom: Space.s12 }}>
              <MettloText style={styles.catLabel}>{TECH_CAT[cat] ?? cat}</MettloText>
              {list.map((t: any) => (
                <View key={t.id} style={styles.techniqueRow}>
                  <View style={{ flex: 1 }}>
                    <MettloText style={{ fontWeight: '600' }}>
                      {t.name}{t.notation ? ` · ${t.notation}` : ''}
                    </MettloText>
                    <MettloText style={styles.caption}>
                      {t.coach?.name}{t.description ? ` · ${t.description}` : ''}{t.coachNote ? ` · Koç notu: ${t.coachNote}` : ''}
                    </MettloText>
                  </View>
                  <View style={[styles.badge, { backgroundColor: `${TECH_STATUS_COLOR[t.status] ?? Colors.textMuted}20` }]}>
                    <MettloText style={[styles.badgeText, { color: TECH_STATUS_COLOR[t.status] ?? Colors.textMuted }]}>
                      {TECH_STATUS[t.status] ?? t.status}
                    </MettloText>
                  </View>
                </View>
              ))}
            </View>
          ))}
        </SectionCard>
      )}

      {/* Tartı (weigh-in) */}
      <SectionCard title="Tartı (Weigh-in)">
        {weighIns.slice(0, 8).map((w: any) => (
          <View key={w.id} style={styles.logRow}>
            <View style={{ flex: 1 }}>
              <MettloText style={{ fontWeight: '600' }}>{fmtDate(w.date)} · {w.weightKg} kg</MettloText>
              <MettloText style={styles.caption}>{w.category}</MettloText>
            </View>
            <TouchableOpacity
              onPress={() => Alert.alert('Sil', 'Bu tartıyı silmek istediğine emin misin?', [
                { text: 'İptal', style: 'cancel' },
                { text: 'Sil', style: 'destructive', onPress: async () => {
                  try { await api.delete(`/boxing/weigh-ins/${w.id}`); qc.invalidateQueries({ queryKey: ['sports', 'boxing'] }); }
                  catch { Alert.alert('Hata', 'Silinemedi'); }
                }},
              ])}
            >
              <MettloText style={[styles.smallBtnText, { color: Colors.error }]}>Sil</MettloText>
            </TouchableOpacity>
          </View>
        ))}
        <View style={styles.divider} />
        <View style={styles.row2}>
          <View style={{ flex: 1 }}><Field label="Tarih"><Inp value={weighDate} onChangeText={setWeighDate} placeholder="YYYY-AA-GG" /></Field></View>
          <View style={{ flex: 1 }}><Field label="Kilo (kg)"><Inp value={weighKg} onChangeText={setWeighKg} keyboardType="decimal-pad" placeholder="66,5" /></Field></View>
        </View>
        <MettloText style={styles.fieldHint}>Kategori WBC sınıflarına göre otomatik belirlenir.</MettloText>
        <SaveBtn onPress={addWeighIn} saving={weighSaving} label="Tartıyı Kaydet" />
      </SectionCard>

      {/* Seans ekle */}
      <SectionCard title="Seans Ekle">
        <Field label="Tür">
          <Chips options={Object.entries(BOX_SESS)} value={sessType} onChange={setSessType} />
        </Field>
        <Field label="Tarih"><Inp value={sessDate} onChangeText={setSessDate} placeholder="YYYY-AA-GG" /></Field>
        <View style={styles.row3}>
          <View style={{ flex: 1 }}><Field label="Round"><Inp value={rounds} onChangeText={setRounds} keyboardType="numeric" /></Field></View>
          <View style={{ flex: 1 }}><Field label="Round süresi (sn)"><Inp value={roundSec} onChangeText={setRoundSec} keyboardType="numeric" /></Field></View>
          <View style={{ flex: 1 }}><Field label="Dinlenme (sn)"><Inp value={restSec} onChangeText={setRestSec} keyboardType="numeric" /></Field></View>
        </View>
        <SaveBtn onPress={addSession} saving={sessSaving} />
      </SectionCard>

      {/* Seans geçmişi */}
      <SectionCard title="Seans Geçmişi">
        {sessions.length === 0 ? (
          <MettloText style={styles.mutedText}>Henüz seans yok.</MettloText>
        ) : (
          sessions.slice(0, 20).map((s: any) => (
            <View key={s.id} style={styles.logRow}>
              <View style={{ flex: 1 }}>
                <MettloText style={{ fontWeight: '600' }}>
                  {fmtDate(s.date)} · {BOX_SESS[s.sessionType] ?? s.sessionType}
                </MettloText>
                <MettloText style={styles.caption}>
                  {s.rounds} round · {Math.floor(s.roundSec / 60)}:{String(s.roundSec % 60).padStart(2, '0')} dk · dinlenme {s.restSec} sn
                </MettloText>
              </View>
              <TouchableOpacity
                onPress={() => Alert.alert('Sil', 'Bu seansı silmek istediğine emin misin?', [
                  { text: 'İptal', style: 'cancel' },
                  { text: 'Sil', style: 'destructive', onPress: async () => {
                    try { await api.delete(`/boxing/sessions/${s.id}`); qc.invalidateQueries({ queryKey: ['sports', 'boxing'] }); }
                    catch { Alert.alert('Hata', 'Silinemedi'); }
                  }},
                ])}
              >
                <MettloText style={[styles.smallBtnText, { color: Colors.error }]}>Sil</MettloText>
              </TouchableOpacity>
            </View>
          ))
        )}
      </SectionCard>
    </>
  );
}

/* ═══════════════ PRACTICE (yoga/pilates/hiit/…) ════ */
function PracticeScreen({ branch, data, qc }: { branch: string; data: any; qc: any }) {
  const apiSlug = PRACTICE_BRANCH_MAP[branch] ?? branch;
  const sessionTypes = getPracticeSessionTypes(branch);

  const [date, setDate] = useState(today());
  const [durationMin, setDurationMin] = useState('');
  const [sessType, setSessType] = useState(sessionTypes[0]);
  const [moodBefore, setMoodBefore] = useState('');
  const [moodAfter, setMoodAfter] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  async function addLog() {
    if (!durationMin) { Alert.alert('Eksik', 'Süre zorunlu'); return; }
    setSaving(true);
    try {
      await api.post('/practice/logs', {
        branch: apiSlug, date, durationMin: parseInt(durationMin),
        sessionType: sessType,
        moodBefore: moodBefore ? parseInt(moodBefore) : undefined,
        moodAfter: moodAfter ? parseInt(moodAfter) : undefined,
        notes: notes.trim() || undefined,
      });
      qc.invalidateQueries({ queryKey: ['sports', branch] });
      setDurationMin(''); setNotes(''); setMoodBefore(''); setMoodAfter('');
    } catch (e: any) { Alert.alert('Hata', e?.response?.data?.message ?? 'Kaydedilemedi'); }
    finally { setSaving(false); }
  }

  const stats = data?.stats ?? {};
  const logs = data?.logs ?? [];

  return (
    <>
      {/* Stat tiles */}
      <View style={styles.statsGrid}>
        <View style={styles.statTile}>
          <MettloText style={styles.statVal}>{stats.weekMinutes ?? 0}</MettloText>
          <MettloText style={styles.statLbl}>Bu hafta (dk)</MettloText>
        </View>
        <View style={styles.statTile}>
          <MettloText style={styles.statVal}>{stats.month30Count ?? 0}</MettloText>
          <MettloText style={styles.statLbl}>Son 30 gün seans</MettloText>
        </View>
        {stats.avgMoodAfter && (
          <View style={styles.statTile}>
            <MettloText style={styles.statVal}>{stats.avgMoodAfter}/5</MettloText>
            <MettloText style={styles.statLbl}>Ort. seans sonu ruh hali</MettloText>
          </View>
        )}
      </View>

      {/* Seans ekle */}
      <SectionCard title="Yeni Seans Ekle">
        <Field label="Seans Tipi">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: Space.s6 }}>
              {sessionTypes.map((t) => (
                <TouchableOpacity key={t} style={[fieldStyles.chip, sessType === t && fieldStyles.chipActive]} onPress={() => setSessType(t)}>
                  <MettloText style={[fieldStyles.chipText, sessType === t && fieldStyles.chipTextActive] as any}>{t}</MettloText>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </Field>
        <View style={styles.row2}>
          <View style={{ flex: 1 }}><Field label="Tarih"><Inp value={date} onChangeText={setDate} placeholder="YYYY-AA-GG" /></Field></View>
          <View style={{ flex: 1 }}><Field label="Süre (dk)"><Inp value={durationMin} onChangeText={setDurationMin} keyboardType="numeric" placeholder="60" /></Field></View>
        </View>
        <View style={styles.row2}>
          <View style={{ flex: 1 }}><Field label="Ruh hali öncesi (1-5)"><Inp value={moodBefore} onChangeText={setMoodBefore} keyboardType="numeric" placeholder="3" /></Field></View>
          <View style={{ flex: 1 }}><Field label="Ruh hali sonrası (1-5)"><Inp value={moodAfter} onChangeText={setMoodAfter} keyboardType="numeric" placeholder="4" /></Field></View>
        </View>
        <Field label="Notlar (isteğe bağlı)">
          <TextInput
            style={[fieldStyles.input, { height: 60 }]}
            value={notes} onChangeText={setNotes}
            multiline placeholder="Notlar…" placeholderTextColor={Colors.textMuted}
          />
        </Field>
        <SaveBtn onPress={addLog} saving={saving} />
      </SectionCard>

      {/* Son seanslar */}
      <SectionCard title="Son Seanslar">
        {logs.length === 0 ? (
          <MettloText style={styles.mutedText}>Henüz seans kaydedilmedi.</MettloText>
        ) : (
          logs.slice(0, 20).map((l: any) => (
            <View key={l.id} style={styles.logRow}>
              <View style={{ flex: 1 }}>
                <MettloText style={{ fontWeight: '600' }}>
                  {fmtDate(l.date)} · {l.sessionType} · {l.durationMin} dk
                </MettloText>
                {l.moodAfter && <MettloText style={styles.caption}>Ruh hali: {l.moodAfter}/5</MettloText>}
                {l.notes && <MettloText style={styles.caption}>{l.notes}</MettloText>}
              </View>
              <TouchableOpacity
                onPress={() => Alert.alert('Sil', 'Bu seansı silmek istediğine emin misin?', [
                  { text: 'İptal', style: 'cancel' },
                  { text: 'Sil', style: 'destructive', onPress: async () => {
                    try { await api.delete(`/practice/logs/${l.id}?branch=${apiSlug}`); qc.invalidateQueries({ queryKey: ['sports', branch] }); }
                    catch { Alert.alert('Hata', 'Silinemedi'); }
                  }},
                ])}
              >
                <MettloText style={[styles.smallBtnText, { color: Colors.error }]}>Sil</MettloText>
              </TouchableOpacity>
            </View>
          ))
        )}
      </SectionCard>
    </>
  );
}

/* ═══════════════ ANA EKRAN ══════════════════════════ */
export function SportsScreen() {
  const nav = useNavigation();
  const route = useRoute<any>();
  const branch: string = route.params?.branch ?? 'running';
  const cfg = BRANCH_CONFIG[branch] ?? BRANCH_CONFIG.running;
  const qc = useQueryClient();

  const endpoint =
    branch === 'running' ? '/running/overview' :
    branch === 'boxing' ? '/boxing/overview' :
    `/practice/overview/${PRACTICE_BRANCH_MAP[branch] ?? branch}`;

  const { data, isLoading } = useQuery({
    queryKey: ['sports', branch],
    queryFn: async () => { const r = await api.get(endpoint); return r.data; },
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} hitSlop={12}>
          <MettloText color={Colors.textMuted}>← Geri</MettloText>
        </TouchableOpacity>
        <MettloText variant="h4">{cfg.icon} {cfg.title}</MettloText>
        <View style={{ width: 48 }} />
      </View>

      {isLoading ? <MettloLoadingState /> : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={{ padding: Space.s16, paddingBottom: 40, gap: Space.s12 }}>
            {branch === 'running' && <RunningScreen data={data} qc={qc} />}
            {branch === 'boxing' && <BoxingScreen data={data} qc={qc} />}
            {!['running', 'boxing'].includes(branch) && <PracticeScreen branch={branch} data={data} qc={qc} />}
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const fieldStyles = StyleSheet.create({
  label: { fontSize: 13, color: Colors.textMuted, marginBottom: 2 },
  input: { backgroundColor: Colors.surface1, borderRadius: Radius.md, paddingHorizontal: Space.s14, paddingVertical: Space.s10, color: Colors.textPrimary, fontSize: 14, borderWidth: 1, borderColor: Colors.borderSubtle },
  chip: { paddingHorizontal: Space.s10, paddingVertical: Space.s6, borderRadius: Radius.pill, backgroundColor: Colors.surface1, borderWidth: 1, borderColor: Colors.borderSubtle },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 12, color: Colors.textMuted },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: Radius.md, height: 46, alignItems: 'center', justifyContent: 'center', marginTop: Space.s4 },
});

const cardStyles = StyleSheet.create({
  card: { backgroundColor: Colors.surface2, borderRadius: Radius.md, padding: Space.s16, borderWidth: 1, borderColor: Colors.borderSubtle, gap: Space.s12 },
  title: { fontSize: 15, fontWeight: '700' },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Space.s20, paddingVertical: Space.s14, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.s10 },
  statTile: { flex: 1, minWidth: 90, backgroundColor: Colors.surface2, borderRadius: Radius.md, padding: Space.s14, borderWidth: 1, borderColor: Colors.borderSubtle, alignItems: 'center' },
  statVal: { fontSize: 22, fontWeight: '800', color: Colors.primary },
  statUnit: { fontSize: 14, fontWeight: '400' },
  statLbl: { fontSize: 11, color: Colors.textMuted, marginTop: 4, textAlign: 'center' },
  row2: { flexDirection: 'row', gap: Space.s10 },
  row3: { flexDirection: 'row', gap: Space.s8 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tableHeader: { flexDirection: 'row', paddingBottom: Space.s6, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  tableRow: { flexDirection: 'row', paddingVertical: Space.s6, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  th: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase' },
  td: { fontSize: 12, color: Colors.textSecondary },
  planRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Space.s6, borderTopWidth: 1, borderTopColor: Colors.borderSubtle },
  goalRow: { flexDirection: 'row', alignItems: 'center', gap: Space.s10, borderTopWidth: 1, borderTopColor: Colors.borderSubtle, paddingTop: Space.s10 },
  logRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Space.s10, borderTopWidth: 1, borderTopColor: Colors.borderSubtle, paddingTop: Space.s10 },
  techniqueRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Space.s10, borderTopWidth: 1, borderTopColor: Colors.borderSubtle, paddingTop: Space.s8 },
  catLabel: { fontSize: 12, fontWeight: '700', color: Colors.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.pill },
  badgeText: { fontSize: 11, fontWeight: '600' },
  smallBtn: { backgroundColor: Colors.surface1, borderRadius: Radius.pill, paddingHorizontal: Space.s10, paddingVertical: Space.s6, borderWidth: 1, borderColor: Colors.borderSubtle },
  smallBtnText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  divider: { height: 1, backgroundColor: Colors.borderSubtle },
  fieldHint: { fontSize: 11, color: Colors.textMuted, lineHeight: 16 },
  mutedText: { fontSize: 13, color: Colors.textMuted },
  caption: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
});
