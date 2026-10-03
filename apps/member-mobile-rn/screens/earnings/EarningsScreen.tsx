import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MettloText } from '../../components/ui/MettloText';
import { MettloLoadingState } from '../../components/ui/MettloLoadingState';
import { Colors, Radius, Space } from '../../constants/tokens';
import { api } from '../../services/api';

const fmt = (kurus: number) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(kurus / 100);

const fmtDate = (s: string) =>
  new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(s));

const ACC_STATUS_TR: Record<string, string> = {
  VERIFIED: 'Doğrulandı', PENDING_VERIFICATION: 'Doğrulama Bekleniyor', REJECTED: 'Reddedildi',
};
const ACC_STATUS_COLOR: Record<string, string> = {
  VERIFIED: Colors.success, PENDING_VERIFICATION: Colors.warning, REJECTED: Colors.error,
};

export function EarningsScreen() {
  const nav = useNavigation();
  const qc = useQueryClient();
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  const { data: balance, isLoading: balLoading } = useQuery({
    queryKey: ['earnings-balance'],
    queryFn: async () => { const r = await api.get('/earnings'); return r.data; },
  });
  const { data: history, isLoading: histLoading } = useQuery({
    queryKey: ['earnings-history'],
    queryFn: async () => { const r = await api.get('/earnings/history?limit=20'); return r.data; },
  });
  const { data: accounts = [], isLoading: accLoading } = useQuery({
    queryKey: ['payout-accounts'],
    queryFn: async () => { const r = await api.get('/payout-accounts'); return r.data as any[]; },
  });

  const activeAccount = accounts.find((a: any) => a.isActive && a.status === 'VERIFIED');

  async function requestPayout() {
    const kurus = Math.round(parseFloat(withdrawAmount) * 100);
    if (!kurus || kurus <= 0) { Alert.alert('Eksik', 'Geçerli bir tutar gir'); return; }
    const available = Math.round((balance?.available ?? 0) * 100);
    if (kurus > available) { Alert.alert('Yetersiz Bakiye', 'Çekilebilir bakiyenden fazla girildi'); return; }
    if (!activeAccount) { Alert.alert('Hesap Yok', 'Doğrulanmış banka hesabı eklenmemiş'); return; }
    setWithdrawing(true);
    try {
      await api.post('/earnings/payout', { amountKurus: kurus, accountId: activeAccount.id });
      qc.invalidateQueries({ queryKey: ['earnings-balance'] });
      qc.invalidateQueries({ queryKey: ['earnings-history'] });
      setWithdrawAmount('');
      Alert.alert('Başarılı', 'Para çekme talebi oluşturuldu');
    } catch (e: any) {
      Alert.alert('Hata', e?.response?.data?.message ?? 'İşlem başarısız');
    } finally { setWithdrawing(false); }
  }

  const isLoading = balLoading || histLoading || accLoading;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} hitSlop={12}>
          <MettloText color={Colors.textMuted}>← Geri</MettloText>
        </TouchableOpacity>
        <MettloText variant="h4">Kazançlarım</MettloText>
        <View style={{ width: 48 }} />
      </View>

      {isLoading ? <MettloLoadingState /> : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={{ padding: Space.s16, paddingBottom: 40 }}>

            {/* Bakiye kartları */}
            <View style={styles.statsGrid}>
              {[
                { label: 'Toplam Kazanç', value: balance?.totalEarnings ?? 0 },
                { label: 'Bekleyen', value: balance?.pending ?? 0 },
                { label: 'Çekilebilir', value: balance?.available ?? 0 },
                { label: 'Toplam Ödenen', value: balance?.totalPaidOut ?? 0 },
              ].map(({ label, value }) => (
                <View key={label} style={styles.statCard}>
                  <MettloText style={styles.statLabel}>{label}</MettloText>
                  <MettloText style={styles.statValue}>{fmt(Math.round(value * 100))}</MettloText>
                </View>
              ))}
            </View>

            {/* Para çek */}
            <View style={[styles.section, { marginTop: Space.s16 }]}>
              <MettloText style={styles.sectionTitle}>Para Çek</MettloText>
              {!activeAccount ? (
                <MettloText style={styles.mutedText}>
                  Para çekebilmek için doğrulanmış bir banka hesabı eklemeniz gerekiyor.
                </MettloText>
              ) : (
                <View style={{ gap: Space.s10 }}>
                  <View>
                    <MettloText style={{ fontWeight: '600' }}>{activeAccount.accountHolderName}</MettloText>
                    <MettloText style={styles.caption}>{activeAccount.maskedIban}</MettloText>
                    {activeAccount.bankName && <MettloText style={styles.caption}>{activeAccount.bankName}</MettloText>}
                  </View>
                  <TextInput
                    style={styles.input}
                    value={withdrawAmount}
                    onChangeText={setWithdrawAmount}
                    keyboardType="decimal-pad"
                    placeholder="Tutar (₺)"
                    placeholderTextColor={Colors.textMuted}
                  />
                  <TouchableOpacity
                    style={[styles.btn, withdrawing && { opacity: 0.5 }]}
                    onPress={requestPayout}
                    disabled={withdrawing}
                  >
                    {withdrawing
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <MettloText style={{ color: '#fff', fontWeight: '700' }}>Para Çek</MettloText>}
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Banka hesapları */}
            <View style={[styles.section, { marginTop: Space.s12 }]}>
              <MettloText style={styles.sectionTitle}>Banka Hesaplarım</MettloText>
              {accounts.length === 0 ? (
                <MettloText style={styles.mutedText}>Henüz banka hesabı eklenmedi.</MettloText>
              ) : (
                accounts.map((a: any) => (
                  <View key={a.id} style={styles.accountRow}>
                    <View style={{ flex: 1 }}>
                      <MettloText style={{ fontWeight: '600' }}>{a.accountHolderName}</MettloText>
                      <MettloText style={styles.caption}>{a.maskedIban}</MettloText>
                      {a.bankName && <MettloText style={styles.caption}>{a.bankName}</MettloText>}
                    </View>
                    <View style={{ gap: Space.s4, alignItems: 'flex-end' }}>
                      {a.isActive && (
                        <View style={[styles.badge, { backgroundColor: 'rgba(34,197,94,0.15)' }]}>
                          <MettloText style={[styles.badgeText, { color: Colors.success }]}>Aktif</MettloText>
                        </View>
                      )}
                      <View style={[styles.badge, { backgroundColor: `${ACC_STATUS_COLOR[a.status] ?? Colors.textMuted}20` }]}>
                        <MettloText style={[styles.badgeText, { color: ACC_STATUS_COLOR[a.status] ?? Colors.textMuted }]}>
                          {ACC_STATUS_TR[a.status] ?? a.status}
                        </MettloText>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>

            {/* Son kazançlar */}
            <View style={[styles.section, { marginTop: Space.s12 }]}>
              <MettloText style={styles.sectionTitle}>Son Kazançlar</MettloText>
              {!history?.items?.length ? (
                <MettloText style={styles.mutedText}>Henüz kazanç kaydı yok.</MettloText>
              ) : (
                history.items.map((e: any) => (
                  <View key={e.id} style={styles.historyRow}>
                    <View style={{ flex: 1 }}>
                      <MettloText style={{ fontWeight: '600' }}>{fmt(Math.round(e.creatorShare * 100))}</MettloText>
                      <MettloText style={styles.caption}>{e.type} · {e.period}</MettloText>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <MettloText style={styles.caption}>{fmtDate(e.createdAt)}</MettloText>
                      {e.commissionRate != null && (
                        <MettloText style={styles.caption}>%{e.commissionRate} komisyon</MettloText>
                      )}
                    </View>
                  </View>
                ))
              )}
              {history?.total > 20 && (
                <MettloText style={[styles.caption, { textAlign: 'center', marginTop: Space.s8 }]}>
                  Toplam {history.total} kayıt
                </MettloText>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Space.s20, paddingVertical: Space.s14, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.s10 },
  statCard: { width: '47%', backgroundColor: Colors.surface2, borderRadius: Radius.md, padding: Space.s14, borderWidth: 1, borderColor: Colors.borderSubtle, gap: Space.s4 },
  statLabel: { fontSize: 12, color: Colors.textMuted },
  statValue: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  section: { backgroundColor: Colors.surface2, borderRadius: Radius.md, padding: Space.s16, borderWidth: 1, borderColor: Colors.borderSubtle, gap: Space.s10 },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  input: { backgroundColor: Colors.surface1, borderRadius: Radius.md, paddingHorizontal: Space.s14, height: 48, color: Colors.textPrimary, fontSize: 15, borderWidth: 1, borderColor: Colors.borderSubtle },
  btn: { backgroundColor: Colors.primary, borderRadius: Radius.md, height: 48, alignItems: 'center', justifyContent: 'center' },
  accountRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Space.s12, borderTopWidth: 1, borderTopColor: Colors.borderSubtle, paddingTop: Space.s10 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.pill },
  badgeText: { fontSize: 11, fontWeight: '600' },
  historyRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Space.s12, borderTopWidth: 1, borderTopColor: Colors.borderSubtle, paddingTop: Space.s10 },
  caption: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  mutedText: { fontSize: 13, color: Colors.textMuted, lineHeight: 18 },
});
