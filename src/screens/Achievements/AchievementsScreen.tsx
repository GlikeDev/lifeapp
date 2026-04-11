import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, ProgressBar } from '../../components/common';
import { Colors, Typography, Spacing, Radius } from '../../constants/tokens';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import type { Achievement, AchievementCategory, AchievementTier } from '../../types';

// ─── Constants ────────────────────────────────────────────────────────────────

const TIER_COLORS: Record<AchievementTier, string> = {
  bronze:   Colors.tierBronze,
  silver:   Colors.tierSilver,
  gold:     Colors.tierGold,
  platinum: Colors.tierPlatinum,
  legend:   Colors.tierLegend,
};

const TIER_LABELS: Record<AchievementTier, string> = {
  bronze: 'Бронза', silver: 'Серебро', gold: 'Золото', platinum: 'Платина', legend: 'Легенда',
};

const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  budget:    'Бюджет',
  savings:   'Экономия',
  food:      'Продукты',
  nutrition: 'Нутриция',
  activity:  'Активность',
  special:   'Особые',
};

const CATEGORY_ICONS: Record<AchievementCategory, string> = {
  budget: '📊', savings: '💰', food: '🛒', nutrition: '🥗', activity: '⚡', special: '✨',
};

const XP_PER_LEVEL = [0, 200, 500, 900, 1400, 2000, 2700, 3500, 4400, 5400, 6500, 7700, 9000, 10500, 12000];
const LEVEL_NAMES: Record<number, string> = {
  1: 'Новичок', 3: 'Следит', 5: 'Экономный', 8: 'Мастер', 10: 'Эксперт', 15: 'Легенда',
};

const ALL_CATEGORIES: AchievementCategory[] = ['budget', 'savings', 'food', 'nutrition', 'activity'];

// ─── Achievement Detail Modal ─────────────────────────────────────────────────

function AchievementModal({
  achievement,
  onClose,
  userXp,
  userLevel,
}: {
  achievement: Achievement;
  onClose: () => void;
  userXp: number;
  userLevel: number;
}) {
  const color = TIER_COLORS[achievement.tier];
  const xpForCurrent = XP_PER_LEVEL[userLevel - 1] ?? 0;
  const xpForNext = XP_PER_LEVEL[userLevel] ?? XP_PER_LEVEL[XP_PER_LEVEL.length - 1];
  const progress = (userXp - xpForCurrent) / (xpForNext - xpForCurrent);

  async function handleShare() {
    await Share.share({
      message: `Получил ачивку "${achievement.title}" в SaveSmart! +${achievement.xp_reward} XP 🎉`,
    });
  }

  return (
    <Modal transparent animationType="fade">
      <View style={modalStyles.overlay}>
        <View style={modalStyles.card}>
          {/* Badge */}
          <View style={[modalStyles.badge, { backgroundColor: color + '22', borderColor: color + '66' }]}>
            <Text style={[modalStyles.badgeTier, { color }]}>{TIER_LABELS[achievement.tier].toUpperCase()}</Text>
            <Text style={[modalStyles.badgeXp, { color }]}>{achievement.xp_reward}</Text>
          </View>

          <Text style={modalStyles.title}>{achievement.title}</Text>
          <Text style={modalStyles.desc}>{achievement.description}</Text>

          {achievement.earned_at && (
            <View style={[modalStyles.xpBadge, { backgroundColor: color + '22' }]}>
              <Text style={[modalStyles.xpText, { color }]}>+{achievement.xp_reward} XP</Text>
            </View>
          )}

          {/* Level progress */}
          <View style={modalStyles.levelSection}>
            <View style={modalStyles.levelHeader}>
              <Text style={modalStyles.levelLabel}>Уровень {userLevel}</Text>
              <Text style={modalStyles.levelXp}>{userXp} / {xpForNext} XP</Text>
            </View>
            <ProgressBar progress={progress} color={Colors.accentPurple} height={8} />
            <Text style={modalStyles.levelNext}>до уровня {userLevel + 1}: {xpForNext - userXp} XP</Text>
          </View>

          {/* Level road */}
          <View style={modalStyles.road}>
            {[1, 3, 5, 8, 10, 15].map((lvl) => {
              const reached = userLevel >= lvl;
              return (
                <View key={lvl} style={modalStyles.roadStep}>
                  <View style={[modalStyles.roadDot, reached && { backgroundColor: Colors.accentPurple }]}>
                    <Text style={[modalStyles.roadNum, reached && { color: Colors.textPrimary }]}>{lvl}</Text>
                  </View>
                  {LEVEL_NAMES[lvl] && (
                    <Text style={[modalStyles.roadName, reached && { color: Colors.textPrimary }]} numberOfLines={1}>
                      {LEVEL_NAMES[lvl]}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>

          <View style={modalStyles.buttons}>
            <TouchableOpacity style={modalStyles.shareBtn} onPress={handleShare}>
              <Text style={modalStyles.shareBtnText}>Поделиться ачивкой</Text>
            </TouchableOpacity>
            <TouchableOpacity style={modalStyles.closeBtn} onPress={onClose}>
              <Text style={modalStyles.closeBtnText}>Закрыть</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function AchievementsScreen() {
  const { user } = useAuthStore();
  const [allDefs, setAllDefs] = useState<Achievement[]>([]);
  const [earned, setEarned] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState<'all' | AchievementCategory>('all');
  const [selected, setSelected] = useState<Achievement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user) return;
      const [defsRes, earnedRes] = await Promise.all([
        supabase.from('achievement_definitions').select('*').order('category').order('xp_reward'),
        supabase.from('user_achievements')
          .select('achievement_id, earned_at')
          .eq('user_id', user.id),
      ]);

      if (defsRes.data) {
        setAllDefs(defsRes.data.map((d: any) => ({
          id: d.id, key: d.key, title: d.title, description: d.description,
          tier: d.tier, category: d.category, xp_reward: d.xp_reward,
        })));
      }
      if (earnedRes.data) {
        setEarned(new Set(earnedRes.data.map((r: any) => r.achievement_id as string)));
      }
      setLoading(false);
    }
    load();
  }, [user]);

  const filtered = allDefs.filter(
    (a) => activeCategory === 'all' || a.category === activeCategory
  );

  const byCategory = ALL_CATEGORIES.reduce<Record<string, Achievement[]>>((acc, cat) => {
    acc[cat] = filtered.filter((a) => a.category === cat);
    return acc;
  }, {});

  const earnedCount = allDefs.filter((a) => earned.has(a.id)).length;
  const level = user?.level ?? 1;
  const xp = user?.xp ?? 0;

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.center}><ActivityIndicator color={Colors.accentTeal} size="large" /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Мои ачивки</Text>

        {/* Progress summary */}
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryMain}>{earnedCount} из {allDefs.length} ачивок</Text>
          <Text style={styles.summaryLevel}>Уровень {level} — {user?.level ? (
            { 1:'Новичок',2:'Начинающий',3:'Следит',5:'Экономный',8:'Мастер',10:'Эксперт',15:'Легенда' }[level] ?? 'Профи'
          ) : 'Новичок'}</Text>
          <ProgressBar
            progress={earnedCount / Math.max(allDefs.length, 1)}
            color={Colors.accentPurple}
            height={6}
            style={{ marginTop: Spacing.sm }}
          />
        </Card>

        {/* Category filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <View style={styles.filters}>
            <FilterChip
              label="Все"
              active={activeCategory === 'all'}
              onPress={() => setActiveCategory('all')}
            />
            {ALL_CATEGORIES.map((cat) => (
              <FilterChip
                key={cat}
                label={`${CATEGORY_ICONS[cat]} ${CATEGORY_LABELS[cat]}`}
                active={activeCategory === cat}
                onPress={() => setActiveCategory(cat)}
              />
            ))}
          </View>
        </ScrollView>

        {/* Achievements by category */}
        {(activeCategory === 'all' ? ALL_CATEGORIES : [activeCategory]).map((cat) => {
          const items = byCategory[cat] ?? [];
          if (items.length === 0) return null;
          return (
            <View key={cat} style={styles.categorySection}>
              <Text style={styles.categoryTitle}>
                {CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat]}
              </Text>
              {items.map((a) => {
                const isEarned = earned.has(a.id);
                const color = TIER_COLORS[a.tier];
                return (
                  <TouchableOpacity
                    key={a.id}
                    onPress={() => setSelected({ ...a, earned_at: isEarned ? 'earned' : undefined })}
                  >
                    <Card style={[styles.achCard, !isEarned && styles.achCardLocked]}>
                      <View style={styles.achRow}>
                        <View style={[
                          styles.achBadge,
                          { backgroundColor: isEarned ? color + '33' : Colors.surfaceElevated },
                          { borderColor: isEarned ? color + '66' : Colors.border },
                        ]}>
                          <Text style={[styles.achStar, { opacity: isEarned ? 1 : 0.3 }]}>★</Text>
                        </View>
                        <View style={styles.achInfo}>
                          <Text style={[styles.achTitle, !isEarned && styles.achTitleLocked]}>
                            {isEarned ? a.title : '???'}
                          </Text>
                          <Text style={styles.achDesc} numberOfLines={1}>
                            {isEarned ? a.description : 'Не разблокировано'}
                          </Text>
                        </View>
                        <View style={[styles.xpTag, { backgroundColor: color + '22' }]}>
                          <Text style={[styles.xpTagText, { color: isEarned ? color : Colors.textMuted }]}>
                            {a.xp_reward} XP
                          </Text>
                        </View>
                      </View>
                    </Card>
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        })}
      </ScrollView>

      {selected && (
        <AchievementModal
          achievement={selected}
          onClose={() => setSelected(null)}
          userXp={xp}
          userLevel={level}
        />
      )}
    </SafeAreaView>
  );
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.filterChip, active && styles.filterChipActive]}
      onPress={onPress}
    >
      <Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.lg, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  title: { fontSize: Typography.sizeXL, fontWeight: Typography.weightBold, color: Colors.textPrimary, marginBottom: Spacing.md },

  summaryCard: { marginBottom: Spacing.md },
  summaryMain: { fontSize: Typography.sizeMD, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  summaryLevel: { fontSize: Typography.sizeSM, color: Colors.accentPurple, marginTop: 2 },

  filterScroll: { marginBottom: Spacing.md },
  filters: { flexDirection: 'row', gap: Spacing.sm, paddingVertical: Spacing.xs },
  filterChip: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    borderRadius: Radius.full, backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
  },
  filterChipActive: { backgroundColor: Colors.accentPurple + '22', borderColor: Colors.accentPurple },
  filterText: { fontSize: Typography.sizeSM, color: Colors.textSecondary },
  filterTextActive: { color: Colors.accentPurple, fontWeight: Typography.weightSemiBold },

  categorySection: { marginBottom: Spacing.lg },
  categoryTitle: { fontSize: Typography.sizeMD, fontWeight: Typography.weightBold, color: Colors.textPrimary, marginBottom: Spacing.sm },

  achCard: { marginBottom: Spacing.sm, padding: Spacing.md },
  achCardLocked: { opacity: 0.6 },
  achRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  achBadge: {
    width: 44, height: 44, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  achStar: { fontSize: 22, color: Colors.warning },
  achInfo: { flex: 1 },
  achTitle: { fontSize: Typography.sizeMD, fontWeight: Typography.weightSemiBold, color: Colors.textPrimary },
  achTitleLocked: { color: Colors.textMuted },
  achDesc: { fontSize: Typography.sizeXS, color: Colors.textSecondary, marginTop: 2 },
  xpTag: { borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  xpTagText: { fontSize: Typography.sizeXS, fontWeight: Typography.weightBold },
});

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.xl, width: '100%', alignItems: 'center' },

  badge: {
    width: 80, height: 80, borderRadius: Radius.lg,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, marginBottom: Spacing.md,
  },
  badgeTier: { fontSize: Typography.sizeXS, fontWeight: Typography.weightBold },
  badgeXp: { fontSize: Typography.sizeXL, fontWeight: Typography.weightBold },

  title: { fontSize: Typography.sizeLG, fontWeight: Typography.weightBold, color: Colors.textPrimary, textAlign: 'center' },
  desc: { fontSize: Typography.sizeSM, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.xs, marginBottom: Spacing.md },

  xpBadge: { borderRadius: Radius.full, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.xs, marginBottom: Spacing.lg },
  xpText: { fontSize: Typography.sizeMD, fontWeight: Typography.weightBold },

  levelSection: { width: '100%', marginBottom: Spacing.lg },
  levelHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xs },
  levelLabel: { fontSize: Typography.sizeSM, fontWeight: Typography.weightSemiBold, color: Colors.textPrimary },
  levelXp: { fontSize: Typography.sizeSM, color: Colors.textSecondary },
  levelNext: { fontSize: Typography.sizeXS, color: Colors.textMuted, marginTop: Spacing.xs },

  road: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: Spacing.xl },
  roadStep: { alignItems: 'center', gap: 4, flex: 1 },
  roadDot: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  roadNum: { fontSize: Typography.sizeXS, fontWeight: Typography.weightBold, color: Colors.textMuted },
  roadName: { fontSize: 8, color: Colors.textMuted, textAlign: 'center' },

  buttons: { width: '100%', gap: Spacing.sm },
  shareBtn: {
    backgroundColor: Colors.accentTeal,
    borderRadius: Radius.full, paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  shareBtnText: { color: Colors.bg, fontWeight: Typography.weightBold },
  closeBtn: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.full, paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  closeBtnText: { color: Colors.textSecondary, fontWeight: Typography.weightSemiBold },
});
