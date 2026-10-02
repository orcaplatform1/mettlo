import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, Radius } from '../../constants/tokens';

interface Props {
  uri?: string | null;
  name?: string;
  size?: number;
  verified?: boolean;
}

export function MettloAvatar({ uri, name, size = 44, verified }: Props) {
  const initial = name ? name[0].toUpperCase() : '?';
  return (
    <View style={{ width: size, height: size }}>
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
      {verified && (
        <View style={[styles.verifiedDot, { width: size * 0.28, height: size * 0.28, borderRadius: size * 0.14, right: -1, bottom: -1 }]}>
          <Text style={{ fontSize: size * 0.16 }}>✓</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: { backgroundColor: Colors.surface3, alignItems: 'center', justifyContent: 'center' },
  verifiedDot: { position: 'absolute', backgroundColor: Colors.verified, alignItems: 'center', justifyContent: 'center' },
});
