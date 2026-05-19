import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Animated, ActivityIndicator, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Circle, Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, Radius, Layout, Glass } from '../../constants/tokens';
import { useTranslation } from '../../i18n';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../lib/supabase';
import type { Achievement, AchievementTier, MoreStackParamList } from '../../types';

type Nav = NativeStackNavigationProp<MoreStackParamList>;

// ─── XP / Level helpers ───────────────────────────────────────────────────────

const XP_TABLE = [0, 200, 500, 900, 1400, 2000, 2700, 3500, 4400, 5400, 6500];
const LEVEL_KEYS: Record<number, string> = {
  1:'more.level.1', 2:'more.level.2', 3:'more.level.3', 4:'more.level.4', 5:'more.level.5',
  6:'more.level.6', 7:'more.level.7', 8:'more.level.8', 9:'more.level.9', 10:'more.level.10',
};
function levelNameKey(l: number) { return LEVEL_KEYS[l] ?? 'more.level.n'; }
function levelNameVars(l: number) { return LEVEL_KEYS[l] ? undefined : { n: l }; }
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
  progress, size, color, trackColor = Glass.border, strokeWidth = 5, children,
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

// ─── Main Component ───────────────────────────────────────────────────────────

export function MoreMenuScreen() {
  const nav = useNavigation<Nav>();
  const { user } = useAuthStore();
  const { t } = useTranslation();

  // Achievements state
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [earnedIds, setEarnedIds] = useState<Set<string>>(new Set());
  const [achTotal, setAchTotal] = useState(0);
  const [achLoading, setAchLoading] = useState(true);
  const [selectedAch, setSelectedAch] = useState<Achievement | null>(null);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const achScaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 380, useNativeDriver: true }).start();
    loadAchievements();
  }, [user]);

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
                <Text style={s.heroName} numberOfLines={1}>{user?.full_name ?? t('more.profile.user')}</Text>
                <View style={s.levelRow}>
                  <View style={s.levelPill}>
                    <Text style={s.levelPillTxt}>{t('more.level.n', { n: level })}</Text>
                  </View>
                  <Text style={s.levelName}>{t(levelNameKey(level), levelNameVars(level))}</Text>
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
                ACHIEVEMENTS SECTION
          ═══════════════════════════════════════════════════════════ */}
          <View style={[s.sectionHeader, { marginTop: Spacing.xl }]}>
            <Text style={s.sectionTitle}>{t('more.ach.title')}</Text>
            <TouchableOpacity style={s.sectionAddBtn} onPress={() => nav.navigate('Achievements')}>
              <Text style={[s.sectionAddTxt, { color: Colors.accentPurple }]}>{t('more.ach.all')}</Text>
            </TouchableOpacity>
          </View>

          {/* XP level card */}
          <LinearGradient colors={['#2A1F3E','#1A1228']} style={s.xpCard} start={{x:0,y:0}} end={{x:1,y:1}}>
            <ArcRing progress={xpProg} size={68} color={Colors.accentPurple} strokeWidth={5}>
              <Text style={s.xpLevelNum}>{level}</Text>
            </ArcRing>
            <View style={s.xpCardInfo}>
              <Text style={s.xpCardLevel}>{t(levelNameKey(level), levelNameVars(level))}</Text>
              <Text style={s.xpCardXp}>{xp} / {xpTo} XP</Text>
              <Text style={s.xpCardEarned}>{t('more.ach.earnedOf', { count: earnedIds.size, total: achTotal })}</Text>
            </View>
            <View style={s.xpCardStars}>
              {[...Array(5)].map((_, i) => (
                <IcoStar key={i} c={i < Math.min(5, Math.floor(level / 2)) ? Colors.warning : Glass.border} n={14} />
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
                      { backgroundColor: isEarned ? color + '22' : Colors.surfaceElevated, borderColor: isEarned ? color + '55' : Glass.border },
                    ]}>
                      <Text style={[s.achBadgeStar, { color: isEarned ? color : Colors.textMuted }]}>★</Text>
                      <View style={[s.achTierDot, { backgroundColor: isEarned ? color : Glass.border }]} />
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
            <Text style={s.sectionTitle}>{t('more.finance.title')}</Text>
          </View>
          <View style={s.financeRow}>
            <TouchableOpacity style={s.financeCard} onPress={() => nav.navigate('Subscriptions')} activeOpacity={0.82}>
              <LinearGradient colors={['#1A2B3C','#0F1B26']} style={s.financeCardGrad} start={{x:0,y:0}} end={{x:1,y:1}}>
                <Text style={s.financeEmoji}>💳</Text>
                <Text style={s.financeCardTitle}>{t('more.finance.subs')}</Text>
                <Text style={s.financeCardSub}>{t('more.finance.subsSub')}</Text>
                <IcoRight c={Colors.textMuted} n={14} />
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={s.financeCard} onPress={() => nav.navigate('Debts')} activeOpacity={0.82}>
              <LinearGradient colors={['#1F2A1A','#141E0F']} style={s.financeCardGrad} start={{x:0,y:0}} end={{x:1,y:1}}>
                <Text style={s.financeEmoji}>🤝</Text>
                <Text style={s.financeCardTitle}>{t('more.finance.debts')}</Text>
                <Text style={s.financeCardSub}>{t('more.finance.debtsSub')}</Text>
                <IcoRight c={Colors.textMuted} n={14} />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Profile row */}
          <TouchableOpacity style={s.profileRow} onPress={() => nav.navigate('Profile')} activeOpacity={0.8}>
            <View style={s.profileIconWrap}><IcoUser c={Colors.textSecondary} n={18} /></View>
            <Text style={s.profileTxt}>{t('more.profile')}</Text>
            <IcoRight c={Colors.textMuted} n={16} />
          </TouchableOpacity>

        </Animated.View>
      </ScrollView>

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
                      <Text style={s.achModalTitle}>{isEarned ? selectedAch.title : t('more.ach.lockedTitle')}</Text>
                      <Text style={s.achModalDesc}>{isEarned ? selectedAch.description : t('more.ach.lockedDesc')}</Text>
                      {!isEarned && (
                        <View style={s.achModalProgress}>
                          <Text style={s.achModalProgressLbl}>{t('more.ach.progress')}</Text>
                          <View style={s.achModalProgressBar}>
                            <View style={[s.achModalProgressFill, { width: '35%', backgroundColor: color }]} />
                          </View>
                          <Text style={s.achModalProgressPct}>35%</Text>
                        </View>
                      )}
                      <TouchableOpacity style={[s.achModalBtn, { backgroundColor: isEarned ? Colors.accentTeal : Colors.surface }]} onPress={() => setSelectedAch(null)}>
                        <Text style={[s.achModalBtnTxt, { color: isEarned ? Colors.bg : Colors.textSecondary }]}>
                          {isEarned ? t('more.ach.earnedBtn') : t('more.ach.lockedBtn')}
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

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.xl, paddingBottom: Layout.tabBarClearance + Spacing.xl },

  // Profile hero
  heroCard:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg, borderRadius: Radius.xl, marginBottom: Spacing.xl, borderWidth: 1, borderColor: Glass.border },
  avatarCircle:  { width: 46, height: 46, borderRadius: 23, backgroundColor: Colors.accentPurple + '28', alignItems: 'center', justifyContent: 'center' },
  avatarInitials:{ fontSize: Typography.sizeSM, fontWeight: Typography.weightBold, color: Colors.accentPurple },
  heroInfo:      { flex: 1, gap: Spacing.xs },
  heroName:      { fontSize: Typography.sizeMD, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  levelRow:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  levelPill:     { backgroundColor: Colors.accentPurple + '30', borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  levelPillTxt:  { fontSize: Typography.sizeXS, color: Colors.accentPurple, fontWeight: Typography.weightBold },
  levelName:     { fontSize: Typography.sizeXS, color: Colors.textSecondary },
  xpBarRow:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  xpBarBg:       { flex: 1, height: 4, backgroundColor: Glass.border, borderRadius: 2, overflow: 'hidden' },
  xpBarFill:     { height: 4, backgroundColor: Colors.accentPurple, borderRadius: 2 },
  xpTxt:         { fontSize: Typography.sizeXS, color: Colors.textMuted, minWidth: 60 },

  // Section header
  sectionHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  sectionTitle:   { fontSize: Typography.sizeLG, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  sectionAddBtn:  { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.surface, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderWidth: 1, borderColor: Glass.border },
  sectionAddTxt:  { fontSize: Typography.sizeXS, fontWeight: Typography.weightSemiBold },

  // XP card
  xpCard:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg, borderRadius: Radius.xl, marginBottom: Spacing.md, borderWidth: 1, borderColor: Glass.border },
  xpLevelNum: { fontSize: Typography.sizeLG, fontWeight: Typography.weightBold, color: Colors.accentPurple },
  xpCardInfo: { flex: 1 },
  xpCardLevel:{ fontSize: Typography.sizeMD, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  xpCardXp:   { fontSize: Typography.sizeSM, color: Colors.accentPurple, marginTop: 2 },
  xpCardEarned:{ fontSize: Typography.sizeXS, color: Colors.textSecondary, marginTop: 2 },
  xpCardStars:{ flexDirection: 'row', gap: 2 },

  // Achievement grid
  achGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
  achCell:    { width: '48%', backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.md, borderWidth: 1, borderColor: Glass.border, alignItems: 'center', gap: 6 },
  achBadge:   { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, position: 'relative' },
  achBadgeStar:{ fontSize: 26 },
  achTierDot: { width: 8, height: 8, borderRadius: 4, position: 'absolute', bottom: -2, right: -2 },
  achName:    { fontSize: Typography.sizeXS, color: Colors.textPrimary, textAlign: 'center', fontWeight: Typography.weightSemiBold, lineHeight: 14 },
  achNameLocked:{ color: Colors.textMuted },
  achProgressBar:{ width: '100%', height: 3, backgroundColor: Glass.border, borderRadius: 2, overflow: 'hidden', marginTop: 2 },
  achProgressFill:{ height: 3, borderRadius: 2 },
  achXp:      { fontSize: Typography.sizeXS, fontWeight: Typography.weightBold },

  // Finance section
  financeRow:       { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  financeCard:      { flex: 1, borderRadius: Radius.xl, overflow: 'hidden', borderWidth: 1, borderColor: Glass.border },
  financeCardGrad:  { padding: Spacing.lg, gap: Spacing.xs, minHeight: 120 },
  financeEmoji:     { fontSize: 28, marginBottom: Spacing.xs },
  financeCardTitle: { fontSize: Typography.sizeMD, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  financeCardSub:   { fontSize: Typography.sizeXS, color: Colors.textSecondary, lineHeight: 14, flex: 1 },

  // Profile row
  profileRow:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.lg, borderWidth: 1, borderColor: Glass.border, marginTop: Spacing.xl },
  profileIconWrap: { width: 36, height: 36, borderRadius: Radius.md, backgroundColor: Colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  profileTxt:      { flex: 1, fontSize: Typography.sizeMD, color: Colors.textPrimary, fontWeight: Typography.weightSemiBold },

  // Bottom sheets
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet:         { backgroundColor: Colors.surfaceElevated, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: Spacing.xl, borderTopWidth: 1, borderColor: Glass.border },
  sheetHandle:   { width: 40, height: 4, borderRadius: 2, backgroundColor: Glass.border, alignSelf: 'center', marginBottom: Spacing.lg },
  sheetTitle:    { fontSize: Typography.sizeLG, fontWeight: Typography.weightBold, color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing.lg },
  sheetLabel:    { fontSize: Typography.sizeSM, color: Colors.textSecondary, marginBottom: Spacing.xs, marginTop: Spacing.md },
  sheetInput:    { backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, color: Colors.textPrimary, fontSize: Typography.sizeMD, borderWidth: 1, borderColor: Glass.border },
  sheetBtns:     { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.xl },
  sheetCancel:   { flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.full, paddingVertical: Spacing.md, alignItems: 'center' },
  sheetCancelTxt:{ color: Colors.textSecondary, fontWeight: Typography.weightSemiBold },
  sheetSave:     { flex: 2, borderRadius: Radius.full, paddingVertical: Spacing.md, alignItems: 'center' },
  sheetSaveTxt:  { color: Colors.bg, fontWeight: Typography.weightBold, fontSize: Typography.sizeMD },

  // Achievement modal
  achModalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  achModalCard:     { backgroundColor: Colors.surfaceElevated, borderRadius: Radius.xl, padding: Spacing.xl, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: Glass.border },
  achModalBadge:    { width: 88, height: 88, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 2, marginBottom: Spacing.lg },
  achModalStar:     { fontSize: 36 },
  achModalXp:       { fontSize: Typography.sizeXS, fontWeight: Typography.weightBold, marginTop: 2 },
  achModalTitle:    { fontSize: Typography.sizeLG, fontWeight: Typography.weightBold, color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing.xs },
  achModalDesc:     { fontSize: Typography.sizeSM, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: Spacing.lg },
  achModalProgress: { width: '100%', marginBottom: Spacing.lg },
  achModalProgressLbl:{ fontSize: Typography.sizeXS, color: Colors.textMuted, marginBottom: Spacing.xs },
  achModalProgressBar:{ height: 6, backgroundColor: Glass.border, borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  achModalProgressFill:{ height: 6, borderRadius: 3 },
  achModalProgressPct:{ fontSize: Typography.sizeXS, color: Colors.textSecondary },
  achModalBtn:      { width: '100%', borderRadius: Radius.full, paddingVertical: Spacing.md, alignItems: 'center' },
  achModalBtnTxt:   { fontSize: Typography.sizeMD, fontWeight: Typography.weightBold },
});
