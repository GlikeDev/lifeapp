import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card, ProgressBar } from '../../components/common';
import { Colors, Typography, Spacing, Radius } from '../../constants/tokens';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { useBudgetStore } from '../../store/useBudgetStore';
import type { Achievement, MoreStackParamList } from '../../types';

type Nav = NativeStackNavigationProp<MoreStackParamList>;

// XP needed per level
const XP_PER_LEVEL = [0, 200, 500, 900, 1400, 2000, 2700, 3500, 4400, 5400, 6500, 7700, 9000, 10500, 12000];

const LEVEL_NAMES: Record<number, string> = {
  1: 'Новичок', 2: 'Начинающий', 3: 'Следит', 4: 'Внимательный',
  5: 'Экономный', 6: 'Бережливый', 7: 'Опытный', 8: 'Финансовый мастер',
  9: 'Профи', 10: 'Эксперт', 11: 'Гуру', 12: 'Наставник',
  13: 'Легенда', 14: 'Элита', 15: 'Легенда SaveSmart',
};

const TIER_COLORS: Record<string, string> = {
  bronze: Colors.tierBronze,
  silver: Colors.tierSilver,
  gold: Colors.tierGold,
  platinum: Colors.tierPlatinum,
  legend: Colors.tierLegend,
};

export function ProfileScreen() {
  const nav = useNavigation<Nav>();
  const { user, setUser } = useAuthStore();
  const { transactions, goals } = useBudgetStore();

  const [recentAchievements, setRecentAchievements] = useState<Achievement[]>([]);
  const [totalAchievements, setTotalAchievements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notificationsOn, setNotificationsOn] = useState(true);

  const level = user?.level ?? 1;
  const xp = user?.xp ?? 0;
  const xpForCurrent = XP_PER_LEVEL[level - 1] ?? 0;
  const xpForNext = XP_PER_LEVEL[level] ?? XP_PER_LEVEL[XP_PER_LEVEL.length - 1];
  const xpProgress = (xp - xpForCurrent) / (xpForNext - xpForCurrent);
  const levelName = LEVEL_NAMES[level] ?? 'Легенда SaveSmart';

  const totalSaved = goals.reduce((s, g) => s + g.current_amount, 0);
  const txCount = transactions.length;
  const goalCount = goals.length;

  // Activity streak dots (last 14 days)
  const [streak, setStreak] = useState<boolean[]>(Array(14).fill(false));

  useEffect(() => {
    async function load() {
      if (!user) return;

      const [achRes, txDatesRes] = await Promise.all([
        supabase
          .from('user_achievements')
          .select('earned_at, achievement_definitions(key, title, tier, xp_reward)')
          .eq('user_id', user.id)
          .order('earned_at', { ascending: false })
          .limit(3),
        supabase
          .from('transactions')
          .select('date')
          .eq('user_id', user.id)
          .gte('date', new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10)),
      ]);

      if (achRes.data) {
        const mapped = achRes.data.map((r: any) => ({
          id: r.earned_at,
          key: r.achievement_definitions?.key ?? '',
          title: r.achievement_definitions?.title ?? '',
          description: '',
          tier: r.achievement_definitions?.tier ?? 'bronze',
          category: 'budget' as const,
          xp_reward: r.achievement_definitions?.xp_reward ?? 0,
          earned_at: r.earned_at,
        }));
        setRecentAchievements(mapped);
      }

      // Count total achievements
      const { count } = await supabase
        .from('user_achievements')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      setTotalAchievements(count ?? 0);

      // Build streak dots
      if (txDatesRes.data) {
        const activeDates = new Set(txDatesRes.data.map((t: any) => t.date as string));
        const dots = Array.from({ length: 14 }, (_, i) => {
          const d = new Date(Date.now() - (13 - i) * 86400000);
          return activeDates.has(d.toISOString().slice(0, 10));
        });
        setStreak(dots);
      }

      setLoading(false);
    }
    load();
  }, [user]);

  async function handleSignOut() {
    Alert.alert('Выйти из аккаунта?', '', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Выйти', style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          setUser(null);
        },
      },
    ]);
  }

  const initials = user?.full_name
    ?.split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() ?? '??';

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

        {/* Avatar + Name */}
        <View style={styles.avatarArea}>
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
            {user?.is_pro && (
              <View style={styles.proBadge}><Text style={styles.proText}>PRO</Text></View>
            )}
          </View>
          <Text style={styles.name}>{user?.full_name ?? 'Пользователь'}</Text>
          <Text style={styles.joinDate}>В приложении с {new Date(user?.created_at ?? '').toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}</Text>
        </View>

        {/* Level bar */}
        <Card style={styles.levelCard}>
          <View style={styles.levelHeader}>
            <Text style={styles.levelText}>Уровень {level} — {levelName}</Text>
            <Text style={styles.xpText}>{xp} XP</Text>
          </View>
          <ProgressBar progress={xpProgress} color={Colors.accentPurple} height={8} />
          <Text style={styles.xpNext}>до уровня {level + 1}: {xpForNext - xp} XP</Text>
        </Card>

        {/* Key metrics */}
        <View style={styles.metricsGrid}>
          <MetricCard value={`€${Math.round(totalSaved)}`} label="Сэкономлено" color={Colors.success} />
          <MetricCard value={String(txCount)} label="Транзакций" color={Colors.accentTeal} />
          <MetricCard value={String(goalCount)} label="Цели" color={Colors.accentPurple} />
          <MetricCard value={String(totalAchievements)} label="Ачивок" color={Colors.warning} />
        </View>

        {/* Activity streak */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>
            Серия активности{' '}
            <Text style={{ color: Colors.warning }}>
              {streak.filter(Boolean).length} дней подряд
            </Text>
          </Text>
          <View style={styles.streakDots}>
            {streak.map((active, i) => (
              <View
                key={i}
                style={[styles.dot, { backgroundColor: active ? Colors.warning : Colors.border }]}
              />
            ))}
          </View>
        </Card>

        {/* Recent achievements */}
        {recentAchievements.length > 0 && (
          <Card style={styles.section}>
            <View style={styles.achHeader}>
              <Text style={styles.sectionTitle}>Последние ачивки</Text>
              <TouchableOpacity onPress={() => nav.navigate('Achievements')}>
                <Text style={styles.seeAll}>Все →</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.achRow}>
              {recentAchievements.map((a) => (
                <View key={a.id} style={styles.achItem}>
                  <View style={[styles.achBadge, { backgroundColor: TIER_COLORS[a.tier] + '33', borderColor: TIER_COLORS[a.tier] + '66' }]}>
                    <Text style={styles.achStar}>★</Text>
                  </View>
                  <Text style={styles.achTitle} numberOfLines={2}>{a.title}</Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Settings */}
        <Card style={styles.section}>
          <SettingRow
            label="Уведомления"
            right={
              <Switch
                value={notificationsOn}
                onValueChange={setNotificationsOn}
                trackColor={{ false: Colors.border, true: Colors.accentTeal }}
                thumbColor={Colors.textPrimary}
              />
            }
          />
          <SettingRow label="Валюта" right={<Text style={styles.settingValue}>EUR — Euro</Text>} />
          <SettingRow
            label="Подписка"
            right={
              <Text style={[styles.settingValue, { color: user?.is_pro ? Colors.accentPurple : Colors.textMuted }]}>
                {user?.is_pro ? 'Pro активна' : 'Бесплатный'}
              </Text>
            }
          />
          <SettingRow label="Экспорт данных" right={<Text style={styles.settingValue}>CSV / PDF</Text>} />
        </Card>

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Выйти из аккаунта</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

function MetricCard({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <Card style={styles.metricCard}>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </Card>
  );
}

function SettingRow({ label, right }: { label: string; right: React.ReactNode }) {
  return (
    <View style={styles.settingRow}>
      <Text style={styles.settingLabel}>{label}</Text>
      <View style={styles.settingRight}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.lg, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  avatarArea: { alignItems: 'center', marginBottom: Spacing.xl },
  avatarRing: { position: 'relative', marginBottom: Spacing.md },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.accentPurple,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: Colors.accentTeal,
  },
  avatarInitials: { fontSize: Typography.sizeXL, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  proBadge: {
    position: 'absolute', bottom: -4, right: -4,
    backgroundColor: Colors.warning,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm, paddingVertical: 2,
  },
  proText: { fontSize: Typography.sizeXS, fontWeight: Typography.weightBold, color: Colors.bg },
  name: { fontSize: Typography.sizeLG, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  joinDate: { fontSize: Typography.sizeSM, color: Colors.textSecondary, marginTop: 4 },

  levelCard: { marginBottom: Spacing.md },
  levelHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  levelText: { fontSize: Typography.sizeSM, fontWeight: Typography.weightSemiBold, color: Colors.accentPurple },
  xpText: { fontSize: Typography.sizeSM, color: Colors.textSecondary },
  xpNext: { fontSize: Typography.sizeXS, color: Colors.textMuted, marginTop: Spacing.xs },

  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
  metricCard: { width: '47%', padding: Spacing.md, alignItems: 'center' },
  metricValue: { fontSize: Typography.sizeLG, fontWeight: Typography.weightBold },
  metricLabel: { fontSize: Typography.sizeXS, color: Colors.textSecondary, marginTop: 2 },

  section: { marginBottom: Spacing.md },
  sectionTitle: { fontSize: Typography.sizeMD, fontWeight: Typography.weightSemiBold, color: Colors.textPrimary, marginBottom: Spacing.md },

  streakDots: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  dot: { width: 14, height: 14, borderRadius: 7 },

  achHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  seeAll: { color: Colors.accentTeal, fontSize: Typography.sizeSM },
  achRow: { flexDirection: 'row', gap: Spacing.md },
  achItem: { flex: 1, alignItems: 'center', gap: Spacing.xs },
  achBadge: {
    width: 48, height: 48, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  achStar: { fontSize: 22, color: Colors.warning },
  achTitle: { fontSize: Typography.sizeXS, color: Colors.textSecondary, textAlign: 'center' },

  settingRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  settingLabel: { fontSize: Typography.sizeMD, color: Colors.textPrimary },
  settingRight: { flexDirection: 'row', alignItems: 'center' },
  settingValue: { fontSize: Typography.sizeSM, color: Colors.textSecondary },

  signOutBtn: {
    marginTop: Spacing.md,
    backgroundColor: Colors.danger + '22',
    borderRadius: Radius.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.danger + '55',
  },
  signOutText: { color: Colors.danger, fontWeight: Typography.weightSemiBold },
});
