import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

const ROLE_BADGE: Record<string, any> = {
  SUPER_ADMIN: require('../../assets/badge-superadmin.webp'),
  ADMIN: require('../../assets/badge-admin.webp'),
  MODERATOR: require('../../assets/badge-moderator.webp'),
  SUPPORT: require('../../assets/badge-support.webp'),
};

const VERIFIED_BADGE = require('../../assets/verified-badge.webp');

// Satır içi rozet (isim yanında vb.)
export function VerifiedBadge({ size = 18, style }: { size?: number; style?: object }) {
  return (
    <Image source={VERIFIED_BADGE} style={[{ width: size, height: size }, style]} resizeMode="contain" />
  );
}

// Rol rozeti — satır içi
export function RoleBadge({ role, size = 18, style }: { role: string; size?: number; style?: object }) {
  const source = ROLE_BADGE[role];
  if (!source) return null;
  return (
    <Image source={source} style={[{ width: size, height: size }, style]} resizeMode="contain" />
  );
}

// Avatar sol alt köşesi — verified (koç/işletme)
export function VerifiedBadgeOverlay({ avatarSize }: { avatarSize: number }) {
  const badgeSize = Math.round(avatarSize * 0.34);
  return (
    <View style={[styles.overlay, { width: badgeSize, height: badgeSize, bottom: -2, right: -2 }]}>
      <Image source={VERIFIED_BADGE} style={{ width: badgeSize, height: badgeSize }} resizeMode="contain" />
    </View>
  );
}

// Avatar sağ alt köşesi — staff rol rozeti
export function RoleBadgeOverlay({ role, avatarSize }: { role: string; avatarSize: number }) {
  const source = ROLE_BADGE[role];
  if (!source) return null;
  const badgeSize = Math.round(avatarSize * 0.38);
  return (
    <View style={[styles.overlay, { width: badgeSize, height: badgeSize, bottom: -2, right: -2 }]}>
      <Image source={source} style={{ width: badgeSize, height: badgeSize }} resizeMode="contain" />
    </View>
  );
}

const STAFF_ROLES = new Set(['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'SUPPORT']);
export const isStaffRole = (role?: string) => !!role && STAFF_ROLES.has(role.toUpperCase());

const styles = StyleSheet.create({
  overlay: { position: 'absolute' },
});
