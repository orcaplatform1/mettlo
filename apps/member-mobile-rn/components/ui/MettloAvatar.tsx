import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/tokens';
import { VerifiedBadgeOverlay, RoleBadgeOverlay, isStaffRole } from './VerifiedBadge';
import { userService } from '../../services/userService';
import { useAuthStore } from '../../store/authStore';

const { width: SW } = Dimensions.get('window');
const PHOTO_SIZE = SW * 0.82;

interface Props {
  uri?: string | null;
  name?: string;
  size?: number;
  verified?: boolean;
  role?: string;
  style?: object;
  tappable?: boolean;
  username?: string; // geçilirse follow butonu gösterilir
}

export function MettloAvatar({ uri, name, size = 44, verified, role, style, tappable, username }: Props) {
  const [open, setOpen] = useState(false);
  const initial = name ? name[0].toUpperCase() : '?';
  const showRoleBadge = isStaffRole(role);
  const showVerified = !showRoleBadge && verified;

  const avatar = (
    <View style={[{ width: size, height: size, overflow: 'visible' }, style]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <View style={[styles.placeholder, { width: size, height: size, borderRadius: size / 2 }]}>
          <Text style={{ color: Colors.textPrimary, fontSize: size * 0.4, fontWeight: '700' }}>{initial}</Text>
        </View>
      )}
      {showRoleBadge && <RoleBadgeOverlay role={role!.toUpperCase()} avatarSize={size} />}
      {showVerified && <VerifiedBadgeOverlay avatarSize={size} />}
    </View>
  );

  if (!tappable || !uri) return avatar;

  return (
    <>
      <Pressable onPress={() => setOpen(true)} hitSlop={4}>
        {avatar}
      </Pressable>
      {open && (
        <PhotoModal
          uri={uri}
          name={name}
          username={username}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function PhotoModal({ uri, name, username, onClose }: { uri: string; name?: string; username?: string; onClose: () => void }) {
  const me = useAuthStore((s) => s.user);
  const isSelf = !!username && username === me?.username;
  const [following, setFollowing] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!username || isSelf) return;
    userService.getFollowStatus(username)
      .then((d) => setFollowing(d?.isFollowing ?? d?.following ?? false))
      .catch(() => setFollowing(false));
  }, [username, isSelf]);

  const toggle = async () => {
    if (!username || loading) return;
    setLoading(true);
    try {
      if (following) {
        await userService.unfollow(username);
        setFollowing(false);
      } else {
        await userService.follow(username);
        setFollowing(true);
      }
    } catch {}
    setLoading(false);
  };

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent>
      {/* Arka plan — tıklayınca kapat */}
      <Pressable style={styles.backdrop} onPress={onClose}>
        {/* Fotoğraf — tıklamayı durdur, arkaplan kapanmasın */}
        <Pressable onPress={(e) => e.stopPropagation()}>
          <Image
            source={{ uri }}
            style={styles.photo}
            contentFit="cover"
          />
        </Pressable>
      </Pressable>

      {/* Alt buton — backdrop dışında, modalın üstünde */}
      {username && !isSelf && (
        <View style={styles.bottomBar}>
          <Pressable
            style={[styles.followBtn, following && styles.followingBtn]}
            onPress={toggle}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.followText}>
                  {following === null ? '...' : following ? 'Takipten Çık' : 'Takip Et'}
                </Text>
            }
          </Pressable>
        </View>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  placeholder: { backgroundColor: Colors.surface3, alignItems: 'center', justifyContent: 'center' },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 100,
  },
  photo: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: PHOTO_SIZE / 2,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 12,
  },
  followBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  followingBtn: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  followText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
