import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, Alert, ActivityIndicator, Animated, Modal,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, Radius, Layout, Glass } from '../../constants/tokens';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { useTranslation } from '../../i18n';
import type { Subscription, SubscriptionCycle, SubscriptionCategory } from '../../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toMonthly(amount: number, cycle: SubscriptionCycle): number {
  if (cycle === 'weekly')  return (amount * 52) / 12;
  if (cycle === 'yearly')  return amount / 12;
  return amount;
}

function daysUntil(dateStr: string): number {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Math.round((new Date(dateStr).getTime() - today.getTime()) / 86400000);
}

function nextBillingLabel(
  dateStr: string,
  t: (k: string, v?: Record<string, string | number>) => string,
  locale: string,
): string {
  const d = daysUntil(dateStr);
  if (d < 0)   return t('sub.billing.overdue');
  if (d === 0) return t('sub.billing.today');
  if (d === 1) return t('sub.billing.tomorrow');
  if (d <= 7)  return t('sub.billing.inDays', { n: d });
  return new Date(dateStr).toLocaleDateString(locale, { day: 'numeric', month: 'short' });
}

function urgencyColor(dateStr: string): string {
  const d = daysUntil(dateStr);
  if (d <= 1) return Colors.danger;
  if (d <= 3) return '#FF8C42';
  if (d <= 7) return Colors.warning;
  return Colors.textMuted;
}

const CAT_INFO: Record<SubscriptionCategory, { color: string; label: string }> = {
  entertainment: { color: '#E50914',            label: 'Развлечения' },
  streaming:     { color: '#E50914',            label: 'Стриминг'   },
  cloud:         { color: Colors.accentTeal,    label: 'Облако'     },
  ai:            { color: Colors.accentPurple,  label: 'ИИ'         },
  hosting:       { color: Colors.warning,       label: 'Хостинги'   },
  music:         { color: '#1DB954',            label: 'Музыка'     },
  fitness:       { color: Colors.success,       label: 'Фитнес'     },
  software:      { color: '#38BDF8',            label: 'Сервисы'    },
  finance:       { color: Colors.pink,          label: 'Финансы'    },
  other:         { color: Colors.textMuted,     label: 'Другое'     },
};

const CYCLE_MULTS: Record<SubscriptionCycle, number> = {
  weekly: 52, monthly: 12, yearly: 1,
};

const ALL_CATS: SubscriptionCategory[] = ['entertainment','cloud','ai','hosting','music','fitness','software','finance','other'];
const ALL_CYCLES: SubscriptionCycle[] = ['monthly','yearly','weekly'];

// ─── Presets ──────────────────────────────────────────────────────────────────

const PRESETS: Omit<Subscription,'id'|'user_id'|'created_at'|'is_active'|'currency'|'next_billing'>[] = [
  { name:'Netflix',           emoji:'🎬', amount:15.99, cycle:'monthly', category:'entertainment' },
  { name:'Spotify',           emoji:'🎵', amount:9.99,  cycle:'monthly', category:'music'         },
  { name:'YouTube Premium',   emoji:'▶️', amount:13.99, cycle:'monthly', category:'entertainment' },
  { name:'Apple Music',       emoji:'🍎', amount:10.99, cycle:'monthly', category:'music'         },
  { name:'iCloud+',           emoji:'☁️', amount:2.99,  cycle:'monthly', category:'cloud'         },
  { name:'Google One',        emoji:'🔵', amount:2.99,  cycle:'monthly', category:'cloud'         },
  { name:'Dropbox',           emoji:'📦', amount:11.99, cycle:'monthly', category:'cloud'         },
  { name:'ChatGPT Plus',      emoji:'🤖', amount:20,    cycle:'monthly', category:'ai'            },
  { name:'Claude Pro',        emoji:'🧠', amount:20,    cycle:'monthly', category:'ai'            },
  { name:'Midjourney',        emoji:'🎨', amount:10,    cycle:'monthly', category:'ai'            },
  { name:'GitHub',            emoji:'🐙', amount:4,     cycle:'monthly', category:'hosting'       },
  { name:'Vercel',            emoji:'▲',  amount:20,    cycle:'monthly', category:'hosting'       },
  { name:'Amazon AWS',        emoji:'⚡', amount:10,    cycle:'monthly', category:'hosting'       },
  { name:'Gym',               emoji:'💪', amount:30,    cycle:'monthly', category:'fitness'       },
  { name:'Amazon Prime',      emoji:'🛍️', amount:8.99,  cycle:'monthly', category:'entertainment' },
  { name:'Disney+',           emoji:'✨', amount:8.99,  cycle:'monthly', category:'entertainment' },
  { name:'Adobe CC',          emoji:'🎨', amount:54.99, cycle:'monthly', category:'software'      },
  { name:'Notion',            emoji:'📝', amount:10,    cycle:'monthly', category:'software'      },
];

const SUB_EMOJIS = ['💳','🎬','🎵','📱','💪','🎮','📺','🤖','☁️','🎨','📦','🔑','🏠','✈️','📚','🎓'];

// ─── Icons ────────────────────────────────────────────────────────────────────

function IcoPlus({ c = '#fff', n = 18 }: { c?: string; n?: number }) {
  return <Svg width={n} height={n} viewBox="0 0 24 24" fill="none"><Path d="M12 5v14M5 12h14" stroke={c} strokeWidth={2.2} strokeLinecap="round"/></Svg>;
}
function IcoTrash({ c = Colors.danger, n = 16 }: { c?: string; n?: number }) {
  return <Svg width={n} height={n} viewBox="0 0 24 24" fill="none"><Path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/></Svg>;
}
function IcoPause({ c = Colors.textMuted, n = 16 }: { c?: string; n?: number }) {
  return <Svg width={n} height={n} viewBox="0 0 24 24" fill="none"><Path d="M10 4H6v16h4V4zM18 4h-4v16h4V4z" stroke={c} strokeWidth={1.8} strokeLinejoin="round"/></Svg>;
}
function IcoPlay({ c = Colors.success, n = 16 }: { c?: string; n?: number }) {
  return <Svg width={n} height={n} viewBox="0 0 24 24" fill="none"><Path d="M5 3l14 9-14 9V3z" stroke={c} strokeWidth={1.8} strokeLinejoin="round"/></Svg>;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function SubscriptionsScreen() {
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();
  const { t, locale } = useTranslation();
  const currency = user?.currency ?? 'EUR';

  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showPresets, setShowPresets] = useState(false);

  const [name, setName]       = useState('');
  const [emoji, setEmoji]     = useState('💳');
  const [amount, setAmount]   = useState('');
  const [cycle, setCycle]     = useState<SubscriptionCycle>('monthly');
  const [category, setCategory] = useState<SubscriptionCategory>('other');
  const [daysFromNow, setDaysFromNow] = useState('30');
  const [saving, setSaving]   = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    load();
  }, [user]);

  async function load() {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('next_billing', { ascending: true });
    if (data) setSubs(data as Subscription[]);
    setLoading(false);
    Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
  }

  async function handleSave() {
    const num = parseFloat(amount.replace(',', '.'));
    if (!name.trim() || isNaN(num) || num <= 0) { Alert.alert(t('sub.err.nameAmount')); return; }
    if (!user) return;
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + (parseInt(daysFromNow) || 30));
    setSaving(true);
    const { data, error } = await supabase.from('subscriptions').insert({
      user_id: user.id, name: name.trim(), emoji, amount: num,
      currency, cycle, next_billing: nextDate.toISOString().slice(0, 10),
      category, is_active: true,
    }).select().single();
    if (error) { Alert.alert(t('scan.err.title'), error.message); setSaving(false); return; }
    setSubs(prev => [...prev, data as Subscription].sort((a, b) =>
      new Date(a.next_billing).getTime() - new Date(b.next_billing).getTime()
    ));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaving(false); setShowAdd(false);
    resetForm();
  }

  async function handlePreset(preset: typeof PRESETS[0]) {
    if (!user) return;
    const nextDate = new Date(); nextDate.setMonth(nextDate.getMonth() + 1);
    const { data, error } = await supabase.from('subscriptions').insert({
      user_id: user.id, ...preset, currency, is_active: true,
      next_billing: nextDate.toISOString().slice(0, 10),
    }).select().single();
    if (error) { Alert.alert(t('scan.err.title'), error.message); return; }
    setSubs(prev => [...prev, data as Subscription].sort((a, b) =>
      new Date(a.next_billing).getTime() - new Date(b.next_billing).getTime()
    ));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  async function handleDelete(id: string) {
    Alert.alert(t('sub.delete.title'), '', [
      { text: t('sub.delete.cancel'), style: 'cancel' },
      { text: t('sub.delete.confirm'), style: 'destructive', onPress: async () => {
        await supabase.from('subscriptions').delete().eq('id', id);
        setSubs(prev => prev.filter(s => s.id !== id));
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }},
    ]);
  }

  async function toggleActive(sub: Subscription) {
    const { error } = await supabase.from('subscriptions').update({ is_active: !sub.is_active }).eq('id', sub.id);
    if (!error) setSubs(prev => prev.map(s => s.id === sub.id ? { ...s, is_active: !s.is_active } : s));
    Haptics.selectionAsync();
  }

  function resetForm() {
    setName(''); setEmoji('💳'); setAmount(''); setCycle('monthly');
    setCategory('other'); setDaysFromNow('30');
  }

  const currSymb = currency === 'RUB' ? '₽' : currency === 'USD' ? '$' : currency === 'GBP' ? '£' : '€';
  const activeSubs = subs.filter(s => s.is_active);
  const totalMonthly = activeSubs.reduce((sum, s) => sum + toMonthly(s.amount, s.cycle), 0);
  const totalYearly  = totalMonthly * 12;
  const upcoming     = subs.filter(s => daysUntil(s.next_billing) <= 7 && s.is_active);

  const byCategory = ALL_CATS.reduce<Record<string, Subscription[]>>((acc, cat) => {
    acc[cat] = subs.filter(s => s.category === cat);
    return acc;
  }, {});

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <Animated.ScrollView contentContainerStyle={s.scroll} indicatorStyle="white" showsVerticalScrollIndicator={false} style={{ opacity: fadeAnim }}>

        {/* Header */}
        <View style={s.header}>
          <Text style={s.title}>{t('sub.title')}</Text>
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            <TouchableOpacity style={s.presetBtn} onPress={() => setShowPresets(true)}>
              <Text style={s.presetBtnTxt}>{t('sub.presets')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.addBtn} onPress={() => setShowAdd(true)}>
              <IcoPlus c={Colors.accentTeal} n={14} />
              <Text style={s.addBtnTxt}>{t('sub.add')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Summary hero */}
        <LinearGradient colors={['#1A2B3C','#0F1B26']} style={s.summaryCard} start={{x:0,y:0}} end={{x:1,y:1}}>
          <View style={s.summaryMain}>
            <Text style={s.summaryLabel}>{t('sub.summary.monthly')}</Text>
            <Text style={s.summaryAmount}>{currSymb}{totalMonthly.toFixed(2)}</Text>
            <Text style={s.summaryYearly}>{t('sub.summary.yearly', { yearly: currSymb + totalYearly.toFixed(0), count: activeSubs.length })}</Text>
          </View>
          <View style={s.summarySplit}>
            {ALL_CATS.filter(cat => byCategory[cat].length > 0).slice(0, 3).map(cat => {
              const catTotal = byCategory[cat].filter(sub => sub.is_active).reduce((sum, sub) => sum + toMonthly(sub.amount, sub.cycle), 0);
              const info = CAT_INFO[cat];
              return (
                <View key={cat} style={s.summaryChip}>
                  <View style={[s.summaryDot, { backgroundColor: info.color }]} />
                  <Text style={s.summaryChipTxt}>{t('sub.cat.' + cat)}</Text>
                  <Text style={[s.summaryChipAmt, { color: info.color }]}>{currSymb}{catTotal.toFixed(0)}</Text>
                </View>
              );
            })}
          </View>
        </LinearGradient>

        {loading ? (
          <ActivityIndicator color={Colors.accentTeal} style={{ marginVertical: Spacing.xxl }} />
        ) : subs.length === 0 ? (
          <>
            <View style={s.emptyCard}>
              <Text style={{ fontSize: 52, marginBottom: Spacing.md }}>💳</Text>
              <Text style={s.emptyTitle}>{t('sub.empty.title')}</Text>
              <Text style={s.emptySub}>{t('sub.empty.sub')}</Text>
            </View>

            <Text style={s.presetsInlineTitle}>{t('sub.presetsTitle')}</Text>
            {PRESETS.map(preset => {
              const already = subs.some(sub => sub.name === preset.name);
              return (
                <TouchableOpacity
                  key={preset.name}
                  style={[s.presetRow, already && s.presetRowDone]}
                  onPress={() => { if (!already) handlePreset(preset); }}
                  activeOpacity={already ? 1 : 0.8}
                >
                  <Text style={{ fontSize: 24, width: 36 }}>{preset.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.presetName}>{preset.name}</Text>
                    <Text style={s.presetMeta}>{t('sub.cat.' + preset.category)} · {t('sub.cycle.' + preset.cycle)}</Text>
                  </View>
                  <Text style={s.presetAmt}>{currSymb}{preset.amount}</Text>
                  {already
                    ? <Text style={s.presetAdded}>✓</Text>
                    : <View style={s.presetAddBtn}><IcoPlus c="#fff" n={14} /></View>
                  }
                </TouchableOpacity>
              );
            })}
          </>
        ) : (
          <>
            {/* Upcoming renewals */}
            {upcoming.length > 0 && (
              <View style={s.section}>
                <Text style={[s.sectionTitle, { color: Colors.warning }]}>{t('sub.upcoming')}</Text>
                {upcoming.map(sub => (
                  <SubRow key={sub.id} sub={sub} currSymb={currSymb} onDelete={handleDelete} onToggle={toggleActive} highlight />
                ))}
              </View>
            )}

            {/* By category */}
            {ALL_CATS.map(cat => {
              const items = byCategory[cat];
              if (items.length === 0) return null;
              const info = CAT_INFO[cat];
              return (
                <View key={cat} style={s.section}>
                  <View style={s.catHeader}>
                    <View style={[s.catDot, { backgroundColor: info.color }]} />
                    <Text style={[s.sectionTitle, { color: info.color }]}>{t('sub.cat.' + cat)}</Text>
                    <Text style={s.catTotal}>
                      {currSymb}{items.filter(sub=>sub.is_active).reduce((sum,sub)=>sum+toMonthly(sub.amount,sub.cycle),0).toFixed(0)}{t('sub.perMonth')}
                    </Text>
                  </View>
                  {items.map(sub => (
                    <SubRow key={sub.id} sub={sub} currSymb={currSymb} onDelete={handleDelete} onToggle={toggleActive} />
                  ))}
                </View>
              );
            })}
          </>
        )}
      </Animated.ScrollView>

      {/* Add subscription sheet */}
      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={() => setShowAdd(false)}>
            <BlurView intensity={92} tint="dark" style={StyleSheet.absoluteFill} />
          </TouchableOpacity>
          <View style={[s.sheet, { paddingBottom: insets.bottom + 20 }]}>
            <View style={s.handle} />
            <Text style={s.sheetTitle}>{t('sub.new')}</Text>
            <ScrollView keyboardShouldPersistTaps="handled" indicatorStyle="white" showsVerticalScrollIndicator={false}>

              {/* Emoji picker */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
                <View style={{ flexDirection: 'row', gap: Spacing.xs }}>
                  {SUB_EMOJIS.map(e => (
                    <TouchableOpacity key={e} style={[s.emojiBtn, emoji === e && s.emojiBtnOn]} onPress={() => setEmoji(e)}>
                      <Text style={{ fontSize: 20 }}>{e}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <Text style={s.label}>{t('sub.form.name')}</Text>
              <TextInput style={s.input} value={name} onChangeText={setName} placeholder="Netflix, Spotify..." placeholderTextColor={Colors.textMuted} autoFocus />

              <Text style={s.label}>{t('sub.form.amount')}</Text>
              <TextInput style={s.input} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="9.99" placeholderTextColor={Colors.textMuted} />

              <Text style={s.label}>{t('sub.form.cycle')}</Text>
              <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                {ALL_CYCLES.map(c => (
                  <TouchableOpacity key={c} style={[s.cycleBtn, cycle === c && s.cycleBtnOn]} onPress={() => setCycle(c)}>
                    <Text style={[s.cycleBtnTxt, cycle === c && s.cycleBtnTxtOn]}>{t('sub.cycle.' + c)}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={s.label}>{t('sub.form.cat')}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs }}>
                {ALL_CATS.map(cat => {
                  const info = CAT_INFO[cat];
                  return (
                    <TouchableOpacity key={cat} style={[s.catChip, category === cat && { borderColor: info.color, backgroundColor: info.color + '18' }]} onPress={() => setCategory(cat)}>
                      <Text style={[s.catChipTxt, category === cat && { color: info.color }]}>{t('sub.cat.' + cat)}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={s.label}>{t('sub.form.days')}</Text>
              <View style={{ flexDirection: 'row', gap: Spacing.xs, marginBottom: Spacing.sm }}>
                {['7','14','30','90','365'].map(d => (
                  <TouchableOpacity key={d} style={[s.dayBtn, daysFromNow === d && s.dayBtnOn]} onPress={() => setDaysFromNow(d)}>
                    <Text style={[s.dayBtnTxt, daysFromNow === d && s.dayBtnTxtOn]}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput style={s.input} value={daysFromNow} onChangeText={setDaysFromNow} keyboardType="number-pad" placeholder="30" placeholderTextColor={Colors.textMuted} />

              <View style={s.btns}>
                <TouchableOpacity style={s.cancelBtn} onPress={() => setShowAdd(false)}>
                  <Text style={s.cancelTxt}>{t('sub.form.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.saveBtn} onPress={handleSave} disabled={saving}>
                  {saving ? <ActivityIndicator color={Colors.bg} /> : <Text style={s.saveTxt}>{t('sub.form.save')}</Text>}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Presets sheet */}
      <Modal visible={showPresets} transparent animationType="slide" onRequestClose={() => setShowPresets(false)}>
        <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={() => setShowPresets(false)}>
          <BlurView intensity={92} tint="dark" style={StyleSheet.absoluteFill} />
        </TouchableOpacity>
        <View style={[s.sheet, { paddingBottom: insets.bottom + 20, maxHeight: '70%' }]}>
          <View style={s.handle} />
          <Text style={s.sheetTitle}>{t('sub.presetsTitle')}</Text>
          <ScrollView indicatorStyle="white" showsVerticalScrollIndicator={false}>
            {PRESETS.map(preset => {
              const already = subs.some(sub => sub.name === preset.name);
              return (
                <TouchableOpacity
                  key={preset.name}
                  style={[s.presetRow, already && s.presetRowDone]}
                  onPress={() => { if (!already) { handlePreset(preset); } }}
                  activeOpacity={already ? 1 : 0.8}
                >
                  <Text style={{ fontSize: 24, width: 36 }}>{preset.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.presetName}>{preset.name}</Text>
                    <Text style={s.presetMeta}>{t('sub.cat.' + preset.category)} · {t('sub.cycle.' + preset.cycle)}</Text>
                  </View>
                  <Text style={s.presetAmt}>{currSymb}{preset.amount}</Text>
                  {already
                    ? <Text style={s.presetAdded}>✓</Text>
                    : <TouchableOpacity style={s.presetAddBtn} onPress={() => handlePreset(preset)}>
                        <IcoPlus c="#fff" n={14} />
                      </TouchableOpacity>
                  }
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── SubRow component ─────────────────────────────────────────────────────────

function SubRow({ sub, currSymb, onDelete, onToggle, highlight }: {
  sub: Subscription; currSymb: string;
  onDelete: (id: string) => void; onToggle: (sub: Subscription) => void;
  highlight?: boolean;
}) {
  const { t, locale } = useTranslation();
  const info = CAT_INFO[sub.category];
  const monthly = toMonthly(sub.amount, sub.cycle);
  const urgColor = urgencyColor(sub.next_billing);
  return (
    <View style={[sr.row, !sub.is_active && sr.rowPaused, highlight && { borderColor: Colors.warning + '44', backgroundColor: Colors.warning + '08' }]}>
      <View style={[sr.emojiWrap, { backgroundColor: info.color + '20' }]}>
        <Text style={{ fontSize: 20 }}>{sub.emoji}</Text>
      </View>
      <View style={sr.info}>
        <Text style={[sr.name, !sub.is_active && { color: Colors.textMuted }]}>{sub.name}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={[sr.nextDate, { color: urgColor }]}>{nextBillingLabel(sub.next_billing, t, locale)}</Text>
          <Text style={sr.dot}>·</Text>
          <Text style={sr.cycle}>{t('sub.cycle.' + sub.cycle)}</Text>
        </View>
      </View>
      <View style={sr.right}>
        <Text style={[sr.amount, !sub.is_active && { color: Colors.textMuted }]}>{currSymb}{sub.amount.toFixed(2)}</Text>
        <Text style={sr.monthly}>{currSymb}{monthly.toFixed(0)}{t('sub.perMonth')}</Text>
      </View>
      <TouchableOpacity style={sr.iconBtn} onPress={() => onToggle(sub)}>
        {sub.is_active ? <IcoPause c={Colors.textMuted} n={14} /> : <IcoPlay c={Colors.success} n={14} />}
      </TouchableOpacity>
      <TouchableOpacity style={sr.iconBtn} onPress={() => onDelete(sub.id)}>
        <IcoTrash c={Colors.danger} n={14} />
      </TouchableOpacity>
    </View>
  );
}
const sr = StyleSheet.create({
  row:       { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: StyleSheet.hairlineWidth, borderColor: Glass.border },
  rowPaused: { opacity: 0.55 },
  emojiWrap: { width: 42, height: 42, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  info:      { flex: 1 },
  name:      { fontSize: Typography.sizeSM, fontWeight: Typography.weightSemiBold, color: Colors.textPrimary },
  nextDate:  { fontSize: Typography.sizeXS, fontWeight: Typography.weightSemiBold },
  dot:       { fontSize: Typography.sizeXS, color: Colors.textMuted },
  cycle:     { fontSize: Typography.sizeXS, color: Colors.textMuted },
  right:     { alignItems: 'flex-end' },
  amount:    { fontSize: Typography.sizeSM, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  monthly:   { fontSize: Typography.sizeXS, color: Colors.textMuted },
  iconBtn:   { padding: 6 },
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.xl, paddingBottom: Layout.tabBarClearance + Spacing.xl },

  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.lg },
  title:      { fontSize: 28, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  addBtn:     { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.accentTeal + '18', borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderWidth: 1, borderColor: Colors.accentTeal + '44' },
  addBtnTxt:  { color: Colors.accentTeal, fontSize: Typography.sizeSM, fontWeight: Typography.weightSemiBold },
  presetBtn:  { backgroundColor: Colors.surface, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderWidth: StyleSheet.hairlineWidth, borderColor: Glass.border },
  presetBtnTxt:{ color: Colors.textSecondary, fontSize: Typography.sizeSM, fontWeight: Typography.weightSemiBold },

  summaryCard:  { borderRadius: Radius.xl, padding: Spacing.xl, marginBottom: Spacing.xl, borderWidth: StyleSheet.hairlineWidth, borderColor: Glass.border },
  summaryMain:  { marginBottom: Spacing.lg },
  summaryLabel: { fontSize: Typography.sizeSM, color: Colors.textSecondary, marginBottom: 4 },
  summaryAmount:{ fontSize: 40, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  summaryYearly:{ fontSize: Typography.sizeSM, color: Colors.textSecondary, marginTop: 4 },
  summarySplit: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  summaryChip:  { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: 5 },
  summaryDot:   { width: 6, height: 6, borderRadius: 3 },
  summaryChipTxt:{ fontSize: Typography.sizeXS, color: Colors.textSecondary },
  summaryChipAmt:{ fontSize: Typography.sizeXS, fontWeight: Typography.weightBold },

  section:     { marginBottom: Spacing.lg },
  sectionTitle:{ fontSize: Typography.sizeSM, fontWeight: Typography.weightBold, color: Colors.textPrimary, marginBottom: Spacing.sm },
  catHeader:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.sm },
  catDot:      { width: 8, height: 8, borderRadius: 4 },
  catTotal:    { marginLeft: 'auto', fontSize: Typography.sizeXS, color: Colors.textMuted },

  emptyCard:  { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.xxl, alignItems: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: Glass.border, marginBottom: Spacing.xl },
  emptyTitle: { fontSize: Typography.sizeLG, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  emptySub:   { fontSize: Typography.sizeSM, color: Colors.textSecondary, textAlign: 'center', marginTop: 4 },
  presetsInlineTitle: { fontSize: Typography.sizeSM, fontWeight: Typography.weightBold, color: Colors.textMuted, letterSpacing: 0.8, marginBottom: Spacing.md },

  backdrop:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet:      { backgroundColor: '#0D0E1C', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: Spacing.xl, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  handle:     { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: Spacing.lg },
  sheetTitle: { fontSize: Typography.sizeLG, fontWeight: Typography.weightBold, color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing.lg },
  label:      { fontSize: Typography.sizeSM, color: Colors.textSecondary, marginBottom: Spacing.xs, marginTop: Spacing.md },
  input:      { backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, color: Colors.textPrimary, fontSize: Typography.sizeMD, borderWidth: StyleSheet.hairlineWidth, borderColor: Glass.border },
  emojiBtn:   { width: 40, height: 40, borderRadius: Radius.md, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: Glass.border },
  emojiBtnOn: { borderColor: Colors.accentTeal, borderWidth: 2 },
  cycleBtn:   { flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.full, paddingVertical: Spacing.sm, alignItems: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: Glass.border },
  cycleBtnOn: { backgroundColor: Colors.accentTeal + '20', borderColor: Colors.accentTeal },
  cycleBtnTxt:{ fontSize: Typography.sizeSM, color: Colors.textSecondary },
  cycleBtnTxtOn:{ color: Colors.accentTeal, fontWeight: Typography.weightSemiBold },
  catChip:    { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, backgroundColor: Colors.surface, borderRadius: Radius.full, borderWidth: StyleSheet.hairlineWidth, borderColor: Glass.border },
  catChipTxt: { fontSize: Typography.sizeXS, color: Colors.textSecondary },
  dayBtn:     { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, backgroundColor: Colors.surface, borderRadius: Radius.full, borderWidth: StyleSheet.hairlineWidth, borderColor: Glass.border },
  dayBtnOn:   { backgroundColor: Colors.accentPurple + '20', borderColor: Colors.accentPurple },
  dayBtnTxt:  { fontSize: Typography.sizeXS, color: Colors.textSecondary },
  dayBtnTxtOn:{ color: Colors.accentPurple, fontWeight: Typography.weightSemiBold },
  btns:       { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.xl },
  cancelBtn:  { flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.full, paddingVertical: Spacing.md, alignItems: 'center' },
  cancelTxt:  { color: Colors.textSecondary, fontWeight: Typography.weightSemiBold },
  saveBtn:    { flex: 2, backgroundColor: Colors.accentTeal, borderRadius: Radius.full, paddingVertical: Spacing.md, alignItems: 'center' },
  saveTxt:    { color: Colors.bg, fontWeight: Typography.weightBold, fontSize: Typography.sizeMD },

  presetRow:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md, borderRadius: Radius.md, marginBottom: Spacing.sm, backgroundColor: Colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: Glass.border },
  presetRowDone:{ opacity: 0.5 },
  presetName:   { fontSize: Typography.sizeSM, fontWeight: Typography.weightSemiBold, color: Colors.textPrimary },
  presetMeta:   { fontSize: Typography.sizeXS, color: Colors.textMuted, marginTop: 2 },
  presetAmt:    { fontSize: Typography.sizeSM, fontWeight: Typography.weightBold, color: Colors.textPrimary, minWidth: 44, textAlign: 'right' },
  presetAdded:  { color: Colors.success, fontSize: 18, marginLeft: 4 },
  presetAddBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.accentTeal, alignItems: 'center', justifyContent: 'center' },
});
