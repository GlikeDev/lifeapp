import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, Alert, ActivityIndicator, Animated, Modal,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, Radius, Layout, Glass } from '../../constants/tokens';
import { useBudgetStore } from '../../store/useBudgetStore';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../lib/supabase';
import { formatCurrency, monthsLeft } from '../../utils/format';
import type { Goal } from '../../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EMOJIS = ['🏖️','🏠','🚗','💍','✈️','📱','🎓','🏋️','💰','🎯'];
const PALETTES: [string, string][] = [
  ['#1B3A2F','#0E2420'], ['#2A1F3E','#1A1228'],
  ['#1A2B3C','#0F1B26'], ['#3A281F','#261A0E'],
  ['#2F1B3A','#1E1026'],
];

function IcoPlus({ c = '#fff', n = 18 }: { c?: string; n?: number }) {
  return <Svg width={n} height={n} viewBox="0 0 24 24" fill="none"><Path d="M12 5v14M5 12h14" stroke={c} strokeWidth={2.2} strokeLinecap="round"/></Svg>;
}
function IcoTrash({ c = Colors.danger, n = 16 }: { c?: string; n?: number }) {
  return <Svg width={n} height={n} viewBox="0 0 24 24" fill="none"><Path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/></Svg>;
}
function IcoLeft({ c = Colors.accentTeal, n = 22 }: { c?: string; n?: number }) {
  return <Svg width={n} height={n} viewBox="0 0 24 24" fill="none"><Path d="M15 18l-6-6 6-6" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></Svg>;
}

function ArcRing({ progress, size, color, strokeWidth = 4, children }: {
  progress: number; size: number; color: string; strokeWidth?: number; children?: React.ReactNode;
}) {
  const R = size / 2 - strokeWidth;
  const circ = 2 * Math.PI * R;
  const offset = circ * (1 - Math.min(1, Math.max(0, progress)));
  const cx = size / 2;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={cx} cy={cx} r={R} stroke={Colors.border} strokeWidth={strokeWidth} fill="none" />
        <Circle cx={cx} cy={cx} r={R} stroke={color} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cx})`}
        />
      </Svg>
      {children}
    </View>
  );
}

// ─── What-if Simulator ────────────────────────────────────────────────────────

function WhatIfCard({ goal }: { goal: Goal }) {
  const remaining = goal.target_amount - goal.current_amount;
  const base = goal.monthly_contribution > 0 ? Math.ceil(remaining / goal.monthly_contribution) : 0;
  const scenarios = [
    { label: 'Кофе навынос', saving: 47, emoji: '☕' },
    { label: 'Доставка еды', saving: 80, emoji: '🍕' },
    { label: 'Такси', saving: 60, emoji: '🚕' },
  ];
  return (
    <View style={w.card}>
      <Text style={w.title}>What-if симулятор</Text>
      <Text style={w.sub}>Откажись от привычки — цель станет ближе</Text>
      {scenarios.map(sc => {
        const newMonths = Math.ceil(remaining / (goal.monthly_contribution + sc.saving));
        const diff = base - newMonths;
        return (
          <View key={sc.label} style={w.row}>
            <Text style={w.emoji}>{sc.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={w.label}>{sc.label}</Text>
              <Text style={w.effect}>
                На <Text style={w.highlight}>{diff > 0 ? `${diff} мес.` : 'немного'} ближе</Text>
              </Text>
            </View>
            <View style={w.savingBadge}>
              <Text style={w.savingTxt}>+{sc.saving}/мес</Text>
            </View>
          </View>
        );
      })}
      <View style={w.scenarios}>
        <Text style={w.scenTitle}>Сколько откладывать в месяц:</Text>
        <View style={w.scenRow}>
          {[
            { label: 'Минимум', val: remaining / Math.max(base + 3, 1) },
            { label: 'Реалист.', val: goal.monthly_contribution },
            { label: 'Оптим.', val: remaining / Math.max(base - 2, 1) },
          ].map(sc => (
            <View key={sc.label} style={w.scenCard}>
              <Text style={w.scenAmt}>{formatCurrency(Math.round(sc.val))}</Text>
              <Text style={w.scenLabel}>{sc.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
const w = StyleSheet.create({
  card:        { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: StyleSheet.hairlineWidth, borderLeftWidth: 3, borderColor: Glass.border, borderLeftColor: Colors.warning },
  title:       { fontSize: Typography.sizeMD, fontWeight: Typography.weightBold, color: Colors.warning, marginBottom: 2 },
  sub:         { fontSize: Typography.sizeXS, color: Colors.textSecondary, marginBottom: Spacing.md },
  row:         { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  emoji:       { fontSize: 20, width: 28 },
  label:       { fontSize: Typography.sizeSM, color: Colors.textPrimary, fontWeight: Typography.weightSemiBold },
  effect:      { fontSize: Typography.sizeXS, color: Colors.textSecondary },
  highlight:   { color: Colors.success, fontWeight: Typography.weightBold },
  savingBadge: { backgroundColor: Colors.success + '18', borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 3 },
  savingTxt:   { fontSize: Typography.sizeXS, color: Colors.success, fontWeight: Typography.weightBold },
  scenarios:   { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Glass.border, marginTop: Spacing.md, paddingTop: Spacing.md },
  scenTitle:   { fontSize: Typography.sizeXS, color: Colors.textMuted, marginBottom: Spacing.sm },
  scenRow:     { flexDirection: 'row', gap: Spacing.sm },
  scenCard:    { flex: 1, backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md, padding: Spacing.sm, alignItems: 'center' },
  scenAmt:     { fontSize: Typography.sizeSM, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  scenLabel:   { fontSize: Typography.sizeXS, color: Colors.textSecondary, marginTop: 2, textAlign: 'center' },
});

// ─── Main ─────────────────────────────────────────────────────────────────────

export function GoalsScreen() {
  const { user } = useAuthStore();
  const { goals, addGoal, setGoals } = useBudgetStore();
  const insets = useSafeAreaInsets();
  const currency = user?.currency ?? 'EUR';

  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [emoji, setEmoji] = useState('🎯');
  const [target, setTarget] = useState('');
  const [monthly, setMonthly] = useState('');
  const [saving, setSaving] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
  }, []);

  async function handleSave() {
    const num = parseFloat(target.replace(',', '.'));
    if (!title.trim() || isNaN(num) || num <= 0) { Alert.alert('Заполните название и сумму'); return; }
    if (!user) return;
    setSaving(true);
    const { data, error } = await supabase.from('goals').insert({
      user_id: user.id, title: title.trim(), emoji, target_amount: num,
      current_amount: 0, monthly_contribution: parseFloat(monthly.replace(',', '.')) || 0,
    }).select().single();
    if (error) { Alert.alert('Ошибка', error.message); setSaving(false); return; }
    addGoal(data as Goal);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaving(false); setShowAdd(false);
    setTitle(''); setTarget(''); setMonthly(''); setEmoji('🎯');
  }

  async function handleDelete(id: string) {
    Alert.alert('Удалить цель?', '', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Удалить', style: 'destructive', onPress: async () => {
        await supabase.from('goals').delete().eq('id', id);
        setGoals(goals.filter(g => g.id !== id));
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }},
    ]);
  }

  const whatIfGoal = goals.find(g => g.monthly_contribution > 0);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <Animated.ScrollView contentContainerStyle={s.scroll} indicatorStyle="white" showsVerticalScrollIndicator={false} style={{ opacity: fadeAnim }}>

        {/* Header */}
        <View style={s.header}>
          <Text style={s.title}>Мои цели</Text>
          {goals.length < 5 && (
            <TouchableOpacity style={s.addBtn} onPress={() => setShowAdd(true)}>
              <IcoPlus c={Colors.success} n={14} />
              <Text style={s.addBtnTxt}>Добавить</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Empty */}
        {goals.length === 0 && (
          <TouchableOpacity style={s.emptyCard} onPress={() => setShowAdd(true)} activeOpacity={0.8}>
            <Text style={{ fontSize: 52, marginBottom: Spacing.md }}>🎯</Text>
            <Text style={s.emptyTitle}>Нет активных целей</Text>
            <Text style={s.emptySub}>Поставьте первую финансовую цель и отслеживайте прогресс</Text>
            <View style={s.emptyBtn}><Text style={s.emptyBtnTxt}>Поставить цель</Text></View>
          </TouchableOpacity>
        )}

        {/* Goal cards */}
        {goals.map((goal, idx) => {
          const progress = goal.target_amount > 0 ? goal.current_amount / goal.target_amount : 0;
          const months = monthsLeft(goal.current_amount, goal.target_amount, goal.monthly_contribution);
          const pct = Math.round(progress * 100);
          const palette = PALETTES[idx % PALETTES.length];
          const done = goal.current_amount >= goal.target_amount;
          return (
            <LinearGradient key={goal.id} colors={palette} style={s.goalCard} start={{x:0,y:0}} end={{x:1,y:1}}>
              <View style={s.goalTop}>
                {/* Arc ring */}
                <ArcRing progress={progress} size={80} color={done ? Colors.warning : Colors.success} strokeWidth={5}>
                  <Text style={{ fontSize: 28 }}>{goal.emoji}</Text>
                </ArcRing>
                <View style={s.goalMeta}>
                  <Text style={s.goalTitle} numberOfLines={1}>{goal.title}</Text>
                  <Text style={s.goalAmt}>
                    {formatCurrency(goal.current_amount, currency)}
                    <Text style={s.goalAmtOf}> / {formatCurrency(goal.target_amount, currency)}</Text>
                  </Text>
                  {goal.monthly_contribution > 0 && (
                    <Text style={s.goalSub}>+{formatCurrency(goal.monthly_contribution, currency)}/мес</Text>
                  )}
                </View>
                <View style={s.goalActions}>
                  <View style={s.pctBadge}><Text style={s.pctTxt}>{pct}%</Text></View>
                  <TouchableOpacity style={s.trashBtn} onPress={() => handleDelete(goal.id)}>
                    <IcoTrash c={Colors.danger} n={14} />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={s.goalFooter}>
                {done
                  ? <Text style={[s.goalStatus, { color: Colors.warning }]}>🎉 Цель достигнута!</Text>
                  : months > 0
                    ? <Text style={s.goalStatus}>📅 {months} мес. до цели</Text>
                    : <Text style={s.goalStatus}>Пополняйте регулярно</Text>
                }
              </View>
            </LinearGradient>
          );
        })}

      </Animated.ScrollView>

      {/* Add goal sheet */}
      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={() => setShowAdd(false)} />
          <View style={[s.sheet, { paddingBottom: insets.bottom + 20 }]}>
            <View style={s.handle} />
            <Text style={s.sheetTitle}>Новая цель</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
              <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                {EMOJIS.map(e => (
                  <TouchableOpacity key={e} style={[s.emojiBtn, emoji === e && s.emojiBtnOn]} onPress={() => setEmoji(e)}>
                    <Text style={{ fontSize: 22 }}>{e}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <Text style={s.label}>Название</Text>
            <TextInput style={s.input} value={title} onChangeText={setTitle} placeholder="Отпуск в Греции..." placeholderTextColor={Colors.textMuted} />
            <Text style={s.label}>Сумма цели</Text>
            <TextInput style={s.input} value={target} onChangeText={setTarget} keyboardType="decimal-pad" placeholder="2 000" placeholderTextColor={Colors.textMuted} />
            <Text style={s.label}>Откладываю в месяц</Text>
            <TextInput style={s.input} value={monthly} onChangeText={setMonthly} keyboardType="decimal-pad" placeholder="150" placeholderTextColor={Colors.textMuted} />
            <View style={s.btns}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setShowAdd(false)}>
                <Text style={s.cancelTxt}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.saveBtn} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color={Colors.bg} /> : <Text style={s.saveTxt}>Сохранить</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.xl, paddingBottom: Layout.tabBarClearance + Spacing.xl },

  header:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.xl },
  title:     { fontSize: 28, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  addBtn:    { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.success + '18', borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderWidth: 1, borderColor: Colors.success + '44' },
  addBtnTxt: { color: Colors.success, fontSize: Typography.sizeSM, fontWeight: Typography.weightSemiBold },

  emptyCard: { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.xxl, alignItems: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: Glass.border, marginBottom: Spacing.md },
  emptyTitle:{ fontSize: Typography.sizeLG, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  emptySub:  { fontSize: Typography.sizeSM, color: Colors.textSecondary, textAlign: 'center', marginTop: 4, marginBottom: Spacing.lg },
  emptyBtn:  { backgroundColor: Colors.success, borderRadius: Radius.full, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
  emptyBtnTxt:{ color: Colors.bg, fontSize: Typography.sizeSM, fontWeight: Typography.weightBold },

  goalCard:    { borderRadius: Radius.xl, padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: StyleSheet.hairlineWidth, borderColor: Glass.border },
  goalTop:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md },
  goalMeta:    { flex: 1 },
  goalTitle:   { fontSize: Typography.sizeMD, fontWeight: Typography.weightBold, color: Colors.textPrimary, marginBottom: 4 },
  goalAmt:     { fontSize: Typography.sizeSM, color: Colors.success, fontWeight: Typography.weightSemiBold },
  goalAmtOf:   { color: Colors.textMuted, fontWeight: Typography.weightRegular },
  goalSub:     { fontSize: Typography.sizeXS, color: Colors.textSecondary, marginTop: 2 },
  goalActions: { alignItems: 'center', gap: Spacing.sm },
  pctBadge:    { backgroundColor: Colors.success + '22', borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 3, borderWidth: 1, borderColor: Colors.success + '44' },
  pctTxt:      { fontSize: Typography.sizeXS, color: Colors.success, fontWeight: Typography.weightBold },
  trashBtn:    { padding: 6, backgroundColor: Colors.danger + '15', borderRadius: Radius.md },
  goalFooter:  { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', paddingTop: Spacing.sm },
  goalStatus:  { fontSize: Typography.sizeXS, color: Colors.textSecondary },

  // Sheet
  backdrop:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet:      { backgroundColor: Colors.surfaceElevated, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: Spacing.xl, borderTopWidth: StyleSheet.hairlineWidth, borderColor: Glass.border },
  handle:     { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: Spacing.lg },
  sheetTitle: { fontSize: Typography.sizeLG, fontWeight: Typography.weightBold, color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing.lg },
  label:      { fontSize: Typography.sizeSM, color: Colors.textSecondary, marginBottom: Spacing.xs, marginTop: Spacing.md },
  input:      { backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, color: Colors.textPrimary, fontSize: Typography.sizeMD, borderWidth: StyleSheet.hairlineWidth, borderColor: Glass.border },
  emojiBtn:   { width: 44, height: 44, borderRadius: Radius.md, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: Glass.border },
  emojiBtnOn: { borderColor: Colors.accentTeal, borderWidth: 2 },
  btns:       { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.xl },
  cancelBtn:  { flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.full, paddingVertical: Spacing.md, alignItems: 'center' },
  cancelTxt:  { color: Colors.textSecondary, fontWeight: Typography.weightSemiBold },
  saveBtn:    { flex: 2, backgroundColor: Colors.success, borderRadius: Radius.full, paddingVertical: Spacing.md, alignItems: 'center' },
  saveTxt:    { color: Colors.bg, fontWeight: Typography.weightBold, fontSize: Typography.sizeMD },
});
