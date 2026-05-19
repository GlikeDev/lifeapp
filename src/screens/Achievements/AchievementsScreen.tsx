import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, Modal, Animated, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, Radius, Layout } from '../../constants/tokens';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import type { Achievement, AchievementCategory, AchievementTier } from '../../types';

// ─── Constants ────────────────────────────────────────────────────────────────

const TIER_COLOR: Record<AchievementTier, string> = {
  bronze: Colors.tierBronze, silver: Colors.tierSilver,
  gold: Colors.tierGold, platinum: Colors.tierPlatinum, legend: Colors.tierLegend,
};
const TIER_LABEL: Record<AchievementTier, string> = {
  bronze:'Бронза', silver:'Серебро', gold:'Золото', platinum:'Платина', legend:'Легенда',
};
const CAT_LABEL: Record<AchievementCategory, string> = {
  budget:'Бюджет', savings:'Экономия', food:'Продукты',
  nutrition:'Нутриция', activity:'Активность', special:'Особые',
};
const CAT_ICON: Record<AchievementCategory, string> = {
  budget:'📊', savings:'💰', food:'🛒', nutrition:'🥗', activity:'⚡', special:'✨',
};
const ALL_CATS: AchievementCategory[] = ['budget','savings','food','nutrition','activity','special'];

const XP_TABLE = [0, 200, 500, 900, 1400, 2000, 2700, 3500, 4400, 5400, 6500];
const LEVEL_NAMES: Record<number, string> = {
  1:'Новичок',2:'Начинающий',3:'Следит',4:'Растёт',5:'Экономный',
  6:'Опытный',7:'Профи',8:'Мастер',9:'Ас',10:'Эксперт',
};
function levelName(l: number) { return LEVEL_NAMES[l] ?? `Уровень ${l}`; }
function xpProgress(xp: number, lvl: number) {
  const from = XP_TABLE[lvl-1] ?? 0;
  const to   = XP_TABLE[lvl]   ?? from + 300;
  return Math.max(0, Math.min(1, (xp - from) / (to - from)));
}

// ─── SVG icons ────────────────────────────────────────────────────────────────

function IcoShare({ c = '#fff', n = 18 }: { c?: string; n?: number }) {
  return <Svg width={n} height={n} viewBox="0 0 24 24" fill="none"><Path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/></Svg>;
}

// ─── Arc Ring ─────────────────────────────────────────────────────────────────

function ArcRing({ progress, size, color, strokeWidth = 6, children }: {
  progress: number; size: number; color: string; strokeWidth?: number; children?: React.ReactNode;
}) {
  const R  = size / 2 - strokeWidth;
  const circ   = 2 * Math.PI * R;
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

// ─── Achievement modal ────────────────────────────────────────────────────────

function AchModal({ ach, isEarned, userXp, userLevel, onClose }: {
  ach: Achievement; isEarned: boolean; userXp: number; userLevel: number; onClose: () => void;
}) {
  const color = TIER_COLOR[ach.tier];
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const progress = xpProgress(userXp, userLevel);
  const xpTo = XP_TABLE[userLevel] ?? XP_TABLE[XP_TABLE.length - 1];

  useEffect(() => {
    Animated.spring(scaleAnim, { toValue: 1, tension: 80, friction: 6, useNativeDriver: true }).start();
    if (isEarned) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={am.backdrop} activeOpacity={1} onPress={onClose}>
        <Animated.View style={[am.card, { transform: [{ scale: scaleAnim }] }]}>
          <TouchableOpacity activeOpacity={1}>
            {/* Badge */}
            <View style={am.badgeWrap}>
              <LinearGradient
                colors={isEarned ? [color + '44', color + '22'] : [Colors.surfaceElevated, Colors.surface]}
                style={[am.badge, { borderColor: isEarned ? color + '66' : Colors.border }]}
              >
                <Text style={[am.badgeStar, { color: isEarned ? color : Colors.textMuted }]}>★</Text>
                <Text style={[am.badgeTier, { color: isEarned ? color : Colors.textMuted }]}>
                  {TIER_LABEL[ach.tier].toUpperCase()}
                </Text>
                <Text style={[am.badgeXp, { color: isEarned ? color : Colors.textMuted }]}>
                  {ach.xp_reward} XP
                </Text>
              </LinearGradient>
            </View>

            <Text style={am.title}>{isEarned ? ach.title : '??? Не разблокировано'}</Text>
            <Text style={am.desc}>{isEarned ? ach.description : 'Выполните условия чтобы открыть это достижение'}</Text>

            {/* Progress inside locked */}
            {!isEarned && (
              <View style={am.progressSection}>
                <View style={am.progressHeader}>
                  <Text style={am.progressLbl}>Прогресс</Text>
                  <Text style={am.progressPct}>35%</Text>
                </View>
                <View style={am.progressBar}>
                  <View style={[am.progressFill, { width: '35%', backgroundColor: color }]} />
                </View>
                <Text style={am.progressHint}>Продолжайте использовать приложение</Text>
              </View>
            )}

            {/* XP level */}
            <View style={am.levelSection}>
              <View style={am.levelHeader}>
                <ArcRing progress={progress} size={52} color={Colors.accentPurple} strokeWidth={4}>
                  <Text style={am.levelNum}>{userLevel}</Text>
                </ArcRing>
                <View style={{ flex: 1 }}>
                  <Text style={am.levelName}>{levelName(userLevel)}</Text>
                  <Text style={am.levelXp}>{userXp} / {xpTo} XP</Text>
                </View>
              </View>
            </View>

            {/* Buttons */}
            <View style={am.btns}>
              {isEarned && (
                <TouchableOpacity style={am.shareBtn} onPress={async () => {
                  await Share.share({ message: `Получил ачивку "${ach.title}" в SaveSmart! +${ach.xp_reward} XP 🎉` });
                }}>
                  <IcoShare c={Colors.bg} n={16} />
                  <Text style={am.shareTxt}>Поделиться</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={am.closeBtn} onPress={onClose}>
                <Text style={am.closeTxt}>{isEarned ? 'Отлично! 🎉' : 'Закрыть'}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

const am = StyleSheet.create({
  backdrop:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  card:          { backgroundColor: Colors.surfaceElevated, borderRadius: Radius.xl, padding: Spacing.xl, width: '100%', borderWidth: 1, borderColor: Colors.border },
  badgeWrap:     { alignItems: 'center', marginBottom: Spacing.lg },
  badge:         { width: 96, height: 96, borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 2, gap: 2 },
  badgeStar:     { fontSize: 36 },
  badgeTier:     { fontSize: Typography.sizeXS, fontWeight: Typography.weightBold, letterSpacing: 0.5 },
  badgeXp:       { fontSize: Typography.sizeSM, fontWeight: Typography.weightBold },
  title:         { fontSize: Typography.sizeLG, fontWeight: Typography.weightBold, color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing.xs },
  desc:          { fontSize: Typography.sizeSM, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: Spacing.lg },
  progressSection:{ backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  progressHeader:{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xs },
  progressLbl:   { fontSize: Typography.sizeXS, color: Colors.textSecondary },
  progressPct:   { fontSize: Typography.sizeXS, color: Colors.textPrimary, fontWeight: Typography.weightBold },
  progressBar:   { height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden', marginBottom: Spacing.xs },
  progressFill:  { height: 6, borderRadius: 3 },
  progressHint:  { fontSize: Typography.sizeXS, color: Colors.textMuted },
  levelSection:  { backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  levelHeader:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  levelNum:      { fontSize: Typography.sizeMD, fontWeight: Typography.weightBold, color: Colors.accentPurple },
  levelName:     { fontSize: Typography.sizeSM, fontWeight: Typography.weightSemiBold, color: Colors.textPrimary },
  levelXp:       { fontSize: Typography.sizeXS, color: Colors.textSecondary, marginTop: 2 },
  btns:          { gap: Spacing.sm },
  shareBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.accentTeal, borderRadius: Radius.full, paddingVertical: Spacing.md },
  shareTxt:      { color: Colors.bg, fontWeight: Typography.weightBold, fontSize: Typography.sizeMD },
  closeBtn:      { backgroundColor: Colors.surface, borderRadius: Radius.full, paddingVertical: Spacing.md, alignItems: 'center' },
  closeTxt:      { color: Colors.textPrimary, fontWeight: Typography.weightSemiBold },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function AchievementsScreen() {
  const { user } = useAuthStore();
  const [allDefs, setAllDefs] = useState<Achievement[]>([]);
  const [earnedIds, setEarnedIds] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState<'all' | AchievementCategory>('all');
  const [selected, setSelected] = useState<Achievement | null>(null);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    async function load() {
      if (!user) return;
      const [defsRes, earnedRes] = await Promise.all([
        supabase.from('achievement_definitions').select('*').order('category').order('xp_reward'),
        supabase.from('user_achievements').select('achievement_id').eq('user_id', user.id),
      ]);
      if (defsRes.data) {
        setAllDefs(defsRes.data.map((d: any) => ({
          id: d.id, key: d.key, title: d.title, description: d.description,
          tier: d.tier, category: d.category, xp_reward: d.xp_reward,
        })));
      }
      if (earnedRes.data) setEarnedIds(new Set(earnedRes.data.map((r: any) => r.achievement_id)));
      setLoading(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
    }
    load();
  }, [user]);

  const filtered = allDefs.filter(a => activeCategory === 'all' || a.category === activeCategory);
  const earnedCount = allDefs.filter(a => earnedIds.has(a.id)).length;
  const level = user?.level ?? 1;
  const xp = user?.xp ?? 0;
  const xpTo = XP_TABLE[level] ?? XP_TABLE[XP_TABLE.length - 1];

  if (loading) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.center}><ActivityIndicator color={Colors.accentPurple} size="large" /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <Animated.ScrollView contentContainerStyle={s.scroll} indicatorStyle="white" showsVerticalScrollIndicator={false} style={{ opacity: fadeAnim }}>

        {/* Title */}
        <Text style={s.title}>Достижения</Text>

        {/* XP Level hero card */}
        <LinearGradient colors={['#2A1F3E','#1A1228']} style={s.xpCard} start={{x:0,y:0}} end={{x:1,y:1}}>
          <ArcRing progress={xpProgress(xp, level)} size={96} color={Colors.accentPurple} strokeWidth={7}>
            <View style={s.xpCenter}>
              <Text style={s.xpLvlNum}>{level}</Text>
              <Text style={s.xpLvlWord}>ур.</Text>
            </View>
          </ArcRing>
          <View style={s.xpInfo}>
            <Text style={s.xpLevelName}>{levelName(level)}</Text>
            <Text style={s.xpPoints}>{xp} / {xpTo} XP</Text>
            <View style={s.xpBarRow}>
              <View style={s.xpBarBg}>
                <View style={[s.xpBarFill, { width: `${Math.round(xpProgress(xp, level) * 100)}%` as any }]} />
              </View>
              <Text style={s.xpBarPct}>{Math.round(xpProgress(xp, level) * 100)}%</Text>
            </View>
            <Text style={s.xpEarned}>{earnedCount} / {allDefs.length} ачивок</Text>
          </View>
        </LinearGradient>

        {/* Category filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.lg }}>
          <View style={s.filters}>
            <FilterTab label="Все" active={activeCategory === 'all'} count={allDefs.length} onPress={() => setActiveCategory('all')} />
            {ALL_CATS.map(cat => (
              <FilterTab
                key={cat}
                label={`${CAT_ICON[cat]} ${CAT_LABEL[cat]}`}
                active={activeCategory === cat}
                count={allDefs.filter(a => a.category === cat).length}
                onPress={() => setActiveCategory(cat)}
              />
            ))}
          </View>
        </ScrollView>

        {/* 2-column grid */}
        <View style={s.grid}>
          {filtered.map(ach => {
            const isEarned = earnedIds.has(ach.id);
            const color = TIER_COLOR[ach.tier];
            return (
              <TouchableOpacity
                key={ach.id}
                style={[s.cell, !isEarned && s.cellLocked]}
                onPress={() => setSelected(ach)}
                activeOpacity={0.75}
              >
                {/* Badge */}
                <View style={[
                  s.badgeBox,
                  { backgroundColor: isEarned ? color + '22' : Colors.surfaceElevated, borderColor: isEarned ? color + '55' : Colors.border },
                ]}>
                  <Text style={[s.badgeStar, { color: isEarned ? color : Colors.textMuted, opacity: isEarned ? 1 : 0.4 }]}>★</Text>
                  {/* Tier dot */}
                  <View style={[s.tierDot, { backgroundColor: isEarned ? color : Colors.border }]} />
                </View>

                {/* Name */}
                <Text style={[s.achName, !isEarned && s.achNameLocked]} numberOfLines={2}>
                  {isEarned ? ach.title : '???'}
                </Text>

                {/* Progress bar for locked */}
                {!isEarned && (
                  <View style={s.lockedProgress}>
                    <View style={[s.lockedFill, { width: '35%', backgroundColor: color + '77' }]} />
                  </View>
                )}

                {/* XP */}
                <Text style={[s.xpTag, { color: isEarned ? color : Colors.textMuted }]}>
                  {ach.xp_reward} XP
                </Text>

                {/* Earned checkmark */}
                {isEarned && <View style={[s.earnedBadge, { backgroundColor: color + '22' }]}>
                  <Text style={[{ fontSize: 8, color }]}>✓ {TIER_LABEL[ach.tier]}</Text>
                </View>}
              </TouchableOpacity>
            );
          })}
        </View>

      </Animated.ScrollView>

      {selected && (
        <AchModal
          ach={selected}
          isEarned={earnedIds.has(selected.id)}
          userXp={xp}
          userLevel={level}
          onClose={() => setSelected(null)}
        />
      )}
    </SafeAreaView>
  );
}

function FilterTab({ label, active, count, onPress }: {
  label: string; active: boolean; count: number; onPress: () => void;
}) {
  return (
    <TouchableOpacity style={[ft.chip, active && ft.chipOn]} onPress={onPress}>
      <Text style={[ft.txt, active && ft.txtOn]}>{label}</Text>
      <View style={[ft.badge, active && ft.badgeOn]}>
        <Text style={[ft.badgeTxt, active && ft.badgeTxtOn]}>{count}</Text>
      </View>
    </TouchableOpacity>
  );
}
const ft = StyleSheet.create({
  chip:     { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.full, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  chipOn:   { backgroundColor: Colors.accentPurple + '20', borderColor: Colors.accentPurple },
  txt:      { fontSize: Typography.sizeSM, color: Colors.textSecondary },
  txtOn:    { color: Colors.accentPurple, fontWeight: Typography.weightSemiBold },
  badge:    { backgroundColor: Colors.surfaceElevated, borderRadius: Radius.full, paddingHorizontal: 6, paddingVertical: 1 },
  badgeOn:  { backgroundColor: Colors.accentPurple + '30' },
  badgeTxt: { fontSize: Typography.sizeXS, color: Colors.textMuted },
  badgeTxtOn:{ color: Colors.accentPurple, fontWeight: Typography.weightBold },
});

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.xl, paddingBottom: Layout.tabBarClearance + Spacing.xl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  title:  { fontSize: 28, fontWeight: Typography.weightBold, color: Colors.textPrimary, marginBottom: Spacing.xl },

  // XP hero card
  xpCard:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg, padding: Spacing.xl, borderRadius: Radius.xl, marginBottom: Spacing.xl, borderWidth: 1, borderColor: Colors.border },
  xpCenter:    { alignItems: 'center' },
  xpLvlNum:   { fontSize: Typography.sizeLG, fontWeight: Typography.weightBold, color: Colors.accentPurple },
  xpLvlWord:  { fontSize: Typography.sizeXS, color: Colors.textMuted },
  xpInfo:      { flex: 1, gap: 4 },
  xpLevelName: { fontSize: Typography.sizeMD, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  xpPoints:    { fontSize: Typography.sizeSM, color: Colors.accentPurple },
  xpBarRow:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  xpBarBg:     { flex: 1, height: 5, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden' },
  xpBarFill:   { height: 5, backgroundColor: Colors.accentPurple, borderRadius: 3 },
  xpBarPct:    { fontSize: Typography.sizeXS, color: Colors.textMuted, minWidth: 30 },
  xpEarned:    { fontSize: Typography.sizeXS, color: Colors.textSecondary },

  // Category filter
  filters: { flexDirection: 'row', gap: Spacing.sm, paddingVertical: Spacing.xs },

  // Grid
  grid:       { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  cell:       { width: '48%', backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.md, alignItems: 'center', gap: Spacing.xs, borderWidth: 1, borderColor: Colors.border },
  cellLocked: { opacity: 0.7 },
  badgeBox:   { width: 58, height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, position: 'relative' },
  badgeStar:  { fontSize: 30 },
  tierDot:    { width: 10, height: 10, borderRadius: 5, position: 'absolute', bottom: -3, right: -3, borderWidth: 1.5, borderColor: Colors.bg },
  achName:    { fontSize: Typography.sizeSM, fontWeight: Typography.weightSemiBold, color: Colors.textPrimary, textAlign: 'center', lineHeight: 16 },
  achNameLocked:{ color: Colors.textMuted, fontWeight: Typography.weightRegular },
  lockedProgress:{ width: '100%', height: 3, backgroundColor: Colors.border, borderRadius: 2, overflow: 'hidden' },
  lockedFill: { height: 3, borderRadius: 2 },
  xpTag:      { fontSize: Typography.sizeXS, fontWeight: Typography.weightBold },
  earnedBadge:{ borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2 },
});
