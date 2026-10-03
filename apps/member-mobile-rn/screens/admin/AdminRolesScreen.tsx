import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MettloText } from '../../components/ui/MettloText';
import { MettloAvatar } from '../../components/ui/MettloAvatar';
import { Colors, Radius, Space } from '../../constants/tokens';
import { api } from '../../services/api';

const ROLE_TR: Record<string, string> = { SUPER_ADMIN: 'Kurucu', ADMIN: 'Yönetici', MODERATOR: 'Topluluk Kontrolörü', SUPPORT: 'Müşteri İlişkileri', MEMBER: 'Üye', CREATOR: 'Koç' };
const ROLE_COLORS: Record<string, string> = { SUPER_ADMIN: '#EF4444', ADMIN: '#10B981', MODERATOR: '#F59E0B', SUPPORT: '#C084FC', MEMBER: Colors.textMuted, CREATOR: Colors.success };
const ROLES = ['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'SUPPORT', 'MEMBER'];

export function AdminRolesScreen() {
  const nav = useNavigation();
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [targetUser, setTargetUser] = useState('');
  const [newRole, setNewRole] = useState('MODERATOR');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/admin/staff');
      setStaff(res.data ?? []);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, []);

  async function changeRole(userId: string, role: string, name: string) {
    Alert.alert('Rol Değiştir', `${name} kullanıcısının rolünü ${ROLE_TR[role] ?? role} olarak değiştir?`, [
      { text: 'İptal', style: 'cancel' },
      { text: 'Değiştir', onPress: async () => {
        try {
          await api.patch(`/admin/users/${userId}/role`, { role });
          setStaff(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
        } catch (e: any) {
          Alert.alert('Hata', e?.response?.data?.message ?? 'Rol değiştirilemedi');
        }
      }},
    ]);
  }

  async function assignRole() {
    if (!targetUser.trim()) return;
    setSaving(true);
    try {
      await api.patch(`/admin/users/${targetUser.trim()}/role`, { role: newRole });
      Alert.alert('Başarılı', 'Rol atandı');
      setTargetUser('');
      setShowModal(false);
      load();
    } catch (e: any) {
      Alert.alert('Hata', e?.response?.data?.message ?? 'Rol atanamadı');
    } finally { setSaving(false); }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} hitSlop={12}>
          <MettloText color={Colors.textMuted}>← Geri</MettloText>
        </TouchableOpacity>
        <MettloText variant="h4">Rol Yönetimi</MettloText>
        <TouchableOpacity onPress={() => setShowModal(true)}>
          <MettloText style={{ color: Colors.primary, fontWeight: '600' }}>+ Ata</MettloText>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>
      ) : (
        <FlatList
          data={staff}
          keyExtractor={u => u.id}
          contentContainerStyle={{ paddingBottom: 32 }}
          ListEmptyComponent={<MettloText style={styles.empty}>Ekip üyesi yok</MettloText>}
          renderItem={({ item: u }) => (
            <View style={styles.row}>
              <MettloAvatar uri={u.avatarUrl} name={u.name} size={40} />
              <View style={{ flex: 1 }}>
                <MettloText style={{ fontWeight: '600' }}>{u.name}</MettloText>
                <MettloText style={styles.caption}>@{u.username}</MettloText>
              </View>
              <View style={{ gap: Space.s6, alignItems: 'flex-end' }}>
                <View style={[styles.badge, { backgroundColor: `${ROLE_COLORS[u.role] ?? Colors.textMuted}20` }]}>
                  <MettloText style={[styles.badgeText, { color: ROLE_COLORS[u.role] ?? Colors.textMuted }]}>{ROLE_TR[u.role] ?? u.role}</MettloText>
                </View>
                <View style={styles.roleButtons}>
                  {ROLES.filter(r => r !== u.role).slice(0, 2).map(r => (
                    <TouchableOpacity key={r} style={styles.roleBtn} onPress={() => changeRole(u.id, r, u.name)}>
                      <MettloText style={{ fontSize: 11, color: Colors.textMuted }}>{ROLE_TR[r]}</MettloText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          )}
        />
      )}

      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <MettloText variant="h4" style={{ marginBottom: Space.s16 }}>Kullanıcıya Rol Ver</MettloText>
            <MettloText style={styles.label}>Kullanıcı ID veya Kullanıcı Adı</MettloText>
            <TextInput style={styles.input} value={targetUser} onChangeText={setTargetUser} placeholder="örn: abc123 veya @kullanici" placeholderTextColor={Colors.textMuted} autoCapitalize="none" />
            <MettloText style={styles.label}>Rol</MettloText>
            <View style={styles.roleSelect}>
              {ROLES.map(r => (
                <TouchableOpacity key={r} style={[styles.roleOption, newRole === r && styles.roleOptionActive]} onPress={() => setNewRole(r)}>
                  <MettloText style={[styles.roleOptionText, newRole === r && styles.roleOptionTextActive] as any}>{ROLE_TR[r]}</MettloText>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setShowModal(false)}>
                <MettloText style={{ color: Colors.textMuted }}>İptal</MettloText>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.5 }]} onPress={assignRole} disabled={saving}>
                <MettloText style={{ color: '#fff', fontWeight: '600' }}>Ata</MettloText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Space.s20, paddingVertical: Space.s14, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Space.s16, paddingVertical: Space.s12, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle, gap: Space.s12 },
  caption: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.pill },
  badgeText: { fontSize: 11, fontWeight: '600' },
  roleButtons: { flexDirection: 'row', gap: Space.s4 },
  roleBtn: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.sm, backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.borderSubtle },
  empty: { textAlign: 'center', color: Colors.textMuted, padding: Space.s32 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modal: { backgroundColor: Colors.surface1, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: Space.s20, paddingBottom: 40 },
  label: { fontSize: 13, color: Colors.textMuted, marginBottom: Space.s6 },
  input: { backgroundColor: Colors.surface2, borderRadius: Radius.md, paddingHorizontal: Space.s14, height: 48, color: Colors.textPrimary, fontSize: 15, borderWidth: 1, borderColor: Colors.borderSubtle, marginBottom: Space.s16 },
  roleSelect: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.s8, marginBottom: Space.s20 },
  roleOption: { paddingHorizontal: Space.s12, paddingVertical: Space.s8, borderRadius: Radius.pill, backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.borderSubtle },
  roleOptionActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  roleOptionText: { fontSize: 13, color: Colors.textMuted },
  roleOptionTextActive: { color: '#fff', fontWeight: '600' },
  modalBtns: { flexDirection: 'row', gap: Space.s12 },
  cancelModalBtn: { flex: 1, height: 48, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.borderSubtle, alignItems: 'center', justifyContent: 'center' },
  saveBtn: { flex: 1, height: 48, borderRadius: Radius.md, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
});
