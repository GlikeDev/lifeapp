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
  KeyboardAvoidingView, Platform, Keyboard, ActivityIndicator,
  LayoutAnimation, UIManager,
} from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, G, Circle, Text as SvgText } from 'react-native-svg';
import { Card, ProgressBar } from '../../components/common';
import { Colors, Typography, Spacing, Radius, Layout, Glass } from '../../constants/tokens';
import { useBudgetStore } from '../../store/useBudgetStore';
import { useAuthStore } from '../../store/useAuthStore';
import { formatCurrency, monthsLeft } from '../../utils/format';
import { supabase } from '../../lib/supabase';
import type { Transaction, Goal, FridgeItem } from '../../types';
import { useTranslation } from '../../i18n';

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
  food:          { key: 'cat.food',          color: Colors.categoryFood },
  transport:     { key: 'cat.transport',     color: Colors.categoryTransport },
  home:          { key: 'cat.home',          color: Colors.categoryHome },
  health:        { key: 'cat.health',        color: Colors.accentTeal },
  entertainment: { key: 'cat.entertainment', color: '#E879F9' },
  shopping:      { key: 'cat.shopping',      color: '#FB7185' },
  other:         { key: 'cat.other',         color: Colors.categoryOther },
};

// ─── Goal constants ───────────────────────────────────────────────────────────

const GOAL_PALETTES: [string, string][] = [
  ['#1E2A3A','#0F1B26'],
  ['#1E1F38','#161727'],
  ['#1F2A1A','#141E0F'],
  ['#2A1F3E','#1A1228'],
  ['#2A2010','#1A1208'],
];

interface GoalTemplate {
  emoji: string;
  title: string;
  target: number;
  monthly: number;
  color: string;
  custom?: boolean;
}

const GOAL_TEMPLATES: GoalTemplate[] = [
  { emoji: '🏖️', title: 'Отпуск',        target: 2000,  monthly: 200,  color: '#06B6D4' },
  { emoji: '🏠', title: 'Жильё',          target: 50000, monthly: 1000, color: '#8B5CF6' },
  { emoji: '🚗', title: 'Автомобиль',     target: 15000, monthly: 500,  color: '#F59E0B' },
  { emoji: '💍', title: 'Свадьба',        target: 10000, monthly: 400,  color: '#EC4899' },
  { emoji: '✈️', title: 'Путешествие',    target: 3000,  monthly: 300,  color: '#3B82F6' },
  { emoji: '📱', title: 'Гаджет',         target: 800,   monthly: 150,  color: '#22D3EE' },
  { emoji: '🎓', title: 'Образование',    target: 5000,  monthly: 300,  color: '#6366F1' },
  { emoji: '🏋️', title: 'Фитнес',        target: 600,   monthly: 100,  color: '#4ADE80' },
  { emoji: '💊', title: 'Здоровье',       target: 2000,  monthly: 200,  color: '#34D399' },
  { emoji: '🛋️', title: 'Мебель',        target: 3000,  monthly: 250,  color: '#FB923C' },
  { emoji: '🐾', title: 'Питомец',        target: 1500,  monthly: 150,  color: '#F97316' },
  { emoji: '💡', title: 'Инвестиции',     target: 10000, monthly: 500,  color: '#EAB308' },
  { emoji: '🎮', title: 'Развлечения',    target: 500,   monthly: 80,   color: '#A855F7' },
  { emoji: '🎯', title: 'Своя цель',      target: 0,     monthly: 0,    color: '#94A3B8', custom: true },
];

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
  visible, current, onSelect, onClose, title, searchPh,
}: {
  visible: boolean;
  current: string;
  onSelect: (code: string) => void;
  onClose: () => void;
  title: string;
  searchPh: string;
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
          <Text style={ms.title}>{title}</Text>
          <TextInput
            style={ms.search}
            placeholder={searchPh}
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
  sheet: { backgroundColor: '#0D0E1C', borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, paddingHorizontal: Spacing.lg, paddingBottom: 40, maxHeight: '80%' },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginTop: Spacing.md, marginBottom: Spacing.lg },
  title: { fontSize: Typography.sizeLG, fontWeight: Typography.weightBold, color: Colors.textPrimary, marginBottom: Spacing.md },
  search: { backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, color: Colors.textPrimary, fontSize: Typography.sizeMD, marginBottom: Spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: Spacing.md },
  rowActive: { backgroundColor: 'rgba(0,212,200,0.06)', marginHorizontal: -Spacing.lg, paddingHorizontal: Spacing.lg },
  symbol: { width: 36, fontSize: Typography.sizeMD, fontWeight: Typography.weightBold, color: Colors.textPrimary, textAlign: 'center' },
  currName: { fontSize: Typography.sizeSM, color: Colors.textPrimary, fontWeight: Typography.weightSemiBold },
  currCode: { fontSize: Typography.sizeXS, color: Colors.textMuted, marginTop: 1 },
});

// ─── Collapsible Section ──────────────────────────────────────────────────────

function CollapsibleSection({
  title, children, accentColor = Colors.accentTeal, badge, open, onToggle,
}: {
  title: string; children: React.ReactNode; accentColor?: string;
  badge?: string; open: boolean; onToggle: () => void;
}) {
  const rot = useRef(new Animated.Value(open ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(rot, { toValue: open ? 1 : 0, duration: 220, useNativeDriver: true }).start();
  }, [open]);

  const chevronRot = rot.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '90deg'] });

  return (
    <View style={[cs.wrap, { borderColor: accentColor + '35', shadowColor: accentColor }]}>
      <TouchableOpacity style={cs.header} onPress={onToggle} activeOpacity={0.7}>
        <Text style={cs.title}>{title}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {badge ? (
            <View style={[cs.badge, { backgroundColor: accentColor + '18', borderColor: accentColor + '35' }]}>
              <Text style={[cs.badgeTxt, { color: accentColor }]}>{badge}</Text>
            </View>
          ) : null}
          <Animated.Text style={[cs.chevron, { transform: [{ rotate: chevronRot }] }]}>›</Animated.Text>
        </View>
      </TouchableOpacity>
      {open && <View style={cs.body}>{children}</View>}
    </View>
  );
}

const cs = StyleSheet.create({
  wrap: { borderRadius: Radius.xl, borderWidth: 1, marginBottom: Spacing.md, shadowOpacity: 0.18, shadowRadius: 20, shadowOffset: { width: 0, height: 0 }, elevation: 4 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: Spacing.md },
  title: { fontSize: Typography.sizeXS, fontFamily: Typography.fontMedium, color: Colors.textMuted, letterSpacing: 1.2 },
  badge: { borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 3, borderWidth: 1 },
  badgeTxt: { fontSize: Typography.sizeXS, fontFamily: Typography.fontSemiBold },
  chevron: { fontSize: 20, color: Colors.textMuted },
  body: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.md },
});

// ─── Fridge helpers ───────────────────────────────────────────────────────────

function fridgeDaysUntil(d: string) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Math.round((new Date(d).getTime() - today.getTime()) / 86400000);
}
function fridgeZoneColor(days: number) {
  if (days < 0) return Colors.danger;
  if (days <= 1) return Colors.danger;
  if (days <= 3) return Colors.warning;
  return Colors.success;
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function DashboardScreen() {
  const { user, setUser } = useAuthStore();
  const {
    transactions, goals, monthlyBudget,
    setTransactions, setGoals, addGoal, setMonthlyBudget,
    getTotalSpent, getRemaining, getSpentByCategory,
  } = useBudgetStore();

  const [refreshing, setRefreshing] = useState(false);
  const [currencyModal, setCurrencyModal] = useState(false);
  const [insightIdx, setInsightIdx] = useState(0);

  // Collapsible sections
  const [catsOpen, setCatsOpen] = useState(false);
  const [goalsOpen, setGoalsOpen] = useState(false);
  const [fridgeOpen, setFridgeOpen] = useState(false);
  const [whatIfOpen, setWhatIfOpen] = useState(false);
  const [fridgeItems, setFridgeItems] = useState<FridgeItem[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const neonAnim = useRef(new Animated.Value(0)).current;
  const { visible: tipsVisible, complete: tipsDone } = useCoachMark('dashboard');
  const insets = useSafeAreaInsets();
  const { t, lang, setLang, locale } = useTranslation();

  // Goal modal state
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalStep, setGoalStep] = useState<'pick' | 'form'>('pick');
  const [goalEmoji, setGoalEmoji] = useState('🎯');
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalMonthly, setGoalMonthly] = useState('');
  const [goalSaving, setGoalSaving] = useState(false);

  function openGoalModal() {
    setGoalStep('pick');
    setGoalEmoji('🎯');
    setGoalTitle('');
    setGoalTarget('');
    setGoalMonthly('');
    openGoalModal();
  }

  function handlePickTemplate(tpl: GoalTemplate) {
    setGoalEmoji(tpl.emoji);
    setGoalTitle(tpl.custom ? '' : tpl.title);
    setGoalTarget(tpl.target > 0 ? String(tpl.target) : '');
    setGoalMonthly(tpl.monthly > 0 ? String(tpl.monthly) : '');
    setGoalStep('form');
  }

  const totalSpent = getTotalSpent();
  const remaining = getRemaining();
  const spentPct = monthlyBudget > 0 ? totalSpent / monthlyBudget : 0;
  const byCategory = getSpentByCategory();
  const currency = user?.currency ?? 'EUR';
  const health = getBudgetHealth(spentPct, goals.length > 0);
  const trend = getTrend(spentPct);
  const weekData = getLast7Days(transactions);
  const fmt = (n: number) => formatCurrency(n, currency);

  const neonBorderColor = neonAnim.interpolate({
    inputRange: [0, 0.33, 0.66, 1],
    outputRange: ['#22D3EE', '#A78BFA', '#E879F9', '#22D3EE'],
  });

  async function loadData() {
    if (!user) return;
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const to   = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);

    const [txRes, goalsRes, profileRes, fridgeRes] = await Promise.all([
      supabase.from('transactions').select('*').eq('user_id', user.id).gte('date', from).lte('date', to).order('date', { ascending: false }),
      supabase.from('goals').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
      supabase.from('profiles').select('monthly_budget, currency').eq('id', user.id).single(),
      supabase.from('fridge_items').select('*').eq('user_id', user.id).order('expires_at', { ascending: true }),
    ]);

    if (txRes.data) setTransactions(txRes.data as Transaction[]);
    if (goalsRes.data) setGoals(goalsRes.data as Goal[]);
    if (profileRes.data) {
      setMonthlyBudget(profileRes.data.monthly_budget);
      if (profileRes.data.currency && user.currency !== profileRes.data.currency) {
        setUser({ ...user, currency: profileRes.data.currency });
      }
    }
    if (fridgeRes.data) setFridgeItems(fridgeRes.data as FridgeItem[]);
  }

  useEffect(() => {
    loadData();
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    Animated.loop(
      Animated.timing(neonAnim, { toValue: 1, duration: 3000, useNativeDriver: false })
    ).start();
  }, [user?.id]);

  useEffect(() => {
    const timer = setInterval(() => setInsightIdx(i => (i + 1) % 3), 4000);
    return () => clearInterval(timer);
  }, []);

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

  async function handleAddGoal() {
    const target = parseFloat(goalTarget.replace(',', '.'));
    const monthly = parseFloat(goalMonthly.replace(',', '.'));
    if (!goalTitle.trim()) { return; }
    if (isNaN(target) || target <= 0) { return; }
    if (!user) return;
    setGoalSaving(true);
    const { data, error } = await supabase.from('goals').insert({
      user_id: user.id,
      title: goalTitle.trim(),
      emoji: goalEmoji,
      target_amount: target,
      current_amount: 0,
      monthly_contribution: isNaN(monthly) ? 0 : monthly,
    }).select().single();
    if (!error && data) {
      addGoal(data as Goal);
    }
    setGoalSaving(false);
    setShowGoalModal(false);
    setGoalTitle(''); setGoalTarget(''); setGoalMonthly(''); setGoalEmoji('🎯');
  }

  async function handleDeleteGoal(id: string) {
    await supabase.from('goals').delete().eq('id', id);
    setGoals(goals.filter(g => g.id !== id));
  }

  const monthName = new Date().toLocaleString(locale, { month: 'long', year: 'numeric' });
  const firstName = user?.full_name?.split(' ')[0] ?? 'Привет';
  const currObj = CURRENCIES.find(c => c.code === currency) ?? CURRENCIES[0];
  const healthColor = health >= 70 ? Colors.success : health >= 40 ? Colors.warning : Colors.danger;

  const aiMessages = [
    spentPct > 0.85
      ? t('dash.ai.over85')
      : spentPct > 0.5
      ? t('dash.ai.over50', { pct: Math.round(spentPct * 100) })
      : totalSpent === 0
      ? t('dash.ai.empty')
      : t('dash.ai.great', { amount: fmt(Math.abs(remaining)) }),
    t('dash.ai.tip2'),
    t('dash.ai.tip3'),
  ];

  const balanceInt = Math.floor(Math.max(monthlyBudget - totalSpent, 0));
  const balanceDec = String(Math.round((Math.max(monthlyBudget - totalSpent, 0) % 1) * 100)).padStart(2, '0');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Holographic blob background */}
      <View style={styles.blobTR} pointerEvents="none" />
      <View style={styles.blobCL} pointerEvents="none" />
      <View style={styles.blobBR} pointerEvents="none" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accentTeal} />}
      >
        <Animated.View style={{ opacity: fadeAnim }}>

          {/* ── Header ── */}
          <View style={styles.header}>
            <Text style={styles.monthLabel}>{monthName.toUpperCase()}</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity style={styles.langBtn} onPress={() => setLang(lang === 'ru' ? 'en' : 'ru')} activeOpacity={0.7}>
                <Text style={styles.langBtnText}>{t('dash.lang.btn')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.currencyBtn} onPress={() => setCurrencyModal(true)} activeOpacity={0.7}>
                <Text style={styles.currencyBtnText}>{currObj.symbol} {currency}</Text>
                <Text style={styles.currencyChevron}>▾</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Hero Balance ── */}
          <View style={styles.heroSection}>
            <Text style={styles.heroLabel}>{t('dash.availableBudget')}</Text>
            <Animated.View style={[styles.neonBorder, { borderColor: neonBorderColor }]}>
              <View style={styles.heroAmountRow}>
                <Text style={styles.heroCurrency}>{currObj.symbol}</Text>
                <Text style={styles.heroNumber}>{balanceInt.toLocaleString('ru-RU')}</Text>
                <Text style={styles.heroDec}>.{balanceDec}</Text>
              </View>
            </Animated.View>

            {/* Gradient progress bar */}
            <View style={styles.barTrack}>
              <LinearGradient
                colors={['#22D3EE', '#A78BFA']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.barFill, { width: `${Math.min(spentPct * 100, 100)}%` as any }]}
              />
            </View>

            <View style={styles.heroMeta}>
              <Text style={styles.heroMetaText}>
                <Text style={{ color: Colors.accentTeal }}>{fmt(totalSpent)}</Text>
                <Text style={{ color: Colors.textMuted }}> {t('dash.spent')}</Text>
              </Text>
              <Text style={styles.heroMetaText}>
                <Text style={{ color: Colors.textMuted }}>{fmt(monthlyBudget)}</Text>
                <Text style={{ color: Colors.textFaint }}> {t('dash.total')}</Text>
              </Text>
            </View>
          </View>

          {/* ── Categories ── */}
          {(() => {
            const catTotal = Object.entries(CAT).reduce((s, [k]) => s + (byCategory[k] ?? 0), 0);
            const activeCats = Object.entries(CAT)
              .map(([k, cfg]) => ({ key: k, cfg, amount: byCategory[k] ?? 0 }))
              .filter(c => c.amount > 0)
              .sort((a, b) => b.amount - a.amount);
            return (
              <CollapsibleSection
                title={t('dash.categories')}
                accentColor={Colors.accentPurple}
                badge={catTotal > 0 ? `${currObj.symbol}${Math.round(catTotal).toLocaleString('ru-RU')}` : undefined}
                open={catsOpen}
                onToggle={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setCatsOpen(v => !v); }}
              >
                {activeCats.length === 0 ? (
                  <Text style={styles.catEmpty}>{t('dash.cat.empty')}</Text>
                ) : (
                  <View style={styles.catBlocks}>
                    {activeCats.map(({ key, cfg, amount }) => {
                      const pct = catTotal > 0 ? amount / catTotal : 0;
                      return (
                        <View
                          key={key}
                          style={[styles.catBlock, {
                            flex: Math.max(pct, 0.08),
                            backgroundColor: cfg.color + '18',
                            borderColor: cfg.color + '55',
                            shadowColor: cfg.color,
                          }]}
                        >
                          <Text style={[styles.catBlockLabel, { color: cfg.color }]} numberOfLines={1}>{t(cfg.key)}</Text>
                          <Text style={[styles.catBlockAmount, { color: cfg.color }]}>{currObj.symbol}{Math.round(amount)}</Text>
                        </View>
                      );
                    })}
                  </View>
                )}
              </CollapsibleSection>
            );
          })()}

          {/* ── Goals Section ── */}
          <CollapsibleSection
            title={t('dash.goals')}
            accentColor={Colors.accentPurple}
            badge={goals.length > 0 ? `${goals.length}` : undefined}
            open={goalsOpen}
            onToggle={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setGoalsOpen(v => !v); }}
          >
            <View style={styles.goalsSectionHeader}>
              <View style={{ flex: 1 }} />
              <TouchableOpacity style={styles.goalsAddBtn} onPress={() => openGoalModal()} activeOpacity={0.7}>
                <Text style={styles.goalsAddBtnText}>{t('dash.goals.add')}</Text>
              </TouchableOpacity>
            </View>

            {goals.length === 0 ? (
              <TouchableOpacity style={styles.goalsEmpty} onPress={() => openGoalModal()} activeOpacity={0.8}>
                <Text style={styles.emptyIcon}>🎯</Text>
                <Text style={styles.emptyTitle}>{t('dash.goals.emptyTitle')}</Text>
                <Text style={styles.emptyText}>{t('dash.goals.emptyDesc')}</Text>
              </TouchableOpacity>
            ) : (
              goals.map((goal, idx) => {
                const progress = goal.target_amount > 0 ? goal.current_amount / goal.target_amount : 0;
                const pct = Math.round(Math.min(progress * 100, 100));
                const months = monthsLeft(goal.current_amount, goal.target_amount, goal.monthly_contribution);
                const palette = GOAL_PALETTES[idx % GOAL_PALETTES.length];
                return (
                  <LinearGradient key={goal.id} colors={palette} style={styles.goalCard} start={{x:0,y:0}} end={{x:1,y:1}}>
                    <View style={styles.goalCardTop}>
                      <View style={styles.goalEmojiWrap}>
                        <Text style={{ fontSize: 22 }}>{goal.emoji}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.goalCardTitle} numberOfLines={1}>{goal.title}</Text>
                        <Text style={styles.goalCardAmts}>
                          {fmt(goal.current_amount)}
                          <Text style={styles.goalCardAmtMuted}> / {fmt(goal.target_amount)}</Text>
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: 6 }}>
                        <View style={styles.goalPctBadge}>
                          <Text style={styles.goalPctTxt}>{pct}%</Text>
                        </View>
                        <TouchableOpacity onPress={() => handleDeleteGoal(goal.id)} style={styles.goalTrashBtn}>
                          <Text style={styles.goalTrashTxt}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View style={styles.goalBarTrack}>
                      <LinearGradient
                        colors={['#4ADE80', '#22D3EE']}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={[styles.goalBarFill, { width: `${pct}%` as any }]}
                      />
                    </View>
                    {months > 0 && (
                      <Text style={styles.goalCardSub}>
                        +{fmt(goal.monthly_contribution)}{t('dash.goals.perMonth')} {months} {t('dash.goals.months')}
                      </Text>
                    )}
                    {goal.current_amount >= goal.target_amount && (
                      <Text style={[styles.goalCardSub, { color: Colors.success }]}>{t('dash.goals.done')}</Text>
                    )}
                  </LinearGradient>
                );
              })
            )}
          </CollapsibleSection>

          {/* ── Fridge Section ── */}
          {(() => {
            const urgentItems = fridgeItems.filter(i => fridgeDaysUntil(i.expires_at) <= 3);
            const expiredCount = fridgeItems.filter(i => fridgeDaysUntil(i.expires_at) < 0).length;
            const soonCount = fridgeItems.filter(i => { const d = fridgeDaysUntil(i.expires_at); return d >= 0 && d <= 3; }).length;
            const badgeParts: string[] = [];
            if (expiredCount > 0) badgeParts.push(`${expiredCount} просрочено`);
            else if (soonCount > 0) badgeParts.push(`${soonCount} скоро`);
            else if (fridgeItems.length > 0) badgeParts.push(`${fridgeItems.length} продуктов`);
            return (
              <CollapsibleSection
                title="ХОЛОДИЛЬНИК"
                accentColor={expiredCount > 0 ? Colors.danger : soonCount > 0 ? Colors.warning : Colors.accentTeal}
                badge={badgeParts[0]}
                open={fridgeOpen}
                onToggle={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setFridgeOpen(v => !v); }}
              >
                {fridgeItems.length === 0 ? (
                  <Text style={styles.catEmpty}>Холодильник пуст</Text>
                ) : (
                  <View style={{ gap: 6 }}>
                    <View style={styles.fridgeStats}>
                      <View style={[styles.fridgeStat, { borderColor: Colors.accentTeal + '35' }]}>
                        <Text style={[styles.fridgeStatNum, { color: Colors.accentTeal }]}>{fridgeItems.length}</Text>
                        <Text style={styles.fridgeStatLabel}>всего</Text>
                      </View>
                      <View style={[styles.fridgeStat, { borderColor: Colors.warning + '35' }]}>
                        <Text style={[styles.fridgeStatNum, { color: Colors.warning }]}>{soonCount}</Text>
                        <Text style={styles.fridgeStatLabel}>скоро</Text>
                      </View>
                      <View style={[styles.fridgeStat, { borderColor: Colors.danger + '35' }]}>
                        <Text style={[styles.fridgeStatNum, { color: Colors.danger }]}>{expiredCount}</Text>
                        <Text style={styles.fridgeStatLabel}>просрочено</Text>
                      </View>
                    </View>
                    {urgentItems.slice(0, 5).map(item => {
                      const days = fridgeDaysUntil(item.expires_at);
                      const col = fridgeZoneColor(days);
                      const label = days < 0 ? 'просрочено' : days === 0 ? 'сегодня' : days === 1 ? '1 день' : `${days} дня`;
                      return (
                        <View key={item.id} style={[styles.fridgeRow, { borderColor: col + '25' }]}>
                          <Text style={styles.fridgeRowName} numberOfLines={1}>{item.name}</Text>
                          <Text style={styles.fridgeRowQty}>{item.quantity} {item.unit}</Text>
                          <View style={[styles.fridgeRowBadge, { backgroundColor: col + '18', borderColor: col + '40' }]}>
                            <Text style={[styles.fridgeRowBadgeTxt, { color: col }]}>{label}</Text>
                          </View>
                        </View>
                      );
                    })}
                    {urgentItems.length > 5 && (
                      <Text style={styles.catEmpty}>+{urgentItems.length - 5} ещё</Text>
                    )}
                  </View>
                )}
              </CollapsibleSection>
            );
          })()}

          {/* ── What-if Simulator ── */}
          {(() => {
            const wiGoal = goals.find(g => g.monthly_contribution > 0 && g.target_amount > g.current_amount);
            if (!wiGoal) return null;
            const remaining = wiGoal.target_amount - wiGoal.current_amount;
            const base = Math.ceil(remaining / wiGoal.monthly_contribution);
            const scenarios = [
              { label: 'Кофе навынос', saving: 47, emoji: '☕' },
              { label: 'Доставка еды', saving: 80, emoji: '🍕' },
              { label: 'Такси',        saving: 60, emoji: '🚕' },
            ];
            return (
              <CollapsibleSection
                title="ЧТО ЕСЛИ"
                accentColor={Colors.warning}
                badge={wiGoal.emoji + ' ' + wiGoal.title}
                open={whatIfOpen}
                onToggle={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setWhatIfOpen(v => !v); }}
              >
                <Text style={styles.wiSub}>Откажись от привычки — цель станет ближе</Text>
                <View style={{ gap: 8, marginBottom: Spacing.md }}>
                  {scenarios.map(sc => {
                    const newMos = Math.ceil(remaining / (wiGoal.monthly_contribution + sc.saving));
                    const diff = base - newMos;
                    return (
                      <View key={sc.label} style={styles.wiRow}>
                        <Text style={{ fontSize: 20 }}>{sc.emoji}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.wiLabel}>{sc.label}</Text>
                          <Text style={styles.wiEffect}>
                            {'На '}
                            <Text style={{ color: Colors.success, fontWeight: Typography.weightBold }}>
                              {diff > 0 ? `${diff} мес.` : 'чуть'} ближе
                            </Text>
                          </Text>
                        </View>
                        <View style={styles.wiSavingBadge}>
                          <Text style={styles.wiSavingTxt}>+{sc.saving}/мес</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
                <View style={styles.wiScenSection}>
                  <Text style={styles.wiScenTitle}>Сколько откладывать в месяц:</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {[
                      { label: 'Минимум',  val: remaining / Math.max(base + 3, 1) },
                      { label: 'Реалист.', val: wiGoal.monthly_contribution },
                      { label: 'Оптим.',   val: remaining / Math.max(base - 2, 1) },
                    ].map(sc => (
                      <View key={sc.label} style={styles.wiScenCard}>
                        <Text style={styles.wiScenAmt}>{fmt(Math.round(sc.val))}</Text>
                        <Text style={styles.wiScenLabel}>{sc.label}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </CollapsibleSection>
            );
          })()}

          {/* ── AI Insight card ── */}
          <TouchableOpacity style={styles.aiCard} onPress={() => setInsightIdx(i => (i + 1) % 3)} activeOpacity={0.9}>
            <View style={styles.aiShine} pointerEvents="none" />
            <Text style={styles.aiLabel}>{t('dash.ai.label')}</Text>
            <Text style={styles.aiText}>{aiMessages[insightIdx]}</Text>
            <View style={styles.aiDots}>
              {[0, 1, 2].map(i => (
                <View key={i} style={[styles.aiDot, i === insightIdx && styles.aiDotActive]} />
              ))}
            </View>
          </TouchableOpacity>

        </Animated.View>
      </ScrollView>

      {/* ── Add Goal Modal ── */}
      <Modal visible={showGoalModal} transparent animationType="slide" onRequestClose={() => setShowGoalModal(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <TouchableOpacity style={gm.backdrop} activeOpacity={1} onPress={() => { Keyboard.dismiss(); setShowGoalModal(false); }} />
          <View style={[gm.sheet, { paddingBottom: insets.bottom + 20 }]}>
            <View style={gm.handle} />

            {goalStep === 'pick' ? (
              /* ── Step 1: Template picker ── */
              <>
                <View style={gm.pickHeader}>
                  <Text style={gm.title}>Новая цель</Text>
                  <Text style={gm.pickSub}>Выбери шаблон или создай свою</Text>
                </View>
                <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
                  <View style={gm.tplGrid}>
                    {GOAL_TEMPLATES.map(tpl => (
                      <TouchableOpacity
                        key={tpl.title}
                        style={[gm.tplCard, { borderColor: tpl.color + '55' }]}
                        onPress={() => handlePickTemplate(tpl)}
                        activeOpacity={0.75}
                      >
                        <LinearGradient
                          colors={[tpl.color + '1E', tpl.color + '08']}
                          style={gm.tplInner}
                        >
                          <Text style={gm.tplEmoji}>{tpl.emoji}</Text>
                          <Text style={gm.tplName} numberOfLines={1}>{tpl.title}</Text>
                          {tpl.target > 0 ? (
                            <Text style={[gm.tplHint, { color: tpl.color }]}>
                              {tpl.target.toLocaleString('ru-RU')} {currObj.symbol}
                            </Text>
                          ) : (
                            <Text style={[gm.tplHint, { color: tpl.color }]}>Произвольно</Text>
                          )}
                          {tpl.monthly > 0 && (
                            <Text style={gm.tplMonthly}>
                              {tpl.monthly} {currObj.symbol}/мес
                            </Text>
                          )}
                        </LinearGradient>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </>
            ) : (
              /* ── Step 2: Form ── */
              <>
                <View style={gm.formHeader}>
                  <TouchableOpacity style={gm.backBtn} onPress={() => setGoalStep('pick')} activeOpacity={0.7}>
                    <Text style={gm.backTxt}>← Шаблоны</Text>
                  </TouchableOpacity>
                  <Text style={gm.title}>Настрой цель</Text>
                </View>

                {/* Emoji picker */}
                <View style={gm.emojiRow}>
                  <View style={gm.emojiSelected}>
                    <Text style={{ fontSize: 32 }}>{goalEmoji}</Text>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', gap: Spacing.sm, paddingLeft: Spacing.sm }}>
                      {GOAL_TEMPLATES.filter(t => !t.custom).map(tpl => (
                        <TouchableOpacity
                          key={tpl.emoji}
                          style={[gm.emojiBtn, goalEmoji === tpl.emoji && gm.emojiBtnOn]}
                          onPress={() => setGoalEmoji(tpl.emoji)}
                        >
                          <Text style={{ fontSize: 20 }}>{tpl.emoji}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>

                <Text style={gm.label}>{t('dash.goals.name')}</Text>
                <TextInput
                  style={gm.input}
                  value={goalTitle}
                  onChangeText={setGoalTitle}
                  placeholder={t('dash.goals.namePh')}
                  placeholderTextColor={Colors.textMuted}
                  autoFocus={!goalTitle}
                />

                <View style={gm.row2}>
                  <View style={{ flex: 1 }}>
                    <Text style={gm.label}>{t('dash.goals.target')}</Text>
                    <TextInput
                      style={gm.input}
                      value={goalTarget}
                      onChangeText={setGoalTarget}
                      keyboardType="decimal-pad"
                      placeholder="2 000"
                      placeholderTextColor={Colors.textMuted}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={gm.label}>{t('dash.goals.monthly')}</Text>
                    <TextInput
                      style={gm.input}
                      value={goalMonthly}
                      onChangeText={setGoalMonthly}
                      keyboardType="decimal-pad"
                      placeholder="150"
                      placeholderTextColor={Colors.textMuted}
                    />
                  </View>
                </View>

                {goalTarget && goalMonthly && parseFloat(goalTarget) > 0 && parseFloat(goalMonthly) > 0 && (
                  <View style={gm.estimate}>
                    <Text style={gm.estimateTxt}>
                      ~{Math.ceil(parseFloat(goalTarget) / parseFloat(goalMonthly))} мес до цели
                    </Text>
                  </View>
                )}

                <View style={gm.btns}>
                  <TouchableOpacity style={gm.cancel} onPress={() => setShowGoalModal(false)}>
                    <Text style={gm.cancelTxt}>{t('dash.goals.cancel')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[gm.save, { backgroundColor: Colors.success }]} onPress={handleAddGoal} disabled={goalSaving}>
                    {goalSaving ? <ActivityIndicator color={Colors.bg} /> : <Text style={gm.saveTxt}>{t('dash.goals.save')}</Text>}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <CurrencyModal
        visible={currencyModal}
        current={currency}
        onSelect={handleCurrencySelect}
        onClose={() => setCurrencyModal(false)}
        title={t('dash.currency.title')}
        searchPh={t('dash.currency.search')}
      />

      <CoachMark steps={DASHBOARD_TIPS} visible={tipsVisible} onDone={tipsDone} />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.bg },
  scroll:  { flex: 1 },
  content: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Layout.tabBarClearance },

  // Holographic blob background layers
  blobTR: { position: 'absolute', width: 320, height: 200, top: -60, right: -80, borderRadius: 999, backgroundColor: 'rgba(34,211,238,0.20)', opacity: 0.6, transform: [{ scaleX: 1.4 }] },
  blobCL: { position: 'absolute', width: 280, height: 220, top: '28%', left: -100, borderRadius: 999, backgroundColor: 'rgba(167,139,250,0.16)', opacity: 0.6, transform: [{ scaleY: 1.3 }] },
  blobBR: { position: 'absolute', width: 300, height: 200, bottom: 120, right: -80, borderRadius: 999, backgroundColor: 'rgba(232,121,249,0.14)', opacity: 0.6, transform: [{ scaleX: 1.3 }] },

  // Header
  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.xl },
  monthLabel:      { fontSize: Typography.sizeXS, fontFamily: Typography.fontMedium, color: Colors.textMuted, letterSpacing: 1.2 },
  langBtn:         { backgroundColor: 'rgba(167,139,250,0.12)', borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: 7, borderWidth: 1, borderColor: 'rgba(167,139,250,0.35)' },
  langBtnText:     { fontSize: Typography.sizeSM, fontFamily: Typography.fontSemiBold, color: Colors.accentPurple },
  currencyBtn:     { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(34,211,238,0.12)', borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: 7, borderWidth: 1, borderColor: 'rgba(34,211,238,0.35)' },
  currencyBtnText: { fontSize: Typography.sizeSM, fontFamily: Typography.fontSemiBold, color: Colors.accentTeal },
  currencyChevron: { fontSize: 10, color: Colors.accentTeal },

  // Hero
  heroSection:   { marginBottom: Spacing.xxl },
  heroLabel:     { fontSize: Typography.sizeSM, fontFamily: Typography.fontRegular, color: Colors.textMuted, marginBottom: Spacing.sm },
  neonBorder: {
    borderWidth: 2,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.lg,
    alignSelf: 'flex-start',
    shadowColor: '#A78BFA',
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  heroAmountRow: { flexDirection: 'row', alignItems: 'flex-end' },
  heroCurrency:  { fontSize: 28, fontFamily: Typography.fontDisplay, color: Colors.textSecondary, marginBottom: 6, marginRight: 4 },
  heroNumber:    { fontSize: 72, fontFamily: Typography.fontDisplay, color: Colors.textPrimary, lineHeight: 76, letterSpacing: -2 },
  heroDec:       { fontSize: 22, fontFamily: Typography.fontDisplay, color: Colors.textMuted, marginBottom: 10, marginLeft: 2 },

  // Progress bar
  barTrack: { height: 6, backgroundColor: Glass.elev, borderRadius: Radius.full, overflow: 'hidden', marginBottom: Spacing.sm },
  barFill:  { height: '100%', borderRadius: Radius.full, shadowColor: '#22D3EE', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.7, shadowRadius: 8 },

  heroMeta:     { flexDirection: 'row', justifyContent: 'space-between' },
  heroMetaText: { fontSize: Typography.sizeSM, fontFamily: Typography.fontRegular },

  // Categories
  catSection: { marginBottom: Spacing.xl },
  catTitle:   { fontSize: Typography.sizeXS, fontFamily: Typography.fontMedium, color: Colors.textMuted, letterSpacing: 1.2, marginBottom: Spacing.md },
  catBlocks:  { flexDirection: 'row', gap: 6 },
  catBlock: {
    minWidth: 46,
    height: 62,
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.sm,
    justifyContent: 'space-between',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 3,
  },
  catBlockLabel:  { fontSize: 9, fontFamily: Typography.fontSemiBold, letterSpacing: 0.2 },
  catBlockAmount: { fontSize: Typography.sizeSM, fontFamily: Typography.fontBold },
  catEmpty:   { fontSize: Typography.sizeSM, fontFamily: Typography.fontRegular, color: Colors.textMuted, textAlign: 'center', paddingVertical: Spacing.lg },

  // Goals section
  goalsSectionHeader:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginBottom: Spacing.md },
  goalsAddBtn:          { backgroundColor: 'rgba(74,222,128,0.14)', borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(74,222,128,0.35)' },
  goalsAddBtnText:      { fontSize: Typography.sizeSM, fontFamily: Typography.fontSemiBold, color: Colors.success },
  goalsEmpty:           { backgroundColor: Glass.surface, borderRadius: Radius.xl, padding: Spacing.xl, alignItems: 'center', borderWidth: 1, borderColor: Glass.border, marginBottom: Spacing.md },

  // What-if simulator
  wiSub:        { fontSize: Typography.sizeXS, color: Colors.textSecondary, marginBottom: Spacing.md },
  wiRow:        { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  wiLabel:      { fontSize: Typography.sizeSM, color: Colors.textPrimary, fontWeight: Typography.weightSemiBold },
  wiEffect:     { fontSize: Typography.sizeXS, color: Colors.textSecondary },
  wiSavingBadge:{ backgroundColor: Colors.success+'18', borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 3 },
  wiSavingTxt:  { fontSize: Typography.sizeXS, color: Colors.success, fontWeight: Typography.weightBold },
  wiScenSection:{ borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)', paddingTop: Spacing.md },
  wiScenTitle:  { fontSize: Typography.sizeXS, color: Colors.textMuted, marginBottom: Spacing.sm },
  wiScenCard:   { flex: 1, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: Radius.md, padding: Spacing.sm, alignItems: 'center' },
  wiScenAmt:    { fontSize: Typography.sizeSM, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  wiScenLabel:  { fontSize: Typography.sizeXS, color: Colors.textSecondary, marginTop: 2, textAlign: 'center' },

  // Fridge widget
  fridgeStats:        { flexDirection: 'row', gap: 8, marginBottom: 8 },
  fridgeStat:         { flex: 1, borderRadius: Radius.md, borderWidth: 1, padding: Spacing.sm, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)' },
  fridgeStatNum:      { fontSize: Typography.sizeLG, fontFamily: Typography.fontBold },
  fridgeStatLabel:    { fontSize: 9, fontFamily: Typography.fontMedium, color: Colors.textMuted, letterSpacing: 0.5 },
  fridgeRow:          { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: Radius.md, borderWidth: 1, paddingHorizontal: Spacing.sm, paddingVertical: 7 },
  fridgeRowName:      { flex: 1, fontSize: Typography.sizeSM, fontFamily: Typography.fontMedium, color: Colors.textPrimary },
  fridgeRowQty:       { fontSize: Typography.sizeXS, fontFamily: Typography.fontRegular, color: Colors.textMuted },
  fridgeRowBadge:     { borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
  fridgeRowBadgeTxt:  { fontSize: 10, fontFamily: Typography.fontSemiBold },

  goalCard:       { borderRadius: Radius.xl, padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: Glass.border },
  goalCardTop:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md },
  goalEmojiWrap:  { width: 46, height: 46, borderRadius: Radius.md, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  goalCardTitle:  { fontSize: Typography.sizeMD, fontFamily: Typography.fontSemiBold, color: Colors.textPrimary },
  goalCardAmts:   { fontSize: Typography.sizeSM, fontFamily: Typography.fontSemiBold, color: Colors.success, marginTop: 2 },
  goalCardAmtMuted:{ color: Colors.textMuted, fontFamily: Typography.fontRegular },
  goalCardSub:    { fontSize: Typography.sizeXS, fontFamily: Typography.fontRegular, color: Colors.textSecondary, marginTop: Spacing.sm },
  goalPctBadge:   { backgroundColor: 'rgba(74,222,128,0.18)', borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(74,222,128,0.4)' },
  goalPctTxt:     { fontSize: Typography.sizeXS, color: Colors.success, fontFamily: Typography.fontSemiBold },
  goalTrashBtn:   { padding: 2 },
  goalTrashTxt:   { fontSize: 12, color: Colors.textMuted },
  goalBarTrack:   { height: 5, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: Radius.full, overflow: 'hidden' },
  goalBarFill:    { height: '100%', borderRadius: Radius.full },

  emptyIcon:  { fontSize: 36, marginBottom: Spacing.md },
  emptyTitle: { fontSize: Typography.sizeMD, fontFamily: Typography.fontSemiBold, color: Colors.textPrimary, marginBottom: Spacing.xs },
  emptyText:  { fontSize: Typography.sizeSM, fontFamily: Typography.fontRegular, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },

  // AI card (goal emojis in gm stylesheet below)
  aiCard: {
    borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md,
    backgroundColor: 'rgba(34,211,238,0.06)',
    borderWidth: 1, borderColor: 'rgba(34,211,238,0.25)',
    overflow: 'hidden',
    shadowColor: '#22D3EE', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 16,
  },
  aiShine: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(34,211,238,0.30)' },
  aiLabel: { fontSize: Typography.sizeXS, fontFamily: Typography.fontSemiBold, color: Colors.accentTeal, letterSpacing: 1, marginBottom: Spacing.sm },
  aiText:  { fontSize: Typography.sizeSM, fontFamily: Typography.fontRegular, color: Colors.textSecondary, lineHeight: 20 },
  aiDots:  { flexDirection: 'row', gap: 6, marginTop: Spacing.sm },
  aiDot:   { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(34,211,238,0.25)' },
  aiDotActive: { backgroundColor: Colors.accentTeal, width: 16 },
});

// ─── Goal modal styles ────────────────────────────────────────────────────────

const gm = StyleSheet.create({
  backdrop:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet:     { backgroundColor: '#0D0E1C', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: Spacing.xl, borderTopWidth: 1, borderColor: Glass.border },
  handle:    { width: 40, height: 4, borderRadius: 2, backgroundColor: Glass.border, alignSelf: 'center', marginBottom: Spacing.lg },

  // Step 1 – picker
  pickHeader: { marginBottom: Spacing.lg },
  pickSub:    { fontSize: Typography.sizeSM, color: Colors.textMuted, textAlign: 'center', marginTop: 2 },

  tplGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingBottom: Spacing.md },
  tplCard:    { width: '47.5%', borderRadius: Radius.lg, borderWidth: 1, overflow: 'hidden' },
  tplInner:   { paddingVertical: Spacing.md, paddingHorizontal: Spacing.sm, alignItems: 'center', gap: 3 },
  tplEmoji:   { fontSize: 30, marginBottom: 2 },
  tplName:    { fontSize: Typography.sizeSM, fontFamily: Typography.fontSemiBold, color: Colors.textPrimary, textAlign: 'center' },
  tplHint:    { fontSize: 11, fontFamily: Typography.fontSemiBold },
  tplMonthly: { fontSize: 10, fontFamily: Typography.fontRegular, color: Colors.textMuted },

  // Step 2 – form
  formHeader: { marginBottom: Spacing.md },
  backBtn:    { alignSelf: 'flex-start', marginBottom: Spacing.sm },
  backTxt:    { fontSize: Typography.sizeSM, color: Colors.accentTeal, fontFamily: Typography.fontSemiBold },

  emojiRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  emojiSelected: { width: 52, height: 52, borderRadius: Radius.md, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.accentTeal + '60', marginRight: Spacing.sm },

  title:     { fontSize: Typography.sizeLG, fontWeight: Typography.weightBold, color: Colors.textPrimary, textAlign: 'center', marginBottom: 2 },
  label:     { fontSize: Typography.sizeSM, color: Colors.textSecondary, marginBottom: Spacing.xs, marginTop: Spacing.md },
  input:     { backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, color: Colors.textPrimary, fontSize: Typography.sizeMD, borderWidth: 1, borderColor: Glass.border },

  row2:      { flexDirection: 'row', gap: Spacing.md },

  estimate:  { backgroundColor: 'rgba(74,222,128,0.10)', borderRadius: Radius.md, paddingVertical: 8, paddingHorizontal: Spacing.md, marginTop: Spacing.md, borderWidth: 1, borderColor: 'rgba(74,222,128,0.25)', alignItems: 'center' },
  estimateTxt: { fontSize: Typography.sizeSM, color: Colors.success, fontFamily: Typography.fontSemiBold },

  emojiBtn:  { width: 40, height: 40, borderRadius: Radius.md, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Glass.border },
  emojiBtnOn:{ borderColor: Colors.accentTeal, borderWidth: 2 },
  btns:      { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.xl },
  cancel:    { flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.full, paddingVertical: Spacing.md, alignItems: 'center' },
  cancelTxt: { color: Colors.textSecondary, fontWeight: Typography.weightSemiBold },
  save:      { flex: 2, borderRadius: Radius.full, paddingVertical: Spacing.md, alignItems: 'center' },
  saveTxt:   { color: Colors.bg, fontWeight: Typography.weightBold, fontSize: Typography.sizeMD },
});
