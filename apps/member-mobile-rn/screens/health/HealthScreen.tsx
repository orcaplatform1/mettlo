import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { MettloText } from '../../components/ui/MettloText';
import { MettloLoadingState } from '../../components/ui/MettloLoadingState';
import { Colors, Radius, Space } from '../../constants/tokens';
import { healthService } from '../../services/healthService';

interface StatCard { label: string; value: string | number; unit: string; icon: string; color: string }

export function HealthScreen() {
  const { data, isLoading } = useQuery({
    queryKey: ['health-stats'],
    queryFn: () => healthService.getStats(),
  });

  const { data: weekly } = useQuery({
    queryKey: ['health-weekly'],
    queryFn: () => healthService.getWeekly(),
  });

  const stats: StatCard[] = [
    { label: 'Adım', value: data?.steps ?? 0, unit: 'adım', icon: '👣', color: Colors.success },
    { label: 'Kalori', value: data?.activeCalories ?? 0, unit: 'kcal', icon: '🔥', color: Colors.primary },
    { label: 'Uyku', value: data?.sleepHours ?? 0, unit: 'saat', icon: '😴', color: Colors.secondary },
    { label: 'Nabız', value: data?.heartRate ?? 0, unit: 'bpm', icon: '❤️', color: Colors.error },
  ];

  if (isLoading) return <MettloLoadingState />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <MettloText variant="h2">Sağlık Takibi</MettloText>
          <MettloText variant="body" color={Colors.textMuted}>Günlük istatistiklerin</MettloText>
        </View>

        {/* Stat grid */}
        <View style={styles.grid}>
          {stats.map((s) => (
            <View key={s.label} style={styles.statCard}>
              <MettloText style={styles.statIcon}>{s.icon}</MettloText>
              <MettloText variant="h3" color={s.color}>{s.value}</MettloText>
              <MettloText variant="caption" color={Colors.textMuted}>{s.unit}</MettloText>
              <MettloText variant="caption" color={Colors.textSecondary}>{s.label}</MettloText>
            </View>
          ))}
        </View>

        {/* XP & Streak */}
        <View style={styles.section}>
          <LinearGradient
            colors={['rgba(249,115,22,0.15)', 'rgba(253,224,71,0.08)']}
            style={styles.xpCard}
          >
            <View style={styles.xpRow}>
              <View>
                <MettloText variant="h4" color={Colors.highlight}>⚡ {data?.xp ?? 0} XP</MettloText>
                <MettloText variant="caption" color={Colors.textMuted}>Toplam Puan</MettloText>
              </View>
              <View style={styles.divider} />
              <View>
                <MettloText variant="h4" color={Colors.primary}>🔥 {data?.streakDays ?? 0} Gün</MettloText>
                <MettloText variant="caption" color={Colors.textMuted}>Streak</MettloText>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Haftalık özet */}
        <View style={styles.section}>
          <MettloText variant="h4">Bu Hafta</MettloText>
          <View style={styles.weeklyRow}>
            {['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pa'].map((day, i) => {
              const val = weekly?.days?.[i] ?? 0;
              const max = Math.max(...(weekly?.days ?? [1]), 1);
              const pct = val / max;
              return (
                <View key={day} style={styles.dayCol}>
                  <View style={styles.barWrap}>
                    <View style={[styles.barFill, { height: `${Math.round(pct * 100)}%` as any, backgroundColor: pct > 0.7 ? Colors.primary : Colors.surface3 }]} />
                  </View>
                  <MettloText variant="caption" color={Colors.textMuted}>{day}</MettloText>
                </View>
              );
            })}
          </View>
        </View>

        {/* Entegrasyon notu */}
        <View style={styles.integNote}>
          <MettloText variant="caption" color={Colors.textMuted} style={{ textAlign: 'center' }}>
            📱 iOS'ta Apple Health, Android'de Health Connect entegrasyonu için izin ver.
          </MettloText>
        </View>

        <View style={{ height: Space.s32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  header: { paddingHorizontal: Space.s16, paddingTop: Space.s16, paddingBottom: Space.s16, gap: Space.s4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Space.s16, gap: Space.s12 },
  statCard: {
    width: '47%', backgroundColor: Colors.surface1, borderRadius: Radius.card,
    padding: Space.s16, gap: Space.s4, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.borderSubtle,
  },
  statIcon: { fontSize: 28, marginBottom: Space.s4 },
  section: { paddingHorizontal: Space.s16, paddingVertical: Space.s16, gap: Space.s12 },
  xpCard: { borderRadius: Radius.card, padding: Space.s20 },
  xpRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  divider: { width: 1, height: 40, backgroundColor: Colors.borderSubtle },
  weeklyRow: { flexDirection: 'row', gap: Space.s8, alignItems: 'flex-end' },
  dayCol: { flex: 1, alignItems: 'center', gap: Space.s4 },
  barWrap: { width: '100%', height: 60, backgroundColor: Colors.surface2, borderRadius: 4, overflow: 'hidden', justifyContent: 'flex-end' },
  barFill: { width: '100%', borderRadius: 4 },
  integNote: { marginHorizontal: Space.s16, padding: Space.s14, backgroundColor: Colors.surface2, borderRadius: Radius.md },
});
