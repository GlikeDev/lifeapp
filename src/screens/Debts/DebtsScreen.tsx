import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, Alert, ActivityIndicator, Animated, Modal,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, Radius, Layout, Glass } from '../../constants/tokens';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { useTranslation } from '../../i18n';
import type { Debt, DebtDirection } from '../../types';

// ─── Icons ────────────────────────────────────────────────────────────────────

function IcoPlus({ c = '#fff', n = 18 }: { c?: string; n?: number }) {
  return (
    <Svg width={n} height={n} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={c} strokeWidth={2.2} strokeLinecap="round" />
    </Svg>
  );
}

function IcoCheck({ c = Colors.success, n = 16 }: { c?: string; n?: number }) {
  return (
    <Svg width={n} height={n} viewBox="0 0 24 24" fill="none">
      <Path d="M5 13l4 4L19 7" stroke={c} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function IcoArrowDown({ c = Colors.danger, n = 20 }: { c?: string; n?: number }) {
  return (
    <Svg width={n} height={n} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 14l7 7 7-7" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function IcoArrowUp({ c = Colors.success, n = 20 }: { c?: string; n?: number }) {
  return (
    <Svg width={n} height={n} viewBox="0 0 24 24" fill="none">
      <Path d="M12 19V5M5 10l7-7 7 7" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(isoStr: string, locale: string): string {
  return new Date(isoStr).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
}

function initials(name: string): string {
  return name.trim().split(/\s+/).map(w => w[0]?.toUpperCase() ?? '').slice(0, 2).join('');
}

const AVATAR_COLORS = [
  '#7B6CF6', '#00D4C8', '#FF6B9D', '#FAAD14', '#39D98A', '#F5554A',
];

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function DebtsScreen() {
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();
  const { t, locale } = useTranslation();
  const currency = user?.currency ?? 'EUR';
  const currSymb = currency === 'RUB' ? '₽' : currency === 'USD' ? '$' : currency === 'GBP' ? '£' : '€';

  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const [direction, setDirection] = useState<DebtDirection>('owed');
  const [person, setPerson] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const sheetAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    load();
  }, [user]);

  async function load() {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('debts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setDebts(data as Debt[]);
    setLoading(false);
    Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
  }

  function openAdd() {
    setShowAdd(true);
    Animated.spring(sheetAnim, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 200 }).start();
  }

  function closeAdd() {
    Animated.timing(sheetAnim, { toValue: 300, duration: 200, useNativeDriver: true }).start(() => {
      setShowAdd(false);
      resetForm();
    });
  }

  async function handleSave() {
    const num = parseFloat(amount.replace(',', '.'));
    if (!person.trim() || isNaN(num) || num <= 0) {
      Alert.alert(t('debt.err.fields'));
      return;
    }
    if (!user) return;
    setSaving(true);
    const { data, error } = await supabase.from('debts').insert({
      user_id: user.id,
      person: person.trim(),
      amount: num,
      currency,
      note: note.trim() || null,
      direction,
    }).select().single();
    if (error) { Alert.alert(t('scan.err.title'), error.message); setSaving(false); return; }
    setDebts(prev => [data as Debt, ...prev]);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaving(false);
    closeAdd();
  }

  function handleSettle(debt: Debt) {
    const label = debt.direction === 'owed'
      ? t('debt.settle.owed', { name: debt.person })
      : t('debt.settle.owe', { name: debt.person });
    Alert.alert(label, `${currSymb}${debt.amount.toFixed(2)}`, [
      { text: t('debt.settle.cancel'), style: 'cancel' },
      {
        text: t('debt.settle.btn'), onPress: async () => {
          await supabase.from('debts').delete().eq('id', debt.id);
          setDebts(prev => prev.filter(d => d.id !== debt.id));
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  }

  function resetForm() {
    setPerson(''); setAmount(''); setNote(''); setDirection('owed');
  }

  const owedToMe = debts.filter(d => d.direction === 'owed');
  const iOwe     = debts.filter(d => d.direction === 'owe');

  const totalOwedToMe = owedToMe.reduce((sum, d) => sum + d.amount, 0);
  const totalIOwe     = iOwe.reduce((sum, d) => sum + d.amount, 0);
  const netBalance    = totalOwedToMe - totalIOwe;
  const netPositive   = netBalance >= 0;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <Animated.ScrollView
        contentContainerStyle={s.scroll}
        indicatorStyle="white"
        showsVerticalScrollIndicator={false}
        style={{ opacity: fadeAnim }}
      >
        {/* Header */}
        <View style={s.header}>
          <Text style={s.title}>{t('debt.title')}</Text>
          <TouchableOpacity style={s.addBtn} onPress={openAdd}>
            <IcoPlus c={Colors.accentTeal} n={14} />
            <Text style={s.addBtnTxt}>{t('debt.add')}</Text>
          </TouchableOpacity>
        </View>

        {/* Net balance hero */}
        <LinearGradient
          colors={netPositive ? ['#0F2A1C', '#0D1F16'] : ['#2A0F0F', '#1F0D0D']}
          style={s.heroCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={s.heroTop}>
            <View style={[s.heroIcon, { backgroundColor: netPositive ? Colors.success + '20' : Colors.danger + '20' }]}>
              {netPositive ? <IcoArrowUp c={Colors.success} n={22} /> : <IcoArrowDown c={Colors.danger} n={22} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.heroLabel}>{t('debt.hero.net')}</Text>
              <Text style={[s.heroAmount, { color: netPositive ? Colors.success : Colors.danger }]}>
                {netPositive ? '+' : ''}{currSymb}{Math.abs(netBalance).toFixed(2)}
              </Text>
              <Text style={s.heroSub}>
                {netPositive ? t('debt.hero.sub.pos') : t('debt.hero.sub.neg')}
              </Text>
            </View>
          </View>
          <View style={s.heroDivider} />
          <View style={s.heroRow}>
            <View style={s.heroStat}>
              <Text style={s.heroStatLabel}>{t('debt.hero.owed')}</Text>
              <Text style={[s.heroStatAmt, { color: Colors.success }]}>{currSymb}{totalOwedToMe.toFixed(2)}</Text>
              <Text style={s.heroStatCount}>{t('debt.hero.persons', { n: owedToMe.length })}</Text>
            </View>
            <View style={s.heroSep} />
            <View style={s.heroStat}>
              <Text style={s.heroStatLabel}>{t('debt.hero.owe')}</Text>
              <Text style={[s.heroStatAmt, { color: Colors.danger }]}>{currSymb}{totalIOwe.toFixed(2)}</Text>
              <Text style={s.heroStatCount}>{t('debt.hero.persons', { n: iOwe.length })}</Text>
            </View>
          </View>
        </LinearGradient>

        {loading ? (
          <ActivityIndicator color={Colors.accentTeal} style={{ marginVertical: Spacing.xxl }} />
        ) : debts.length === 0 ? (
          <View style={s.emptyCard}>
            <Text style={{ fontSize: 52, marginBottom: Spacing.md }}>🤝</Text>
            <Text style={s.emptyTitle}>{t('debt.empty.title')}</Text>
            <Text style={s.emptySub}>{t('debt.empty.sub')}</Text>
            <TouchableOpacity style={s.emptyBtn} onPress={openAdd}>
              <Text style={s.emptyBtnTxt}>{t('debt.empty.btn')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {owedToMe.length > 0 && (
              <View style={s.section}>
                <View style={s.sectionHeader}>
                  <View style={[s.sectionDot, { backgroundColor: Colors.success }]} />
                  <Text style={[s.sectionTitle, { color: Colors.success }]}>{t('debt.hero.owed')}</Text>
                  <Text style={s.sectionTotal}>{currSymb}{totalOwedToMe.toFixed(2)}</Text>
                </View>
                {owedToMe.map(debt => (
                  <DebtRow key={debt.id} debt={debt} currSymb={currSymb} onSettle={handleSettle} />
                ))}
              </View>
            )}

            {iOwe.length > 0 && (
              <View style={s.section}>
                <View style={s.sectionHeader}>
                  <View style={[s.sectionDot, { backgroundColor: Colors.danger }]} />
                  <Text style={[s.sectionTitle, { color: Colors.danger }]}>{t('debt.hero.owe')}</Text>
                  <Text style={s.sectionTotal}>{currSymb}{totalIOwe.toFixed(2)}</Text>
                </View>
                {iOwe.map(debt => (
                  <DebtRow key={debt.id} debt={debt} currSymb={currSymb} onSettle={handleSettle} />
                ))}
              </View>
            )}
          </>
        )}
      </Animated.ScrollView>

      {/* Add debt sheet */}
      <Modal visible={showAdd} transparent animationType="none" onRequestClose={closeAdd}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={closeAdd}>
            <BlurView intensity={92} tint="dark" style={StyleSheet.absoluteFill} />
          </TouchableOpacity>
          <Animated.View style={[s.sheet, { paddingBottom: insets.bottom + 20, transform: [{ translateY: sheetAnim }] }]}>
            <View style={s.handle} />
            <Text style={s.sheetTitle}>{t('debt.new')}</Text>

            {/* Direction toggle */}
            <View style={s.dirToggle}>
              <TouchableOpacity
                style={[s.dirBtn, direction === 'owed' && s.dirBtnActiveGreen]}
                onPress={() => setDirection('owed')}
              >
                <IcoArrowUp c={direction === 'owed' ? Colors.success : Colors.textMuted} n={14} />
                <Text style={[s.dirBtnTxt, direction === 'owed' && { color: Colors.success }]}>{t('debt.hero.owed')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.dirBtn, direction === 'owe' && s.dirBtnActiveRed]}
                onPress={() => setDirection('owe')}
              >
                <IcoArrowDown c={direction === 'owe' ? Colors.danger : Colors.textMuted} n={14} />
                <Text style={[s.dirBtnTxt, direction === 'owe' && { color: Colors.danger }]}>{t('debt.hero.owe')}</Text>
              </TouchableOpacity>
            </View>

            <Text style={s.label}>{t('debt.form.name')}</Text>
            <TextInput
              style={s.input}
              value={person}
              onChangeText={setPerson}
              placeholder={t('debt.form.namePh')}
              placeholderTextColor={Colors.textMuted}
              autoFocus
            />

            <Text style={s.label}>{t('debt.form.amount')}</Text>
            <TextInput
              style={s.input}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={Colors.textMuted}
            />

            <Text style={s.label}>{t('debt.form.note')}</Text>
            <TextInput
              style={[s.input, { height: 72, textAlignVertical: 'top' }]}
              value={note}
              onChangeText={setNote}
              placeholder={t('debt.form.notePh')}
              placeholderTextColor={Colors.textMuted}
              multiline
            />

            <View style={s.btns}>
              <TouchableOpacity style={s.cancelBtn} onPress={closeAdd}>
                <Text style={s.cancelTxt}>{t('debt.form.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.saveBtn, { backgroundColor: direction === 'owed' ? Colors.success : Colors.danger }]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator color={Colors.bg} />
                  : <Text style={s.saveTxt}>{direction === 'owed' ? t('debt.hero.owed') : t('debt.hero.owe')}</Text>
                }
              </TouchableOpacity>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

// ─── DebtRow ──────────────────────────────────────────────────────────────────

function DebtRow({ debt, currSymb, onSettle }: {
  debt: Debt; currSymb: string; onSettle: (d: Debt) => void;
}) {
  const { t, locale } = useTranslation();
  const isOwed = debt.direction === 'owed';
  const color   = isOwed ? Colors.success : Colors.danger;
  const bgColor = avatarColor(debt.person);

  return (
    <View style={dr.row}>
      <View style={[dr.avatar, { backgroundColor: bgColor + '30', borderColor: bgColor + '60' }]}>
        <Text style={[dr.avatarTxt, { color: bgColor }]}>{initials(debt.person)}</Text>
      </View>
      <View style={dr.info}>
        <Text style={dr.name}>{debt.person}</Text>
        {debt.note ? <Text style={dr.note}>{debt.note}</Text> : null}
        <Text style={dr.date}>{formatDate(debt.created_at, locale)}</Text>
      </View>
      <View style={dr.right}>
        <Text style={[dr.amount, { color }]}>
          {isOwed ? '+' : '-'}{currSymb}{debt.amount.toFixed(2)}
        </Text>
        <TouchableOpacity style={[dr.settleBtn, { borderColor: color + '50', backgroundColor: color + '12' }]} onPress={() => onSettle(debt)}>
          <IcoCheck c={color} n={12} />
          <Text style={[dr.settleTxt, { color }]}>{t('debt.settle.btn')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const dr = StyleSheet.create({
  row:       { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: StyleSheet.hairlineWidth, borderColor: Glass.border },
  avatar:    { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  avatarTxt: { fontSize: Typography.sizeMD, fontFamily: Typography.fontBold },
  info:      { flex: 1 },
  name:      { fontSize: Typography.sizeSM, fontFamily: Typography.fontSemiBold, color: Colors.textPrimary },
  note:      { fontSize: Typography.sizeXS, fontFamily: Typography.fontMedium, color: Colors.textSecondary, marginTop: 2 },
  date:      { fontSize: Typography.sizeXS, fontFamily: Typography.fontMedium, color: Colors.textMuted, marginTop: 2 },
  right:     { alignItems: 'flex-end', gap: Spacing.xs },
  amount:    { fontSize: Typography.sizeMD, fontFamily: Typography.fontBold },
  settleBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 4, borderWidth: 1 },
  settleTxt: { fontSize: Typography.sizeXS, fontFamily: Typography.fontSemiBold },
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.xl, paddingBottom: Layout.tabBarClearance + Spacing.xl },

  header:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.lg },
  title:     { fontSize: 28, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  addBtn:    { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.accentTeal + '18', borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderWidth: 1, borderColor: Colors.accentTeal + '44' },
  addBtnTxt: { color: Colors.accentTeal, fontSize: Typography.sizeSM, fontWeight: Typography.weightSemiBold },

  heroCard:  { borderRadius: Radius.xl, padding: Spacing.xl, marginBottom: Spacing.xl, borderWidth: StyleSheet.hairlineWidth, borderColor: Glass.border },
  heroTop:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg, marginBottom: Spacing.lg },
  heroIcon:  { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  heroLabel: { fontSize: Typography.sizeSM, fontFamily: Typography.fontMedium, color: Colors.textSecondary, marginBottom: 4 },
  heroAmount:{ fontSize: 36, fontFamily: Typography.fontBold },
  heroSub:   { fontSize: Typography.sizeXS, fontFamily: Typography.fontMedium, color: Colors.textMuted, marginTop: 4 },
  heroDivider:{ height: 1, backgroundColor: Colors.border, marginBottom: Spacing.lg },
  heroRow:   { flexDirection: 'row' },
  heroStat:  { flex: 1, alignItems: 'center' },
  heroSep:   { width: 1, backgroundColor: Colors.border },
  heroStatLabel:{ fontSize: Typography.sizeXS, fontFamily: Typography.fontMedium, color: Colors.textSecondary, marginBottom: 4 },
  heroStatAmt:  { fontSize: Typography.sizeLG, fontFamily: Typography.fontBold },
  heroStatCount:{ fontSize: Typography.sizeXS, fontFamily: Typography.fontMedium, color: Colors.textMuted, marginTop: 2 },

  section:      { marginBottom: Spacing.lg },
  sectionHeader:{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.sm },
  sectionDot:   { width: 8, height: 8, borderRadius: 4 },
  sectionTitle: { fontSize: Typography.sizeSM, fontFamily: Typography.fontBold },
  sectionTotal: { marginLeft: 'auto', fontSize: Typography.sizeXS, fontFamily: Typography.fontSemiBold, color: Colors.textMuted },

  emptyCard:  { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.xxl, alignItems: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: Glass.border },
  emptyTitle: { fontSize: Typography.sizeLG, fontFamily: Typography.fontBold, color: Colors.textPrimary },
  emptySub:   { fontSize: Typography.sizeSM, fontFamily: Typography.fontMedium, color: Colors.textSecondary, textAlign: 'center', marginTop: 4, marginBottom: Spacing.lg },
  emptyBtn:   { backgroundColor: Colors.accentTeal, borderRadius: Radius.full, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
  emptyBtnTxt:{ color: Colors.bg, fontSize: Typography.sizeSM, fontWeight: Typography.weightBold },

  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet:    { backgroundColor: '#0D0E1C', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: Spacing.xl, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  handle:   { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: Spacing.lg },
  sheetTitle:{ fontSize: Typography.sizeLG, fontWeight: Typography.weightBold, color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing.lg },

  dirToggle: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  dirBtn:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Colors.surface, borderRadius: Radius.full, paddingVertical: Spacing.md, borderWidth: 1, borderColor: Glass.border },
  dirBtnActiveGreen:{ borderColor: Colors.success, backgroundColor: Colors.success + '18' },
  dirBtnActiveRed:  { borderColor: Colors.danger,  backgroundColor: Colors.danger  + '18' },
  dirBtnTxt: { fontSize: Typography.sizeSM, fontFamily: Typography.fontSemiBold, color: Colors.textMuted },

  label:     { fontSize: Typography.sizeSM, color: Colors.textSecondary, marginBottom: Spacing.xs, marginTop: Spacing.md },
  input:     { backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, color: Colors.textPrimary, fontSize: Typography.sizeMD, borderWidth: 1, borderColor: Glass.border },

  btns:      { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.xl },
  cancelBtn: { flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.full, paddingVertical: Spacing.md, alignItems: 'center' },
  cancelTxt: { color: Colors.textSecondary, fontWeight: Typography.weightSemiBold },
  saveBtn:   { flex: 2, borderRadius: Radius.full, paddingVertical: Spacing.md, alignItems: 'center' },
  saveTxt:   { color: Colors.bg, fontWeight: Typography.weightBold, fontSize: Typography.sizeMD },
});
