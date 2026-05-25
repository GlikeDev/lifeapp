import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, Alert, ActivityIndicator, RefreshControl,
  Animated, Modal, KeyboardAvoidingView, Platform, Keyboard,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, Radius, Layout, Glass } from '../../constants/tokens';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { scheduleItemNotifications, cancelItemNotifications } from '../../lib/notifications';
import type { FridgeItem } from '../../types';
import { useTranslation } from '../../i18n';

// ─── Category system ──────────────────────────────────────────────────────────

const FOOD_CATS: Record<string, { emoji: string; label: string; color: string; keywords: string[] }> = {
  dairy:    { emoji: '🥛', label: 'Молочное',  color: '#60A5FA', keywords: ['молок', 'кефир', 'йогурт', 'сметан', 'творог', 'сыр', 'масл', 'сливк', 'ряженк'] },
  meat:     { emoji: '🥩', label: 'Мясо',      color: '#F5554A', keywords: ['курич', 'мяс', 'говяд', 'свин', 'фарш', 'колбас', 'сосис', 'бекон', 'ветч', 'индейк', 'шашлык'] },
  fish:     { emoji: '🐟', label: 'Рыба',      color: '#00D4C8', keywords: ['рыб', 'семг', 'тунец', 'лосос', 'треск', 'судак', 'форел', 'минтай', 'краб', 'кревет'] },
  produce:  { emoji: '🥕', label: 'Овощи',     color: '#39D98A', keywords: ['огурц', 'помидор', 'морков', 'перец', 'лук', 'чеснок', 'капуст', 'картош', 'брокк', 'шпинат', 'зелен', 'укроп', 'петруш', 'томат', 'баклаж', 'кабачк', 'свекл'] },
  fruit:    { emoji: '🍎', label: 'Фрукты',    color: '#FAAD14', keywords: ['яблок', 'банан', 'апельсин', 'лимон', 'груш', 'виноград', 'ягод', 'клубник', 'черник', 'малин', 'персик', 'слив', 'арбуз', 'дын'] },
  eggs:     { emoji: '🥚', label: 'Яйца',      color: '#FBBF24', keywords: ['яйц', 'яйк'] },
  bread:    { emoji: '🍞', label: 'Хлеб',      color: '#D97706', keywords: ['хлеб', 'булоч', 'батон', 'тост', 'лаваш', 'питт', 'лепёшк'] },
  drinks:   { emoji: '🧃', label: 'Напитки',   color: '#7B6CF6', keywords: ['сок', 'воды', 'вода', 'пиво', 'вино', 'напит', 'квас', 'компот', 'морс'] },
  prepared: { emoji: '🍲', label: 'Готовое',   color: '#FF6B9D', keywords: ['суп', 'каша', 'борщ', 'плов', 'салат', 'пюре', 'запеканк'] },
  other:    { emoji: '📦', label: 'Прочее',    color: Colors.textMuted, keywords: [] },
};

function detectCat(name: string): string {
  const low = name.toLowerCase();
  for (const [key, cat] of Object.entries(FOOD_CATS)) {
    if (key === 'other') continue;
    if (cat.keywords.some(kw => low.includes(kw))) return key;
  }
  return 'other';
}

function catInfo(name: string) {
  return FOOD_CATS[detectCat(name)] ?? FOOD_CATS.other;
}

// ─── Recipe data ──────────────────────────────────────────────────────────────

interface Recipe { title: string; emoji: string; time: string; cats: string[] }

const ALL_RECIPES: Recipe[] = [
  { title: 'Яичница с сыром',    emoji: '🍳', time: '5 мин',  cats: ['eggs', 'dairy'] },
  { title: 'Омлет',              emoji: '🍳', time: '8 мин',  cats: ['eggs', 'dairy'] },
  { title: 'Варёные яйца',       emoji: '🥚', time: '12 мин', cats: ['eggs'] },
  { title: 'Молочная каша',      emoji: '🥣', time: '10 мин', cats: ['dairy'] },
  { title: 'Тост с сыром',       emoji: '🥪', time: '3 мин',  cats: ['bread', 'dairy'] },
  { title: 'Куриный суп',        emoji: '🍲', time: '30 мин', cats: ['meat', 'produce'] },
  { title: 'Тушёное мясо',       emoji: '🍗', time: '25 мин', cats: ['meat'] },
  { title: 'Рыба в духовке',     emoji: '🐟', time: '20 мин', cats: ['fish'] },
  { title: 'Овощной суп',        emoji: '🥣', time: '25 мин', cats: ['produce'] },
  { title: 'Греческий салат',    emoji: '🥗', time: '10 мин', cats: ['produce', 'dairy'] },
  { title: 'Смузи из фруктов',   emoji: '🥤', time: '5 мин',  cats: ['fruit', 'dairy'] },
  { title: 'Фруктовый салат',    emoji: '🍓', time: '7 мин',  cats: ['fruit'] },
  { title: 'Бутерброд',          emoji: '🥪', time: '2 мин',  cats: ['bread'] },
  { title: 'Запечённая рыба',    emoji: '🐠', time: '25 мин', cats: ['fish', 'produce'] },
];

function getBestRecipes(items: FridgeItem[]): Recipe[] {
  const cats = new Set(items.map(i => detectCat(i.name)));
  const scored = ALL_RECIPES
    .map(r => ({ ...r, score: r.cats.filter(c => cats.has(c)).length }))
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.length > 0 ? scored.slice(0, 3) : ALL_RECIPES.slice(0, 2);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysUntil(d: string) {
  const today = new Date(); today.setHours(0,0,0,0);
  return Math.round((new Date(d).getTime() - today.getTime()) / 86400000);
}
function zoneColor(days: number) {
  if (days < 0)  return Colors.danger;
  if (days <= 1) return Colors.danger;
  if (days <= 3) return Colors.warning;
  return Colors.success;
}
function freshnessPct(item: FridgeItem): number {
  const addedAt = item.added_at;
  if (!addedAt) return Math.max(0, Math.min(1, daysUntil(item.expires_at) / 7));
  const total  = (new Date(item.expires_at).getTime() - new Date(addedAt).getTime()) / 86400000;
  const remain = daysUntil(item.expires_at);
  if (total <= 0) return remain > 0 ? 1 : 0;
  return Math.max(0, Math.min(1, remain / total));
}
function daysLabel(days: number): string {
  if (days < 0)  return 'Просрочено';
  if (days === 0) return 'Сегодня';
  if (days === 1) return '1 день';
  return `${days} дн`;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function IcoPlus({ c = '#fff', n = 18 }: { c?: string; n?: number }) {
  return <Svg width={n} height={n} viewBox="0 0 24 24" fill="none"><Path d="M12 5v14M5 12h14" stroke={c} strokeWidth={2.2} strokeLinecap="round"/></Svg>;
}
function IcoCheck({ c = Colors.success, n = 14 }: { c?: string; n?: number }) {
  return <Svg width={n} height={n} viewBox="0 0 24 24" fill="none"><Path d="M20 6L9 17l-5-5" stroke={c} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/></Svg>;
}
function IcoTrash({ c = Colors.danger, n = 14 }: { c?: string; n?: number }) {
  return <Svg width={n} height={n} viewBox="0 0 24 24" fill="none"><Path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/></Svg>;
}
function IcoChef({ c = Colors.warning, n = 16 }: { c?: string; n?: number }) {
  return <Svg width={n} height={n} viewBox="0 0 24 24" fill="none"><Path d="M12 2C8.686 2 6 4.686 6 8c0 1.5.55 2.87 1.45 3.91L6 21h12l-1.45-9.09A5.98 5.98 0 0018 8c0-3.314-2.686-6-6-6z" stroke={c} strokeWidth={1.8} strokeLinejoin="round"/><Path d="M9 21h6" stroke={c} strokeWidth={1.8} strokeLinecap="round"/></Svg>;
}

// ─── FreshnessBar ─────────────────────────────────────────────────────────────

function FreshnessBar({ pct }: { pct: number }) {
  const color = pct > 0.5 ? Colors.success : pct > 0.2 ? Colors.warning : Colors.danger;
  return (
    <View style={fb.track}>
      <View style={[fb.fill, { width: `${Math.round(Math.max(pct, 0) * 100)}%` as any, backgroundColor: color }]} />
    </View>
  );
}
const fb = StyleSheet.create({
  track: { flex: 1, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.07)', overflow: 'hidden' },
  fill:  { height: '100%', borderRadius: 2 },
});

// ─── SpotlightCard ────────────────────────────────────────────────────────────

function SpotlightCard({ item, onUsed }: {
  item: FridgeItem; onUsed: (id: string) => void;
}) {
  const days    = daysUntil(item.expires_at);
  const color   = zoneColor(days);
  const cat     = catInfo(item.name);
  const gradColors: [string, string] = days <= 0
    ? ['rgba(251,113,133,0.14)', 'rgba(11,12,27,0.6)']
    : ['rgba(245,158,11,0.12)', 'rgba(11,12,27,0.6)'];

  return (
    <LinearGradient colors={gradColors} style={sp.card} start={{x:0,y:0}} end={{x:1,y:1}}>
      <View style={[sp.topLine, { backgroundColor: color + '90' }]} />
      <Text style={sp.emoji}>{cat.emoji}</Text>
      <View style={[sp.badge, { backgroundColor: color + '22', borderColor: color + '55' }]}>
        <Text style={[sp.badgeTxt, { color }]}>{daysLabel(days)}</Text>
      </View>
      <Text style={sp.name} numberOfLines={2}>{item.name}</Text>
      <Text style={sp.qty}>{item.quantity} {item.unit}</Text>
      <TouchableOpacity
        style={[sp.btn, { backgroundColor: Colors.success + '20', borderColor: Colors.success + '55' }]}
        onPress={() => onUsed(item.id)}
        activeOpacity={0.75}
      >
        <IcoCheck c={Colors.success} n={12} />
        <Text style={[sp.btnTxt, { color: Colors.success }]}>Использую</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}
const sp = StyleSheet.create({
  card:     { width: 148, borderRadius: Radius.xl, padding: Spacing.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', overflow: 'hidden', gap: Spacing.xs },
  topLine:  { position: 'absolute', top: 0, left: 20, right: 20, height: 1 },
  emoji:    { fontSize: 38, textAlign: 'center', marginBottom: 2 },
  badge:    { alignSelf: 'center', borderWidth: 1, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  badgeTxt: { fontSize: 9, fontFamily: Typography.fontBold, textAlign: 'center' },
  name:     { fontSize: Typography.sizeSM, fontFamily: Typography.fontSemiBold, color: Colors.textPrimary, textAlign: 'center' },
  qty:      { fontSize: Typography.sizeXS, fontFamily: Typography.fontMedium, color: Colors.textMuted, textAlign: 'center' },
  btn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderRadius: Radius.full, paddingVertical: Spacing.xs, borderWidth: 1, marginTop: 2 },
  btnTxt:   { fontSize: Typography.sizeXS, fontFamily: Typography.fontSemiBold },
});

// ─── ZoneSection ─────────────────────────────────────────────────────────────

function ZoneSection({ items, label, color, onUsed, onDelete }: {
  items: FridgeItem[]; label: string; color: string;
  onUsed: (id: string) => void; onDelete: (id: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <View style={zs.section}>
      <View style={zs.header}>
        <View style={[zs.dot, { backgroundColor: color }]} />
        <Text style={[zs.title, { color }]}>{label}</Text>
        <View style={[zs.badge, { backgroundColor: color + '22' }]}>
          <Text style={[zs.badgeTxt, { color }]}>{items.length}</Text>
        </View>
      </View>
      {items.map(item => {
        const days  = daysUntil(item.expires_at);
        const fpct  = freshnessPct(item);
        const cat   = catInfo(item.name);
        return (
          <View key={item.id} style={[zs.row, { borderLeftColor: color }]}>
            <Text style={zs.rowEmoji}>{cat.emoji}</Text>
            <View style={zs.rowBody}>
              <View style={zs.rowTop}>
                <Text style={zs.rowName} numberOfLines={1}>{item.name}</Text>
                <Text style={[zs.rowDays, { color }]}>{daysLabel(days)}</Text>
              </View>
              <View style={zs.rowBottom}>
                <Text style={zs.rowQty}>{item.quantity} {item.unit}</Text>
                <FreshnessBar pct={fpct} />
              </View>
            </View>
            <TouchableOpacity style={[zs.actionBtn, { backgroundColor: Colors.success + '18' }]} onPress={() => onUsed(item.id)}>
              <IcoCheck c={Colors.success} n={13} />
            </TouchableOpacity>
            <TouchableOpacity style={[zs.actionBtn, { backgroundColor: Colors.danger + '15' }]} onPress={() => onDelete(item.id)}>
              <IcoTrash c={Colors.danger} n={13} />
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
}
const zs = StyleSheet.create({
  section:   { marginBottom: Spacing.lg },
  header:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  dot:       { width: 8, height: 8, borderRadius: 4 },
  title:     { fontSize: Typography.sizeSM, fontFamily: Typography.fontBold, flex: 1 },
  badge:     { borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  badgeTxt:  { fontSize: Typography.sizeXS, fontFamily: Typography.fontBold },
  row:       { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.sm, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Glass.border, borderLeftWidth: 3 },
  rowEmoji:  { fontSize: 26, width: 34, textAlign: 'center' },
  rowBody:   { flex: 1, gap: 5 },
  rowTop:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowBottom: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  rowName:   { fontSize: Typography.sizeSM, fontFamily: Typography.fontSemiBold, color: Colors.textPrimary, flex: 1 },
  rowDays:   { fontSize: Typography.sizeXS, fontFamily: Typography.fontBold, marginLeft: 4 },
  rowQty:    { fontSize: Typography.sizeXS, fontFamily: Typography.fontMedium, color: Colors.textMuted, minWidth: 44 },
  actionBtn: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={sc.card}>
      <Text style={[sc.value, { color }]}>{value}</Text>
      <Text style={sc.label}>{label}</Text>
    </View>
  );
}
const sc = StyleSheet.create({
  card:  { flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center', borderWidth: 1, borderColor: Glass.border },
  value: { fontSize: Typography.sizeLG, fontFamily: Typography.fontBold },
  label: { fontSize: Typography.sizeXS, fontFamily: Typography.fontMedium, color: Colors.textMuted, marginTop: 2 },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export function FridgeScreen() {
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<FridgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showRecipe, setShowRecipe] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Add form
  const [name, setName] = useState('');
  const [qty, setQty] = useState('1');
  const [unit, setUnit] = useState('шт');
  const [days, setDays] = useState('7');
  const [saving, setSaving] = useState(false);

  const UNITS = ['шт', 'г', 'кг', 'мл', 'л', 'пач.'];
  const DAY_PRESETS = ['1', '3', '7', '14', '30'];

  useEffect(() => {
    loadItems().finally(() => {
      setLoading(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
    });
  }, [user]);

  async function loadItems() {
    if (!user) return;
    const { data } = await supabase
      .from('fridge_items').select('*')
      .eq('user_id', user.id)
      .order('expires_at', { ascending: true });
    if (data) setItems(data as FridgeItem[]);
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadItems();
    setRefreshing(false);
  }, [user]);

  async function handleAdd() {
    if (!name.trim()) { Alert.alert(t('fridge.add.errName')); return; }
    const d = parseInt(days);
    if (isNaN(d) || d < 1) { Alert.alert(t('fridge.add.errDays')); return; }
    if (!user) return;
    const expires = new Date(); expires.setDate(expires.getDate() + d);
    setSaving(true);
    const { data, error } = await supabase.from('fridge_items').insert({
      user_id: user.id, name: name.trim(),
      quantity: parseFloat(qty) || 1, unit,
      expires_at: expires.toISOString().slice(0, 10),
    }).select().single();
    if (error) { Alert.alert(t('scan.err.title'), error.message); setSaving(false); return; }
    const newItem = data as FridgeItem;
    setItems(prev => [...prev, newItem].sort((a, b) =>
      new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime()
    ));
    scheduleItemNotifications(newItem).catch(() => {});
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaving(false); setShowAdd(false);
    setName(''); setQty('1'); setDays('7'); setUnit('шт');
  }

  async function handleUsed(id: string) {
    await supabase.from('fridge_items').delete().eq('id', id);
    cancelItemNotifications(id).catch(() => {});
    setItems(prev => prev.filter(i => i.id !== id));
    setSavedCount(c => c + 1);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  async function handleDelete(id: string) {
    Alert.alert(t('fridge.delete.title'), '', [
      { text: t('fridge.delete.cancel'), style: 'cancel' },
      { text: t('fridge.delete.confirm'), style: 'destructive', onPress: async () => {
        await supabase.from('fridge_items').delete().eq('id', id);
        cancelItemNotifications(id).catch(() => {});
        setItems(prev => prev.filter(i => i.id !== id));
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }},
    ]);
  }

  const expired  = items.filter(i => daysUntil(i.expires_at) < 0);
  const urgent   = items.filter(i => { const d = daysUntil(i.expires_at); return d >= 0 && d <= 1; });
  const warning  = items.filter(i => { const d = daysUntil(i.expires_at); return d >= 2 && d <= 3; });
  const fresh    = items.filter(i => daysUntil(i.expires_at) > 3);
  const spotlight = [...expired, ...urgent].slice(0, 5);
  const expiringSoon = [...expired, ...urgent, ...warning];
  const recipes  = getBestRecipes(expiringSoon);
  const catCount = new Set(items.map(i => detectCat(i.name))).size;

  const savedLabel = savedCount === 1 ? 'продукт' : savedCount < 5 ? 'продукта' : 'продуктов';

  if (loading) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.center}><ActivityIndicator color={Colors.accentTeal} size="large" /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <Animated.ScrollView
        contentContainerStyle={s.scroll}
        indicatorStyle="white"
        style={{ opacity: fadeAnim }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accentTeal} />}
      >
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.title}>{t('fridge.title')}</Text>
            {savedCount > 0 && (
              <Text style={s.savedBadge}>✅ Сэкономлено сегодня: {savedCount} {savedLabel}</Text>
            )}
          </View>
          <View style={{ flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start', marginTop: 4 }}>
            {expiringSoon.length > 0 && (
              <TouchableOpacity style={s.recipeBtn} onPress={() => setShowRecipe(true)} activeOpacity={0.75}>
                <IcoChef c={Colors.warning} n={15} />
                <Text style={s.recipeBtnTxt}>{t('fridge.recipe')}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={s.addBtn} onPress={() => setShowAdd(true)} activeOpacity={0.75}>
              <IcoPlus c={Colors.accentTeal} n={14} />
              <Text style={s.addBtnTxt}>{t('fridge.add')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats row */}
        {items.length > 0 && (
          <View style={s.statsRow}>
            <StatCard label="Всего"    value={items.length}      color={Colors.textPrimary} />
            <StatCard label="Истекает" value={expiringSoon.length} color={expiringSoon.length > 0 ? Colors.warning : Colors.textMuted} />
            <StatCard label="Свежих"   value={fresh.length}      color={Colors.success} />
            <StatCard label="Видов"    value={catCount}           color={Colors.accentPurple} />
          </View>
        )}

        {/* Spotlight — use-first cards */}
        {spotlight.length > 0 && (
          <View style={s.spotlightWrap}>
            <Text style={s.sectionLabel}>ИСПОЛЬЗОВАТЬ В ПЕРВУЮ ОЧЕРЕДЬ</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.spotlightRow}
            >
              {spotlight.map(item => (
                <SpotlightCard key={item.id} item={item} onUsed={handleUsed} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Empty state */}
        {items.length === 0 && (
          <TouchableOpacity style={s.emptyCard} onPress={() => setShowAdd(true)} activeOpacity={0.8}>
            <Text style={{ fontSize: 52, marginBottom: Spacing.md }}>🧊</Text>
            <Text style={s.emptyTitle}>{t('fridge.empty.title')}</Text>
            <Text style={s.emptySub}>{t('fridge.empty.sub')}</Text>
            <View style={s.emptyBtn}><Text style={s.emptyBtnTxt}>{t('fridge.empty.btn')}</Text></View>
          </TouchableOpacity>
        )}

        {/* Zone sections */}
        {items.length > 0 && (
          <Text style={[s.sectionLabel, { marginTop: Spacing.xs }]}>ВСЕ ПРОДУКТЫ</Text>
        )}
        <ZoneSection items={expired} label={t('fridge.zone.expired')} color={Colors.danger}  onUsed={handleUsed} onDelete={handleDelete} />
        <ZoneSection items={urgent}  label={t('fridge.zone.urgent')}  color="#FF8C42"        onUsed={handleUsed} onDelete={handleDelete} />
        <ZoneSection items={warning} label={t('fridge.zone.warning')} color={Colors.warning} onUsed={handleUsed} onDelete={handleDelete} />
        <ZoneSection items={fresh}   label={t('fridge.zone.fresh')}   color={Colors.success} onUsed={handleUsed} onDelete={handleDelete} />

        {items.length > 0 && (
          <Text style={s.hint}>{t('fridge.hint')}</Text>
        )}
      </Animated.ScrollView>

      {/* ── Add product sheet ── */}
      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={() => { Keyboard.dismiss(); setShowAdd(false); }}>
            <BlurView intensity={92} tint="dark" style={StyleSheet.absoluteFill} />
          </TouchableOpacity>
          <View style={[s.sheet, { paddingBottom: insets.bottom + 20 }]}>
            <View style={s.handle} />
            <Text style={s.sheetTitle}>{t('fridge.add.title')}</Text>

            {/* Auto-category preview */}
            {name.length > 1 && (() => {
              const cat = catInfo(name);
              return (
                <View style={s.catPreview}>
                  <Text style={s.catEmoji}>{cat.emoji}</Text>
                  <Text style={[s.catLabel, { color: cat.color }]}>{cat.label}</Text>
                  <Text style={s.catAuto}>· определено автоматически</Text>
                </View>
              );
            })()}

            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Text style={s.label}>{t('fridge.add.name')}</Text>
              <TextInput
                style={s.input} value={name} onChangeText={setName}
                placeholder={t('fridge.add.namePh')} placeholderTextColor={Colors.textMuted} autoFocus
              />
              <Text style={s.label}>{t('fridge.add.qty')}</Text>
              <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                <TextInput style={[s.input, { flex: 1 }]} value={qty} onChangeText={setQty} keyboardType="decimal-pad" />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 2 }}>
                  <View style={{ flexDirection: 'row', gap: Spacing.xs, alignItems: 'center' }}>
                    {UNITS.map(u => (
                      <TouchableOpacity key={u} style={[s.chip, unit === u && s.chipOn]} onPress={() => setUnit(u)}>
                        <Text style={[s.chipTxt, unit === u && s.chipTxtOn]}>{u}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
              <Text style={s.label}>{t('fridge.add.days')}</Text>
              <View style={{ flexDirection: 'row', gap: Spacing.xs, marginBottom: Spacing.sm }}>
                {DAY_PRESETS.map(p => (
                  <TouchableOpacity key={p} style={[s.chip, days === p && s.chipOn]} onPress={() => { setDays(p); Keyboard.dismiss(); }}>
                    <Text style={[s.chipTxt, days === p && s.chipTxtOn]}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={s.input} value={days} onChangeText={setDays}
                keyboardType="number-pad" placeholder={t('fridge.add.daysPh')} placeholderTextColor={Colors.textMuted}
              />
              <View style={s.btns}>
                <TouchableOpacity style={s.cancelBtn} onPress={() => setShowAdd(false)}>
                  <Text style={s.cancelTxt}>{t('fridge.add.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.saveBtn} onPress={handleAdd} disabled={saving}>
                  {saving ? <ActivityIndicator color={Colors.bg} /> : <Text style={s.saveTxt}>{t('fridge.add.btn')}</Text>}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Recipe sheet ── */}
      <Modal visible={showRecipe} transparent animationType="slide" onRequestClose={() => setShowRecipe(false)}>
        <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={() => setShowRecipe(false)}>
          <BlurView intensity={92} tint="dark" style={StyleSheet.absoluteFill} />
        </TouchableOpacity>
        <View style={[s.sheet, { paddingBottom: insets.bottom + 20 }]}>
          <View style={s.handle} />
          <Text style={s.sheetTitle}>{t('fridge.recipe.title')}</Text>
          <Text style={s.recipeIntro}>Подобрано по продуктам из вашего холодильника</Text>
          <View style={{ gap: Spacing.md, marginBottom: Spacing.lg }}>
            {recipes.map((r, i) => (
              <LinearGradient
                key={i}
                colors={i === 0 ? ['#1C2B20', '#111A15'] : ['#1C1C2E', '#131320']}
                style={s.recipeCard}
                start={{x:0,y:0}} end={{x:1,y:1}}
              >
                <Text style={s.recipeEmoji}>{r.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.recipeName}>{r.title}</Text>
                  <View style={s.recipeMeta}>
                    <View style={s.recipeChip}>
                      <Text style={s.recipeChipTxt}>⏱ {r.time}</Text>
                    </View>
                  </View>
                </View>
                {i === 0 && (
                  <View style={s.recipeBest}>
                    <Text style={s.recipeBestTxt}>Лучший</Text>
                  </View>
                )}
              </LinearGradient>
            ))}
          </View>
          <Text style={s.recipeDisclaimer}>{t('fridge.recipe.disclaimer')}</Text>
          <TouchableOpacity style={[s.saveBtn, { marginTop: Spacing.md, flex: 0, width: '100%' }]} onPress={() => setShowRecipe(false)}>
            <Text style={s.saveTxt}>{t('fridge.recipe.ok')}</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.xl, paddingBottom: Layout.tabBarClearance + Spacing.xl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header:      { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: Spacing.lg },
  title:       { fontSize: 28, fontFamily: Typography.fontBold, color: Colors.textPrimary },
  savedBadge:  { fontSize: Typography.sizeXS, fontFamily: Typography.fontSemiBold, color: Colors.success, marginTop: 4 },

  addBtn:      { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.accentTeal + '18', borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderWidth: 1, borderColor: Colors.accentTeal + '44' },
  addBtnTxt:   { color: Colors.accentTeal, fontSize: Typography.sizeSM, fontFamily: Typography.fontSemiBold },
  recipeBtn:   { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.warning + '15', borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderWidth: 1, borderColor: Colors.warning + '44' },
  recipeBtnTxt:{ color: Colors.warning, fontSize: Typography.sizeSM, fontFamily: Typography.fontSemiBold },

  statsRow:     { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl },
  sectionLabel: { fontSize: Typography.sizeXS, fontFamily: Typography.fontSemiBold, color: Colors.textMuted, letterSpacing: 1.2, marginBottom: Spacing.md },

  // Spotlight
  spotlightWrap: { marginBottom: Spacing.xl },
  spotlightRow:  { gap: Spacing.md, paddingRight: Spacing.md },

  // Empty
  emptyCard:   { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.xxl, alignItems: 'center', borderWidth: 1, borderColor: Glass.border, marginBottom: Spacing.md },
  emptyTitle:  { fontSize: Typography.sizeLG, fontFamily: Typography.fontBold, color: Colors.textPrimary },
  emptySub:    { fontSize: Typography.sizeSM, fontFamily: Typography.fontMedium, color: Colors.textSecondary, textAlign: 'center', marginTop: 4, marginBottom: Spacing.lg },
  emptyBtn:    { backgroundColor: Colors.accentTeal, borderRadius: Radius.full, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
  emptyBtnTxt: { color: Colors.bg, fontSize: Typography.sizeSM, fontFamily: Typography.fontBold },

  hint: { textAlign: 'center', color: Colors.textMuted, fontFamily: Typography.fontMedium, fontSize: Typography.sizeXS, marginTop: Spacing.md },

  // Sheet
  backdrop:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet:      { backgroundColor: '#0D0E1C', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: Spacing.xl, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  handle:     { width: 40, height: 4, borderRadius: 2, backgroundColor: Glass.border, alignSelf: 'center', marginBottom: Spacing.lg },
  sheetTitle: { fontSize: Typography.sizeLG, fontFamily: Typography.fontBold, color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing.md },

  // Category preview in add form
  catPreview: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.surface, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Glass.border },
  catEmoji:   { fontSize: 22 },
  catLabel:   { fontSize: Typography.sizeSM, fontFamily: Typography.fontSemiBold },
  catAuto:    { fontSize: Typography.sizeXS, fontFamily: Typography.fontMedium, color: Colors.textFaint },

  label:      { fontSize: Typography.sizeSM, fontFamily: Typography.fontMedium, color: Colors.textSecondary, marginBottom: Spacing.xs, marginTop: Spacing.md },
  input:      { backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, color: Colors.textPrimary, fontSize: Typography.sizeMD, borderWidth: 1, borderColor: Glass.border, marginBottom: Spacing.xs },
  chip:       { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, backgroundColor: Colors.surface, borderRadius: Radius.full, borderWidth: 1, borderColor: Glass.border },
  chipOn:     { borderColor: Colors.accentTeal, backgroundColor: Colors.accentTeal + '18' },
  chipTxt:    { fontSize: Typography.sizeSM, fontFamily: Typography.fontMedium, color: Colors.textSecondary },
  chipTxtOn:  { color: Colors.accentTeal, fontFamily: Typography.fontSemiBold },
  btns:       { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.xl },
  cancelBtn:  { flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.full, paddingVertical: Spacing.md, alignItems: 'center' },
  cancelTxt:  { color: Colors.textSecondary, fontFamily: Typography.fontSemiBold },
  saveBtn:    { flex: 2, backgroundColor: Colors.accentTeal, borderRadius: Radius.full, paddingVertical: Spacing.md, alignItems: 'center' },
  saveTxt:    { color: Colors.bg, fontFamily: Typography.fontBold, fontSize: Typography.sizeMD },

  // Recipe sheet
  recipeIntro:     { fontSize: Typography.sizeXS, fontFamily: Typography.fontMedium, color: Colors.textMuted, textAlign: 'center', marginBottom: Spacing.lg },
  recipeCard:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, borderRadius: Radius.xl, padding: Spacing.md, borderWidth: 1, borderColor: Glass.border },
  recipeEmoji:     { fontSize: 38 },
  recipeName:      { fontSize: Typography.sizeMD, fontFamily: Typography.fontSemiBold, color: Colors.textPrimary, marginBottom: 4 },
  recipeMeta:      { flexDirection: 'row', gap: Spacing.sm },
  recipeChip:      { backgroundColor: Colors.surfaceElevated, borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 3 },
  recipeChipTxt:   { fontSize: Typography.sizeXS, fontFamily: Typography.fontMedium, color: Colors.textSecondary },
  recipeBest:      { backgroundColor: Colors.success + '22', borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 3, borderWidth: 1, borderColor: Colors.success + '55' },
  recipeBestTxt:   { fontSize: Typography.sizeXS, fontFamily: Typography.fontBold, color: Colors.success },
  recipeDisclaimer:{ fontSize: Typography.sizeXS, fontFamily: Typography.fontMedium, color: Colors.textMuted, textAlign: 'center' },
});
