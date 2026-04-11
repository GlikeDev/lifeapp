import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, ProgressBar } from '../../components/common';
import { Colors, Typography, Spacing, Radius } from '../../constants/tokens';
import { useBudgetStore } from '../../store/useBudgetStore';
import { useAuthStore } from '../../store/useAuthStore';
import { formatCurrency, monthsLeft } from '../../utils/format';
import { supabase } from '../../lib/supabase';
import type { Transaction, Goal } from '../../types';

// Category display config
const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  food:      { label: 'Еда',        color: Colors.categoryFood },
  transport: { label: 'Транспорт',  color: Colors.categoryTransport },
  home:      { label: 'Дом',        color: Colors.categoryHome },
  health:    { label: 'Здоровье',   color: Colors.accentTeal },
  other:     { label: 'Прочее',     color: Colors.categoryOther },
};

export function DashboardScreen() {
  const { user } = useAuthStore();
  const {
    transactions, goals, monthlyBudget,
    setTransactions, setGoals, setMonthlyBudget,
    getTotalSpent, getRemaining, getSpentByCategory,
  } = useBudgetStore();

  const [refreshing, setRefreshing] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);

  const totalSpent = getTotalSpent();
  const remaining = getRemaining();
  const spentPct = monthlyBudget > 0 ? totalSpent / monthlyBudget : 0;
  const byCategory = getSpentByCategory();
  const activeGoal = goals[0] ?? null;

  async function loadData() {
    if (!user) return;

    // Current month range
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);

    const [txRes, goalsRes, profileRes] = await Promise.all([
      supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', from)
        .lte('date', to)
        .order('date', { ascending: false }),
      supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true }),
      supabase
        .from('profiles')
        .select('monthly_budget')
        .eq('id', user.id)
        .single(),
    ]);

    if (txRes.data) setTransactions(txRes.data as Transaction[]);
    if (goalsRes.data) setGoals(goalsRes.data as Goal[]);
    if (profileRes.data) setMonthlyBudget(profileRes.data.monthly_budget);
  }

  useEffect(() => { loadData(); }, [user]);

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  // Month name in Russian
  const monthName = new Date().toLocaleString('ru-RU', { month: 'long', year: 'numeric' });
  const dayOfMonth = new Date().getDate();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accentTeal} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Привет, {user?.full_name?.split(' ')[0] ?? 'пользователь'}</Text>
          <Text style={styles.subtitle}>{monthName} | {dayOfMonth} дней позади</Text>
        </View>

        {/* Balance Card */}
        <LinearGradient
          colors={[Colors.accentPurple, '#4B3FC7']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.balanceCard}
        >
          <Text style={styles.balanceLabel}>Доступный бюджет</Text>
          <Text style={styles.balanceAmount}>{formatCurrency(monthlyBudget - totalSpent)}</Text>
          <Text style={styles.balanceSub}>
            из {formatCurrency(monthlyBudget)} | {Math.round(spentPct * 100)}% потрачено
          </Text>
          <ProgressBar
            progress={spentPct}
            color={spentPct > 0.85 ? Colors.danger : Colors.success}
            height={4}
            style={styles.balanceBar}
          />
        </LinearGradient>

        {/* Quick Metrics */}
        <View style={styles.metricsRow}>
          <MetricCard label="Потрачено" value={formatCurrency(totalSpent)} color={Colors.danger} />
          <MetricCard label="Остаток" value={formatCurrency(Math.max(remaining, 0))} color={Colors.success} />
          <MetricCard
            label="Отложено"
            value={formatCurrency(goals.reduce((s, g) => s + (g.monthly_contribution ?? 0), 0))}
            color={Colors.accentTeal}
          />
        </View>

        {/* Category Bars */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Расходы по категориям</Text>
          {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => {
            const amount = byCategory[key] ?? 0;
            const pct = totalSpent > 0 ? amount / totalSpent : 0;
            if (amount === 0) return null;
            return (
              <View key={key} style={styles.categoryRow}>
                <Text style={styles.categoryLabel}>{cfg.label}</Text>
                <ProgressBar progress={pct} color={cfg.color} height={8} style={styles.categoryBar} />
                <Text style={styles.categoryPct}>{Math.round(pct * 100)}%</Text>
              </View>
            );
          })}
          {totalSpent === 0 && (
            <Text style={styles.empty}>Транзакций пока нет</Text>
          )}
        </Card>

        {/* Active Goal */}
        {activeGoal && (
          <Card style={[styles.section]}>
            <View style={styles.goalHeader}>
              <Text style={styles.goalEmoji}>{activeGoal.emoji}</Text>
              <Text style={styles.goalTitle}>{activeGoal.title}</Text>
              <Text style={styles.goalMonths}>
                {monthsLeft(activeGoal.current_amount, activeGoal.target_amount, activeGoal.monthly_contribution)} мес.
              </Text>
            </View>
            <ProgressBar
              progress={activeGoal.current_amount / activeGoal.target_amount}
              color={Colors.success}
              height={8}
              style={styles.goalBar}
            />
            <Text style={styles.goalSub}>
              {formatCurrency(activeGoal.current_amount)} из {formatCurrency(activeGoal.target_amount)} |{' '}
              +{formatCurrency(activeGoal.monthly_contribution)}/мес
            </Text>
          </Card>
        )}

        {/* AI Insight */}
        {aiInsight && (
          <Card style={[styles.section, styles.aiCard]}>
            <Text style={styles.aiLabel}>AI Инсайт</Text>
            <Text style={styles.aiText}>{aiInsight}</Text>
          </Card>
        )}

        {/* Placeholder AI insight (static until Claude API connected) */}
        {!aiInsight && totalSpent > 0 && (
          <Card style={[styles.section, styles.aiCard]}>
            <Text style={styles.aiLabel}>AI Инсайт</Text>
            <Text style={styles.aiText}>
              За этот месяц потрачено {Math.round(spentPct * 100)}% бюджета.
              {spentPct > 0.8
                ? ' Осторожно — бюджет почти исчерпан.'
                : ' Вы в рамках бюджета. Продолжайте!'}
            </Text>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function MetricCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <Card style={styles.metricCard}>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },

  header: { marginBottom: Spacing.lg },
  greeting: { fontSize: Typography.sizeLG, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  subtitle: { fontSize: Typography.sizeSM, color: Colors.textSecondary, marginTop: 2 },

  balanceCard: {
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.md,
  },
  balanceLabel: { fontSize: Typography.sizeSM, color: 'rgba(255,255,255,0.7)', marginBottom: Spacing.xs },
  balanceAmount: { fontSize: 36, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  balanceSub: { fontSize: Typography.sizeSM, color: 'rgba(255,255,255,0.6)', marginTop: 4, marginBottom: Spacing.md },
  balanceBar: { marginTop: Spacing.xs },

  metricsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  metricCard: { flex: 1, padding: Spacing.md, alignItems: 'center' },
  metricValue: { fontSize: Typography.sizeMD, fontWeight: Typography.weightBold },
  metricLabel: { fontSize: Typography.sizeXS, color: Colors.textSecondary, marginTop: 2 },

  section: { marginBottom: Spacing.md },
  sectionTitle: { fontSize: Typography.sizeMD, fontWeight: Typography.weightSemiBold, color: Colors.textPrimary, marginBottom: Spacing.md },

  categoryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  categoryLabel: { width: 80, fontSize: Typography.sizeSM, color: Colors.textSecondary },
  categoryBar: { flex: 1 },
  categoryPct: { width: 36, textAlign: 'right', fontSize: Typography.sizeSM, color: Colors.textSecondary },

  empty: { color: Colors.textMuted, fontSize: Typography.sizeSM, textAlign: 'center', paddingVertical: Spacing.sm },

  goalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  goalEmoji: { fontSize: 20, marginRight: Spacing.sm },
  goalTitle: { flex: 1, fontSize: Typography.sizeMD, fontWeight: Typography.weightSemiBold, color: Colors.textPrimary },
  goalMonths: { fontSize: Typography.sizeSM, color: Colors.accentTeal, fontWeight: Typography.weightSemiBold },
  goalBar: { marginBottom: Spacing.sm },
  goalSub: { fontSize: Typography.sizeXS, color: Colors.textSecondary },

  aiCard: { borderColor: Colors.accentPurple + '66' },
  aiLabel: { fontSize: Typography.sizeSM, fontWeight: Typography.weightBold, color: Colors.accentPurple, marginBottom: Spacing.xs },
  aiText: { fontSize: Typography.sizeSM, color: Colors.textSecondary, lineHeight: 20 },
});
