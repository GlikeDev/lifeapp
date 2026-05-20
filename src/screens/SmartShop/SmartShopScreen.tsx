import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassCard, GlyphIcon, ProgressBar, Toast } from '../../components/common';
import { Colors, Radius, fontMono } from '../../constants/tokens';

type Screen = 'search' | 'detail' | 'scan';

const DEMO_PRODUCTS = [
  { id: '1', name: 'Греческий йогурт 500г', brand: 'Chobani', cal: 130, protein: 17, fat: 0, carbs: 8, price: 2.49, store: 'Lidl' },
  { id: '2', name: 'Куриная грудка охл.', brand: 'Местная ферма', cal: 165, protein: 31, fat: 3.6, carbs: 0, price: 5.99, store: 'Rimi' },
  { id: '3', name: 'Лосось атлантический', brand: 'AquaFarm', cal: 208, protein: 20, fat: 13, carbs: 0, price: 8.49, store: 'Maxima' },
  { id: '4', name: 'Овсянка быстрая', brand: 'Quaker', cal: 150, protein: 5, fat: 3, carbs: 27, price: 1.29, store: 'Lidl' },
];

const STORE_PRICES = [
  { store: 'Lidl', price: 2.49, inStock: true },
  { store: 'Rimi', price: 2.79, inStock: true },
  { store: 'Maxima', price: 2.59, inStock: false },
  { store: 'Barbora', price: 2.69, inStock: true },
];

export function SmartShopScreen() {
  const [screen, setScreen] = useState<Screen>('search');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(DEMO_PRODUCTS[0]);
  const [toast, setToast] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const filtered = query.length > 1
    ? DEMO_PRODUCTS.filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
    : DEMO_PRODUCTS;

  function addToFridge(product: typeof DEMO_PRODUCTS[0]) {
    setAddedIds(s => new Set(s).add(product.id));
    setToast(product.name + ' добавлен в холодильник');
  }

  if (screen === 'scan') {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => setScreen('search')} style={s.backBtn}>
            <GlyphIcon name="arrow-left" size={18} color={Colors.t1} />
          </TouchableOpacity>
          <Text style={s.title}>Сканер</Text>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20, paddingHorizontal: 32 }}>
          <View style={{ width: 220, height: 220, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' }}>
            <GlyphIcon name="scan" size={64} color={Colors.cyan} />
          </View>
          <Text style={{ fontSize: 14, color: Colors.t2, textAlign: 'center', lineHeight: 22 }}>
            Наведите камеру на штрихкод товара. В демо-режиме сканирование недоступно.
          </Text>
          <TouchableOpacity onPress={() => { setSelected(DEMO_PRODUCTS[0]); setScreen('detail'); }} activeOpacity={0.85}>
            <LinearGradient colors={[Colors.cyan, Colors.purple]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[s.gradBtn, { paddingHorizontal: 32 }]}>
              <Text style={s.gradBtnLabel}>Демо-товар</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        {toast && <Toast message={toast} onDone={() => setToast(null)} />}
      </SafeAreaView>
    );
  }

  if (screen === 'detail') {
    const macroTotal = selected.protein + selected.fat + selected.carbs || 1;
    const added = addedIds.has(selected.id);
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => setScreen('search')} style={s.backBtn}>
            <GlyphIcon name="arrow-left" size={18} color={Colors.t1} />
          </TouchableOpacity>
          <Text style={s.title}>Товар</Text>
        </View>
        <ScrollView contentContainerStyle={{ padding: 18, gap: 14, paddingBottom: 100 }}>
          <GlassCard style={{ padding: 20, gap: 8 }} accentColor={Colors.cyan}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: Colors.t1 }}>{selected.name}</Text>
            <Text style={{ fontSize: 13, color: Colors.t3 }}>{selected.brand}</Text>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
              {[
                { label: 'Ккал', val: selected.cal },
                { label: 'Белки', val: `${selected.protein}г` },
                { label: 'Жиры', val: `${selected.fat}г` },
                { label: 'Углев.', val: `${selected.carbs}г` },
              ].map(m => (
                <View key={m.label} style={{ flex: 1, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, paddingVertical: 10 }}>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: Colors.t1 }}>{m.val}</Text>
                  <Text style={{ fontSize: 9, color: Colors.t3, marginTop: 2 }}>{m.label}</Text>
                </View>
              ))}
            </View>
          </GlassCard>

          <GlassCard style={{ padding: 18, gap: 12 }}>
            <Text style={s.sectionLabel}>МАКРОСЫ</Text>
            {[
              { label: 'Белки', val: selected.protein, total: macroTotal, color: Colors.cyan },
              { label: 'Жиры', val: selected.fat, total: macroTotal, color: Colors.gold },
              { label: 'Углеводы', val: selected.carbs, total: macroTotal, color: Colors.purple },
            ].map(m => (
              <View key={m.label} style={{ gap: 4 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 12, color: Colors.t2 }}>{m.label}</Text>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: m.color }}>{m.val}г</Text>
                </View>
                <ProgressBar progress={m.val / m.total} color={m.color} height={5} />
              </View>
            ))}
          </GlassCard>

          <GlassCard style={{ padding: 18, gap: 12 }}>
            <Text style={s.sectionLabel}>ЦЕНЫ В МАГАЗИНАХ</Text>
            {STORE_PRICES.map(sp => (
              <View key={sp.store} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border }}>
                <Text style={{ flex: 1, fontSize: 14, color: sp.inStock ? Colors.t1 : Colors.t4 }}>{sp.store}</Text>
                <Text style={{ fontSize: 14, fontWeight: '700', color: sp.inStock ? Colors.green : Colors.t4 }}>€{sp.price}</Text>
                {!sp.inStock && <Text style={{ fontSize: 10, color: Colors.coral }}>нет</Text>}
              </View>
            ))}
          </GlassCard>

          <TouchableOpacity onPress={() => addToFridge(selected)} activeOpacity={0.85} disabled={added}>
            <LinearGradient
              colors={added ? [Colors.surface, Colors.surface] : [Colors.cyan, Colors.purple]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[s.gradBtn, added && { opacity: 0.5 }]}
            >
              <GlyphIcon name={added ? 'check' : 'plus'} size={16} color={added ? Colors.t2 : '#06070D'} />
              <Text style={[s.gradBtnLabel, added && { color: Colors.t2 }]}>
                {added ? 'В холодильнике' : 'В холодильник'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
        {toast && <Toast message={toast} onDone={() => setToast(null)} />}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Text style={s.title}>Магазин</Text>
        <TouchableOpacity onPress={() => setScreen('scan')} style={s.scanBtn}>
          <GlyphIcon name="scan" size={18} color={Colors.cyan} />
        </TouchableOpacity>
      </View>
      <View style={s.searchRow}>
        <GlyphIcon name="search" size={16} color={Colors.t4} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Поиск товаров..."
          placeholderTextColor={Colors.t4}
          style={s.searchInput}
        />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 100 }}
        renderItem={({ item }) => {
          const added = addedIds.has(item.id);
          return (
            <TouchableOpacity onPress={() => { setSelected(item); setScreen('detail'); }} activeOpacity={0.82}>
              <GlassCard style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: `${Colors.cyan}18`, alignItems: 'center', justifyContent: 'center' }}>
                  <GlyphIcon name="groceries" size={22} color={Colors.cyan} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.t1 }}>{item.name}</Text>
                  <Text style={{ fontSize: 11, color: Colors.t3 }}>{item.brand} · {item.cal} ккал</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: Colors.t1 }}>€{item.price}</Text>
                  <Text style={{ fontSize: 10, color: Colors.t3 }}>{item.store}</Text>
                </View>
              </GlassCard>
            </TouchableOpacity>
          );
        }}
      />
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, gap: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontSize: 24, fontWeight: '700', color: Colors.t1 },
  scanBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: `${Colors.cyan}1A`, borderWidth: 1, borderColor: `${Colors.cyan}40`, alignItems: 'center', justifyContent: 'center' },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, marginBottom: 12, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: Colors.border2, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12 },
  searchInput: { flex: 1, fontSize: 15, color: Colors.t1 },
  sectionLabel: { fontFamily: fontMono, fontSize: 10, letterSpacing: 1.8, color: Colors.t3, textTransform: 'uppercase', marginBottom: 4 },
  gradBtn: { paddingVertical: 16, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  gradBtnLabel: { fontSize: 15, fontWeight: '700', color: '#06070D' },
});
