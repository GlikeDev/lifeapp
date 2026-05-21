import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, Alert, ActivityIndicator, RefreshControl,
  Animated, Modal, KeyboardAvoidingView, Platform, Keyboard,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, Radius, Layout, Glass } from '../../constants/tokens';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { scheduleItemNotifications, cancelItemNotifications } from '../../lib/notifications';
import type { FridgeItem } from '../../types';
import { useTranslation } from '../../i18n';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysUntil(d: string) {
  const today = new Date(); today.setHours(0,0,0,0);
  return Math.round((new Date(d).getTime() - today.getTime()) / 86400000);
}
function zoneColor(days: number) {
  if (days < 0) return Colors.danger;
  if (days <= 1) return Colors.danger;
  if (days <= 3) return Colors.warning;
  return Colors.success;
}
function zoneLabelKey(days: number) {
  if (days < 0) return 'more.fridge.days.expired';
  if (days === 0) return 'more.fridge.days.today';
  if (days === 1) return 'more.fridge.days.one';
  return 'more.fridge.days.n';
}
function zoneLabelVars(days: number) {
  return days > 1 ? { n: days } : undefined;
}

const MOCK_RECIPES = [
  { title: 'Яичница с сыром', emoji: '🍳', time: '5 мин' },
  { title: 'Молочная каша', emoji: '🥣', time: '10 мин' },
  { title: 'Омлет с овощами', emoji: '🫔', time: '8 мин' },
  { title: 'Суп из остатков', emoji: '🍲', time: '25 мин' },
];

// ─── Icons ────────────────────────────────────────────────────────────────────

function IcoPlus({ c = '#fff', n = 18 }: { c?: string; n?: number }) {
  return <Svg width={n} height={n} viewBox="0 0 24 24" fill="none"><Path d="M12 5v14M5 12h14" stroke={c} strokeWidth={2.2} strokeLinecap="round"/></Svg>;
}
function IcoCheck({ c = Colors.success, n = 15 }: { c?: string; n?: number }) {
  return <Svg width={n} height={n} viewBox="0 0 24 24" fill="none"><Path d="M20 6L9 17l-5-5" stroke={c} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/></Svg>;
}
function IcoTrash({ c = Colors.danger, n = 15 }: { c?: string; n?: number }) {
  return <Svg width={n} height={n} viewBox="0 0 24 24" fill="none"><Path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/></Svg>;
}
function IcoChef({ c = Colors.warning, n = 16 }: { c?: string; n?: number }) {
  return <Svg width={n} height={n} viewBox="0 0 24 24" fill="none"><Path d="M12 2C8.686 2 6 4.686 6 8c0 1.5.55 2.87 1.45 3.91L6 21h12l-1.45-9.09A5.98 5.98 0 0018 8c0-3.314-2.686-6-6-6z" stroke={c} strokeWidth={1.8} strokeLinejoin="round"/><Path d="M9 21h6" stroke={c} strokeWidth={1.8} strokeLinecap="round"/></Svg>;
}

// ─── Zone section ─────────────────────────────────────────────────────────────

function ZoneSection({ items, label, color, onUsed, onDelete }: {
  items: FridgeItem[]; label: string; color: string;
  onUsed: (id: string) => void; onDelete: (id: string) => void;
}) {
  const { t } = useTranslation();
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
        const days = daysUntil(item.expires_at);
        return (
          <View key={item.id} style={[zs.row, { borderLeftColor: color }]}>
            <View style={zs.rowInfo}>
              <Text style={zs.rowName}>{item.name}</Text>
              <Text style={zs.rowQty}>{item.quantity} {item.unit}</Text>
            </View>
            <Text style={[zs.rowDays, { color }]}>{t(zoneLabelKey(days), zoneLabelVars(days))}</Text>
            <TouchableOpacity style={[zs.actionBtn, { backgroundColor: Colors.success + '18' }]} onPress={() => onUsed(item.id)}>
              <IcoCheck c={Colors.success} n={14} />
            </TouchableOpacity>
            <TouchableOpacity style={[zs.actionBtn, { backgroundColor: Colors.danger + '15' }]} onPress={() => onDelete(item.id)}>
              <IcoTrash c={Colors.danger} n={14} />
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
}
const zs = StyleSheet.create({
  section: { marginBottom: Spacing.lg },
  header:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  dot:     { width: 8, height: 8, borderRadius: 4 },
  title:   { fontSize: Typography.sizeSM, fontWeight: Typography.weightBold },
  badge:   { borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  badgeTxt:{ fontSize: Typography.sizeXS, fontWeight: Typography.weightBold },
  row:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Glass.border, borderLeftWidth: 3 },
  rowInfo: { flex: 1 },
  rowName: { fontSize: Typography.sizeSM, fontWeight: Typography.weightSemiBold, color: Colors.textPrimary },
  rowQty:  { fontSize: Typography.sizeXS, color: Colors.textMuted, marginTop: 2 },
  rowDays: { fontSize: Typography.sizeSM, fontWeight: Typography.weightBold, minWidth: 54 },
  actionBtn:{ width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});

// ─── Main ─────────────────────────────────────────────────────────────────────

export function FridgeScreen() {
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<FridgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showRecipe, setShowRecipe] = useState(false);
  const [recipe] = useState(MOCK_RECIPES[Math.floor(Math.random() * MOCK_RECIPES.length)]);
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
    const { data } = await supabase.from('fridge_items').select('*').eq('user_id', user.id).order('expires_at', { ascending: true });
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
    setItems(prev => [...prev, newItem].sort((a, b) => new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime()));
    scheduleItemNotifications(newItem).catch(() => {});
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaving(false); setShowAdd(false);
    setName(''); setQty('1'); setDays('7'); setUnit('шт');
  }

  async function handleUsed(id: string) {
    await supabase.from('fridge_items').delete().eq('id', id);
    cancelItemNotifications(id).catch(() => {});
    setItems(prev => prev.filter(i => i.id !== id));
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

  const expired = items.filter(i => daysUntil(i.expires_at) < 0);
  const urgent  = items.filter(i => { const d = daysUntil(i.expires_at); return d >= 0 && d <= 1; });
  const warning = items.filter(i => { const d = daysUntil(i.expires_at); return d >= 2 && d <= 3; });
  const fresh   = items.filter(i => daysUntil(i.expires_at) > 3);
  const expiringSoon = [...expired, ...urgent, ...warning];

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
          <Text style={s.title}>{t('fridge.title')}</Text>
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            {expiringSoon.length > 0 && (
              <TouchableOpacity style={s.recipeBtn} onPress={() => setShowRecipe(true)}>
                <IcoChef c={Colors.warning} n={15} />
                <Text style={s.recipeBtnTxt}>{t('fridge.recipe')}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={s.addBtn} onPress={() => setShowAdd(true)}>
              <IcoPlus c={Colors.accentTeal} n={14} />
              <Text style={s.addBtnTxt}>{t('fridge.add')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats row */}
        {items.length > 0 && (
          <View style={s.statsRow}>
            <StatCard label={t('fridge.stats.total')} value={items.length} color={Colors.textPrimary} />
            <StatCard label={t('fridge.stats.expiring')} value={expiringSoon.length} color={expiringSoon.length > 0 ? Colors.warning : Colors.textMuted} />
            <StatCard label={t('fridge.stats.fresh')} value={fresh.length} color={Colors.success} />
          </View>
        )}

        {/* Expiring alert banner */}
        {expiringSoon.length > 0 && (
          <LinearGradient colors={['#3A200E','#2A160A']} style={s.alertBanner} start={{x:0,y:0}} end={{x:1,y:1}}>
            <Text style={s.alertEmoji}>⚠️</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.alertTitle}>{t('fridge.alert.title', { count: expiringSoon.length })}</Text>
              <Text style={s.alertSub}>{t('fridge.alert.sub')}</Text>
            </View>
          </LinearGradient>
        )}

        {/* Empty */}
        {items.length === 0 && (
          <TouchableOpacity style={s.emptyCard} onPress={() => setShowAdd(true)} activeOpacity={0.8}>
            <Text style={{ fontSize: 52, marginBottom: Spacing.md }}>🧊</Text>
            <Text style={s.emptyTitle}>{t('fridge.empty.title')}</Text>
            <Text style={s.emptySub}>{t('fridge.empty.sub')}</Text>
            <View style={s.emptyBtn}><Text style={s.emptyBtnTxt}>{t('fridge.empty.btn')}</Text></View>
          </TouchableOpacity>
        )}

        {/* Zone sections */}
        <ZoneSection items={expired} label={t('fridge.zone.expired')} color={Colors.danger} onUsed={handleUsed} onDelete={handleDelete} />
        <ZoneSection items={urgent}  label={t('fridge.zone.urgent')} color='#FF8C42' onUsed={handleUsed} onDelete={handleDelete} />
        <ZoneSection items={warning} label={t('fridge.zone.warning')} color={Colors.warning} onUsed={handleUsed} onDelete={handleDelete} />
        <ZoneSection items={fresh}   label={t('fridge.zone.fresh')} color={Colors.success} onUsed={handleUsed} onDelete={handleDelete} />

        {items.length > 0 && (
          <Text style={s.hint}>{t('fridge.hint')}</Text>
        )}
      </Animated.ScrollView>

      {/* Add product sheet */}
      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={() => { Keyboard.dismiss(); setShowAdd(false); }}>
            <BlurView intensity={92} tint="dark" style={StyleSheet.absoluteFill} />
          </TouchableOpacity>
          <View style={[s.sheet, { paddingBottom: insets.bottom + 20 }]}>
            <View style={s.handle} />
            <Text style={s.sheetTitle}>{t('fridge.add.title')}</Text>
            <ScrollView keyboardShouldPersistTaps="handled" indicatorStyle="white" showsVerticalScrollIndicator={false}>
              <Text style={s.label}>{t('fridge.add.name')}</Text>
              <TextInput style={s.input} value={name} onChangeText={setName} placeholder={t('fridge.add.namePh')} placeholderTextColor={Colors.textMuted} autoFocus />
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
              <TextInput style={s.input} value={days} onChangeText={setDays} keyboardType="number-pad" placeholder={t('fridge.add.daysPh')} placeholderTextColor={Colors.textMuted} />
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

      {/* AI Recipe sheet */}
      <Modal visible={showRecipe} transparent animationType="slide" onRequestClose={() => setShowRecipe(false)}>
        <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={() => setShowRecipe(false)}>
          <BlurView intensity={92} tint="dark" style={StyleSheet.absoluteFill} />
        </TouchableOpacity>
        <View style={[s.sheet, { paddingBottom: insets.bottom + 20 }]}>
          <View style={s.handle} />
          <Text style={s.sheetTitle}>{t('fridge.recipe.title')}</Text>
          <LinearGradient colors={['#1A2B1E','#0E1A12']} style={s.recipeCard} start={{x:0,y:0}} end={{x:1,y:1}}>
            <Text style={{ fontSize: 52, textAlign: 'center', marginBottom: Spacing.md }}>{recipe.emoji}</Text>
            <Text style={s.recipeName}>{recipe.title}</Text>
            <View style={s.recipeMeta}>
              <View style={s.recipeChip}><Text style={s.recipeChipTxt}>⏱ {recipe.time}</Text></View>
              <View style={s.recipeChip}><Text style={s.recipeChipTxt}>{t('fridge.recipe.fromExpiring')}</Text></View>
            </View>
            <Text style={s.recipeDisclaimer}>{t('fridge.recipe.disclaimer')}</Text>
          </LinearGradient>
          <TouchableOpacity style={[s.saveBtn, { marginTop: Spacing.lg, flex: 0, width: '100%' }]} onPress={() => setShowRecipe(false)}>
            <Text style={s.saveTxt}>{t('fridge.recipe.ok')}</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

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
  value: { fontSize: Typography.sizeLG, fontWeight: Typography.weightBold },
  label: { fontSize: Typography.sizeXS, color: Colors.textMuted, marginTop: 2 },
});

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.xl, paddingBottom: Layout.tabBarClearance + Spacing.xl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.lg },
  title:    { fontSize: 28, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  addBtn:   { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.accentTeal + '18', borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderWidth: 1, borderColor: Colors.accentTeal + '44' },
  addBtnTxt:{ color: Colors.accentTeal, fontSize: Typography.sizeSM, fontWeight: Typography.weightSemiBold },
  recipeBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.warning + '15', borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderWidth: 1, borderColor: Colors.warning + '44' },
  recipeBtnTxt:{ color: Colors.warning, fontSize: Typography.sizeSM, fontWeight: Typography.weightSemiBold },

  statsRow:  { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },

  alertBanner:{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, borderRadius: Radius.xl, padding: Spacing.md, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.warning + '33' },
  alertEmoji: { fontSize: 24 },
  alertTitle: { fontSize: Typography.sizeSM, fontWeight: Typography.weightBold, color: Colors.warning },
  alertSub:   { fontSize: Typography.sizeXS, color: Colors.textSecondary, marginTop: 2 },

  emptyCard: { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.xxl, alignItems: 'center', borderWidth: 1, borderColor: Glass.border, marginBottom: Spacing.md },
  emptyTitle:{ fontSize: Typography.sizeLG, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  emptySub:  { fontSize: Typography.sizeSM, color: Colors.textSecondary, textAlign: 'center', marginTop: 4, marginBottom: Spacing.lg },
  emptyBtn:  { backgroundColor: Colors.accentTeal, borderRadius: Radius.full, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
  emptyBtnTxt:{ color: Colors.bg, fontSize: Typography.sizeSM, fontWeight: Typography.weightBold },

  hint: { textAlign: 'center', color: Colors.textMuted, fontSize: Typography.sizeXS, marginTop: Spacing.md },

  // Sheet
  backdrop:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet:      { backgroundColor: '#0D0E1C', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: Spacing.xl, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  handle:     { width: 40, height: 4, borderRadius: 2, backgroundColor: Glass.border, alignSelf: 'center', marginBottom: Spacing.lg },
  sheetTitle: { fontSize: Typography.sizeLG, fontWeight: Typography.weightBold, color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing.lg },
  label:      { fontSize: Typography.sizeSM, color: Colors.textSecondary, marginBottom: Spacing.xs, marginTop: Spacing.md },
  input:      { backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, color: Colors.textPrimary, fontSize: Typography.sizeMD, borderWidth: 1, borderColor: Glass.border, marginBottom: Spacing.xs },
  chip:       { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, backgroundColor: Colors.surface, borderRadius: Radius.full, borderWidth: 1, borderColor: Glass.border },
  chipOn:     { borderColor: Colors.accentTeal, backgroundColor: Colors.accentTeal + '18' },
  chipTxt:    { fontSize: Typography.sizeSM, color: Colors.textSecondary },
  chipTxtOn:  { color: Colors.accentTeal, fontWeight: Typography.weightSemiBold },
  btns:       { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.xl },
  cancelBtn:  { flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.full, paddingVertical: Spacing.md, alignItems: 'center' },
  cancelTxt:  { color: Colors.textSecondary, fontWeight: Typography.weightSemiBold },
  saveBtn:    { flex: 2, backgroundColor: Colors.accentTeal, borderRadius: Radius.full, paddingVertical: Spacing.md, alignItems: 'center' },
  saveTxt:    { color: Colors.bg, fontWeight: Typography.weightBold, fontSize: Typography.sizeMD },

  // Recipe
  recipeCard:     { borderRadius: Radius.xl, padding: Spacing.xl, borderWidth: 1, borderColor: Glass.border },
  recipeName:     { fontSize: Typography.sizeLG, fontWeight: Typography.weightBold, color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing.md },
  recipeMeta:     { flexDirection: 'row', gap: Spacing.sm, justifyContent: 'center', marginBottom: Spacing.md },
  recipeChip:     { backgroundColor: Colors.surfaceElevated, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: 4 },
  recipeChipTxt:  { fontSize: Typography.sizeXS, color: Colors.textSecondary },
  recipeDisclaimer:{ fontSize: Typography.sizeXS, color: Colors.textMuted, textAlign: 'center', lineHeight: 16 },
});
