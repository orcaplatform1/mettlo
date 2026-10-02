import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, Space } from '../../constants/tokens';

export function MettloCopyright() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.line}>
        © 2026 Mettlo. Tüm hakları saklıdır.
      </Text>
      <Text style={styles.line}>
        Bu platformda yer alan tüm içerikler, tasarımlar, marka unsurları ve fikrî mülkiyet hakları ilgili yasal mevzuat kapsamında korunmaktadır.
      </Text>
      <Text style={[styles.line, styles.brand]}>
        {'Mettlo bir '}
        <Text style={styles.tradersWhite}>Traders</Text>
        <Text style={styles.tradersDot}>.</Text>
        <Text style={styles.tradersBlue}>TR</Text>
        {' 🇹🇷 ticari markasıdır.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: Space.s24,
    paddingTop: Space.s20,
    paddingBottom: Space.s28,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    marginTop: Space.s16,
    gap: Space.s8,
    alignItems: 'center',
  },
  line: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  brand: {
    marginTop: Space.s4,
    fontWeight: '600',
  },
  tradersWhite: {
    color: '#F9FAFB',
    fontWeight: '700',
    fontSize: 11,
  },
  tradersDot: {
    color: '#F9FAFB',
    fontWeight: '700',
    fontSize: 11,
  },
  tradersBlue: {
    color: '#0095F6',
    fontWeight: '700',
    fontSize: 11,
  },
});
