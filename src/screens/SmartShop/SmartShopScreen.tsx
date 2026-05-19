import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Image, ActivityIndicator, Alert, Animated,
  Dimensions, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';
import { Colors, Typography, Spacing, Radius, Layout } from '../../constants/tokens';
import { fetchProductByBarcode, searchProductsByName } from '../../lib/openFoodFacts';
import type { OFFProduct } from '../../lib/openFoodFacts';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { CoachMark, TipStep } from '../../components/CoachMark';
import { useCoachMark } from '../../hooks/useCoachMark';

const PRODUCTS_TIPS: TipStep[] = [
  { icon: '🛒', title: 'Сравните цены на продукты', body: 'Ищите товары по названию или сканируйте штрих-код прямо в магазине — мы покажем, где дешевле.' },
  { icon: '📷', title: 'Сканер штрих-кода', body: 'Нажмите на кнопку со сканером рядом с поиском. Наведите камеру на штрих-код — товар определится автоматически.' },
  { icon: '💰', title: 'Сравнение цен', body: 'После выбора товара увидите цены в разных магазинах. Зелёным выделен самый выгодный вариант поблизости.' },
  { icon: '➕', title: 'Добавьте свою цену', body: 'Знаете цену в вашем магазине? Нажмите «Добавить цену» и введите данные — мы сразу покажем выгоду.' },
];

const { width: SW } = Dimensions.get('window');
const VF_W = Math.round(SW * 0.76);
const VF_H = 160;

type Mode = 'hub' | 'scan' | 'product' | 'addManual';

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function IcoSearch({ c = '#fff', n = 20 }: { c?: string; n?: number }) {
  return (
    <Svg width={n} height={n} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="8" stroke={c} strokeWidth={1.8}/>
      <Path d="M21 21l-4.35-4.35" stroke={c} strokeWidth={2} strokeLinecap="round"/>
    </Svg>
  );
}

function IcoBarcode({ c = '#fff', n = 24 }: { c?: string; n?: number }) {
  return (
    <Svg width={n} height={n} viewBox="0 0 24 24" fill="none">
      <Path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" stroke={c} strokeWidth={1.8} strokeLinecap="round"/>
      <Line x1="7" y1="8" x2="7" y2="16" stroke={c} strokeWidth={1.8} strokeLinecap="round"/>
      <Line x1="10" y1="8" x2="10" y2="16" stroke={c} strokeWidth={1.8} strokeLinecap="round"/>
      <Line x1="13" y1="8" x2="13" y2="16" stroke={c} strokeWidth={1.8} strokeLinecap="round"/>
      <Line x1="16" y1="8" x2="16" y2="16" stroke={c} strokeWidth={1.8} strokeLinecap="round"/>
    </Svg>
  );
}

function IcoPlus({ c = '#fff', n = 20 }: { c?: string; n?: number }) {
  return (
    <Svg width={n} height={n} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={c} strokeWidth={2} strokeLinecap="round"/>
    </Svg>
  );
}

function IcoLeft({ c = '#fff', n = 22 }: { c?: string; n?: number }) {
  return (
    <Svg width={n} height={n} viewBox="0 0 24 24" fill="none">
      <Path d="M15 18l-6-6 6-6" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

function IcoTrash({ c = '#fff', n = 18 }: { c?: string; n?: number }) {
  return (
    <Svg width={n} height={n} viewBox="0 0 24 24" fill="none">
      <Path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

function IcoFridge({ c = '#fff', n = 20 }: { c?: string; n?: number }) {
  return (
    <Svg width={n} height={n} viewBox="0 0 24 24" fill="none">
      <Rect x="5" y="2" width="14" height="20" rx="2" stroke={c} strokeWidth={1.8}/>
      <Path d="M5 10h14" stroke={c} strokeWidth={1.8} strokeLinecap="round"/>
      <Path d="M10 6v2M10 14v3" stroke={c} strokeWidth={1.8} strokeLinecap="round"/>
    </Svg>
  );
}

// ─── Data & helpers ───────────────────────────────────────────────────────────

interface PriceEntry { store: string; price: number; distance: string; isUser?: boolean }

const STORE_SUGGESTIONS = ['Lidl', 'Aldi', 'Rewe', 'Kaufland', 'Carrefour', 'Spar', 'Пятёрочка', 'Магнит', 'Перекрёсток', 'Лента'];

function hashCode(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) { h = ((h << 5) + h) + s.charCodeAt(i); h |= 0; }
  return Math.abs(h);
}

function mockPrices(seed: string): PriceEntry[] {
  const h = hashCode(seed);
  const base = 1 + (h % 700) / 100;
  const stores = [
    { store: STORE_SUGGESTIONS[h % 4],          price: base,                                      distance: '0.3 км' },
    { store: STORE_SUGGESTIONS[(h + 1) % 4 + 4], price: +(base * (1.08 + ((h >> 8) & 0x1F) / 200)).toFixed(2), distance: '0.8 км' },
    { store: STORE_SUGGESTIONS[(h + 2) % 3 + 1], price: +(base * (1.15 + ((h >> 16) & 0x1F) / 160)).toFixed(2), distance: '1.3 км' },
    { store: STORE_SUGGESTIONS[(h + 3) % 3 + 2], price: +(base * (1.22 + ((h >> 24) & 0x1F) / 130)).toFixed(2), distance: '1.8 км' },
  ];
  return stores.sort((a, b) => a.price - b.price);
}

function PriceBar({ price, best, currency }: { price: number; best: number; currency: string }) {
  const pct = Math.min((best / price), 1);
  const fillPct = best === price ? 1 : price / (best * 1.5);
  const diffPct = Math.round(((price - best) / best) * 100);
  const isBest = price === best;

  return (
    <View style={pb.wrap}>
      <View style={pb.barBg}>
        <View style={[pb.barFill, { width: `${Math.min(fillPct * 100, 100)}%`, backgroundColor: isBest ? Colors.success : Colors.accentPurple }]} />
      </View>
      {isBest
        ? <Text style={pb.best}>🏆 лучшая цена</Text>
        : <Text style={pb.diff}>▲ +{diffPct}% дороже</Text>
      }
    </View>
  );
}

const pb = StyleSheet.create({
  wrap:   { marginTop: 4 },
  barBg:  { height: 4, backgroundColor: Colors.border, borderRadius: 2, overflow: 'hidden', marginBottom: 4 },
  barFill:{ height: 4, borderRadius: 2 },
  best:   { fontSize: 10, color: Colors.success, fontWeight: '600' },
  diff:   { fontSize: 10, color: Colors.textMuted },
});

// ─── Main component ───────────────────────────────────────────────────────────

export function SmartShopScreen() {
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();
  const currency = user?.currency ?? 'EUR';
  const { visible: tipsVisible, complete: tipsDone } = useCoachMark('products');

  const [mode, setMode]               = useState<Mode>('hub');
  const [permission, reqPerm]         = useCameraPermissions();
  const [query, setQuery]             = useState('');
  const [results, setResults]         = useState<OFFProduct[]>([]);
  const [product, setProduct]         = useState<OFFProduct | null>(null);
  const [loading, setLoading]         = useState(false);
  const [scanned, setScanned]         = useState(false);
  const [prices, setPrices]           = useState<PriceEntry[]>([]);
  const [showAddPrice, setShowAddPrice] = useState(false);
  const [addStore, setAddStore]       = useState('');
  const [addPrice, setAddPrice]       = useState('');

  // Manual add form
  const [manualName, setManualName]   = useState('');
  const [manualBrand, setManualBrand] = useState('');
  const [manualRows, setManualRows]   = useState<PriceEntry[]>([
    { store: '', price: 0, distance: '' },
  ]);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scanAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, { toValue: 1, duration: 320, useNativeDriver: true }).start();
    if (mode === 'scan') {
      scanAnim.setValue(0);
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnim, { toValue: 1, duration: 1600, useNativeDriver: true }),
          Animated.timing(scanAnim, { toValue: 0, duration: 1600, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [mode]);

  async function doSearch() {
    if (!query.trim()) return;
    setLoading(true); setProduct(null); setResults([]);
    const r = await searchProductsByName(query.trim());
    setResults(r); setLoading(false);
    if (r.length === 0) Alert.alert('Ничего не найдено', 'Попробуйте другое название');
  }

  function selectProduct(p: OFFProduct) {
    setProduct(p);
    setResults([]);
    setPrices(mockPrices(p.barcode || p.name));
    setMode('product');
  }

  async function openScanner() {
    if (!permission?.granted) {
      const r = await reqPerm();
      if (!r.granted) { Alert.alert('Нет доступа к камере'); return; }
    }
    setScanned(false);
    setMode('scan');
  }

  async function onBarcodeScanned({ data }: { data: string }) {
    if (scanned) return;
    setScanned(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setMode('hub');
    setLoading(true);
    const p = await fetchProductByBarcode(data);
    setLoading(false);
    if (p) {
      selectProduct(p);
    } else {
      Alert.alert('Товар не найден', `Штрих-код: ${data}\n\nДобавьте вручную?`, [
        { text: 'Отмена' },
        { text: 'Добавить', onPress: () => setMode('addManual') },
      ]);
    }
  }

  function addUserPrice() {
    const num = parseFloat(addPrice.replace(',', '.'));
    if (!addStore.trim() || isNaN(num) || num <= 0) {
      Alert.alert('Ошибка', 'Введите название магазина и цену');
      return;
    }
    const entry: PriceEntry = { store: addStore.trim(), price: num, distance: 'Ваш магазин', isUser: true };
    const updated = [...prices, entry].sort((a, b) => a.price - b.price);
    setPrices(updated);
    setAddStore(''); setAddPrice('');
    setShowAddPrice(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  async function addToFridge(p: OFFProduct) {
    if (!user) return;
    const { data: cached } = await supabase.from('products').upsert({
      barcode: p.barcode || null, name: p.name, brand: p.brand,
      calories_per_100g: p.calories_per_100g, protein_per_100g: p.protein_per_100g,
      fat_per_100g: p.fat_per_100g, carbs_per_100g: p.carbs_per_100g, image_url: p.image_url,
    }, { onConflict: 'barcode' }).select().single();

    const exp = new Date(); exp.setDate(exp.getDate() + 7);
    await supabase.from('fridge_items').insert({
      user_id: user.id, product_id: cached?.id ?? null,
      name: p.name, quantity: 1, unit: 'шт',
      expires_at: exp.toISOString().slice(0, 10),
    });
    Alert.alert('Добавлено в холодильник', `${p.name} — срок 7 дней`);
  }

  async function saveManualProduct() {
    if (!manualName.trim()) { Alert.alert('Введите название товара'); return; }
    if (!user) return;
    const validRows = manualRows.filter(r => r.store.trim() && r.price > 0);

    await supabase.from('products').insert({
      name: manualName.trim(),
      brand: manualBrand.trim() || null,
      barcode: null,
    });

    const fakeProduct: OFFProduct = {
      barcode: '', name: manualName.trim(), brand: manualBrand.trim(),
      calories_per_100g: null, protein_per_100g: null, fat_per_100g: null,
      carbs_per_100g: null, image_url: null,
    };
    const builtPrices: PriceEntry[] = validRows.length > 0
      ? validRows.sort((a, b) => a.price - b.price)
      : mockPrices(manualName);

    setManualName(''); setManualBrand('');
    setManualRows([{ store: '', price: 0, distance: '' }]);
    setProduct(fakeProduct);
    setPrices(builtPrices);
    setMode('product');
  }

  // ── HUB ──────────────────────────────────────────────────────────────────────
  if (mode === 'hub') {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <ScrollView contentContainerStyle={s.hubPad} keyboardShouldPersistTaps="handled" indicatorStyle="white" showsVerticalScrollIndicator={false}>

          <Animated.View style={{ opacity: fadeAnim }}>
            <Text style={s.hubTitle}>Продукты</Text>
            <Text style={s.hubSub}>Найди лучшую цену рядом</Text>

            {/* Search bar */}
            <View style={s.searchRow}>
              <View style={s.searchBox}>
                <IcoSearch c={Colors.textMuted} n={18} />
                <TextInput
                  style={s.searchInput}
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Название товара..."
                  placeholderTextColor={Colors.textMuted}
                  returnKeyType="search"
                  onSubmitEditing={doSearch}
                />
                {loading && <ActivityIndicator size="small" color={Colors.accentTeal} />}
              </View>
              <TouchableOpacity style={s.scanBtn} onPress={openScanner} activeOpacity={0.8}>
                <IcoBarcode c="#fff" n={22} />
              </TouchableOpacity>
            </View>

            {/* Search results */}
            {results.length > 0 && (
              <View style={s.resultsList}>
                {results.map((p, i) => (
                  <TouchableOpacity key={i} style={s.resultRow} onPress={() => selectProduct(p)} activeOpacity={0.8}>
                    {p.image_url
                      ? <Image source={{ uri: p.image_url }} style={s.resultImg} />
                      : <View style={[s.resultImg, s.resultImgPH]}><Text style={{ fontSize: 20 }}>🛒</Text></View>
                    }
                    <View style={{ flex: 1 }}>
                      <Text style={s.resultName} numberOfLines={1}>{p.name}</Text>
                      {!!p.brand && <Text style={s.resultBrand}>{p.brand}</Text>}
                      {!!p.calories_per_100g && <Text style={s.resultCal}>{p.calories_per_100g} ккал</Text>}
                    </View>
                    <Text style={{ color: Colors.textMuted, fontSize: 20 }}>›</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Quick action cards */}
            <View style={s.actionRow}>
              <TouchableOpacity style={s.actionCard} onPress={openScanner} activeOpacity={0.82}>
                <LinearGradient colors={['#7B6CF6', '#5243D1']} style={s.actionGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <View style={s.actionIcon}><IcoBarcode c="#fff" n={26} /></View>
                  <Text style={s.actionTitle}>Сканировать</Text>
                  <Text style={s.actionSub}>штрих-код товара</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={s.actionCard} onPress={() => setMode('addManual')} activeOpacity={0.82}>
                <LinearGradient colors={['#00C9A7', '#008F7A']} style={s.actionGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <View style={s.actionIcon}><IcoPlus c="#fff" n={26} /></View>
                  <Text style={s.actionTitle}>Добавить</Text>
                  <Text style={s.actionSub}>товар вручную</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Tip */}
            <View style={s.tipCard}>
              <Text style={s.tipText}>💡 Сканируйте штрих-код прямо в магазине — сразу увидите, где дешевле</Text>
            </View>
          </Animated.View>
        </ScrollView>
        <CoachMark steps={PRODUCTS_TIPS} visible={tipsVisible} onDone={tipsDone} />
      </SafeAreaView>
    );
  }

  // ── SCANNER ───────────────────────────────────────────────────────────────────
  if (mode === 'scan') {
    const scanY = scanAnim.interpolate({ inputRange: [0, 1], outputRange: [0, VF_H - 3] });
    const vfTop = 200;
    return (
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          onBarcodeScanned={scanned ? undefined : onBarcodeScanned}
          barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'qr'] }}
        />
        {/* Mask top */}
        <View style={{ height: vfTop, backgroundColor: 'rgba(0,0,0,0.65)' }} />
        {/* Middle */}
        <View style={{ height: VF_H, flexDirection: 'row' }}>
          <View style={{ width: (SW - VF_W) / 2, backgroundColor: 'rgba(0,0,0,0.65)' }} />
          <View style={{ width: VF_W, overflow: 'hidden' }}>
            <View style={[s.corner, s.cTL]} /><View style={[s.corner, s.cTR]} />
            <View style={[s.corner, s.cBL]} /><View style={[s.corner, s.cBR]} />
            <Animated.View style={[s.scanLine, { transform: [{ translateY: scanY }] }]} />
          </View>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)' }} />
        </View>
        {/* Mask bottom */}
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', paddingTop: 32 }}>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 12 }}>Наведите на штрих-код товара</Text>
          <TouchableOpacity style={s.cancelBtn} onPress={() => setMode('hub')}>
            <IcoLeft c="#fff" n={18} />
            <Text style={s.cancelTxt}>Назад</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── PRODUCT DETAIL ────────────────────────────────────────────────────────────
  if (mode === 'product' && product) {
    const best = prices.length > 0 ? prices[0].price : 0;
    const symb = currency === 'RUB' ? '₽' : currency === 'USD' ? '$' : currency === 'GBP' ? '£' : '€';

    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <ScrollView contentContainerStyle={s.formPad} indicatorStyle="white" showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={s.header}>
            <TouchableOpacity style={s.backBtn} onPress={() => { setMode('hub'); setResults([]); }}>
              <IcoLeft c={Colors.accentTeal} n={22} />
            </TouchableOpacity>
            <Text style={s.headerTitle} numberOfLines={1}>Информация о товаре</Text>
            <View style={{ width: 38 }} />
          </View>

          {/* Product card */}
          <View style={s.productCard}>
            {product.image_url
              ? <Image source={{ uri: product.image_url }} style={s.productImg} resizeMode="contain" />
              : <View style={[s.productImg, s.productImgPH]}><Text style={{ fontSize: 48 }}>🛒</Text></View>
            }
            <Text style={s.productName}>{product.name}</Text>
            {!!product.brand && <Text style={s.productBrand}>{product.brand}</Text>}

            {/* Nutrition chips */}
            {!!product.calories_per_100g && (
              <View style={s.nutriRow}>
                <NChip label="ккал" val={product.calories_per_100g} col={Colors.warning} />
                {!!product.protein_per_100g && <NChip label="Белок" val={product.protein_per_100g} col={Colors.accentTeal} unit="г" />}
                {!!product.fat_per_100g && <NChip label="Жир" val={product.fat_per_100g} col={Colors.danger} unit="г" />}
                {!!product.carbs_per_100g && <NChip label="Углев." val={product.carbs_per_100g} col={Colors.accentPurple} unit="г" />}
              </View>
            )}
          </View>

          {/* Price comparison */}
          <View style={s.priceSection}>
            <View style={s.priceSectionHeader}>
              <Text style={s.priceSectionTitle}>💰 Сравнение цен</Text>
              <Text style={s.priceSectionSub}>{prices.length} магазинов</Text>
            </View>

            {prices.map((p, i) => (
              <View key={i} style={[s.priceRow, p.isUser && s.priceRowUser, i === 0 && s.priceRowBest]}>
                <View style={{ flex: 1 }}>
                  <View style={s.priceTopLine}>
                    <Text style={[s.storeName, i === 0 && { color: Colors.success }]}>{p.store}</Text>
                    <Text style={[s.priceAmt, i === 0 && { color: Colors.success }]}>
                      {symb}{p.price.toFixed(2)}
                    </Text>
                  </View>
                  <Text style={s.storeDist}>{p.distance}{p.isUser ? ' · Ваш магазин' : ''}</Text>
                  <PriceBar price={p.price} best={best} currency={currency} />
                </View>
                {p.isUser && (
                  <TouchableOpacity style={s.trashBtn} onPress={() => setPrices(prices.filter((_, j) => j !== i))}>
                    <IcoTrash c={Colors.danger} n={16} />
                  </TouchableOpacity>
                )}
              </View>
            ))}

            {/* Add price button */}
            <TouchableOpacity style={s.addPriceBtn} onPress={() => setShowAddPrice(true)} activeOpacity={0.8}>
              <IcoPlus c={Colors.accentTeal} n={16} />
              <Text style={s.addPriceTxt}>Добавить цену из другого магазина</Text>
            </TouchableOpacity>
          </View>

          {/* Actions */}
          <TouchableOpacity style={s.fridgeBtn} onPress={() => addToFridge(product)} activeOpacity={0.85}>
            <IcoFridge c={Colors.bg} n={18} />
            <Text style={s.fridgeBtnTxt}>В холодильник · срок 7 дней</Text>
          </TouchableOpacity>

        </ScrollView>

        {/* Add price modal overlay */}
        {showAddPrice && (
          <KeyboardAvoidingView
            style={StyleSheet.absoluteFill}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            pointerEvents="box-none"
          >
            <TouchableOpacity style={s.modalBackdrop} activeOpacity={1} onPress={() => setShowAddPrice(false)} />
            <View style={[s.addPriceSheet, { paddingBottom: insets.bottom + 16 }]}>
              <View style={s.sheetHandle} />
              <Text style={s.sheetTitle}>Добавить цену</Text>

              {/* Store suggestions */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
                <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                  {STORE_SUGGESTIONS.slice(0, 6).map(st => (
                    <TouchableOpacity key={st} style={[s.storeSuggest, addStore === st && s.storeSuggestOn]} onPress={() => setAddStore(st)}>
                      <Text style={[s.storeSuggestTxt, addStore === st && { color: Colors.accentTeal }]}>{st}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <View style={s.sheetRow}>
                <View style={[s.sheetInput, { flex: 2 }]}>
                  <TextInput
                    style={s.sheetInputTxt}
                    value={addStore}
                    onChangeText={setAddStore}
                    placeholder="Магазин..."
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>
                <View style={[s.sheetInput, { flex: 1 }]}>
                  <TextInput
                    style={s.sheetInputTxt}
                    value={addPrice}
                    onChangeText={setAddPrice}
                    placeholder={`Цена ${symb}`}
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
              <TouchableOpacity style={s.sheetSave} onPress={addUserPrice} activeOpacity={0.85}>
                <Text style={s.sheetSaveTxt}>Добавить</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        )}
      </SafeAreaView>
    );
  }

  // ── ADD MANUAL ────────────────────────────────────────────────────────────────
  if (mode === 'addManual') {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={s.formPad} keyboardShouldPersistTaps="handled" indicatorStyle="white" showsVerticalScrollIndicator={false}>
            <View style={s.header}>
              <TouchableOpacity style={s.backBtn} onPress={() => setMode('hub')}>
                <IcoLeft c={Colors.accentTeal} n={22} />
              </TouchableOpacity>
              <Text style={s.headerTitle}>Добавить товар</Text>
              <View style={{ width: 38 }} />
            </View>

            <Text style={s.secLabel}>Название товара *</Text>
            <View style={s.inputBox}>
              <TextInput style={s.inputTxt} value={manualName} onChangeText={setManualName} placeholder="Молоко 3.5%, 1л..." placeholderTextColor={Colors.textMuted} />
            </View>

            <Text style={s.secLabel}>Бренд (необязательно)</Text>
            <View style={s.inputBox}>
              <TextInput style={s.inputTxt} value={manualBrand} onChangeText={setManualBrand} placeholder="Простоквашино, Danone..." placeholderTextColor={Colors.textMuted} />
            </View>

            <Text style={s.secLabel}>Цены в магазинах</Text>
            <Text style={s.secSub}>Сравним цены и покажем где выгоднее</Text>

            {manualRows.map((row, i) => (
              <View key={i} style={s.manualPriceRow}>
                <View style={[s.inputBox, { flex: 2, marginBottom: 0 }]}>
                  <TextInput
                    style={s.inputTxt}
                    value={row.store}
                    onChangeText={v => {
                      const r = [...manualRows]; r[i] = { ...r[i], store: v }; setManualRows(r);
                    }}
                    placeholder="Магазин..."
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>
                <View style={[s.inputBox, { flex: 1, marginBottom: 0 }]}>
                  <TextInput
                    style={s.inputTxt}
                    value={row.price > 0 ? String(row.price) : ''}
                    onChangeText={v => {
                      const r = [...manualRows]; r[i] = { ...r[i], price: parseFloat(v) || 0 }; setManualRows(r);
                    }}
                    placeholder="Цена"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="decimal-pad"
                  />
                </View>
                {manualRows.length > 1 && (
                  <TouchableOpacity onPress={() => setManualRows(manualRows.filter((_, j) => j !== i))} style={{ padding: 8 }}>
                    <IcoTrash c={Colors.danger} n={18} />
                  </TouchableOpacity>
                )}
              </View>
            ))}

            <TouchableOpacity style={s.addRowBtn} onPress={() => setManualRows([...manualRows, { store: '', price: 0, distance: '' }])}>
              <IcoPlus c={Colors.accentTeal} n={16} />
              <Text style={s.addRowTxt}>Добавить магазин</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.saveBtn} onPress={saveManualProduct} activeOpacity={0.85}>
              <Text style={s.saveTxt}>Сохранить и сравнить цены</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return null;
}

// ─── Nutrition chip ───────────────────────────────────────────────────────────

function NChip({ label, val, col, unit = '' }: { label: string; val: number; col: string; unit?: string }) {
  return (
    <View style={[nc.chip, { borderColor: col + '44' }]}>
      <Text style={[nc.val, { color: col }]}>{Math.round(val)}{unit}</Text>
      <Text style={nc.label}>{label}</Text>
    </View>
  );
}

const nc = StyleSheet.create({
  chip:  { backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md, padding: Spacing.sm, alignItems: 'center', minWidth: 58, borderWidth: 1 },
  val:   { fontSize: Typography.sizeSM, fontWeight: Typography.weightBold },
  label: { fontSize: Typography.sizeXS, color: Colors.textMuted, marginTop: 2 },
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },

  // Hub
  hubPad:   { padding: Spacing.xl, paddingBottom: Layout.tabBarClearance + Spacing.xl },
  hubTitle: { fontSize: 28, fontWeight: Typography.weightBold, color: Colors.textPrimary, marginBottom: 4 },
  hubSub:   { fontSize: Typography.sizeSM, color: Colors.textSecondary, marginBottom: Spacing.xl },

  searchRow:  { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  searchBox:  { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.surface, borderRadius: Radius.full, paddingHorizontal: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  searchInput:{ flex: 1, color: Colors.textPrimary, fontSize: Typography.sizeMD, paddingVertical: Spacing.md },
  scanBtn:    { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.accentPurple, alignItems: 'center', justifyContent: 'center' },

  resultsList: { marginBottom: Spacing.md },
  resultRow:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  resultImg:   { width: 52, height: 52, borderRadius: Radius.sm },
  resultImgPH: { backgroundColor: Colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  resultName:  { color: Colors.textPrimary, fontSize: Typography.sizeMD, fontWeight: Typography.weightSemiBold },
  resultBrand: { color: Colors.textSecondary, fontSize: Typography.sizeXS, marginTop: 2 },
  resultCal:   { color: Colors.warning, fontSize: Typography.sizeXS, marginTop: 2 },

  actionRow:   { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  actionCard:  { flex: 1, borderRadius: Radius.xl, overflow: 'hidden' },
  actionGrad:  { padding: Spacing.lg, minHeight: 140, justifyContent: 'flex-end', gap: Spacing.xs },
  actionIcon:  { width: 46, height: 46, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xs },
  actionTitle: { fontSize: Typography.sizeMD, fontWeight: Typography.weightBold, color: '#fff' },
  actionSub:   { fontSize: Typography.sizeXS, color: 'rgba(255,255,255,0.72)' },

  tipCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, marginTop: Spacing.xs },
  tipText: { fontSize: Typography.sizeXS, color: Colors.textMuted, lineHeight: 18 },

  // Scanner
  corner:   { position: 'absolute', width: 20, height: 20, borderColor: Colors.accentTeal, borderWidth: 3, borderRadius: 2 },
  cTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  cTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  cBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  cBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  scanLine: { position: 'absolute', left: 0, right: 0, height: 2, backgroundColor: Colors.accentTeal, shadowColor: Colors.accentTeal, shadowOpacity: 1, shadowRadius: 6 },
  cancelBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: Radius.full, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
  cancelTxt: { color: '#fff', fontSize: Typography.sizeSM, fontWeight: Typography.weightSemiBold },

  // Product detail
  formPad: { padding: Spacing.xl, paddingBottom: Layout.tabBarClearance + Spacing.xl },
  header:       { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xl },
  backBtn:      { width: 38, height: 38, alignItems: 'flex-start', justifyContent: 'center' },
  headerTitle:  { flex: 1, fontSize: Typography.sizeLG, fontWeight: Typography.weightBold, color: Colors.textPrimary, textAlign: 'center' },

  productCard:  { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.xl, marginBottom: Spacing.xl, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  productImg:   { width: 120, height: 120, borderRadius: Radius.md, marginBottom: Spacing.md },
  productImgPH: { backgroundColor: Colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  productName:  { fontSize: Typography.sizeLG, fontWeight: Typography.weightBold, color: Colors.textPrimary, textAlign: 'center', marginBottom: 4 },
  productBrand: { fontSize: Typography.sizeSM, color: Colors.textSecondary, marginBottom: Spacing.md },
  nutriRow:     { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap', justifyContent: 'center' },

  priceSection:       { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  priceSectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  priceSectionTitle:  { fontSize: Typography.sizeMD, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  priceSectionSub:    { fontSize: Typography.sizeXS, color: Colors.textMuted },

  priceRow:     { paddingVertical: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  priceRowBest: { borderTopColor: 'transparent' },
  priceRowUser: { backgroundColor: Colors.accentTeal + '08', marginHorizontal: -Spacing.lg, paddingHorizontal: Spacing.lg },
  priceTopLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  storeName:    { fontSize: Typography.sizeMD, fontWeight: Typography.weightSemiBold, color: Colors.textPrimary },
  priceAmt:     { fontSize: Typography.sizeLG, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  storeDist:    { fontSize: Typography.sizeXS, color: Colors.textMuted, marginTop: 2 },
  trashBtn:     { padding: 6 },

  addPriceBtn:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.md, paddingVertical: Spacing.sm, justifyContent: 'center' },
  addPriceTxt:  { color: Colors.accentTeal, fontSize: Typography.sizeSM, fontWeight: Typography.weightSemiBold },

  fridgeBtn:    { backgroundColor: Colors.accentTeal, borderRadius: Radius.full, paddingVertical: Spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  fridgeBtnTxt: { color: Colors.bg, fontSize: Typography.sizeSM, fontWeight: Typography.weightBold },

  // Add price sheet
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  addPriceSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.surfaceElevated, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: Spacing.xl },
  sheetHandle:   { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: Spacing.lg },
  sheetTitle:    { fontSize: Typography.sizeLG, fontWeight: Typography.weightBold, color: Colors.textPrimary, marginBottom: Spacing.md },
  sheetRow:      { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  sheetInput:    { backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.md },
  sheetInputTxt: { color: Colors.textPrimary, fontSize: Typography.sizeMD, paddingVertical: Spacing.md },
  sheetSave:     { backgroundColor: Colors.accentTeal, borderRadius: Radius.full, paddingVertical: Spacing.md, alignItems: 'center' },
  sheetSaveTxt:  { color: Colors.bg, fontSize: Typography.sizeMD, fontWeight: Typography.weightBold },

  storeSuggest:    { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, backgroundColor: Colors.surface, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border },
  storeSuggestOn:  { borderColor: Colors.accentTeal, backgroundColor: Colors.accentTeal + '15' },
  storeSuggestTxt: { fontSize: Typography.sizeXS, color: Colors.textSecondary },

  // Manual add
  secLabel: { fontSize: Typography.sizeSM, fontWeight: Typography.weightSemiBold, color: Colors.textSecondary, marginBottom: Spacing.xs, marginTop: Spacing.md },
  secSub:   { fontSize: Typography.sizeXS, color: Colors.textMuted, marginBottom: Spacing.sm, marginTop: -4 },
  inputBox: { backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.md, marginBottom: Spacing.sm },
  inputTxt: { color: Colors.textPrimary, fontSize: Typography.sizeMD, paddingVertical: Spacing.md },

  manualPriceRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center', marginBottom: Spacing.sm },
  addRowBtn:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.sm, marginBottom: Spacing.md },
  addRowTxt:  { color: Colors.accentTeal, fontSize: Typography.sizeSM, fontWeight: Typography.weightSemiBold },
  saveBtn:    { backgroundColor: Colors.accentTeal, borderRadius: Radius.full, paddingVertical: Spacing.lg, alignItems: 'center', marginTop: Spacing.sm },
  saveTxt:    { color: Colors.bg, fontSize: Typography.sizeMD, fontWeight: Typography.weightBold },
});
