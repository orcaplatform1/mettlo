import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MettloText } from '../../components/ui/MettloText';
import { MettloButton } from '../../components/ui/MettloButton';
import { Colors, Radius, Space } from '../../constants/tokens';
import { api } from '../../services/api';
import type { RootStackParamList } from '../../navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface Product {
  id: string;
  name: string;
  price: number;
  currency: string;
  stock?: number;
  isPublished: boolean;
  imageUrl?: string;
  category?: string;
}

function fmt(n: number, cur = 'TRY') {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(n);
}

export function AdminStoreScreen() {
  const nav = useNavigation<Nav>();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: Product[] }>('/admin/products');
      setProducts(res.data.data ?? (res.data as any));
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function togglePublish(p: Product) {
    setTogglingId(p.id);
    try {
      await api.patch(`/admin/products/${p.id}`, { isPublished: !p.isPublished });
      setProducts(prev => prev.map(x => x.id === p.id ? { ...x, isPublished: !x.isPublished } : x));
    } catch (e: any) {
      Alert.alert('Hata', e?.response?.data?.message ?? 'İşlem başarısız.');
    } finally { setTogglingId(null); }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} hitSlop={12}>
          <MettloText color={Colors.textMuted}>← Geri</MettloText>
        </TouchableOpacity>
        <MettloText variant="h4">Mağaza Ürünleri</MettloText>
        <View style={{ width: 48 }} />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={p => p.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<MettloText style={styles.empty}>Ürün bulunamadı</MettloText>}
          renderItem={({ item: p }) => (
            <View style={styles.card}>
              <View style={styles.row}>
                {p.imageUrl ? (
                  <Image source={{ uri: p.imageUrl }} style={styles.img} />
                ) : (
                  <View style={[styles.img, styles.imgPlaceholder]}><MettloText>🛍️</MettloText></View>
                )}
                <View style={styles.info}>
                  <MettloText style={styles.name}>{p.name}</MettloText>
                  {p.category && <MettloText style={styles.cat}>{p.category}</MettloText>}
                  <MettloText style={styles.price}>{fmt(p.price, p.currency)}</MettloText>
                  {p.stock != null && <MettloText style={styles.stock}>Stok: {p.stock}</MettloText>}
                </View>
                <View style={[styles.badge, { backgroundColor: p.isPublished ? 'rgba(16,185,129,0.15)' : 'rgba(107,114,128,0.15)' }]}>
                  <MettloText style={[styles.badgeText, { color: p.isPublished ? '#10B981' : Colors.textMuted }]}>
                    {p.isPublished ? 'Yayında' : 'Taslak'}
                  </MettloText>
                </View>
              </View>
              <MettloButton
                label={p.isPublished ? '📴 Yayından Al' : '📢 Yayınla'}
                variant="secondary"
                size="sm"
                onPress={() => togglePublish(p)}
                loading={togglingId === p.id}
                fullWidth
              />
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Space.s20, paddingVertical: Space.s14, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: Space.s16, gap: Space.s12 },
  empty: { textAlign: 'center', color: Colors.textMuted, padding: Space.s32 },
  card: { backgroundColor: Colors.surface1, borderRadius: Radius.card, borderWidth: 1, borderColor: Colors.borderSubtle, padding: Space.s14, gap: Space.s12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Space.s12 },
  img: { width: 60, height: 60, borderRadius: Radius.md },
  imgPlaceholder: { backgroundColor: Colors.surface3, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, gap: Space.s4 },
  name: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  cat: { fontSize: 12, color: Colors.textMuted },
  price: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  stock: { fontSize: 12, color: Colors.textMuted },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99, alignSelf: 'flex-start' },
  badgeText: { fontSize: 11, fontWeight: '600' },
});
