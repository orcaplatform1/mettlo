import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MettloText } from './MettloText';
import { MettloButton } from './MettloButton';
import { Colors, Radius, Space } from '../../constants/tokens';

const ITEM_H = 52;
const VISIBLE = 5;
const PICKER_H = ITEM_H * VISIBLE;

const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

function daysInMonth(month: number, year: number) {
  return new Date(year, month, 0).getDate();
}

function range(from: number, to: number) {
  const arr: number[] = [];
  for (let i = from; i <= to; i++) arr.push(i);
  return arr;
}

interface ColumnProps {
  items: (string | number)[];
  selectedIndex: number;
  onSelect: (i: number) => void;
  flex?: number;
}

function Column({ items, selectedIndex, onSelect, flex = 1 }: ColumnProps) {
  const ref = useRef<ScrollView>(null);
  // Scroll pozisyonunu takip et
  const pendingIdx = useRef(selectedIndex);

  // Seçili öğeye scroll et (mount + selectedIndex değişince)
  useEffect(() => {
    const timer = setTimeout(() => {
      ref.current?.scrollTo({ y: selectedIndex * ITEM_H, animated: false });
      pendingIdx.current = selectedIndex;
    }, 50);
    return () => clearTimeout(timer);
  }, [selectedIndex, items.length]);

  function commitScroll(offsetY: number) {
    const i = Math.max(0, Math.min(Math.round(offsetY / ITEM_H), items.length - 1));
    pendingIdx.current = i;
    onSelect(i);
  }

  function handleMomentumEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    commitScroll(e.nativeEvent.contentOffset.y);
  }

  function handleDragEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    commitScroll(e.nativeEvent.contentOffset.y);
  }

  function handleTap(index: number) {
    ref.current?.scrollTo({ y: index * ITEM_H, animated: true });
    onSelect(index);
  }

  return (
    <View style={[colStyles.wrap, { flex }]}>
      {/* Seçim bandı */}
      <View pointerEvents="none" style={colStyles.band} />
      {/* Üst/alt karartma */}
      <View pointerEvents="none" style={colStyles.fadeTop} />
      <View pointerEvents="none" style={colStyles.fadeBottom} />

      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        snapToAlignment="center"
        decelerationRate="fast"
        contentContainerStyle={{ paddingVertical: ITEM_H * 2 }}
        onMomentumScrollEnd={handleMomentumEnd}
        onScrollEndDrag={handleDragEnd}
        scrollEventThrottle={16}
        nestedScrollEnabled
      >
        {items.map((item, index) => {
          const selected = index === selectedIndex;
          return (
            <TouchableOpacity
              key={index}
              onPress={() => handleTap(index)}
              activeOpacity={0.6}
              style={colStyles.item}
            >
              <Text style={[colStyles.text, selected ? colStyles.textSelected : colStyles.textMuted]}>
                {typeof item === 'number' ? String(item).padStart(2, '0') : item}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const colStyles = StyleSheet.create({
  wrap: { height: PICKER_H, overflow: 'hidden', position: 'relative' },
  item: { height: ITEM_H, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 17, textAlign: 'center' },
  textSelected: { color: Colors.primary, fontWeight: '700', fontSize: 20 },
  textMuted: { color: Colors.textMuted },
  band: {
    position: 'absolute',
    left: 4, right: 4,
    top: ITEM_H * 2, height: ITEM_H,
    zIndex: 0,
    backgroundColor: 'rgba(249,115,22,0.10)',
    borderTopWidth: 1.5, borderBottomWidth: 1.5,
    borderTopColor: 'rgba(249,115,22,0.35)',
    borderBottomColor: 'rgba(249,115,22,0.35)',
    borderRadius: Radius.sm,
  },
  fadeTop: {
    position: 'absolute', left: 0, right: 0, top: 0, zIndex: 1,
    height: ITEM_H * 2,
    // Üstten aşağı koyudan şeffafa gradyan efekti (pure View ile)
    backgroundColor: 'transparent',
  },
  fadeBottom: {
    position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 1,
    height: ITEM_H * 2,
    backgroundColor: 'transparent',
  },
});

interface Props {
  visible: boolean;
  value: Date | null;
  onConfirm: (date: Date) => void;
  onClose: () => void;
  maxDate?: Date;
}

export function DatePickerModal({ visible, value, onConfirm, onClose, maxDate }: Props) {
  const insets = useSafeAreaInsets();
  const now = new Date();
  const maxYear = maxDate ? maxDate.getFullYear() : now.getFullYear() - 18;
  const minYear = 1960;

  const defaultDate = new Date(maxYear - 7, 0, 1);
  const initDate = value ?? defaultDate;

  const [day, setDay] = useState(initDate.getDate());
  const [month, setMonth] = useState(initDate.getMonth() + 1);
  const [year, setYear] = useState(
    Math.min(Math.max(initDate.getFullYear(), minYear), maxYear)
  );

  // Modal açılınca senkronize et
  useEffect(() => {
    if (visible) {
      const d = value ?? defaultDate;
      setDay(d.getDate());
      setMonth(d.getMonth() + 1);
      setYear(Math.min(Math.max(d.getFullYear(), minYear), maxYear));
    }
  }, [visible]);

  const years = range(minYear, maxYear).reverse();
  const months = MONTHS;
  const totalDays = daysInMonth(month, year);
  const days = range(1, totalDays);
  const clampedDay = Math.min(day, totalDays);

  const dayIdx = Math.max(0, days.indexOf(clampedDay));
  const monthIdx = month - 1;
  const yearIdx = Math.max(0, years.indexOf(year));

  const handleDay = useCallback((i: number) => setDay(i + 1), []);
  const handleMonth = useCallback((i: number) => setMonth(i + 1), []);
  const handleYear = useCallback((i: number) => setYear(years[i]), [years]);

  function confirm() {
    const date = new Date(year, month - 1, clampedDay);
    onConfirm(date);
    onClose();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Arka plan overlay */}
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />

      {/* Sheet */}
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, Space.s16) }]}>
        {/* Tutamaç */}
        <View style={styles.handle} />

        <LinearGradient colors={['#0F0C1F', '#111827']} style={styles.header}>
          <MettloText variant="h5">Doğum Tarihi</MettloText>
          <TouchableOpacity onPress={onClose} hitSlop={16}>
            <MettloText style={{ fontSize: 22, color: Colors.textMuted }}>×</MettloText>
          </TouchableOpacity>
        </LinearGradient>

        {/* Kolonlar */}
        <View style={styles.pickers}>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <MettloText variant="caption" color={Colors.textMuted} style={styles.colLabel}>GÜN</MettloText>
            <Column items={days} selectedIndex={dayIdx} onSelect={handleDay} />
          </View>

          <View style={styles.sep} />

          <View style={{ flex: 2, alignItems: 'center' }}>
            <MettloText variant="caption" color={Colors.textMuted} style={styles.colLabel}>AY</MettloText>
            <Column items={months} selectedIndex={monthIdx} onSelect={handleMonth} />
          </View>

          <View style={styles.sep} />

          <View style={{ flex: 1.4, alignItems: 'center' }}>
            <MettloText variant="caption" color={Colors.textMuted} style={styles.colLabel}>YIL</MettloText>
            <Column items={years} selectedIndex={yearIdx} onSelect={handleYear} />
          </View>
        </View>

        <View style={styles.footer}>
          <MettloButton label="Seç" onPress={confirm} fullWidth size="lg" />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.60)',
  },
  sheet: {
    backgroundColor: Colors.surface1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    overflow: 'hidden',
  },
  handle: {
    alignSelf: 'center',
    width: 40, height: 4,
    borderRadius: 2,
    backgroundColor: Colors.surface3,
    marginTop: Space.s12,
    marginBottom: Space.s4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Space.s20,
    paddingVertical: Space.s14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  pickers: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Space.s12,
    paddingVertical: Space.s12,
    backgroundColor: Colors.surface1,
  },
  colLabel: {
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: Space.s6,
    fontWeight: '700',
  },
  sep: {
    width: 1,
    height: PICKER_H,
    backgroundColor: Colors.borderSubtle,
    marginHorizontal: Space.s4,
  },
  footer: {
    paddingHorizontal: Space.s20,
    paddingTop: Space.s12,
  },
});
