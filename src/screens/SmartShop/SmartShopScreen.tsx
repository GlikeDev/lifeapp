import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Card, Badge } from '../../components/common';
import { Colors, Typography, Spacing, Radius } from '../../constants/tokens';
import { fetchProductByBarcode, searchProductsByName } from '../../lib/openFoodFacts';
import type { OFFProduct } from '../../lib/openFoodFacts';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';

// Mock store prices (до подключения реального API цен)
function mockStorePrices(productName: string) {
  const base = 0.5 + Math.random() * 2;
  return [
    { store: 'Lidl', distance: '0.3 км', price: base, best: true },
    { store: 'Maxi', distance: '0.7 км', price: +(base * 1.18).toFixed(2), best: false },
    { store: 'Idea', distance: '1.4 км', price: +(base * 1.26).toFixed(2), best: false },
  ];
}

type Mode = 'search' | 'scanning';

export function SmartShopScreen() {
  const { user } = useAuthStore();
  const [mode, setMode] = useState<Mode>('search');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<OFFProduct[]>([]);
  const [selected, setSelected] = useState<OFFProduct | null>(null);
  const [loading, setLoading] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  async function handleSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setSelected(null);
    const products = await searchProductsByName(query.trim());
    setResults(products);
    setLoading(false);
    if (products.length === 0) Alert.alert('Ничего не найдено', 'Попробуйте другое название');
  }

  async function handleBarcodeScan({ data }: { data: string }) {
    if (scanned) return;
    setScanned(true);
    setMode('search');
    setLoading(true);
    const product = await fetchProductByBarcode(data);
    setLoading(false);
    if (product) {
      setSelected(product);
      setResults([]);
    } else {
      Alert.alert('Продукт не найден', `Штрих-код: ${data}`);
    }
    setTimeout(() => setScanned(false), 2000);
  }

  async function handleOpenScanner() {
    if (!permission?.granted) {
      const r = await requestPermission();
      if (!r.granted) { Alert.alert('Нет доступа к камере'); return; }
    }
    setMode('scanning');
    setScanned(false);
  }

  async function addToFridge(product: OFFProduct) {
    if (!user) return;

    // Upsert product in cache
    const { data: cached } = await supabase
      .from('products')
      .upsert({
        barcode: product.barcode || null,
        name: product.name,
        brand: product.brand,
        calories_per_100g: product.calories_per_100g,
        protein_per_100g: product.protein_per_100g,
        fat_per_100g: product.fat_per_100g,
        carbs_per_100g: product.carbs_per_100g,
        image_url: product.image_url,
      }, { onConflict: 'barcode' })
      .select()
      .single();

    // Add to fridge with default 7-day expiry
    const expires = new Date();
    expires.setDate(expires.getDate() + 7);

    await supabase.from('fridge_items').insert({
      user_id: user.id,
      product_id: cached?.id ?? null,
      name: product.name,
      quantity: 1,
      unit: 'шт',
      expires_at: expires.toISOString().slice(0, 10),
    });

    Alert.alert('✓ Добавлено в холодильник', `${product.name} — срок 7 дней`);
  }

  const storePrices = selected ? mockStorePrices(selected.name) : [];

  // ── Scanning Mode ────────────────────────────────────────────────────────
  if (mode === 'scanning') {
    return (
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarcodeScan}
          barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'qr'] }}
        />
        <View style={styles.scanOverlay}>
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
            <Text style={styles.scanHint}>Наведите на штрих-код</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.scanCancel} onPress={() => setMode('search')}>
          <Text style={styles.scanCancelText}>Отмена</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Search Mode ──────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Умные покупки</Text>

        {/* Search bar */}
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Товар или штрих-код..."
            placeholderTextColor={Colors.textMuted}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity style={styles.scanBtn} onPress={handleOpenScanner}>
            <Text style={styles.scanBtnText}>скан</Text>
          </TouchableOpacity>
        </View>

        {loading && <ActivityIndicator color={Colors.accentTeal} style={{ marginTop: Spacing.lg }} />}

        {/* Search results list */}
        {results.length > 0 && !selected && (
          <View style={styles.resultsList}>
            {results.map((p, i) => (
              <TouchableOpacity key={i} style={styles.resultRow} onPress={() => { setSelected(p); setResults([]); }}>
                {p.image_url
                  ? <Image source={{ uri: p.image_url }} style={styles.resultImg} />
                  : <View style={[styles.resultImg, styles.resultImgPlaceholder]}><Text>🛒</Text></View>
                }
                <View style={styles.resultInfo}>
                  <Text style={styles.resultName} numberOfLines={1}>{p.name}</Text>
                  {p.brand ? <Text style={styles.resultBrand}>{p.brand}</Text> : null}
                  {p.calories_per_100g ? <Text style={styles.resultCals}>{p.calories_per_100g} ккал/100г</Text> : null}
                </View>
                <Text style={styles.resultArrow}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Selected product card */}
        {selected && (
          <>
            <Card style={styles.productCard}>
              <View style={styles.productHeader}>
                {selected.image_url
                  ? <Image source={{ uri: selected.image_url }} style={styles.productImg} />
                  : <View style={[styles.productImg, styles.resultImgPlaceholder]}><Text style={{ fontSize: 32 }}>🛒</Text></View>
                }
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{selected.name}</Text>
                  {selected.brand ? <Text style={styles.productBrand}>{selected.brand}</Text> : null}
                </View>
              </View>

              {/* Nutrition row */}
              {selected.calories_per_100g && (
                <View style={styles.nutriRow}>
                  <NutriChip label="ккал" value={selected.calories_per_100g} color={Colors.warning} />
                  {selected.protein_per_100g && <NutriChip label="Белок" value={selected.protein_per_100g} unit="г" color={Colors.accentTeal} />}
                  {selected.fat_per_100g && <NutriChip label="Жир" value={selected.fat_per_100g} unit="г" color={Colors.danger} />}
                  {selected.carbs_per_100g && <NutriChip label="Углев." value={selected.carbs_per_100g} unit="г" color={Colors.accentPurple} />}
                </View>
              )}

              <TouchableOpacity style={styles.fridgeBtn} onPress={() => addToFridge(selected)}>
                <Text style={styles.fridgeBtnText}>+ В холодильник · срок: 7 дней</Text>
              </TouchableOpacity>
            </Card>

            {/* Store prices */}
            <Text style={styles.sectionTitle}>Где купить дешевле сейчас</Text>
            {storePrices.map((s, i) => (
              <Card key={i} style={[styles.storeCard, s.best && styles.storeCardBest]}>
                <View style={styles.storeRow}>
                  <View style={styles.storeLeft}>
                    {s.best && <Badge label="лучшая цена" color={Colors.success} />}
                    <Text style={styles.storeName}>{s.store}</Text>
                    <Text style={styles.storeDist}>{s.distance}</Text>
                  </View>
                  <Text style={[styles.storePrice, s.best && styles.storePriceBest]}>
                    €{s.price.toFixed(2)}
                  </Text>
                </View>
              </Card>
            ))}

            <TouchableOpacity style={styles.backLink} onPress={() => setSelected(null)}>
              <Text style={styles.backLinkText}>← Новый поиск</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function NutriChip({ label, value, unit = '', color }: { label: string; value: number; unit?: string; color: string }) {
  return (
    <View style={[styles.nutriChip, { borderColor: color + '44' }]}>
      <Text style={[styles.nutriValue, { color }]}>{Math.round(value)}{unit}</Text>
      <Text style={styles.nutriLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: 40 },

  title: { fontSize: Typography.sizeXL, fontWeight: Typography.weightBold, color: Colors.textPrimary, marginBottom: Spacing.lg },

  searchRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  searchInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    color: Colors.textPrimary,
    fontSize: Typography.sizeMD,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  scanBtn: {
    backgroundColor: Colors.warning,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanBtnText: { color: Colors.bg, fontWeight: Typography.weightBold, fontSize: Typography.sizeSM },

  resultsList: { marginBottom: Spacing.md },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  resultImg: { width: 48, height: 48, borderRadius: Radius.sm },
  resultImgPlaceholder: { backgroundColor: Colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  resultInfo: { flex: 1 },
  resultName: { color: Colors.textPrimary, fontSize: Typography.sizeMD, fontWeight: Typography.weightSemiBold },
  resultBrand: { color: Colors.textSecondary, fontSize: Typography.sizeXS, marginTop: 2 },
  resultCals: { color: Colors.warning, fontSize: Typography.sizeXS, marginTop: 2 },
  resultArrow: { color: Colors.textMuted, fontSize: 20 },

  productCard: { marginBottom: Spacing.md },
  productHeader: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  productImg: { width: 72, height: 72, borderRadius: Radius.md },
  productInfo: { flex: 1, justifyContent: 'center' },
  productName: { fontSize: Typography.sizeMD, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  productBrand: { fontSize: Typography.sizeSM, color: Colors.textSecondary, marginTop: 2 },

  nutriRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md, flexWrap: 'wrap' },
  nutriChip: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    alignItems: 'center',
    minWidth: 60,
    borderWidth: 1,
  },
  nutriValue: { fontSize: Typography.sizeSM, fontWeight: Typography.weightBold },
  nutriLabel: { fontSize: Typography.sizeXS, color: Colors.textMuted, marginTop: 2 },

  fridgeBtn: {
    backgroundColor: Colors.accentTeal + '22',
    borderRadius: Radius.md,
    padding: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.accentTeal + '66',
  },
  fridgeBtnText: { color: Colors.accentTeal, fontSize: Typography.sizeSM, fontWeight: Typography.weightSemiBold },

  sectionTitle: { fontSize: Typography.sizeMD, fontWeight: Typography.weightSemiBold, color: Colors.textPrimary, marginBottom: Spacing.sm },
  storeCard: { marginBottom: Spacing.sm, padding: Spacing.md },
  storeCardBest: { borderColor: Colors.success + '66' },
  storeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  storeLeft: { gap: 2 },
  storeName: { fontSize: Typography.sizeMD, fontWeight: Typography.weightSemiBold, color: Colors.textPrimary },
  storeDist: { fontSize: Typography.sizeXS, color: Colors.textSecondary },
  storePrice: { fontSize: Typography.sizeXL, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  storePriceBest: { color: Colors.success },

  backLink: { marginTop: Spacing.md, alignItems: 'center' },
  backLinkText: { color: Colors.accentTeal, fontSize: Typography.sizeSM },

  // Scanner
  scanOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  scanFrame: { width: 260, height: 160, position: 'relative', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: Spacing.md },
  corner: { position: 'absolute', width: 24, height: 24, borderColor: Colors.accentTeal, borderWidth: 3 },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  scanHint: { color: 'rgba(255,255,255,0.8)', fontSize: Typography.sizeSM },
  scanCancel: { position: 'absolute', bottom: 50, alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: Radius.full, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
  scanCancelText: { color: Colors.textPrimary, fontWeight: Typography.weightSemiBold },
});
