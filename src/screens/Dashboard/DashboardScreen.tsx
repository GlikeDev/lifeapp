import React, { useEffect, useState, useRef, useCallback } from 'react';
import { CoachMark, TipStep } from '../../components/CoachMark';
import { useCoachMark } from '../../hooks/useCoachMark';

const DASHBOARD_TIPS: TipStep[] = [
  {
    icon: '📊',
    title: 'График расходов',
    body: 'Столбики показывают расходы за каждый день недели. Сегодня выделен бирюзовым. Нажмите на столбик, чтобы увидеть детали.',
  },
  {
    icon: '💱',
    title: 'Выбор валюты',
    body: 'Нажмите на значок валюты в правом верхнем углу, чтобы выбрать свою: € £ $ ₽ и ещё 60+ валют мира.',
  },
  {
    icon: '🎯',
    title: 'Карточки бюджета',
    body: 'Три карточки: сколько потрачено, сколько осталось и индекс здоровья бюджета от 0 до 100.',
  },
  {
    icon: '💡',
    title: 'Умные советы',
    body: 'В нижней части экрана каждый день новый совет по экономии — на основе именно ваших расходов.',
  },
];
import {
  View, Text, ScrollView, StyleSheet, RefreshControl,
  TouchableOpacity, Modal, FlatList, TextInput, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, G, Circle, Text as SvgText } from 'react-native-svg';
import { Card, ProgressBar } from '../../components/common';
import { Colors, Typography, Spacing, Radius, Layout } from '../../constants/tokens';
import { useBudgetStore } from '../../store/useBudgetStore';
import { useAuthStore } from '../../store/useAuthStore';
import { formatCurrency, monthsLeft } from '../../utils/format';
import { supabase } from '../../lib/supabase';
import type { Transaction, Goal } from '../../types';

// ─── Currencies ───────────────────────────────────────────────────────────────

const CURRENCIES = [
  { code: 'EUR', symbol: '€', name: 'Евро' },
  { code: 'USD', symbol: '$', name: 'Доллар США' },
  { code: 'GBP', symbol: '£', name: 'Британский фунт' },
  { code: 'RUB', symbol: '₽', name: 'Российский рубль' },
  { code: 'CHF', symbol: 'CHF', name: 'Швейцарский франк' },
  { code: 'JPY', symbol: '¥', name: 'Японская иена' },
  { code: 'CNY', symbol: '¥', name: 'Китайский юань' },
  { code: 'CAD', symbol: 'CA$', name: 'Канадский доллар' },
  { code: 'AUD', symbol: 'A$', name: 'Австралийский доллар' },
  { code: 'NZD', symbol: 'NZ$', name: 'Новозеландский доллар' },
  { code: 'HKD', symbol: 'HK$', name: 'Гонконгский доллар' },
  { code: 'SGD', symbol: 'S$', name: 'Сингапурский доллар' },
  { code: 'SEK', symbol: 'kr', name: 'Шведская крона' },
  { code: 'NOK', symbol: 'kr', name: 'Норвежская крона' },
  { code: 'DKK', symbol: 'kr', name: 'Датская крона' },
  { code: 'PLN', symbol: 'zł', name: 'Польский злотый' },
  { code: 'CZK', symbol: 'Kč', name: 'Чешская крона' },
  { code: 'HUF', symbol: 'Ft', name: 'Венгерский форинт' },
  { code: 'RON', symbol: 'lei', name: 'Румынский лей' },
  { code: 'BGN', symbol: 'лв', name: 'Болгарский лев' },
  { code: 'HRK', symbol: 'kn', name: 'Хорватская куна' },
  { code: 'RSD', symbol: 'дин.', name: 'Сербский динар' },
  { code: 'UAH', symbol: '₴', name: 'Украинская гривна' },
  { code: 'TRY', symbol: '₺', name: 'Турецкая лира' },
  { code: 'ILS', symbol: '₪', name: 'Израильский шекель' },
  { code: 'AED', symbol: 'د.إ', name: 'Дирхам ОАЭ' },
  { code: 'SAR', symbol: '﷼', name: 'Саудовский риял' },
  { code: 'QAR', symbol: 'ر.ق', name: 'Катарский риял' },
  { code: 'KWD', symbol: 'د.ك', name: 'Кувейтский динар' },
  { code: 'BHD', symbol: 'BD', name: 'Бахрейнский динар' },
  { code: 'OMR', symbol: 'ر.ع.', name: 'Оманский риал' },
  { code: 'JOD', symbol: 'JD', name: 'Иорданский динар' },
  { code: 'EGP', symbol: 'E£', name: 'Египетский фунт' },
  { code: 'MAD', symbol: 'MAD', name: 'Марокканский дирхам' },
  { code: 'ZAR', symbol: 'R', name: 'Южноафриканский рэнд' },
  { code: 'NGN', symbol: '₦', name: 'Нигерийская найра' },
  { code: 'KES', symbol: 'KSh', name: 'Кенийский шиллинг' },
  { code: 'GHS', symbol: 'GH₵', name: 'Ганский седи' },
  { code: 'MXN', symbol: 'MX$', name: 'Мексиканский песо' },
  { code: 'BRL', symbol: 'R$', name: 'Бразильский реал' },
  { code: 'ARS', symbol: '$', name: 'Аргентинский песо' },
  { code: 'CLP', symbol: 'CL$', name: 'Чилийский песо' },
  { code: 'COP', symbol: 'CO$', name: 'Колумбийский песо' },
  { code: 'PEN', symbol: 'S/.', name: 'Перуанский соль' },
  { code: 'INR', symbol: '₹', name: 'Индийская рупия' },
  { code: 'PKR', symbol: '₨', name: 'Пакистанская рупия' },
  { code: 'BDT', symbol: '৳', name: 'Бангладешская така' },
  { code: 'LKR', symbol: 'Rs', name: 'Шриланкийская рупия' },
  { code: 'NPR', symbol: 'रू', name: 'Непальская рупия' },
  { code: 'VND', symbol: '₫', name: 'Вьетнамский донг' },
  { code: 'THB', symbol: '฿', name: 'Тайский бат' },
  { code: 'IDR', symbol: 'Rp', name: 'Индонезийская рупия' },
  { code: 'MYR', symbol: 'RM', name: 'Малайзийский ринггит' },
  { code: 'PHP', symbol: '₱', name: 'Филиппинский песо' },
  { code: 'KRW', symbol: '₩', name: 'Южнокорейская вона' },
  { code: 'TWD', symbol: 'NT$', name: 'Тайваньский доллар' },
  { code: 'GEL', symbol: '₾', name: 'Грузинский лари' },
  { code: 'AMD', symbol: '֏', name: 'Армянский драм' },
  { code: 'AZN', symbol: '₼', name: 'Азербайджанский манат' },
  { code: 'KZT', symbol: '₸', name: 'Казахстанский тенге' },
  { code: 'UZS', symbol: "so'm", name: 'Узбекский сум' },
  { code: 'MNT', symbol: '₮', name: 'Монгольский тугрик' },
];

// ─── Category config ──────────────────────────────────────────────────────────

const CAT = {
  food:      { label: 'Еда',        color: Colors.categoryFood },
  transport: { label: 'Транспорт',  color: Colors.categoryTransport },
  home:      { label: 'Дом',        color: Colors.categoryHome },
  health:    { label: 'Здоровье',   color: Colors.accentTeal },
  other:     { label: 'Прочее',     color: Colors.categoryOther },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getLast7Days(transactions: Transaction[]) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const date = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString('ru-RU', { weekday: 'short' }).slice(0, 2);
    const amount = transactions
      .filter(t => t.date === date)
      .reduce((s, t) => s + t.amount, 0);
    return { date, label, amount };
  });
}

function getBudgetHealth(spentPct: number, hasGoals: boolean): number {
  let score = Math.max(0, 100 - Math.round(spentPct * 80));
  if (hasGoals) score = Math.min(100, score + 10);
  return score;
}

function getTrend(spentPct: number): { label: string; positive: boolean } {
  const dayOfMonth = new Date().getDate();
  const expectedPct = dayOfMonth / 31;
  if (spentPct < expectedPct * 0.85) return { label: 'Отличный темп', positive: true };
  if (spentPct < expectedPct * 1.1) return { label: 'В норме', positive: true };
  return { label: 'Превышение темпа', positive: false };
}

// ─── Bar Chart ────────────────────────────────────────────────────────────────

function SpendingBarChart({ data, currency }: { data: { label: string; amount: number }[]; currency: string }) {
  const W = 320;
  const H = 100;
  const barW = 32;
  const gap = (W - barW * 7) / 8;
  const maxAmount = Math.max(...data.map(d => d.amount), 1);

  return (
    <Svg width="100%" height={H + 24} viewBox={`0 0 ${W} ${H + 24}`}>
      {data.map((d, i) => {
        const x = gap + i * (barW + gap);
        const barH = Math.max(4, (d.amount / maxAmount) * H);
        const y = H - barH;
        const isToday = i === 6;
        const color = isToday ? Colors.accentTeal : d.amount > 0 ? Colors.accentPurple : Colors.border;
        return (
          <G key={d.label}>
            <Path
              d={`M${x + 4},${y + barH} L${x + 4},${y + 4} Q${x + 4},${y} ${x + 8},${y} L${x + barW - 8},${y} Q${x + barW},${y} ${x + barW},${y + 4} L${x + barW},${y + barH} Z`}
              fill={color}
              opacity={isToday ? 1 : 0.7}
            />
            <SvgText
              x={x + barW / 2}
              y={H + 16}
              textAnchor="middle"
              fontSize={10}
              fill={isToday ? Colors.accentTeal : Colors.textMuted}
              fontWeight={isToday ? '700' : '400'}
            >
              {d.label}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
}

// ─── Donut Chart ──────────────────────────────────────────────────────────────

function CategoryDonut({ data, total }: { data: Record<string, number>; total: number }) {
  const SIZE = 120;
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const R = 44;
  const strokeW = 20;

  if (total === 0) return null;

  let offset = 0;
  const circumference = 2 * Math.PI * R;
  const segments = Object.entries(CAT)
    .map(([key, cfg]) => ({ key, cfg, amount: data[key] ?? 0 }))
    .filter(s => s.amount > 0)
    .map(s => {
      const pct = s.amount / total;
      const dash = pct * circumference;
      const gap = circumference - dash;
      const rotation = offset * 360 - 90;
      offset += pct;
      return { ...s, dash, gap, rotation };
    });

  return (
    <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
      <Circle cx={cx} cy={cy} r={R} stroke={Colors.border} strokeWidth={strokeW} fill="none" />
      {segments.map(s => (
        <Circle
          key={s.key}
          cx={cx} cy={cy} r={R}
          stroke={s.cfg.color}
          strokeWidth={strokeW}
          fill="none"
          strokeDasharray={`${s.dash} ${s.gap}`}
          rotation={s.rotation}
          origin={`${cx}, ${cy}`}
        />
      ))}
    </Svg>
  );
}

// ─── Currency Modal ───────────────────────────────────────────────────────────

function CurrencyModal({
  visible, current, onSelect, onClose,
}: {
  visible: boolean;
  current: string;
  onSelect: (code: string) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const filtered = CURRENCIES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={ms.overlay}>
        <View style={ms.sheet}>
          <View style={ms.handle} />
          <Text style={ms.title}>Выберите валюту</Text>
          <TextInput
            style={ms.search}
            placeholder="Поиск валюты..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
            autoFocus
          />
          <FlatList
            data={filtered}
            keyExtractor={c => c.code}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[ms.row, item.code === current && ms.rowActive]}
                onPress={() => { onSelect(item.code); onClose(); }}
                activeOpacity={0.7}
              >
                <Text style={ms.symbol}>{item.symbol}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={ms.currName}>{item.name}</Text>
                  <Text style={ms.currCode}>{item.code}</Text>
                </View>
                {item.code === current && (
                  <Text style={{ color: Colors.accentTeal, fontSize: 16 }}>✓</Text>
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );
}

const ms = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.surface, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, paddingHorizontal: Spacing.lg, paddingBottom: 40, maxHeight: '80%' },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginTop: Spacing.md, marginBottom: Spacing.lg },
  title: { fontSize: Typography.sizeLG, fontWeight: Typography.weightBold, color: Colors.textPrimary, marginBottom: Spacing.md },
  search: { backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, color: Colors.textPrimary, fontSize: Typography.sizeMD, marginBottom: Spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: Spacing.md },
  rowActive: { backgroundColor: 'rgba(0,212,200,0.06)', marginHorizontal: -Spacing.lg, paddingHorizontal: Spacing.lg },
  symbol: { width: 36, fontSize: Typography.sizeMD, fontWeight: Typography.weightBold, color: Colors.textPrimary, textAlign: 'center' },
  currName: { fontSize: Typography.sizeSM, color: Colors.textPrimary, fontWeight: Typography.weightSemiBold },
  currCode: { fontSize: Typography.sizeXS, color: Colors.textMuted, marginTop: 1 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function DashboardScreen() {
  const { user, setUser } = useAuthStore();
  const {
    transactions, goals, monthlyBudget,
    setTransactions, setGoals, setMonthlyBudget,
    getTotalSpent, getRemaining, getSpentByCategory,
  } = useBudgetStore();

  const [refreshing, setRefreshing] = useState(false);
  const [currencyModal, setCurrencyModal] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { visible: tipsVisible, complete: tipsDone } = useCoachMark('dashboard');

  const totalSpent = getTotalSpent();
  const remaining = getRemaining();
  const spentPct = monthlyBudget > 0 ? totalSpent / monthlyBudget : 0;
  const byCategory = getSpentByCategory();
  const activeGoal = goals[0] ?? null;
  const currency = user?.currency ?? 'EUR';
  const health = getBudgetHealth(spentPct, goals.length > 0);
  const trend = getTrend(spentPct);
  const weekData = getLast7Days(transactions);
  const fmt = (n: number) => formatCurrency(n, currency);

  async function loadData() {
    if (!user) return;
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const to   = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);

    const [txRes, goalsRes, profileRes] = await Promise.all([
      supabase.from('transactions').select('*').eq('user_id', user.id).gte('date', from).lte('date', to).order('date', { ascending: false }),
      supabase.from('goals').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
      supabase.from('profiles').select('monthly_budget, currency').eq('id', user.id).single(),
    ]);

    if (txRes.data) setTransactions(txRes.data as Transaction[]);
    if (goalsRes.data) setGoals(goalsRes.data as Goal[]);
    if (profileRes.data) {
      setMonthlyBudget(profileRes.data.monthly_budget);
      if (profileRes.data.currency && user.currency !== profileRes.data.currency) {
        setUser({ ...user, currency: profileRes.data.currency });
      }
    }
  }

  useEffect(() => {
    loadData();
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, [user?.id]);

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  async function handleCurrencySelect(code: string) {
    if (!user) return;
    setUser({ ...user, currency: code });
    await supabase.from('profiles').update({ currency: code }).eq('id', user.id);
  }

  const monthName = new Date().toLocaleString('ru-RU', { month: 'long', year: 'numeric' });
  const firstName = user?.full_name?.split(' ')[0] ?? 'Привет';
  const currObj = CURRENCIES.find(c => c.code === currency) ?? CURRENCIES[0];
  const savingsTotal = goals.reduce((s, g) => s + (g.monthly_contribution ?? 0), 0);
  const healthColor = health >= 70 ? Colors.success : health >= 40 ? Colors.warning : Colors.danger;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        indicatorStyle="white"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accentTeal} />}
      >
        <Animated.View style={{ opacity: fadeAnim }}>

          {/* ── Header ── */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Привет, {firstName} 👋</Text>
              <Text style={styles.subtitle}>{monthName}</Text>
            </View>
            <TouchableOpacity style={styles.currencyBtn} onPress={() => setCurrencyModal(true)} activeOpacity={0.7}>
              <Text style={styles.currencySymbol}>{currObj.symbol}</Text>
              <Text style={styles.currencyCode}>{currency}</Text>
              <Text style={styles.currencyChevron}>▾</Text>
            </TouchableOpacity>
          </View>

          {/* ── Hero Card ── */}
          <LinearGradient
            colors={['#6C5CE7', '#4B3FC7', '#2D2B8F']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroTopRow}>
              <Text style={styles.heroLabel}>Остаток бюджета</Text>
              <View style={[styles.trendBadge, { backgroundColor: trend.positive ? 'rgba(57,217,138,0.2)' : 'rgba(245,85,74,0.2)' }]}>
                <Text style={[styles.trendText, { color: trend.positive ? Colors.success : Colors.danger }]}>
                  {trend.positive ? '↑' : '↓'} {trend.label}
                </Text>
              </View>
            </View>
            <Text style={styles.heroAmount}>{fmt(Math.max(monthlyBudget - totalSpent, 0))}</Text>
            <Text style={styles.heroSub}>из {fmt(monthlyBudget)} · {Math.round(spentPct * 100)}% использовано</Text>
            <View style={styles.heroBg}>
              <ProgressBar
                progress={spentPct}
                color={spentPct > 0.85 ? Colors.danger : 'rgba(255,255,255,0.9)'}
                height={5}
                style={styles.heroBar}
              />
            </View>
          </LinearGradient>

          {/* ── Quick Stats ── */}
          <View style={styles.statsRow}>
            <StatCard
              label="Потрачено"
              value={fmt(totalSpent)}
              sub={`${Math.round(spentPct * 100)}%`}
              color={Colors.danger}
              icon="↓"
            />
            <StatCard
              label="Сбережения"
              value={fmt(savingsTotal)}
              sub="/мес"
              color={Colors.accentTeal}
              icon="↑"
            />
            <StatCard
              label="Здоровье"
              value={`${health}`}
              sub="/100"
              color={healthColor}
              icon="♥"
            />
          </View>

          {/* ── Weekly Chart ── */}
          <Card style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Расходы за 7 дней</Text>
              <Text style={styles.sectionSub}>{fmt(weekData.reduce((s, d) => s + d.amount, 0))}</Text>
            </View>
            <SpendingBarChart data={weekData} currency={currency} />
          </Card>

          {/* ── Category Breakdown ── */}
          {totalSpent > 0 && (
            <Card style={styles.section}>
              <Text style={styles.sectionTitle}>Структура расходов</Text>
              <View style={styles.categoryLayout}>
                <CategoryDonut data={byCategory} total={totalSpent} />
                <View style={styles.legend}>
                  {Object.entries(CAT).map(([key, cfg]) => {
                    const amount = byCategory[key] ?? 0;
                    if (amount === 0) return null;
                    const pct = Math.round((amount / totalSpent) * 100);
                    return (
                      <View key={key} style={styles.legendRow}>
                        <View style={[styles.legendDot, { backgroundColor: cfg.color }]} />
                        <Text style={styles.legendLabel}>{cfg.label}</Text>
                        <Text style={styles.legendPct}>{pct}%</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </Card>
          )}

          {/* ── No transactions placeholder ── */}
          {totalSpent === 0 && (
            <Card style={[styles.section, styles.emptyCard]}>
              <Text style={styles.emptyIcon}>📊</Text>
              <Text style={styles.emptyTitle}>Добавьте первую трату</Text>
              <Text style={styles.emptyText}>Отсканируйте чек или добавьте вручную — и увидите графики расходов</Text>
            </Card>
          )}

          {/* ── Active Goal ── */}
          {activeGoal && (
            <Card style={styles.section}>
              <View style={styles.goalHeader}>
                <Text style={styles.goalEmoji}>{activeGoal.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.goalTitle}>{activeGoal.title}</Text>
                  <Text style={styles.goalSub}>
                    {fmt(activeGoal.current_amount)} из {fmt(activeGoal.target_amount)}
                  </Text>
                </View>
                <View style={styles.goalBadge}>
                  <Text style={styles.goalMonths}>
                    {monthsLeft(activeGoal.current_amount, activeGoal.target_amount, activeGoal.monthly_contribution)} мес.
                  </Text>
                </View>
              </View>
              <ProgressBar
                progress={activeGoal.current_amount / activeGoal.target_amount}
                color={Colors.success}
                height={6}
                style={{ marginTop: Spacing.sm }}
              />
            </Card>
          )}

          {/* ── Smart Tip ── */}
          <LinearGradient
            colors={['rgba(123,108,246,0.15)', 'rgba(0,212,200,0.08)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.tipCard}
          >
            <Text style={styles.tipLabel}>💡 Умный совет</Text>
            <Text style={styles.tipText}>
              {spentPct > 0.85
                ? 'Бюджет почти исчерпан. Постарайтесь ограничить расходы до конца месяца.'
                : spentPct > 0.5
                ? `Вы потратили ${Math.round(spentPct * 100)}% бюджета. Хороший темп — продолжайте!`
                : totalSpent === 0
                ? 'Начните отслеживать расходы — это первый шаг к финансовой свободе.'
                : `Отличный результат! Вы тратите меньше запланированного. Разница ${fmt(Math.abs(remaining))} может пойти в накопления.`}
            </Text>
          </LinearGradient>

        </Animated.View>
      </ScrollView>

      <CurrencyModal
        visible={currencyModal}
        current={currency}
        onSelect={handleCurrencySelect}
        onClose={() => setCurrencyModal(false)}
      />

      <CoachMark steps={DASHBOARD_TIPS} visible={tipsVisible} onDone={tipsDone} />
    </SafeAreaView>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color, icon }: { label: string; value: string; sub: string; color: string; icon: string }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color + '22' }]}>
        <Text style={[styles.statIconText, { color }]}>{icon}</Text>
      </View>
      <Text style={[styles.statValue, { color }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.statSub}>{sub}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: Layout.tabBarClearance },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.lg },
  greeting: { fontSize: Typography.sizeLG, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  subtitle: { fontSize: Typography.sizeSM, color: Colors.textSecondary, marginTop: 2 },

  currencyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.surfaceElevated, borderRadius: Radius.full,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    borderWidth: 1, borderColor: Colors.border,
  },
  currencySymbol: { fontSize: Typography.sizeMD, color: Colors.accentTeal, fontWeight: Typography.weightBold },
  currencyCode: { fontSize: Typography.sizeSM, color: Colors.textPrimary, fontWeight: Typography.weightSemiBold },
  currencyChevron: { fontSize: 10, color: Colors.textMuted },

  heroCard: { borderRadius: Radius.xl, padding: Spacing.xl, marginBottom: Spacing.md },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  heroLabel: { fontSize: Typography.sizeSM, color: 'rgba(255,255,255,0.7)' },
  trendBadge: { borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 3 },
  trendText: { fontSize: Typography.sizeXS, fontWeight: Typography.weightSemiBold },
  heroAmount: { fontSize: 38, fontWeight: Typography.weightBold, color: '#fff', letterSpacing: -0.5 },
  heroSub: { fontSize: Typography.sizeSM, color: 'rgba(255,255,255,0.6)', marginTop: 4, marginBottom: Spacing.lg },
  heroBg: { backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: Radius.full, overflow: 'hidden' },
  heroBar: {},

  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  statCard: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.md, alignItems: 'center', gap: 2,
    borderWidth: 1, borderColor: Colors.border,
  },
  statIcon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  statIconText: { fontSize: 12, fontWeight: Typography.weightBold },
  statValue: { fontSize: Typography.sizeSM, fontWeight: Typography.weightBold },
  statSub: { fontSize: Typography.sizeXS, color: Colors.textMuted },
  statLabel: { fontSize: Typography.sizeXS, color: Colors.textSecondary, marginTop: 1 },

  section: { marginBottom: Spacing.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitle: { fontSize: Typography.sizeMD, fontWeight: Typography.weightSemiBold, color: Colors.textPrimary },
  sectionSub: { fontSize: Typography.sizeSM, color: Colors.accentTeal, fontWeight: Typography.weightSemiBold },

  categoryLayout: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  legend: { flex: 1, gap: Spacing.sm },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { flex: 1, fontSize: Typography.sizeSM, color: Colors.textSecondary },
  legendPct: { fontSize: Typography.sizeSM, color: Colors.textPrimary, fontWeight: Typography.weightSemiBold },

  emptyCard: { alignItems: 'center', paddingVertical: Spacing.xl },
  emptyIcon: { fontSize: 40, marginBottom: Spacing.md },
  emptyTitle: { fontSize: Typography.sizeMD, fontWeight: Typography.weightBold, color: Colors.textPrimary, marginBottom: Spacing.sm },
  emptyText: { fontSize: Typography.sizeSM, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },

  goalHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  goalEmoji: { fontSize: 24 },
  goalTitle: { fontSize: Typography.sizeMD, fontWeight: Typography.weightSemiBold, color: Colors.textPrimary },
  goalSub: { fontSize: Typography.sizeXS, color: Colors.textMuted, marginTop: 2 },
  goalBadge: { backgroundColor: Colors.success + '22', borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 3 },
  goalMonths: { fontSize: Typography.sizeXS, color: Colors.success, fontWeight: Typography.weightBold },

  tipCard: { borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.accentPurple + '33' },
  tipLabel: { fontSize: Typography.sizeSM, fontWeight: Typography.weightBold, color: Colors.accentPurple, marginBottom: Spacing.xs },
  tipText: { fontSize: Typography.sizeSM, color: Colors.textSecondary, lineHeight: 20 },
});
