import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Animated, TextInput, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, Keyboard, Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Circle, Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, Radius, Layout } from '../../constants/tokens';
import { useAuthStore } from '../../store/useAuthStore';
import { useBudgetStore } from '../../store/useBudgetStore';
import { supabase } from '../../lib/supabase';
import { formatCurrency, monthsLeft } from '../../utils/format';
import type { Goal, FridgeItem, Achievement, AchievementTier, MoreStackParamList } from '../../types';

type Nav = NativeStackNavigationProp<MoreStackParamList>;

// ─── XP / Level helpers ───────────────────────────────────────────────────────

const XP_TABLE = [0, 200, 500, 900, 1400, 2000, 2700, 3500, 4400, 5400, 6500];
const LEVEL_NAMES: Record<number, string> = {
  1:'Новичок', 2:'Начинающий', 3:'Следит', 4:'Растёт', 5:'Экономный',
  6:'Опытный', 7:'Профи', 8:'Мастер', 9:'Ас', 10:'Эксперт',
};
function levelName(l: number) { return LEVEL_NAMES[l] ?? `Ур. ${l}`; }
function xpProgress(xp: number, lvl: number) {
  const from = XP_TABLE[lvl - 1] ?? 0;
  const to = XP_TABLE[lvl] ?? from + 300;
  return Math.max(0, Math.min(1, (xp - from) / (to - from)));
}

// ─── Achievement tier helpers ─────────────────────────────────────────────────

const TIER_COLOR: Record<AchievementTier, string> = {
  bronze: Colors.tierBronze, silver: Colors.tierSilver,
  gold: Colors.tierGold, platinum: Colors.tierPlatinum, legend: Colors.tierLegend,
};

// ─── Fridge helpers ───────────────────────────────────────────────────────────

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
function zoneLabel(days: number) {
  if (days < 0) return 'Истёк';
  if (days === 0) return 'Сегодня';
  if (days === 1) return '1 день';
  return `${days} дн.`;
}

// ─── SVG icons ────────────────────────────────────────────────────────────────

function IcoRight({ c = Colors.textMuted, n = 18 }: { c?: string; n?: number }) {
  return (
    <Svg width={n} height={n} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}
function IcoPlus({ c = '#fff', n = 18 }: { c?: string; n?: number }) {
  return (
    <Svg width={n} height={n} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={c} strokeWidth={2.2} strokeLinecap="round"/>
    </Svg>
  );
}
function IcoCheck({ c = '#fff', n = 16 }: { c?: string; n?: number }) {
  return (
    <Svg width={n} height={n} viewBox="0 0 24 24" fill="none">
      <Path d="M20 6L9 17l-5-5" stroke={c} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}
function IcoTrash({ c = Colors.danger, n = 16 }: { c?: string; n?: number }) {
  return (
    <Svg width={n} height={n} viewBox="0 0 24 24" fill="none">
      <Path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}
function IcoStar({ c = '#fff', n = 14 }: { c?: string; n?: number }) {
  return (
    <Svg width={n} height={n} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke={c} strokeWidth={1.8} strokeLinejoin="round"/>
    </Svg>
  );
}
function IcoChef({ c = '#fff', n = 18 }: { c?: string; n?: number }) {
  return (
    <Svg width={n} height={n} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2C8.686 2 6 4.686 6 8c0 1.5.55 2.87 1.45 3.91L6 21h12l-1.45-9.09A5.98 5.98 0 0018 8c0-3.314-2.686-6-6-6z" stroke={c} strokeWidth={1.8} strokeLinejoin="round"/>
      <Path d="M9 21h6" stroke={c} strokeWidth={1.8} strokeLinecap="round"/>
    </Svg>
  );
}
function IcoUser({ c = Colors.accentPurple, n = 18 }: { c?: string; n?: number }) {
  return (
    <Svg width={n} height={n} viewBox="0 0 24 24" fill="none">
      <Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke={c} strokeWidth={1.8} strokeLinecap="round"/>
      <Circle cx="12" cy="7" r="4" stroke={c} strokeWidth={1.8}/>
    </Svg>
  );
}

// ─── Arc ring component ───────────────────────────────────────────────────────

function ArcRing({
  progress, size, color, trackColor = Colors.border, strokeWidth = 5, children,
}: {
  progress: number; size: number; color: string;
  trackColor?: string; strokeWidth?: number; children?: React.ReactNode;
}) {
  const R = size / 2 - strokeWidth;
  const circ = 2 * Math.PI * R;
  const offset = circ * (1 - Math.min(1, Math.max(0, progress)));
  const cx = size / 2;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={cx} cy={cx} r={R} stroke={trackColor} strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={cx} cy={cx} r={R} stroke={color} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" transform={`rotate(-90 ${cx} ${cx})`}
        />
      </Svg>
      {children}
    </View>
  );
}

// ─── Mock AI recipes ──────────────────────────────────────────────────────────

const MOCK_RECIPES = [
  { title: 'Яичница с сыром', emoji: '🍳', time: '5 мин', ingredients: ['яйца', 'сыр', 'масло'] },
  { title: 'Молочная каша', emoji: '🥣', time: '10 мин', ingredients: ['молоко', 'крупа', 'сахар'] },
  { title: 'Омлет с овощами', emoji: '🫔', time: '8 мин', ingredients: ['яйца', 'молоко', 'помидор'] },
  { title: 'Творожная запеканка', emoji: '🧁', time: '30 мин', ingredients: ['творог', 'яйца', 'сахар'] },
];

// ─── Goal EMOJIS ──────────────────────────────────────────────────────────────

const GOAL_EMOJIS = ['🏖️','🏠','🚗','💍','✈️','📱','🎓','🏋️','💰','🎯'];

// ─── Goal palette ─────────────────────────────────────────────────────────────

const GOAL_PALETTES = [
  ['#1B3A2F','#0E2420'] as [string, string],
  ['#2A1F3E','#1A1228'] as [string, string],
  ['#1A2B3C','#0F1B26'] as [string, string],
  ['#3A281F','#261A0E'] as [string, string],
  ['#2F1B3A','#1E1026'] as [string, string],
];

// ─── Main Component ───────────────────────────────────────────────────────────

export function MoreMenuScreen() {
  const nav = useNavigation<Nav>();
  const { user } = useAuthStore();
  const { goals, addGoal, setGoals } = useBudgetStore();
  const insets = useSafeAreaInsets();

  // Fridge state
  const [fridgeItems, setFridgeItems] = useState<FridgeItem[]>([]);
  const [fridgeLoading, setFridgeLoading] = useState(true);

  // Achievements state
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [earnedIds, setEarnedIds] = useState<Set<string>>(new Set());
  const [achTotal, setAchTotal] = useState(0);
  const [achLoading, setAchLoading] = useState(true);
  const [selectedAch, setSelectedAch] = useState<Achievement | null>(null);

  // Add Goal sheet
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalEmoji, setGoalEmoji] = useState('🎯');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalMonthly, setGoalMonthly] = useState('');
  const [goalSaving, setGoalSaving] = useState(false);

  // Add Fridge sheet
  const [showAddFridge, setShowAddFridge] = useState(false);
  const [fridgeName, setFridgeName] = useState('');
  const [fridgeQty, setFridgeQty] = useState('1');
  const [fridgeUnit, setFridgeUnit] = useState('шт');
  const [fridgeDays, setFridgeDays] = useState('7');
  const [fridgeSaving, setFridgeSaving] = useState(false);

  // AI recipe sheet
  const [showRecipe, setShowRecipe] = useState(false);
  const [recipe] = useState(MOCK_RECIPES[Math.floor(Math.random() * MOCK_RECIPES.length)]);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const achScaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 380, useNativeDriver: true }).start();
    loadFridge();
    loadAchievements();
  }, [user]);

  async function loadFridge() {
    if (!user) return;
    setFridgeLoading(true);
    const { data } = await supabase
      .from('fridge_items').select('*').eq('user_id', user.id)
      .order('expires_at', { ascending: true });
    if (data) setFridgeItems(data as FridgeItem[]);
    setFridgeLoading(false);
  }

  async function loadAchievements() {
    if (!user) return;
    setAchLoading(true);
    const [defsRes, earnedRes] = await Promise.all([
      supabase.from('achievement_definitions').select('*').order('xp_reward', { ascending: false }).limit(16),
      supabase.from('user_achievements').select('achievement_id').eq('user_id', user.id),
    ]);
    const totalRes = await supabase.from('achievement_definitions').select('id', { count: 'exact', head: true });
    if (defsRes.data) {
      setAchievements(defsRes.data.map((d: any) => ({
        id: d.id, key: d.key, title: d.title, description: d.description,
        tier: d.tier, category: d.category, xp_reward: d.xp_reward,
      })));
    }
    if (earnedRes.data) setEarnedIds(new Set(earnedRes.data.map((r: any) => r.achievement_id)));
    setAchTotal(totalRes.count ?? 0);
    setAchLoading(false);
  }

  async function handleAddGoal() {
    const num = parseFloat(goalTarget.replace(',', '.'));
    if (!goalTitle.trim() || isNaN(num) || num <= 0) {
      Alert.alert('Заполните название и сумму'); return;
    }
    if (!user) return;
    setGoalSaving(true);
    const { data, error } = await supabase.from('goals').insert({
      user_id: user.id, title: goalTitle.trim(), emoji: goalEmoji,
      target_amount: num, current_amount: 0,
      monthly_contribution: parseFloat(goalMonthly.replace(',', '.')) || 0,
    }).select().single();
    if (error) { Alert.alert('Ошибка', error.message); setGoalSaving(false); return; }
    addGoal(data as Goal);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setGoalSaving(false);
    setShowAddGoal(false);
    setGoalTitle(''); setGoalTarget(''); setGoalMonthly(''); setGoalEmoji('🎯');
  }

  async function handleAddFridge() {
    if (!fridgeName.trim()) { Alert.alert('Введите название'); return; }
    const d = parseInt(fridgeDays);
    if (isNaN(d) || d < 1) { Alert.alert('Укажите срок годности'); return; }
    if (!user) return;
    const expires = new Date(); expires.setDate(expires.getDate() + d);
    setFridgeSaving(true);
    const { data, error } = await supabase.from('fridge_items').insert({
      user_id: user.id, name: fridgeName.trim(),
      quantity: parseFloat(fridgeQty) || 1, unit: fridgeUnit,
      expires_at: expires.toISOString().slice(0, 10),
    }).select().single();
    if (error) { Alert.alert('Ошибка', error.message); setFridgeSaving(false); return; }
    setFridgeItems(prev =>
      [...prev, data as FridgeItem].sort((a, b) => new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime())
    );
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setFridgeSaving(false);
    setShowAddFridge(false);
    setFridgeName(''); setFridgeQty('1'); setFridgeDays('7'); setFridgeUnit('шт');
  }

  async function handleDeleteFridge(id: string) {
    await supabase.from('fridge_items').delete().eq('id', id);
    setFridgeItems(prev => prev.filter(i => i.id !== id));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  async function handleUsedFridge(id: string) {
    await supabase.from('fridge_items').delete().eq('id', id);
    setFridgeItems(prev => prev.filter(i => i.id !== id));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  async function handleDeleteGoal(id: string) {
    Alert.alert('Удалить цель?', 'Это действие необратимо.', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить', style: 'destructive',
        onPress: async () => {
          await supabase.from('goals').delete().eq('id', id);
          setGoals(goals.filter(g => g.id !== id));
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        },
      },
    ]);
  }

  function tapAchievement(ach: Achievement) {
    setSelectedAch(ach);
    achScaleAnim.setValue(0);
    Animated.spring(achScaleAnim, { toValue: 1, tension: 80, friction: 6, useNativeDriver: true }).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  const level = user?.level ?? 1;
  const xp = user?.xp ?? 0;
  const xpTo = XP_TABLE[level] ?? XP_TABLE[XP_TABLE.length - 1];
  const xpProg = xpProgress(xp, level);
  const initials = (user?.full_name ?? 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const currency = user?.currency ?? 'EUR';

  const expiringSoon = fridgeItems.filter(i => daysUntil(i.expires_at) <= 3);
  const expired = fridgeItems.filter(i => daysUntil(i.expires_at) < 0);
  const urgent = fridgeItems.filter(i => { const d = daysUntil(i.expires_at); return d >= 0 && d <= 1; });
  const warning = fridgeItems.filter(i => { const d = daysUntil(i.expires_at); return d >= 2 && d <= 3; });
  const fresh = fridgeItems.filter(i => daysUntil(i.expires_at) > 3);

  const earnedCount = achievements.filter(a => earnedIds.has(a.id)).length;

  const topGoal = goals[0];
  const whatIfGoal = goals.find(g => g.monthly_contribution > 0);

  const FRIDGE_UNITS = ['шт', 'г', 'кг', 'мл', 'л', 'пач.'];
  const FRIDGE_PRESETS = ['1', '3', '7', '14', '30'];

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll} indicatorStyle="white" showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>

          {/* ═══════════════════════════════════════════════════════════
                PROFILE HERO
          ═══════════════════════════════════════════════════════════ */}
          <TouchableOpacity onPress={() => nav.navigate('Profile')} activeOpacity={0.88}>
            <LinearGradient colors={['#1E1F38','#161727']} style={s.heroCard} start={{x:0,y:0}} end={{x:1,y:1}}>
              {/* XP ring + avatar */}
              <ArcRing progress={xpProg} size={72} color={Colors.accentPurple} strokeWidth={5}>
                <View style={s.avatarCircle}>
                  <Text style={s.avatarInitials}>{initials}</Text>
                </View>
              </ArcRing>

              <View style={s.heroInfo}>
                <Text style={s.heroName} numberOfLines={1}>{user?.full_name ?? 'Пользователь'}</Text>
                <View style={s.levelRow}>
                  <View style={s.levelPill}>
                    <Text style={s.levelPillTxt}>Ур. {level}</Text>
                  </View>
                  <Text style={s.levelName}>{levelName(level)}</Text>
                </View>
                <View style={s.xpBarRow}>
                  <View style={s.xpBarBg}>
                    <View style={[s.xpBarFill, { width: `${Math.round(xpProg * 100)}%` as any }]} />
                  </View>
                  <Text style={s.xpTxt}>{xp}/{xpTo} XP</Text>
                </View>
              </View>
              <IcoRight c={Colors.textMuted} n={18} />
            </LinearGradient>
          </TouchableOpacity>

          {/* ═══════════════════════════════════════════════════════════
                GOALS SECTION
          ═══════════════════════════════════════════════════════════ */}
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Мои цели</Text>
            <TouchableOpacity style={s.sectionAddBtn} onPress={() => setShowAddGoal(true)}>
              <IcoPlus c={Colors.success} n={14} />
              <Text style={[s.sectionAddTxt, { color: Colors.success }]}>Цель</Text>
            </TouchableOpacity>
          </View>

          {goals.length === 0 ? (
            <TouchableOpacity style={s.emptyCard} onPress={() => setShowAddGoal(true)} activeOpacity={0.8}>
              <Text style={s.emptyEmoji}>🎯</Text>
              <Text style={s.emptyTitle}>Нет активных целей</Text>
              <Text style={s.emptySub}>Поставьте первую финансовую цель</Text>
            </TouchableOpacity>
          ) : (
            goals.map((goal, idx) => {
              const progress = goal.target_amount > 0 ? goal.current_amount / goal.target_amount : 0;
              const months = monthsLeft(goal.current_amount, goal.target_amount, goal.monthly_contribution);
              const palette = GOAL_PALETTES[idx % GOAL_PALETTES.length];
              const pct = Math.round(progress * 100);
              return (
                <LinearGradient key={goal.id} colors={palette} style={s.goalCard} start={{x:0,y:0}} end={{x:1,y:1}}>
                  {/* Arc + emoji */}
                  <ArcRing progress={progress} size={62} color={Colors.success} strokeWidth={4}>
                    <Text style={{ fontSize: 22 }}>{goal.emoji}</Text>
                  </ArcRing>

                  {/* Info */}
                  <View style={s.goalInfo}>
                    <Text style={s.goalTitle} numberOfLines={1}>{goal.title}</Text>
                    <Text style={s.goalAmts}>
                      {formatCurrency(goal.current_amount, currency)}
                      <Text style={s.goalAmtMuted}> / {formatCurrency(goal.target_amount, currency)}</Text>
                    </Text>
                    <Text style={s.goalSub}>
                      {months > 0
                        ? `+${formatCurrency(goal.monthly_contribution, currency)}/мес · ${months} мес.`
                        : goal.current_amount >= goal.target_amount ? '🎉 Цель достигнута!' : 'Пополняйте'}
                    </Text>
                  </View>

                  {/* Percent + delete */}
                  <View style={s.goalRight}>
                    <View style={s.goalPctBadge}>
                      <Text style={s.goalPctTxt}>{pct}%</Text>
                    </View>
                    <TouchableOpacity style={s.goalTrash} onPress={() => handleDeleteGoal(goal.id)}>
                      <IcoTrash c={Colors.danger} n={14} />
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              );
            })
          )}

          {/* What-if mini card */}
          {whatIfGoal && whatIfGoal.monthly_contribution > 0 && (() => {
            const remaining = whatIfGoal.target_amount - whatIfGoal.current_amount;
            const baseMonths = Math.ceil(remaining / whatIfGoal.monthly_contribution);
            const coffeeSave = Math.ceil(remaining / (whatIfGoal.monthly_contribution + 47));
            const diff = baseMonths - coffeeSave;
            return (
              <View style={s.whatifCard}>
                <Text style={s.whatifTitle}>☕ Откажись от кофе навынос</Text>
                <Text style={s.whatifBody}>
                  +47 {currency}/мес → цель <Text style={{ color: Colors.success, fontWeight: Typography.weightBold }}>на {diff} мес. ближе</Text>
                </Text>
              </View>
            );
          })()}

          {/* ═══════════════════════════════════════════════════════════
                FRIDGE SECTION
          ═══════════════════════════════════════════════════════════ */}
          <View style={[s.sectionHeader, { marginTop: Spacing.xl }]}>
            <Text style={s.sectionTitle}>Холодильник</Text>
            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              {expiringSoon.length > 0 && (
                <TouchableOpacity style={s.recipeBtn} onPress={() => setShowRecipe(true)}>
                  <IcoChef c={Colors.warning} n={14} />
                  <Text style={s.recipeBtnTxt}>Рецепт</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={s.sectionAddBtn} onPress={() => setShowAddFridge(true)}>
                <IcoPlus c={Colors.accentTeal} n={14} />
                <Text style={[s.sectionAddTxt, { color: Colors.accentTeal }]}>Продукт</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Zone summary */}
          {fridgeItems.length > 0 && (
            <View style={s.zoneRow}>
              <ZoneBubble count={expired.length} label="Истекло" color={Colors.danger} />
              <ZoneBubble count={urgent.length} label="Критично" color='#FF8C42' />
              <ZoneBubble count={warning.length} label="Скоро" color={Colors.warning} />
              <ZoneBubble count={fresh.length} label="Свежее" color={Colors.success} />
            </View>
          )}

          {fridgeLoading ? (
            <ActivityIndicator color={Colors.accentTeal} style={{ marginVertical: Spacing.xl }} />
          ) : fridgeItems.length === 0 ? (
            <TouchableOpacity style={s.emptyCard} onPress={() => setShowAddFridge(true)} activeOpacity={0.8}>
              <Text style={s.emptyEmoji}>🧊</Text>
              <Text style={s.emptyTitle}>Холодильник пуст</Text>
              <Text style={s.emptySub}>Добавьте продукты и следите за сроками</Text>
            </TouchableOpacity>
          ) : (
            fridgeItems.map(item => {
              const days = daysUntil(item.expires_at);
              const color = zoneColor(days);
              return (
                <View key={item.id} style={[s.fridgeRow, { borderLeftColor: color }]}>
                  <View style={[s.fridgeDot, { backgroundColor: color }]} />
                  <View style={s.fridgeInfo}>
                    <Text style={s.fridgeName}>{item.name}</Text>
                    <Text style={s.fridgeQty}>{item.quantity} {item.unit}</Text>
                  </View>
                  <Text style={[s.fridgeDays, { color }]}>{zoneLabel(days)}</Text>
                  <TouchableOpacity style={s.fridgeUsedBtn} onPress={() => handleUsedFridge(item.id)}>
                    <IcoCheck c={Colors.success} n={14} />
                  </TouchableOpacity>
                  <TouchableOpacity style={s.fridgeTrashBtn} onPress={() => handleDeleteFridge(item.id)}>
                    <IcoTrash c={Colors.danger} n={14} />
                  </TouchableOpacity>
                </View>
              );
            })
          )}

          {/* ═══════════════════════════════════════════════════════════
                ACHIEVEMENTS SECTION
          ═══════════════════════════════════════════════════════════ */}
          <View style={[s.sectionHeader, { marginTop: Spacing.xl }]}>
            <Text style={s.sectionTitle}>Достижения</Text>
            <TouchableOpacity style={s.sectionAddBtn} onPress={() => nav.navigate('Achievements')}>
              <Text style={[s.sectionAddTxt, { color: Colors.accentPurple }]}>Все →</Text>
            </TouchableOpacity>
          </View>

          {/* XP level card */}
          <LinearGradient colors={['#2A1F3E','#1A1228']} style={s.xpCard} start={{x:0,y:0}} end={{x:1,y:1}}>
            <ArcRing progress={xpProg} size={68} color={Colors.accentPurple} strokeWidth={5}>
              <Text style={s.xpLevelNum}>{level}</Text>
            </ArcRing>
            <View style={s.xpCardInfo}>
              <Text style={s.xpCardLevel}>{levelName(level)}</Text>
              <Text style={s.xpCardXp}>{xp} / {xpTo} XP</Text>
              <Text style={s.xpCardEarned}>{earnedIds.size} из {achTotal} ачивок</Text>
            </View>
            <View style={s.xpCardStars}>
              {[...Array(5)].map((_, i) => (
                <IcoStar key={i} c={i < Math.min(5, Math.floor(level / 2)) ? Colors.warning : Colors.border} n={14} />
              ))}
            </View>
          </LinearGradient>

          {/* 2-col achievement grid */}
          {achLoading ? (
            <ActivityIndicator color={Colors.accentPurple} style={{ marginVertical: Spacing.xl }} />
          ) : (
            <View style={s.achGrid}>
              {achievements.map(ach => {
                const isEarned = earnedIds.has(ach.id);
                const color = TIER_COLOR[ach.tier];
                return (
                  <TouchableOpacity key={ach.id} style={s.achCell} onPress={() => tapAchievement({ ...ach, earned_at: isEarned ? 'yes' : undefined })} activeOpacity={0.75}>
                    <View style={[
                      s.achBadge,
                      { backgroundColor: isEarned ? color + '22' : Colors.surfaceElevated, borderColor: isEarned ? color + '55' : Colors.border },
                    ]}>
                      <Text style={[s.achBadgeStar, { color: isEarned ? color : Colors.textMuted }]}>★</Text>
                      <View style={[s.achTierDot, { backgroundColor: isEarned ? color : Colors.border }]} />
                    </View>
                    <Text style={[s.achName, !isEarned && s.achNameLocked]} numberOfLines={2}>
                      {isEarned ? ach.title : '???'}
                    </Text>
                    {!isEarned && (
                      <View style={s.achProgressBar}>
                        <View style={[s.achProgressFill, { width: `${Math.min(100, Math.random() * 60 + 10)}%` as any, backgroundColor: color + '66' }]} />
                      </View>
                    )}
                    <Text style={[s.achXp, { color: isEarned ? color : Colors.textMuted }]}>{ach.xp_reward} XP</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Finance section: Subscriptions + Debts */}
          <View style={[s.sectionHeader, { marginTop: Spacing.xl }]}>
            <Text style={s.sectionTitle}>Финансы</Text>
          </View>
          <View style={s.financeRow}>
            <TouchableOpacity style={s.financeCard} onPress={() => nav.navigate('Subscriptions')} activeOpacity={0.82}>
              <LinearGradient colors={['#1A2B3C','#0F1B26']} style={s.financeCardGrad} start={{x:0,y:0}} end={{x:1,y:1}}>
                <Text style={s.financeEmoji}>💳</Text>
                <Text style={s.financeCardTitle}>Подписки</Text>
                <Text style={s.financeCardSub}>Отслеживай ежемесячные платежи</Text>
                <IcoRight c={Colors.textMuted} n={14} />
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={s.financeCard} onPress={() => nav.navigate('Debts')} activeOpacity={0.82}>
              <LinearGradient colors={['#1F2A1A','#141E0F']} style={s.financeCardGrad} start={{x:0,y:0}} end={{x:1,y:1}}>
                <Text style={s.financeEmoji}>🤝</Text>
                <Text style={s.financeCardTitle}>Долги</Text>
                <Text style={s.financeCardSub}>Кто кому и сколько должен</Text>
                <IcoRight c={Colors.textMuted} n={14} />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Profile row */}
          <TouchableOpacity style={s.profileRow} onPress={() => nav.navigate('Profile')} activeOpacity={0.8}>
            <View style={s.profileIconWrap}><IcoUser c={Colors.textSecondary} n={18} /></View>
            <Text style={s.profileTxt}>Профиль и настройки</Text>
            <IcoRight c={Colors.textMuted} n={16} />
          </TouchableOpacity>

        </Animated.View>
      </ScrollView>

      {/* ═══════════════════════════════════════════════════════════
            ADD GOAL BOTTOM SHEET
      ═══════════════════════════════════════════════════════════ */}
      <Modal visible={showAddGoal} transparent animationType="slide" onRequestClose={() => setShowAddGoal(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <TouchableOpacity style={s.modalBackdrop} activeOpacity={1} onPress={() => { Keyboard.dismiss(); setShowAddGoal(false); }} />
          <View style={[s.sheet, { paddingBottom: insets.bottom + 20 }]}>
            <View style={s.sheetHandle} />
            <Text style={s.sheetTitle}>Новая цель</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
              <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                {GOAL_EMOJIS.map(e => (
                  <TouchableOpacity key={e} style={[s.emojiBtn, goalEmoji === e && s.emojiBtnOn]} onPress={() => setGoalEmoji(e)}>
                    <Text style={{ fontSize: 22 }}>{e}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <Text style={s.sheetLabel}>Название цели</Text>
            <TextInput style={s.sheetInput} value={goalTitle} onChangeText={setGoalTitle} placeholder="Отпуск в Греции..." placeholderTextColor={Colors.textMuted} />
            <Text style={s.sheetLabel}>Сумма цели</Text>
            <TextInput style={s.sheetInput} value={goalTarget} onChangeText={setGoalTarget} keyboardType="decimal-pad" placeholder="2 000" placeholderTextColor={Colors.textMuted} />
            <Text style={s.sheetLabel}>Откладываю в месяц</Text>
            <TextInput style={s.sheetInput} value={goalMonthly} onChangeText={setGoalMonthly} keyboardType="decimal-pad" placeholder="150" placeholderTextColor={Colors.textMuted} />
            <View style={s.sheetBtns}>
              <TouchableOpacity style={s.sheetCancel} onPress={() => setShowAddGoal(false)}>
                <Text style={s.sheetCancelTxt}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.sheetSave, { backgroundColor: Colors.success }]} onPress={handleAddGoal} disabled={goalSaving}>
                {goalSaving ? <ActivityIndicator color={Colors.bg} /> : <Text style={s.sheetSaveTxt}>Сохранить</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════
            ADD FRIDGE BOTTOM SHEET
      ═══════════════════════════════════════════════════════════ */}
      <Modal visible={showAddFridge} transparent animationType="slide" onRequestClose={() => setShowAddFridge(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <TouchableOpacity style={s.modalBackdrop} activeOpacity={1} onPress={() => { Keyboard.dismiss(); setShowAddFridge(false); }} />
          <View style={[s.sheet, { paddingBottom: insets.bottom + 20 }]}>
            <View style={s.sheetHandle} />
            <Text style={s.sheetTitle}>Добавить продукт</Text>
            <Text style={s.sheetLabel}>Название</Text>
            <TextInput style={s.sheetInput} value={fridgeName} onChangeText={setFridgeName} placeholder="Молоко 1л..." placeholderTextColor={Colors.textMuted} autoFocus />
            <Text style={s.sheetLabel}>Количество</Text>
            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              <TextInput style={[s.sheetInput, { flex: 1 }]} value={fridgeQty} onChangeText={setFridgeQty} keyboardType="decimal-pad" />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 2 }}>
                <View style={{ flexDirection: 'row', gap: Spacing.xs, alignItems: 'center' }}>
                  {FRIDGE_UNITS.map(u => (
                    <TouchableOpacity key={u} style={[s.chip, fridgeUnit === u && s.chipOn]} onPress={() => setFridgeUnit(u)}>
                      <Text style={[s.chipTxt, fridgeUnit === u && s.chipTxtOn]}>{u}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
            <Text style={s.sheetLabel}>Срок годности (дней)</Text>
            <View style={{ flexDirection: 'row', gap: Spacing.xs, marginBottom: Spacing.sm }}>
              {FRIDGE_PRESETS.map(p => (
                <TouchableOpacity key={p} style={[s.chip, fridgeDays === p && s.chipOn]} onPress={() => setFridgeDays(p)}>
                  <Text style={[s.chipTxt, fridgeDays === p && s.chipTxtOn]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput style={s.sheetInput} value={fridgeDays} onChangeText={setFridgeDays} keyboardType="number-pad" placeholder="или введите дни" placeholderTextColor={Colors.textMuted} />
            <View style={s.sheetBtns}>
              <TouchableOpacity style={s.sheetCancel} onPress={() => setShowAddFridge(false)}>
                <Text style={s.sheetCancelTxt}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.sheetSave, { backgroundColor: Colors.accentTeal }]} onPress={handleAddFridge} disabled={fridgeSaving}>
                {fridgeSaving ? <ActivityIndicator color={Colors.bg} /> : <Text style={s.sheetSaveTxt}>Добавить</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════
            AI RECIPE SHEET
      ═══════════════════════════════════════════════════════════ */}
      <Modal visible={showRecipe} transparent animationType="slide" onRequestClose={() => setShowRecipe(false)}>
        <TouchableOpacity style={s.modalBackdrop} activeOpacity={1} onPress={() => setShowRecipe(false)} />
        <View style={[s.sheet, { paddingBottom: insets.bottom + 20 }]}>
          <View style={s.sheetHandle} />
          <Text style={s.sheetTitle}>Что приготовить?</Text>
          <View style={s.recipeCard}>
            <Text style={{ fontSize: 48, textAlign: 'center', marginBottom: Spacing.md }}>{recipe.emoji}</Text>
            <Text style={s.recipeName}>{recipe.title}</Text>
            <View style={s.recipeMetaRow}>
              <View style={s.recipeMeta}><Text style={s.recipeMetaTxt}>⏱ {recipe.time}</Text></View>
              <View style={s.recipeMeta}><Text style={s.recipeMetaTxt}>🧊 Из холодильника</Text></View>
            </View>
            <Text style={s.recipeIngTitle}>Понадобится:</Text>
            {recipe.ingredients.map((ing, i) => (
              <Text key={i} style={s.recipeIng}>· {ing}</Text>
            ))}
            <Text style={s.recipeDisclaimer}>Рецепт подобран на основе продуктов с истекающим сроком</Text>
          </View>
          <TouchableOpacity style={[s.sheetSave, { backgroundColor: Colors.accentTeal, marginTop: Spacing.md }]} onPress={() => setShowRecipe(false)}>
            <Text style={s.sheetSaveTxt}>Понятно</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════
            ACHIEVEMENT DETAIL MODAL
      ═══════════════════════════════════════════════════════════ */}
      {selectedAch && (
        <Modal transparent animationType="fade" onRequestClose={() => setSelectedAch(null)}>
          <TouchableOpacity style={s.achModalBackdrop} activeOpacity={1} onPress={() => setSelectedAch(null)}>
            <Animated.View style={[s.achModalCard, { transform: [{ scale: achScaleAnim }] }]}>
              <TouchableOpacity activeOpacity={1}>
                {(() => {
                  const color = TIER_COLOR[selectedAch.tier];
                  const isEarned = !!selectedAch.earned_at;
                  return (
                    <>
                      <View style={[s.achModalBadge, { backgroundColor: color + '22', borderColor: color + '55' }]}>
                        <Text style={[s.achModalStar, { color }]}>★</Text>
                        <Text style={[s.achModalXp, { color }]}>{selectedAch.xp_reward} XP</Text>
                      </View>
                      <Text style={s.achModalTitle}>{isEarned ? selectedAch.title : '??? Не разблокировано'}</Text>
                      <Text style={s.achModalDesc}>{isEarned ? selectedAch.description : 'Выполните условия чтобы разблокировать ачивку'}</Text>
                      {!isEarned && (
                        <View style={s.achModalProgress}>
                          <Text style={s.achModalProgressLbl}>Прогресс</Text>
                          <View style={s.achModalProgressBar}>
                            <View style={[s.achModalProgressFill, { width: '35%', backgroundColor: color }]} />
                          </View>
                          <Text style={s.achModalProgressPct}>35%</Text>
                        </View>
                      )}
                      <TouchableOpacity style={[s.achModalBtn, { backgroundColor: isEarned ? Colors.accentTeal : Colors.surface }]} onPress={() => setSelectedAch(null)}>
                        <Text style={[s.achModalBtnTxt, { color: isEarned ? Colors.bg : Colors.textSecondary }]}>
                          {isEarned ? 'Отлично! 🎉' : 'Закрыть'}
                        </Text>
                      </TouchableOpacity>
                    </>
                  );
                })()}
              </TouchableOpacity>
            </Animated.View>
          </TouchableOpacity>
        </Modal>
      )}
    </SafeAreaView>
  );
}

// ─── Zone bubble ──────────────────────────────────────────────────────────────

function ZoneBubble({ count, label, color }: { count: number; label: string; color: string }) {
  return (
    <View style={[zb.wrap, { borderColor: count > 0 ? color + '44' : Colors.border }]}>
      <Text style={[zb.count, { color: count > 0 ? color : Colors.textMuted }]}>{count}</Text>
      <Text style={zb.label}>{label}</Text>
    </View>
  );
}
const zb = StyleSheet.create({
  wrap:  { flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.sm, alignItems: 'center', borderWidth: 1 },
  count: { fontSize: Typography.sizeLG, fontWeight: Typography.weightBold },
  label: { fontSize: 9, color: Colors.textMuted, marginTop: 2 },
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.xl, paddingBottom: Layout.tabBarClearance + Spacing.xl },

  // Profile hero
  heroCard:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg, borderRadius: Radius.xl, marginBottom: Spacing.xl, borderWidth: 1, borderColor: Colors.border },
  avatarCircle:  { width: 46, height: 46, borderRadius: 23, backgroundColor: Colors.accentPurple + '28', alignItems: 'center', justifyContent: 'center' },
  avatarInitials:{ fontSize: Typography.sizeSM, fontWeight: Typography.weightBold, color: Colors.accentPurple },
  heroInfo:      { flex: 1, gap: Spacing.xs },
  heroName:      { fontSize: Typography.sizeMD, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  levelRow:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  levelPill:     { backgroundColor: Colors.accentPurple + '30', borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  levelPillTxt:  { fontSize: Typography.sizeXS, color: Colors.accentPurple, fontWeight: Typography.weightBold },
  levelName:     { fontSize: Typography.sizeXS, color: Colors.textSecondary },
  xpBarRow:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  xpBarBg:       { flex: 1, height: 4, backgroundColor: Colors.border, borderRadius: 2, overflow: 'hidden' },
  xpBarFill:     { height: 4, backgroundColor: Colors.accentPurple, borderRadius: 2 },
  xpTxt:         { fontSize: Typography.sizeXS, color: Colors.textMuted, minWidth: 60 },

  // Section header
  sectionHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  sectionTitle:   { fontSize: Typography.sizeLG, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  sectionAddBtn:  { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.surface, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderWidth: 1, borderColor: Colors.border },
  sectionAddTxt:  { fontSize: Typography.sizeXS, fontWeight: Typography.weightSemiBold },

  // Empty state
  emptyCard:  { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.xl, alignItems: 'center', borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.md },
  emptyEmoji: { fontSize: 40, marginBottom: Spacing.sm },
  emptyTitle: { fontSize: Typography.sizeMD, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  emptySub:   { fontSize: Typography.sizeSM, color: Colors.textSecondary, textAlign: 'center', marginTop: 4 },

  // Goal cards
  goalCard:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg, borderRadius: Radius.xl, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  goalInfo:     { flex: 1 },
  goalTitle:    { fontSize: Typography.sizeMD, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  goalAmts:     { fontSize: Typography.sizeSM, color: Colors.success, fontWeight: Typography.weightSemiBold, marginTop: 2 },
  goalAmtMuted: { color: Colors.textMuted, fontWeight: Typography.weightRegular },
  goalSub:      { fontSize: Typography.sizeXS, color: Colors.textSecondary, marginTop: 2 },
  goalRight:    { alignItems: 'center', gap: Spacing.sm },
  goalPctBadge: { backgroundColor: Colors.success + '22', borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 3, borderWidth: 1, borderColor: Colors.success + '44' },
  goalPctTxt:   { fontSize: Typography.sizeXS, color: Colors.success, fontWeight: Typography.weightBold },
  goalTrash:    { padding: 4 },

  // What-if
  whatifCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderLeftWidth: 3, borderColor: Colors.border, borderLeftColor: Colors.warning, marginBottom: Spacing.md },
  whatifTitle:{ fontSize: Typography.sizeSM, fontWeight: Typography.weightSemiBold, color: Colors.textPrimary, marginBottom: 4 },
  whatifBody: { fontSize: Typography.sizeXS, color: Colors.textSecondary, lineHeight: 16 },

  // Fridge zone row
  zoneRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },

  // Fridge items
  fridgeRow:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border, borderLeftWidth: 3 },
  fridgeDot:     { width: 8, height: 8, borderRadius: 4 },
  fridgeInfo:    { flex: 1 },
  fridgeName:    { fontSize: Typography.sizeSM, fontWeight: Typography.weightSemiBold, color: Colors.textPrimary },
  fridgeQty:     { fontSize: Typography.sizeXS, color: Colors.textMuted, marginTop: 2 },
  fridgeDays:    { fontSize: Typography.sizeSM, fontWeight: Typography.weightBold, minWidth: 54, textAlign: 'right' },
  fridgeUsedBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.success + '20', alignItems: 'center', justifyContent: 'center' },
  fridgeTrashBtn:{ width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.danger + '15', alignItems: 'center', justifyContent: 'center' },

  // Recipe button
  recipeBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.warning + '15', borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderWidth: 1, borderColor: Colors.warning + '44' },
  recipeBtnTxt: { fontSize: Typography.sizeXS, color: Colors.warning, fontWeight: Typography.weightSemiBold },

  // XP card
  xpCard:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg, borderRadius: Radius.xl, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  xpLevelNum: { fontSize: Typography.sizeLG, fontWeight: Typography.weightBold, color: Colors.accentPurple },
  xpCardInfo: { flex: 1 },
  xpCardLevel:{ fontSize: Typography.sizeMD, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  xpCardXp:   { fontSize: Typography.sizeSM, color: Colors.accentPurple, marginTop: 2 },
  xpCardEarned:{ fontSize: Typography.sizeXS, color: Colors.textSecondary, marginTop: 2 },
  xpCardStars:{ flexDirection: 'row', gap: 2 },

  // Achievement grid
  achGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
  achCell:    { width: '48%', backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', gap: 6 },
  achBadge:   { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, position: 'relative' },
  achBadgeStar:{ fontSize: 26 },
  achTierDot: { width: 8, height: 8, borderRadius: 4, position: 'absolute', bottom: -2, right: -2 },
  achName:    { fontSize: Typography.sizeXS, color: Colors.textPrimary, textAlign: 'center', fontWeight: Typography.weightSemiBold, lineHeight: 14 },
  achNameLocked:{ color: Colors.textMuted },
  achProgressBar:{ width: '100%', height: 3, backgroundColor: Colors.border, borderRadius: 2, overflow: 'hidden', marginTop: 2 },
  achProgressFill:{ height: 3, borderRadius: 2 },
  achXp:      { fontSize: Typography.sizeXS, fontWeight: Typography.weightBold },

  // Finance section
  financeRow:       { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  financeCard:      { flex: 1, borderRadius: Radius.xl, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  financeCardGrad:  { padding: Spacing.lg, gap: Spacing.xs, minHeight: 120 },
  financeEmoji:     { fontSize: 28, marginBottom: Spacing.xs },
  financeCardTitle: { fontSize: Typography.sizeMD, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  financeCardSub:   { fontSize: Typography.sizeXS, color: Colors.textSecondary, lineHeight: 14, flex: 1 },

  // Profile row
  profileRow:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, marginTop: Spacing.xl },
  profileIconWrap: { width: 36, height: 36, borderRadius: Radius.md, backgroundColor: Colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  profileTxt:      { flex: 1, fontSize: Typography.sizeMD, color: Colors.textPrimary, fontWeight: Typography.weightSemiBold },

  // Bottom sheets
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet:         { backgroundColor: Colors.surfaceElevated, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: Spacing.xl, borderTopWidth: 1, borderColor: Colors.border },
  sheetHandle:   { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: Spacing.lg },
  sheetTitle:    { fontSize: Typography.sizeLG, fontWeight: Typography.weightBold, color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing.lg },
  sheetLabel:    { fontSize: Typography.sizeSM, color: Colors.textSecondary, marginBottom: Spacing.xs, marginTop: Spacing.md },
  sheetInput:    { backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, color: Colors.textPrimary, fontSize: Typography.sizeMD, borderWidth: 1, borderColor: Colors.border },
  sheetBtns:     { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.xl },
  sheetCancel:   { flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.full, paddingVertical: Spacing.md, alignItems: 'center' },
  sheetCancelTxt:{ color: Colors.textSecondary, fontWeight: Typography.weightSemiBold },
  sheetSave:     { flex: 2, borderRadius: Radius.full, paddingVertical: Spacing.md, alignItems: 'center' },
  sheetSaveTxt:  { color: Colors.bg, fontWeight: Typography.weightBold, fontSize: Typography.sizeMD },

  // Chips
  chip:    { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, backgroundColor: Colors.surface, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border },
  chipOn:  { borderColor: Colors.accentTeal, backgroundColor: Colors.accentTeal + '18' },
  chipTxt: { fontSize: Typography.sizeSM, color: Colors.textSecondary },
  chipTxtOn:{ color: Colors.accentTeal, fontWeight: Typography.weightSemiBold },

  // Emoji picker
  emojiBtn:  { width: 44, height: 44, borderRadius: Radius.md, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  emojiBtnOn:{ borderColor: Colors.accentTeal, borderWidth: 2 },

  // Recipe sheet
  recipeCard:       { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.xl, borderWidth: 1, borderColor: Colors.border },
  recipeName:       { fontSize: Typography.sizeLG, fontWeight: Typography.weightBold, color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing.md },
  recipeMetaRow:    { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md, justifyContent: 'center' },
  recipeMeta:       { backgroundColor: Colors.surfaceElevated, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: 4 },
  recipeMetaTxt:    { fontSize: Typography.sizeXS, color: Colors.textSecondary },
  recipeIngTitle:   { fontSize: Typography.sizeSM, fontWeight: Typography.weightSemiBold, color: Colors.textSecondary, marginBottom: Spacing.xs },
  recipeIng:        { fontSize: Typography.sizeSM, color: Colors.textPrimary, marginBottom: 2 },
  recipeDisclaimer: { fontSize: Typography.sizeXS, color: Colors.textMuted, marginTop: Spacing.md, textAlign: 'center', lineHeight: 16 },

  // Achievement modal
  achModalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  achModalCard:     { backgroundColor: Colors.surfaceElevated, borderRadius: Radius.xl, padding: Spacing.xl, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  achModalBadge:    { width: 88, height: 88, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 2, marginBottom: Spacing.lg },
  achModalStar:     { fontSize: 36 },
  achModalXp:       { fontSize: Typography.sizeXS, fontWeight: Typography.weightBold, marginTop: 2 },
  achModalTitle:    { fontSize: Typography.sizeLG, fontWeight: Typography.weightBold, color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing.xs },
  achModalDesc:     { fontSize: Typography.sizeSM, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: Spacing.lg },
  achModalProgress: { width: '100%', marginBottom: Spacing.lg },
  achModalProgressLbl:{ fontSize: Typography.sizeXS, color: Colors.textMuted, marginBottom: Spacing.xs },
  achModalProgressBar:{ height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  achModalProgressFill:{ height: 6, borderRadius: 3 },
  achModalProgressPct:{ fontSize: Typography.sizeXS, color: Colors.textSecondary },
  achModalBtn:      { width: '100%', borderRadius: Radius.full, paddingVertical: Spacing.md, alignItems: 'center' },
  achModalBtnTxt:   { fontSize: Typography.sizeMD, fontWeight: Typography.weightBold },
});
