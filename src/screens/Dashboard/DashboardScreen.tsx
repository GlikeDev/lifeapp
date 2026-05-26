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
  TouchableOpacity, Modal, FlatList, TextInput, Animated, Easing,
  KeyboardAvoidingView, Platform, Keyboard, ActivityIndicator,
  LayoutAnimation, UIManager, Image, Dimensions,
} from 'react-native';

const SCREEN_H = Dimensions.get('window').height;
const SCREEN_W = Dimensions.get('window').width;

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, G, Circle, Text as SvgText, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { Card, ProgressBar } from '../../components/common';
import { FlowingBar } from '../../components/common/FlowingBar';
import { Colors, Typography, Spacing, Radius, Layout, Glass } from '../../constants/tokens';
import { useBudgetStore } from '../../store/useBudgetStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useWallpaperStore, WALLPAPERS } from '../../store/useWallpaperStore';
import { formatCurrency, monthsLeft } from '../../utils/format';
import { supabase } from '../../lib/supabase';
import type { Transaction, Goal, FridgeItem, Subscription } from '../../types';
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
  cafe:          { key: 'cat.cafe',          color: '#F97316' },
  transport:     { key: 'cat.transport',     color: Colors.categoryTransport },
  home:          { key: 'cat.home',          color: Colors.categoryHome },
  health:        { key: 'cat.health',        color: Colors.accentTeal },
  entertainment: { key: 'cat.entertainment', color: '#FF6B9D' },
  shopping:      { key: 'cat.shopping',      color: '#F5554A' },
  education:     { key: 'cat.education',     color: '#60A5FA' },
  sport:         { key: 'cat.sport',         color: '#39D98A' },
  beauty:        { key: 'cat.beauty',        color: '#FF6B9D' },
  travel:        { key: 'cat.travel',        color: '#38BDF8' },
  pets:          { key: 'cat.pets',          color: '#FBBF24' },
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

const GOAL_BAR_COLORS = [
  '#00D4C8',
  '#7B6CF6',
  '#FF6B9D',
  '#39D98A',
  '#FAAD14',
  '#F5554A',
  '#38BDF8',
  '#F97316',
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
  { emoji: '📱', title: 'Гаджет',         target: 800,   monthly: 150,  color: '#00D4C8' },
  { emoji: '🎓', title: 'Образование',    target: 5000,  monthly: 300,  color: '#7B6CF6' },
  { emoji: '🏋️', title: 'Фитнес',        target: 600,   monthly: 100,  color: '#39D98A' },
  { emoji: '💊', title: 'Здоровье',       target: 2000,  monthly: 200,  color: '#39D98A' },
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
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (6 - i));
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const label = d.toLocaleDateString('ru-RU', { weekday: 'short' }).slice(0, 2);
    const amount = transactions
      .filter(t => t.date === date && t.amount > 0)
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

const BAR_MAX_H = 96;

function SpendingBarChart({ data, animTrigger }: { data: { label: string; amount: number }[]; animTrigger: number }) {
  const maxAmount = Math.max(...data.map(d => d.amount), 1);
  const anims = useRef(data.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    anims.forEach(a => a.setValue(0));
    Animated.stagger(
      45,
      anims.map((a, i) =>
        Animated.timing(a, {
          toValue: 1,
          duration: 420,
          delay: i * 10,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        })
      )
    ).start();
  }, [animTrigger]);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: BAR_MAX_H + 22, paddingTop: 4 }}>
      {data.map((d, i) => {
        const isToday = i === data.length - 1;
        const hasAmount = d.amount > 0;
        const targetH = hasAmount ? Math.max(6, (d.amount / maxAmount) * BAR_MAX_H) : 4;
        const animH = anims[i].interpolate({ inputRange: [0, 1], outputRange: [0, targetH] });
        const teal   = Colors.accentTeal;
        const purple = Colors.accentPurple;

        return (
          <View key={d.label} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: BAR_MAX_H + 22 }}>
            {/* glow layer */}
            {hasAmount && (
              <Animated.View style={{
                position: 'absolute', bottom: 18,
                width: 36, height: animH,
                borderRadius: 8,
                backgroundColor: isToday ? teal : purple,
                opacity: 0.18,
                transform: [{ scaleX: 1.4 }],
              }}/>
            )}
            {/* bar */}
            <Animated.View style={{ width: 26, height: animH, borderRadius: 7, overflow: 'hidden', marginBottom: 4 }}>
              <LinearGradient
                colors={hasAmount
                  ? (isToday ? [teal, teal + '18'] : [purple, purple + '18'])
                  : [Colors.border, Colors.border + '44']}
                start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                style={{ flex: 1 }}
              />
              {/* top shine */}
              {hasAmount && (
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 8, borderRadius: 7, backgroundColor: 'rgba(255,255,255,0.18)' }}/>
              )}
            </Animated.View>
            <Text style={{
              fontSize: 10,
              color: isToday ? teal : Colors.textMuted,
              fontFamily: isToday ? Typography.fontSemiBold : Typography.fontMedium,
            }}>{d.label}</Text>
          </View>
        );
      })}
    </View>
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

  const isAndroid = Platform.OS === 'android';
  return (
    <View style={[cs.wrap, {
      borderColor:  accentColor + (isAndroid ? '70' : '40'),
      borderWidth:  isAndroid ? 1.5 : 1,
      overflow:     'hidden',
      elevation:    isAndroid ? 14 : 6,
    }]}>
      <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: accentColor + (isAndroid ? '1A' : '0D') }]} pointerEvents="none" />
      {/* Top shine line */}
      <View style={{ position: 'absolute', top: 0, left: Radius.xl, right: Radius.xl, height: isAndroid ? 1.5 : 1, backgroundColor: accentColor + (isAndroid ? '80' : '55') }} pointerEvents="none" />
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
  wrap: { marginBottom: Spacing.lg, borderRadius: Radius.xl, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
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

// ─── Subscription helpers ─────────────────────────────────────────────────────

const SUB_CAT_CFG = [
  { key: 'entertainment', aliases: ['streaming'], emoji: '🎬', label: 'Развлечения', color: '#E50914' },
  { key: 'cloud',         aliases: [],            emoji: '☁️',  label: 'Облако',      color: Colors.accentTeal },
  { key: 'ai',            aliases: [],            emoji: '🤖', label: 'ИИ',          color: Colors.accentPurple },
  { key: 'hosting',       aliases: [],            emoji: '🖥️', label: 'Хостинги',    color: Colors.warning },
  { key: 'music',         aliases: [],            emoji: '🎵', label: 'Музыка',       color: '#1DB954' },
  { key: 'fitness',       aliases: [],            emoji: '💪', label: 'Фитнес',       color: Colors.success },
  { key: 'finance',       aliases: [],            emoji: '💼', label: 'Финансы',      color: Colors.pink },
  { key: 'software',      aliases: [],            emoji: '⚙️',  label: 'Сервисы',     color: '#38BDF8' },
  { key: 'other',         aliases: [],            emoji: '📦', label: 'Другое',       color: Colors.textMuted },
];

function toMonthly(amount: number, cycle: string) {
  if (cycle === 'weekly')  return (amount * 52) / 12;
  if (cycle === 'yearly')  return amount / 12;
  return amount;
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function DashboardScreen() {
  const navigation = useNavigation();
  const { user, setUser } = useAuthStore();
  const { wallpaperId } = useWallpaperStore();
  const wallpaperSource = wallpaperId !== null ? WALLPAPERS[wallpaperId] : null;
  const {
    transactions, goals, monthlyBudget,
    setTransactions, setGoals, addGoal, setMonthlyBudget,
    getTotalSpent, getRemaining, getSpentByCategory,
  } = useBudgetStore();

  const [refreshing, setRefreshing] = useState(false);
  const [currencyModal, setCurrencyModal] = useState(false);
  const [insightIdx, setInsightIdx] = useState(0);
  const [chartAnimKey, setChartAnimKey] = useState(0);
  const [showWeekHistory, setShowWeekHistory] = useState(false);

  useFocusEffect(useCallback(() => {
    setChartAnimKey(k => k + 1);
  }, []));

  // Collapsible sections
  const [catsOpen, setCatsOpen] = useState(false);
  const [goalsOpen, setGoalsOpen] = useState(false);
  const [subOpen, setSubOpen] = useState(false);
  const [fridgeOpen, setFridgeOpen] = useState(false);
  const [whatIfOpen, setWhatIfOpen] = useState(false);
  const [fridgeItems, setFridgeItems] = useState<FridgeItem[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const neonAnim   = useRef(new Animated.Value(0)).current;
  const { visible: tipsVisible, complete: tipsDone } = useCoachMark('dashboard');
  const insets = useSafeAreaInsets();
  const { t, lang, setLang, locale } = useTranslation();

  const [showAddModal, setShowAddModal] = useState(false);

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
    setShowGoalModal(true);
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
  const weekData = getLast7Days(transactions);
  const fmt = (n: number) => formatCurrency(n, currency);

  const neonBorderColor = neonAnim.interpolate({
    inputRange: [0, 0.33, 0.66, 1],
    outputRange: ['#00D4C8', '#7B6CF6', '#FF6B9D', '#00D4C8'],
  });

  async function loadData() {
    if (!user) return;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const ago7 = new Date(now); ago7.setDate(now.getDate() - 6);
    const from = (ago7 < monthStart ? ago7 : monthStart).toISOString().slice(0, 10);
    const to   = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);

    const [txRes, goalsRes, profileRes, fridgeRes, subRes] = await Promise.all([
      supabase.from('transactions').select('*').eq('user_id', user.id).gte('date', from).lte('date', to).order('date', { ascending: false }),
      supabase.from('goals').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
      supabase.from('profiles').select('monthly_budget, currency').eq('id', user.id).single(),
      supabase.from('fridge_items').select('*').eq('user_id', user.id).order('expires_at', { ascending: true }),
      supabase.from('subscriptions').select('*').eq('user_id', user.id).eq('is_active', true).order('next_billing', { ascending: true }),
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
    if (subRes.data) setSubscriptions(subRes.data as Subscription[]);
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
    <View style={styles.safe}>
      {wallpaperSource ? (
        <>
          <Image
            source={wallpaperSource}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, height: SCREEN_H }}
            resizeMode="cover"
          />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(5,5,18,0.55)' }]} pointerEvents="none" />
        </>
      ) : (
        <>
          {/* Holographic blob background */}
          <View style={styles.blobTR} pointerEvents="none" />
          <View style={styles.blobCL} pointerEvents="none" />
          <View style={styles.blobBR} pointerEvents="none" />
        </>
      )}
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top']}>

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
          <TouchableOpacity
            activeOpacity={0.82}
            onPress={() => (navigation as any).navigate('FinanceDetail')}
          >
            <LinearGradient
              colors={['rgba(0,212,200,0.09)', 'rgba(123,108,246,0.06)', 'rgba(11,12,27,0)']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.heroCard}
            >
              <View style={styles.heroLabelRow}>
                <Text style={styles.heroLabel}>{t('dash.availableBudget')}</Text>
                <TouchableOpacity
                  onPress={() => setShowAddModal(true)}
                  activeOpacity={0.7}
                  style={styles.heroAddBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.heroAddBtnTxt}>+</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.heroAmountRow}>
                <Text style={styles.heroCurrency}>{currObj.symbol}</Text>
                <Text style={styles.heroNumber}>{balanceInt.toLocaleString('ru-RU')}</Text>
                <Text style={styles.heroDec}>.{balanceDec}</Text>
              </View>

              <View style={{ marginBottom: Spacing.md }}>
                <FlowingBar pct={spentPct} overBudget={spentPct > 1} height={5} borderRadius={999} trackColor="rgba(255,255,255,0.06)" />
              </View>

              <View style={styles.heroStats}>
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatLabel}>{t('dash.spent').toUpperCase()}</Text>
                  <Text style={[styles.heroStatValue, { color: spentPct > 1 ? Colors.danger : Colors.accentTeal }]}>
                    {fmt(totalSpent)}
                  </Text>
                </View>
                <View style={styles.heroStatDivider} />
                <View style={[styles.heroStat, { alignItems: 'flex-end' }]}>
                  <Text style={styles.heroStatLabel}>{t('dash.total').toUpperCase()}</Text>
                  <Text style={styles.heroStatValue}>{fmt(monthlyBudget)}</Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* ── Weekly spending chart ── */}
          <TouchableOpacity
            style={styles.chartCard}
            onPress={() => setShowWeekHistory(true)}
            activeOpacity={0.85}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.xs }}>
              <Text style={styles.chartLabel}>РАСХОДЫ ЗА 7 ДНЕЙ</Text>
              <Text style={{ fontSize: 10, color: Colors.textMuted, fontFamily: Typography.fontMedium }}>история ›</Text>
            </View>
            <SpendingBarChart data={weekData} animTrigger={chartAnimKey} />
          </TouchableOpacity>

          {/* ── Week history modal ── */}
          {(() => {
            const today = new Date(); today.setHours(0,0,0,0);
            const ago6  = new Date(today); ago6.setDate(today.getDate() - 6);
            const weekTxs = [...transactions]
              .filter(tx => { const d = new Date(tx.date); d.setHours(0,0,0,0); return d >= ago6 && d <= today; })
              .sort((a, b) => new Date(b.date + 'T23:59:59').getTime() - new Date(a.date + 'T23:59:59').getTime());

            const byDay: Record<string, typeof weekTxs> = {};
            weekTxs.forEach(tx => {
              if (!byDay[tx.date]) byDay[tx.date] = [];
              byDay[tx.date].push(tx);
            });
            const days = Object.keys(byDay).sort((a, b) => b.localeCompare(a));

            const totalWeekExp = weekTxs.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);

            const dayLabel = (iso: string) => {
              const d = new Date(iso + 'T12:00:00');
              const t = new Date(); t.setHours(0,0,0,0);
              const y = new Date(t); y.setDate(t.getDate()-1);
              if (iso === t.toISOString().slice(0,10)) return 'Сегодня';
              if (iso === y.toISOString().slice(0,10)) return 'Вчера';
              return d.toLocaleDateString('ru-RU', { weekday:'long', day:'numeric', month:'short' });
            };

            const TX_COLOR: Record<string, string> = {
              food: Colors.categoryFood, cafe:'#F97316', restaurant:'#FB923C',
              transport: Colors.categoryTransport, auto:'#94A3B8',
              home: Colors.categoryHome, health: Colors.accentTeal, pharmacy:'#34D399',
              entertainment:'#FF6B9D', shopping:'#F5554A', clothing:'#A78BFA',
              education:'#60A5FA', sport:'#39D98A', beauty:'#FF6B9D',
              travel:'#38BDF8', subscriptions: Colors.accentPurple, pets:'#FBBF24',
              kids:'#FCA5A5', gifts:'#F472B6', alcohol:'#C084FC',
              salary: Colors.success, freelance: Colors.accentPurple,
              business:'#FAAD14', investment:'#39D98A', rental:'#60A5FA',
              bonus:'#FF6B9D', transfer: Colors.accentTeal,
              gift:'#F472B6', cashback: Colors.success, pension:'#94A3B8',
              refund:'#34D399', other: Colors.textMuted,
            };
            const TX_EMOJI: Record<string, string> = {
              food:'🥗', cafe:'☕', restaurant:'🍕', transport:'🚕', auto:'🚗',
              home:'⚡', health:'💊', pharmacy:'💊', entertainment:'🎬',
              shopping:'🛒', clothing:'👕', education:'🎓', sport:'💪',
              beauty:'💍', travel:'✈️', subscriptions:'📱', pets:'🐾',
              kids:'🧒', gifts:'🎁', alcohol:'🍷', salary:'💰',
              freelance:'⚡', business:'💼', investment:'📈', rental:'🏠',
              bonus:'⭐', transfer:'💳', gift:'🎁', cashback:'💸',
              pension:'🏦', refund:'↩️', other:'📦',
            };

            return (
              <Modal visible={showWeekHistory} transparent animationType="slide" onRequestClose={() => setShowWeekHistory(false)}>
                <View style={{ flex: 1, justifyContent: 'flex-end' }}>
                  <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setShowWeekHistory(false)}/>
                  <View style={styles.whSheet}>
                    <View style={styles.addModalHandle}/>

                    {/* Header */}
                    <View style={styles.whHeader}>
                      <View>
                        <Text style={styles.whTitle}>ИСТОРИЯ ЗА 7 ДНЕЙ</Text>
                        <Text style={styles.whSub}>{weekTxs.length} транзакций</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[styles.whAmount, { color: Colors.danger }]}>
                          −{fmt(totalWeekExp)}
                        </Text>
                      </View>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
                      {days.length === 0 ? (
                        <Text style={styles.whEmpty}>Нет транзакций за последние 7 дней</Text>
                      ) : days.map(day => {
                        const txs = byDay[day];
                        const dayTotal = txs.filter(t => t.amount > 0).reduce((s,t) => s + t.amount, 0);
                        return (
                          <View key={day}>
                            {/* Day header */}
                            <View style={styles.whDayRow}>
                              <Text style={styles.whDayLabel}>{dayLabel(day)}</Text>
                              {dayTotal > 0 && (
                                <Text style={styles.whDayTotal}>−{fmt(dayTotal)}</Text>
                              )}
                            </View>
                            {/* Transactions */}
                            {txs.map(tx => {
                              const isIncome = tx.amount < 0;
                              const color = TX_COLOR[tx.category] ?? Colors.textMuted;
                              const emoji = TX_EMOJI[tx.category] ?? '📦';
                              const label = tx.note || tx.store || t(`cat.${tx.category}`) || tx.category;
                              return (
                                <View key={tx.id} style={styles.whTxRow}>
                                  <View style={[styles.whTxDot, { backgroundColor: color + '22', borderColor: color + '55' }]}>
                                    <Text style={{ fontSize: 13 }}>{emoji}</Text>
                                  </View>
                                  <View style={{ flex: 1 }}>
                                    <Text style={styles.whTxLabel} numberOfLines={1}>{label}</Text>
                                    <Text style={styles.whTxCat}>{t(`cat.${tx.category}`)}</Text>
                                  </View>
                                  <Text style={[styles.whTxAmount, { color: isIncome ? Colors.success : Colors.textPrimary }]}>
                                    {isIncome ? '+' : '−'}{fmt(Math.abs(tx.amount))}
                                  </Text>
                                </View>
                              );
                            })}
                          </View>
                        );
                      })}
                      <View style={{ height: 24 }}/>
                    </ScrollView>
                  </View>
                </View>
              </Modal>
            );
          })()}

          {/* ── Add transaction modal ── */}
          <Modal visible={showAddModal} animationType="slide" transparent onRequestClose={() => setShowAddModal(false)}>
            <TouchableOpacity style={styles.addModalOverlay} activeOpacity={1} onPress={() => setShowAddModal(false)}>
              <TouchableOpacity activeOpacity={1} style={styles.addModalSheet} onPress={() => {}}>
                <View style={styles.addModalHandle} />
                <Text style={styles.addModalTitle}>Добавить операцию</Text>
                <TouchableOpacity
                  style={[styles.addModalBtn, styles.addModalBtnExpense]}
                  activeOpacity={0.8}
                  onPress={() => { setShowAddModal(false); (navigation as any).navigate('Scan', { mode: 'manual', txType: 'expense' }); }}
                >
                  <Text style={styles.addModalSign}>−</Text>
                  <View>
                    <Text style={[styles.addModalBtnLabel, { color: Colors.danger }]}>{t('dash.addExpense')}</Text>
                    <Text style={styles.addModalBtnSub}>Списание средств</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.addModalBtn, styles.addModalBtnIncome]}
                  activeOpacity={0.8}
                  onPress={() => { setShowAddModal(false); (navigation as any).navigate('Scan', { mode: 'manual', txType: 'income' }); }}
                >
                  <Text style={[styles.addModalSign, { color: Colors.success }]}>+</Text>
                  <View>
                    <Text style={[styles.addModalBtnLabel, { color: Colors.success }]}>{t('dash.addIncome')}</Text>
                    <Text style={styles.addModalBtnSub}>Пополнение баланса</Text>
                  </View>
                </TouchableOpacity>
              </TouchableOpacity>
            </TouchableOpacity>
          </Modal>

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
                accentColor={Colors.accentTeal}
                badge={catTotal > 0 ? `${currObj.symbol}${Math.round(catTotal).toLocaleString('ru-RU')}` : undefined}
                open={catsOpen}
                onToggle={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setCatsOpen(v => !v); }}
              >
                {activeCats.length === 0 ? (
                  <Text style={styles.catEmpty}>{t('dash.cat.empty')}</Text>
                ) : (
                  <View style={{ gap: 8 }}>
                    {activeCats.map(({ key, cfg, amount }) => {
                      const pct = catTotal > 0 ? amount / catTotal : 0;
                      return (
                        <View key={key} style={styles.catRow}>
                          <View style={[styles.catDot, { backgroundColor: cfg.color }]} />
                          <Text style={styles.catRowLabel} numberOfLines={1}>{t(cfg.key)}</Text>
                          <View style={styles.catRowBar}>
                            <LinearGradient
                              colors={[cfg.color + '77', cfg.color]}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 0 }}
                              style={[styles.catRowBarFill, { width: `${Math.round(pct * 100)}%` as any }]}
                            />
                          </View>
                          <Text style={[styles.catRowAmount, { color: cfg.color }]}>{currObj.symbol}{Math.round(amount)}</Text>
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
            {goals.length === 0 ? (
              <TouchableOpacity style={styles.goalsEmpty} onPress={() => openGoalModal()} activeOpacity={0.8}>
                <Text style={styles.emptyIcon}>🎯</Text>
                <Text style={styles.emptyTitle}>{t('dash.goals.emptyTitle')}</Text>
                <Text style={styles.emptyText}>{t('dash.goals.emptyDesc')}</Text>
              </TouchableOpacity>
            ) : (
              <>
              {goals.map((goal, idx) => {
                const progress = goal.target_amount > 0 ? goal.current_amount / goal.target_amount : 0;
                const pct = Math.round(Math.min(progress * 100, 100));
                const months = monthsLeft(goal.current_amount, goal.target_amount, goal.monthly_contribution);
                const palette = GOAL_PALETTES[idx % GOAL_PALETTES.length];
                const barColor = GOAL_BAR_COLORS[idx % GOAL_BAR_COLORS.length];
                return (
                  <LinearGradient key={goal.id} colors={palette} style={styles.goalCard} start={{x:0,y:0}} end={{x:1,y:1}}>
                    <View style={styles.goalCardTop}>
                      <View style={[styles.goalEmojiWrap, { backgroundColor: barColor + '22', borderColor: barColor + '38' }]}>
                        <LinearGradient
                          colors={['rgba(255,255,255,0.22)', 'rgba(255,255,255,0)']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={StyleSheet.absoluteFill}
                          pointerEvents="none"
                        />
                        <Text style={{ fontSize: 22 }}>{goal.emoji}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.goalCardTitle} numberOfLines={1}>{goal.title}</Text>
                        <Text style={[styles.goalCardAmts, { color: barColor }]}>
                          {fmt(goal.current_amount)}
                          <Text style={styles.goalCardAmtMuted}> / {fmt(goal.target_amount)}</Text>
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: 6 }}>
                        <View style={[styles.goalPctBadge, { backgroundColor: barColor + '1A', borderColor: barColor + '40' }]}>
                          <Text style={[styles.goalPctTxt, { color: barColor }]}>{pct}%</Text>
                        </View>
                        <TouchableOpacity onPress={() => handleDeleteGoal(goal.id)} style={styles.goalTrashBtn}>
                          <Text style={styles.goalTrashTxt}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View style={styles.goalBarTrack}>
                      <LinearGradient
                        colors={[barColor + '77', barColor]}
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
              })}
              <TouchableOpacity style={styles.goalsAddBtn} onPress={openGoalModal} activeOpacity={0.7}>
                <Text style={styles.goalsAddTxt}>+ Добавить цель</Text>
              </TouchableOpacity>
              </>
            )}
          </CollapsibleSection>

          {/* ── Subscriptions Section ── */}
          {(() => {
            const activeSubs = subscriptions.filter(s => s.is_active);
            const totalMonthly = activeSubs.reduce((acc, s) => acc + toMonthly(s.amount, s.cycle), 0);

            // Group by category config
            const grouped = SUB_CAT_CFG.map(cfg => {
              const matches = activeSubs.filter(s =>
                s.category === cfg.key || cfg.aliases.includes(s.category as string)
              );
              return { cfg, monthly: matches.reduce((sum, s) => sum + toMonthly(s.amount, s.cycle), 0), count: matches.length };
            }).filter(g => g.count > 0);

            const maxMonthly = grouped.reduce((m, g) => Math.max(m, g.monthly), 1);

            return (
              <CollapsibleSection
                title="ПОДПИСКИ"
                accentColor={Colors.accentPurple}
                badge={activeSubs.length > 0 ? `${currObj.symbol}${Math.round(totalMonthly)}/мес` : undefined}
                open={subOpen}
                onToggle={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setSubOpen(v => !v); }}
              >
                {activeSubs.length === 0 ? (
                  <TouchableOpacity style={styles.goalsEmpty} onPress={() => (navigation as any).navigate('More', { screen: 'Subscriptions' })} activeOpacity={0.8}>
                    <Text style={styles.emptyIcon}>💳</Text>
                    <Text style={styles.emptyTitle}>Нет активных подписок</Text>
                    <Text style={styles.emptyText}>Добавьте подписки в разделе Профиль → Подписки</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={{ gap: 8 }}>
                    {grouped.map(({ cfg, monthly, count }) => {
                      const pct = monthly / maxMonthly;
                      const countLabel = count === 1 ? '1 сервис' : count < 5 ? `${count} сервиса` : `${count} сервисов`;
                      return (
                        <View key={cfg.key} style={styles.catRow}>
                          <View style={[styles.subCatDot, { backgroundColor: cfg.color + '22', borderColor: cfg.color + '50' }]}>
                            <Text style={{ fontSize: 13 }}>{cfg.emoji}</Text>
                          </View>
                          <Text style={styles.subCatLabel} numberOfLines={1}>{cfg.label}</Text>
                          <View style={{ flex: 1, gap: 3 }}>
                            <View style={styles.catRowBar}>
                              <LinearGradient
                                colors={[cfg.color + '77', cfg.color]}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                style={[styles.catRowBarFill, { width: `${Math.round(pct * 100)}%` as any }]}
                              />
                            </View>
                            <Text style={styles.subCatCount}>{countLabel}</Text>
                          </View>
                          <Text style={[styles.catRowAmount, { color: cfg.color }]}>{currObj.symbol}{Math.round(monthly)}/м</Text>
                        </View>
                      );
                    })}
                    <TouchableOpacity
                      style={styles.subManageBtn}
                      onPress={() => (navigation as any).navigate('More', { screen: 'Subscriptions' })}
                      activeOpacity={0.75}
                    >
                      <Text style={styles.subManageTxt}>Управлять подписками →</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </CollapsibleSection>
            );
          })()}

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
          <TouchableOpacity style={gm.backdrop} activeOpacity={1} onPress={() => { Keyboard.dismiss(); setShowGoalModal(false); }}>
            <BlurView intensity={92} tint="dark" style={StyleSheet.absoluteFill} />
          </TouchableOpacity>
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
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.bg },
  scroll:  { flex: 1 },
  content: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Layout.tabBarClearance },

  // Holographic blob background layers
  blobTR: { position: 'absolute', width: 320, height: 200, top: -60, right: -80, borderRadius: 999, backgroundColor: 'rgba(0,212,200,0.16)', opacity: 0.6, transform: [{ scaleX: 1.4 }] },
  blobCL: { position: 'absolute', width: 280, height: 220, top: '28%', left: -100, borderRadius: 999, backgroundColor: 'rgba(123,108,246,0.14)', opacity: 0.6, transform: [{ scaleY: 1.3 }] },
  blobBR: { position: 'absolute', width: 300, height: 200, bottom: 120, right: -80, borderRadius: 999, backgroundColor: 'rgba(255,107,157,0.10)', opacity: 0.6, transform: [{ scaleX: 1.3 }] },

  // Header
  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.xl },
  monthLabel:      { fontSize: Typography.sizeXS, fontFamily: Typography.fontMedium, color: Colors.textMuted, letterSpacing: 1.2 },
  langBtn:         { backgroundColor: 'rgba(123,108,246,0.12)', borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: 7, borderWidth: 1, borderColor: 'rgba(123,108,246,0.35)' },
  langBtnText:     { fontSize: Typography.sizeSM, fontFamily: Typography.fontSemiBold, color: Colors.accentPurple },
  currencyBtn:     { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,212,200,0.12)', borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: 7, borderWidth: 1, borderColor: 'rgba(0,212,200,0.35)' },
  currencyBtnText: { fontSize: Typography.sizeSM, fontFamily: Typography.fontSemiBold, color: Colors.accentTeal },
  currencyChevron: { fontSize: 10, color: Colors.accentTeal },

  // Hero card
  heroCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(0,212,200,0.18)',
    padding: Spacing.xl,
    marginBottom: Spacing.md,
  },
  heroLabelRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
  heroLabel:     { fontSize: Typography.sizeXS, fontFamily: Typography.fontMedium, color: Colors.textMuted, letterSpacing: 0.8 },
  heroAddBtn:    { width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(0,212,200,0.15)', borderWidth: 1, borderColor: 'rgba(0,212,200,0.45)', alignItems: 'center', justifyContent: 'center' },
  heroAddBtnTxt: { fontSize: 17, fontFamily: Typography.fontBold, color: Colors.accentTeal, lineHeight: 20, marginTop: Platform.OS === 'android' ? -1 : 0 },
  addModalOverlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  addModalSheet:      { backgroundColor: '#1A1B2E', borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: 36, gap: Spacing.md, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  addModalHandle:     { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.18)', alignSelf: 'center', marginBottom: Spacing.sm },
  addModalTitle:      { fontSize: Typography.sizeSM, fontFamily: Typography.fontSemiBold, color: Colors.textMuted, textAlign: 'center', letterSpacing: 0.5, marginBottom: Spacing.xs },
  addModalBtn:        { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.lg, paddingHorizontal: Spacing.lg, borderRadius: Radius.lg, borderWidth: 1 },
  addModalBtnExpense: { backgroundColor: Colors.danger + '12', borderColor: Colors.danger + '33' },
  addModalBtnIncome:  { backgroundColor: Colors.success + '12', borderColor: Colors.success + '33' },
  addModalSign:       { fontSize: 28, fontFamily: Typography.fontBold, color: Colors.danger, width: 32, textAlign: 'center' },
  addModalBtnLabel:   { fontSize: Typography.sizeMD, fontFamily: Typography.fontSemiBold },
  addModalBtnSub:     { fontSize: Typography.sizeXS, fontFamily: Typography.fontRegular, color: Colors.textMuted, marginTop: 2 },
  heroAmountRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: Spacing.lg },
  heroCurrency:  { fontSize: 20, fontFamily: Typography.fontDisplay, color: Colors.textSecondary, marginBottom: 5, marginRight: 3 },
  heroNumber:    { fontSize: 52, fontFamily: Typography.fontDisplay, color: Colors.textPrimary, lineHeight: 56, letterSpacing: -1.5 },
  heroDec:       { fontSize: 18, fontFamily: Typography.fontDisplay, color: Colors.textMuted, marginBottom: 6, marginLeft: 2 },

  // Progress bar
  barTrack: { height: 5, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: Radius.full, overflow: 'hidden', marginBottom: Spacing.md },
  barFill:  { height: '100%', borderRadius: Radius.full },

  chartCard:  { marginBottom: Spacing.lg, backgroundColor: Glass.surface, borderRadius: Radius.xl, borderWidth: 1, borderColor: Glass.border, paddingHorizontal: Spacing.md, paddingTop: Spacing.md, paddingBottom: Spacing.xs },
  chartLabel: { fontSize: Typography.sizeXS, fontFamily: Typography.fontMedium, color: Colors.textMuted, letterSpacing: 1.2, marginBottom: Spacing.xs },

  heroStats:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroStat:        { gap: 3 },
  heroStatLabel:   { fontSize: 10, fontFamily: Typography.fontMedium, color: Colors.textMuted, letterSpacing: 0.8 },
  heroStatValue:   { fontSize: Typography.sizeSM, fontFamily: Typography.fontSemiBold, color: Colors.textSecondary },
  heroStatDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.08)' },

  // Categories rows
  catRow:         { flexDirection: 'row', alignItems: 'center', gap: 8 },
  catDot:         { width: 8, height: 8, borderRadius: 4 },
  catRowLabel:    { width: 90, fontSize: Typography.sizeSM, fontFamily: Typography.fontMedium, color: Colors.textSecondary },
  catRowBar:      { flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: Radius.full, overflow: 'hidden' },
  catRowBarFill:  { height: '100%', borderRadius: Radius.full },
  catRowAmount:   { width: 64, fontSize: Typography.sizeSM, fontFamily: Typography.fontSemiBold, textAlign: 'right' },
  catEmpty:   { fontSize: Typography.sizeSM, fontFamily: Typography.fontMedium, color: Colors.textMuted, textAlign: 'center', paddingVertical: Spacing.lg },

  // Goals section
  goalsEmpty:           { paddingVertical: Spacing.xl, alignItems: 'center', backgroundColor: 'transparent' },
  goalsAddBtn:          { marginTop: Spacing.sm, paddingVertical: Spacing.md, alignItems: 'center', borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.accentPurple + '40', backgroundColor: Colors.accentPurple + '0A' },
  goalsAddTxt:          { fontSize: Typography.sizeSM, color: Colors.accentPurple, fontWeight: Typography.weightSemiBold },

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
  fridgeStat:         { flex: 1, paddingVertical: Spacing.sm, alignItems: 'center' },
  fridgeStatNum:      { fontSize: Typography.sizeLG, fontFamily: Typography.fontBold },
  fridgeStatLabel:    { fontSize: 9, fontFamily: Typography.fontMedium, color: Colors.textMuted, letterSpacing: 0.5 },
  fridgeRow:          { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 0, paddingVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.07)' },
  fridgeRowName:      { flex: 1, fontSize: Typography.sizeSM, fontFamily: Typography.fontMedium, color: Colors.textPrimary },
  fridgeRowQty:       { fontSize: Typography.sizeXS, fontFamily: Typography.fontRegular, color: Colors.textMuted },
  fridgeRowBadge:     { borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
  fridgeRowBadgeTxt:  { fontSize: 10, fontFamily: Typography.fontSemiBold },

  goalCard:       { borderRadius: Radius.xl, padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: Glass.border },
  goalCardTop:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md },
  goalEmojiWrap:  { width: 46, height: 46, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1 },
  goalCardTitle:  { fontSize: Typography.sizeMD, fontFamily: Typography.fontSemiBold, color: Colors.textPrimary },
  goalCardAmts:   { fontSize: Typography.sizeSM, fontFamily: Typography.fontSemiBold, color: Colors.success, marginTop: 2 },
  goalCardAmtMuted:{ color: Colors.textMuted, fontFamily: Typography.fontRegular },
  goalCardSub:    { fontSize: Typography.sizeXS, fontFamily: Typography.fontMedium, color: Colors.textSecondary, marginTop: Spacing.sm },
  goalPctBadge:   { backgroundColor: 'rgba(74,222,128,0.18)', borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(74,222,128,0.4)' },
  goalPctTxt:     { fontSize: Typography.sizeXS, color: Colors.success, fontFamily: Typography.fontSemiBold },
  goalTrashBtn:   { padding: 2 },
  goalTrashTxt:   { fontSize: 12, color: Colors.textMuted },
  goalBarTrack:   { height: 5, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: Radius.full, overflow: 'hidden' },
  goalBarFill:    { height: '100%', borderRadius: Radius.full },

  emptyIcon:  { fontSize: 36, marginBottom: Spacing.md },
  emptyTitle: { fontSize: Typography.sizeMD, fontFamily: Typography.fontSemiBold, color: Colors.textPrimary, marginBottom: Spacing.xs },
  emptyText:  { fontSize: Typography.sizeSM, fontFamily: Typography.fontMedium, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },

  // Subscriptions
  subCatDot:    { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  subCatLabel:  { width: 86, fontSize: Typography.sizeSM, fontFamily: Typography.fontMedium, color: Colors.textSecondary },
  subCatCount:  { fontSize: 10, fontFamily: Typography.fontMedium, color: Colors.textMuted },
  subManageBtn: { marginTop: Spacing.md, alignItems: 'center', paddingVertical: Spacing.sm },
  subManageTxt: { fontSize: Typography.sizeSM, fontFamily: Typography.fontSemiBold, color: Colors.accentPurple },

  // AI card (goal emojis in gm stylesheet below)
  aiCard: {
    borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md,
    backgroundColor: 'rgba(0,212,200,0.06)',
    borderWidth: 1, borderColor: 'rgba(0,212,200,0.25)',
    overflow: 'hidden',
    shadowColor: '#00D4C8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 16,
  },
  aiShine: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(0,212,200,0.30)' },
  aiLabel: { fontSize: Typography.sizeXS, fontFamily: Typography.fontSemiBold, color: Colors.accentTeal, letterSpacing: 1, marginBottom: Spacing.sm },
  aiText:  { fontSize: Typography.sizeSM, fontFamily: Typography.fontMedium, color: Colors.textSecondary, lineHeight: 20 },
  aiDots:  { flexDirection: 'row', gap: 6, marginTop: Spacing.sm },
  aiDot:   { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(0,212,200,0.25)' },
  aiDotActive: { backgroundColor: Colors.accentTeal, width: 16 },

  // Week history modal
  whSheet:     { backgroundColor: 'rgba(13,14,26,0.98)', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 12, paddingHorizontal: Spacing.xl, maxHeight: '85%', flex: 1, marginTop: 'auto' as any },
  whHeader:    { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Glass.border, marginBottom: Spacing.sm },
  whTitle:     { fontSize: Typography.sizeXS, fontFamily: Typography.fontSemiBold, color: Colors.textMuted, letterSpacing: 1.2 },
  whSub:       { fontSize: Typography.sizeSM, fontFamily: Typography.fontMedium, color: Colors.textSecondary, marginTop: 2 },
  whAmount:    { fontSize: 18, fontFamily: Typography.fontBold, color: Colors.danger },
  whEmpty:     { textAlign: 'center', color: Colors.textMuted, marginTop: 40, fontFamily: Typography.fontMedium },
  whDayRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.sm, marginTop: Spacing.sm },
  whDayLabel:  { fontSize: Typography.sizeSM, fontFamily: Typography.fontSemiBold, color: Colors.textSecondary, textTransform: 'capitalize' },
  whDayTotal:  { fontSize: Typography.sizeSM, fontFamily: Typography.fontMedium, color: Colors.textMuted },
  whTxRow:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  whTxDot:     { width: 38, height: 38, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  whTxLabel:   { fontSize: Typography.sizeSM, fontFamily: Typography.fontSemiBold, color: Colors.textPrimary },
  whTxCat:     { fontSize: 11, fontFamily: Typography.fontMedium, color: Colors.textMuted, marginTop: 1 },
  whTxAmount:  { fontSize: Typography.sizeSM, fontFamily: Typography.fontSemiBold, color: Colors.textPrimary },
});

// ─── Goal modal styles ────────────────────────────────────────────────────────

const gm = StyleSheet.create({
  backdrop:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet:     { backgroundColor: '#0D0E1C', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: Spacing.xl, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
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
