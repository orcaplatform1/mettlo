import React, { useState } from 'react';
import {
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MettloText } from './MettloText';
import { MettloButton } from './MettloButton';
import { Colors, Space } from '../../constants/tokens';
import { TERMS_SECTIONS, KVKK_SECTIONS } from '../../constants/legalContent';

interface Props {
  type: 'terms' | 'kvkk';
  visible: boolean;
  onAccept: () => void;
  onClose: () => void;
}

export function LegalConsentModal({ type, visible, onAccept, onClose }: Props) {
  const [canAccept, setCanAccept] = useState(false);
  const sections = type === 'terms' ? TERMS_SECTIONS : KVKK_SECTIONS;
  const title = type === 'terms' ? 'Kullanım Koşulları' : 'KVKK Aydınlatma Metni';

  function handleScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 80) {
      if (!canAccept) setCanAccept(true);
    }
  }

  function handleAccept() {
    onAccept();
    onClose();
    setCanAccept(false);
  }

  function handleClose() {
    onClose();
    setCanAccept(false);
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* Başlık */}
        <LinearGradient colors={['#0F0C1F', '#111827']} style={styles.header}>
          <View style={styles.headerRow}>
            <MettloText variant="h4" style={{ flex: 1 }}>{title}</MettloText>
            <Pressable onPress={handleClose} hitSlop={16} style={styles.closeBtn}>
              <MettloText style={{ fontSize: 20, color: Colors.textMuted, lineHeight: 24 }}>×</MettloText>
            </Pressable>
          </View>
          {!canAccept && (
            <MettloText variant="caption" color={Colors.primary}>
              ↓ Metnin sonuna kadar kaydırın, ardından kabul edebilirsiniz
            </MettloText>
          )}
        </LinearGradient>

        {/* İçerik */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator
        >
          {sections.map((s, i) => (
            <View key={i} style={styles.section}>
              <MettloText variant="h5" color={Colors.primary}>{s.title}</MettloText>
              <MettloText variant="bodySm" color={Colors.textSecondary} style={styles.body}>{s.body}</MettloText>
            </View>
          ))}
          <View style={{ height: Space.s32 }} />
        </ScrollView>

        {/* Alt buton — SafeAreaView içinde olduğu için nav barın üstünde kalır */}
        <View style={styles.footer}>
          {!canAccept && (
            <MettloText variant="caption" color={Colors.textMuted} style={styles.hint}>
              Kabul etmek için metnin sonuna kadar kaydırın
            </MettloText>
          )}
          <MettloButton
            label="Okudum, Kabul Ediyorum"
            onPress={handleAccept}
            disabled={!canAccept}
            fullWidth
            size="lg"
            variant={canAccept ? 'primary' : 'outline'}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    paddingTop: Space.s16,
    paddingHorizontal: Space.s20,
    paddingBottom: Space.s14,
    gap: Space.s8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: Space.s12 },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.surface2,
    alignItems: 'center', justifyContent: 'center',
  },
  scroll: { flex: 1 },
  scrollContent: { padding: Space.s20, gap: Space.s4 },
  section: {
    paddingBottom: Space.s20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
    marginBottom: Space.s4,
    gap: Space.s8,
  },
  body: { lineHeight: 22 },
  footer: {
    paddingHorizontal: Space.s20,
    paddingTop: Space.s12,
    paddingBottom: Space.s12,
    backgroundColor: Colors.surface1,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    gap: Space.s8,
  },
  hint: { textAlign: 'center' },
});
