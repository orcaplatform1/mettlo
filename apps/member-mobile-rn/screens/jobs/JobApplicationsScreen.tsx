import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { MettloText } from '../../components/ui/MettloText';
import { MettloLoadingState } from '../../components/ui/MettloLoadingState';
import { Colors, Radius, Space } from '../../constants/tokens';
import { api } from '../../services/api';

const STATUS_TR: Record<string, string> = {
  APPLIED: 'Başvuruldu', VIEWED: 'Görüntülendi', SHORTLISTED: 'Kısa Listede',
  REJECTED: 'Reddedildi', HIRED: 'Kabul Edildi',
};
const STATUS_COLOR: Record<string, string> = {
  APPLIED: Colors.textMuted, VIEWED: Colors.primary, SHORTLISTED: Colors.success,
  REJECTED: Colors.error, HIRED: Colors.success,
};
const fmtDate = (s: string) =>
  new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(s));

export function JobApplicationsScreen() {
  const nav = useNavigation();

  const { data: applications = [], isLoading: appsLoading } = useQuery({
    queryKey: ['job-applications'],
    queryFn: async () => { const r = await api.get('/my-job-applications'); return r.data as any[]; },
  });

  const { data: offers = [], isLoading: offersLoading } = useQuery({
    queryKey: ['job-offers'],
    queryFn: async () => {
      try { const r = await api.get('/my-job-applications/offers'); return r.data as any[]; }
      catch { return []; }
    },
  });

  const isLoading = appsLoading || offersLoading;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} hitSlop={12}>
          <MettloText color={Colors.textMuted}>← Geri</MettloText>
        </TouchableOpacity>
        <MettloText variant="h4">İş Başvurularım</MettloText>
        <View style={{ width: 48 }} />
      </View>

      {isLoading ? <MettloLoadingState /> : (
        <ScrollView contentContainerStyle={{ padding: Space.s16, paddingBottom: 40, gap: Space.s16 }}>

          {/* Gelen teklifler */}
          {offers.length > 0 && (
            <View style={styles.section}>
              <MettloText style={styles.sectionTitle}>📨 Gelen Teklifler</MettloText>
              {offers.map((offer: any) => (
                <View key={offer.id} style={styles.card}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: Space.s12 }}>
                    <View style={{ flex: 1 }}>
                      <MettloText style={{ fontWeight: '600' }}>{offer.business?.name}</MettloText>
                      {offer.jobPost && <MettloText style={styles.caption}>{offer.jobPost.title}</MettloText>}
                      {offer.message && <MettloText style={[styles.caption, { marginTop: Space.s6 }]}>{offer.message}</MettloText>}
                    </View>
                    <MettloText style={styles.caption}>{fmtDate(offer.sentAt)}</MettloText>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Başvurular */}
          <View style={styles.section}>
            <MettloText style={styles.sectionTitle}>💼 Başvurularım ({applications.length})</MettloText>
            {applications.length === 0 ? (
              <MettloText style={styles.emptyText}>Henüz bir iş ilanına başvurmadınız.</MettloText>
            ) : (
              applications.map((app: any) => (
                <View key={app.id} style={styles.card}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Space.s12 }}>
                    <View style={{ flex: 1 }}>
                      <MettloText style={{ fontWeight: '600' }}>{app.jobPost?.title}</MettloText>
                      <MettloText style={styles.caption}>{app.jobPost?.business?.name}</MettloText>
                      {app.coverLetter && (
                        <MettloText style={[styles.caption, { marginTop: Space.s6 }]} numberOfLines={2}>
                          {app.coverLetter}
                        </MettloText>
                      )}
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: Space.s4 }}>
                      <View style={[styles.badge, { backgroundColor: `${STATUS_COLOR[app.status] ?? Colors.textMuted}20` }]}>
                        <MettloText style={[styles.badgeText, { color: STATUS_COLOR[app.status] ?? Colors.textMuted }]}>
                          {STATUS_TR[app.status] ?? app.status}
                        </MettloText>
                      </View>
                      <MettloText style={styles.caption}>{fmtDate(app.appliedAt)}</MettloText>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Space.s20, paddingVertical: Space.s14, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  section: { gap: Space.s10 },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: Space.s4 },
  card: { backgroundColor: Colors.surface2, borderRadius: Radius.md, padding: Space.s14, borderWidth: 1, borderColor: Colors.borderSubtle },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.pill },
  badgeText: { fontSize: 11, fontWeight: '600' },
  caption: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  emptyText: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', paddingVertical: Space.s20 },
});
