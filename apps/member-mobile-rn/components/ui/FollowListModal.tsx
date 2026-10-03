import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { MettloText } from './MettloText';
import { MettloAvatar } from './MettloAvatar';
import { Colors, Radius, Space } from '../../constants/tokens';
import { userService } from '../../services/userService';
import { absUrl } from '../../services/api';

const { height: SH } = Dimensions.get('window');

type UserRow = {
  username: string;
  name: string;
  avatarUrl?: string | null;
  displayName?: string;
};

interface Props {
  visible: boolean;
  mode: 'followers' | 'following';
  username: string;
  onClose: () => void;
  onNavigate?: (username: string) => void;
}

export function FollowListModal({ visible, mode, username, onClose, onNavigate }: Props) {
  const [list, setList] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    const fn = mode === 'followers' ? userService.getFollowers : userService.getFollowing;
    fn(username)
      .then((d) => setList(Array.isArray(d) ? d : []))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, [visible, mode, username]);

  const title = mode === 'followers' ? 'Takipçiler' : 'Takip Edilenler';

  const renderItem = ({ item }: { item: UserRow }) => {
    const displayName = item.displayName ?? item.name ?? item.username;
    return (
      <Pressable
        style={styles.row}
        onPress={() => { onClose(); onNavigate?.(item.username); }}
      >
        <MettloAvatar uri={absUrl(item.avatarUrl)} name={displayName} size={44} />
        <View style={styles.rowInfo}>
          <MettloText variant="bodySm" style={{ fontWeight: '700' }} numberOfLines={1}>{displayName}</MettloText>
          <MettloText variant="caption" color={Colors.textMuted}>@{item.username}</MettloText>
        </View>
      </Pressable>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      {/* Backdrop */}
      <Pressable style={styles.backdrop} onPress={onClose} />

      {/* Bottom sheet */}
      <View style={styles.sheet}>
        {/* Handle */}
        <View style={styles.handle} />

        {/* Başlık */}
        <View style={styles.header}>
          <MettloText variant="h5">{title}</MettloText>
          <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
            <MettloText style={styles.closeTxt}>✕</MettloText>
          </Pressable>
        </View>

        {/* Liste */}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={Colors.primary} size="large" />
          </View>
        ) : list.length === 0 ? (
          <View style={styles.center}>
            <MettloText color={Colors.textMuted} style={{ textAlign: 'center' }}>
              {mode === 'followers' ? 'Henüz takipçi yok' : 'Henüz takip edilen yok'}
            </MettloText>
          </View>
        ) : (
          <FlatList
            data={list}
            keyExtractor={(item) => item.username}
            renderItem={renderItem}
            ItemSeparatorComponent={() => <View style={styles.sep} />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: Space.s32 }}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: SH * 0.72,
    backgroundColor: Colors.surface1,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingTop: Space.s8,
    paddingHorizontal: Space.s16,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.borderSubtle,
    alignSelf: 'center',
    marginBottom: Space.s12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Space.s12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
    marginBottom: Space.s4,
  },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.surface2,
    alignItems: 'center', justifyContent: 'center',
  },
  closeTxt: { color: Colors.textMuted, fontSize: 14 },
  center: { paddingVertical: Space.s40, alignItems: 'center' },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: Space.s12, gap: Space.s12,
  },
  rowInfo: { flex: 1, gap: 2 },
  sep: { height: 1, backgroundColor: Colors.borderSubtle },
});
