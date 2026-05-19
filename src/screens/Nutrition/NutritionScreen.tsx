import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { Colors, Typography, Spacing, Radius, Layout } from '../../constants/tokens';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ─── Types ────────────────────────────────────────────────────────────────────

type NutrientStatus = 'deficit' | 'warning' | 'normal';

interface MacroData {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

interface VitaminEntry {
  name: string;
  icon: string;
  current: number;
  status: NutrientStatus;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TARGETS: MacroData = { calories: 2100, protein: 90, fat: 70, carbs: 250 };

const RING_SIZE = 240;
const STROKE = 12;
const GAP = 8;
const R1 = 108;
const R2 = R1 - STROKE - GAP;
const R3 = R2 - STROKE - GAP;
const CX = RING_SIZE / 2;

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function statusColor(s: NutrientStatus): string {
  return s === 'deficit' ? Colors.danger : s === 'warning' ? Colors.warning : Colors.success;
}

function statusLabel(s: NutrientStatus): string {
  return s === 'deficit' ? 'Дефицит' : s === 'warning' ? 'Внимание' : 'Норма';
}

function progressToStatus(p: number): NutrientStatus {
  return p < 0.4 ? 'deficit' : p < 0.7 ? 'warning' : 'normal';
}

function buildVitamins(cal: number, prot: number, fat: number, carbs: number): VitaminEntry[] {
  const calP  = Math.min(cal   / TARGETS.calories, 1);
  const protP = Math.min(prot  / TARGETS.protein,  1);
  const fatP  = Math.min(fat   / TARGETS.fat,       1);
  const carbP = Math.min(carbs / TARGETS.carbs,     1);
  return [
    { name: 'Витамин D',   icon: '☀️', current: fatP  * 0.70, status: progressToStatus(fatP  * 0.70) },
    { name: 'Железо',      icon: '🩸', current: protP * 0.80, status: progressToStatus(protP * 0.80) },
    { name: 'Витамин B12', icon: '💊', current: protP * 0.75, status: progressToStatus(protP * 0.75) },
    { name: 'Витамин C',   icon: '🍊', current: carbP * 0.90, status: progressToStatus(carbP * 0.90) },
    { name: 'Магний',      icon: '⚡', current: calP  * 0.85, status: progressToStatus(calP  * 0.85) },
    { name: 'Кальций',     icon: '🦴', current: fatP  * 0.80, status: progressToStatus(fatP  * 0.80) },
  ];
}

function calcScore(vitamins: VitaminEntry[]): number {
  if (!vitamins.length) return 0;
  return Math.round(vitamins.reduce((sum, v) => sum + v.current, 0) / vitamins.length * 100);
}

function buildAiText(deficits: VitaminEntry[]): string | null {
  if (!deficits.length) return null;
  const foods: Record<string, string> = {
    'Витамин D':   'лосось, яйца, молоко',
    'Железо':      'шпинат, говядина, бобовые',
    'Витамин B12': 'лосось, творог, яйца',
    'Витамин C':   'болгарский перец, апельсин, киви',
    'Магний':      'орехи, гречка, тёмный шоколад',
    'Кальций':     'молоко, сыр, брокколи',
  };
  const names = deficits.map(d => d.name).join(', ');
  const food = [...new Set(deficits.map(d => foods[d.name] ?? 'разнообразные продукты'))].join(' · ');
  return `Обнаружен дефицит: ${names}.\n\nРекомендую добавить: ${food}\n\n+€6–10/нед закроет дефицит.`;
}

// ─── Activity Rings (Apple Watch style) ──────────────────────────────────────

function ActivityRings({ proteinPct, fatPct, carbsPct, calories, target }: {
  proteinPct: number; fatPct: number; carbsPct: number; calories: number; target: number;
}) {
  const aC = useRef(new Animated.Value(0)).current;
  const aF = useRef(new Animated.Value(0)).current;
  const aP = useRef(new Animated.Value(0)).current;

  const c1 = 2 * Math.PI * R1;
  const c2 = 2 * Math.PI * R2;
  const c3 = 2 * Math.PI * R3;

  useEffect(() => {
    aC.setValue(0); aF.setValue(0); aP.setValue(0);
    Animated.parallel([
      Animated.timing(aC, { toValue: carbsPct,   duration: 1100, delay: 0,   useNativeDriver: false }),
      Animated.timing(aF, { toValue: fatPct,     duration: 1100, delay: 200, useNativeDriver: false }),
      Animated.timing(aP, { toValue: proteinPct, duration: 1100, delay: 400, useNativeDriver: false }),
    ]).start();
  }, [carbsPct, fatPct, proteinPct]);

  const offC = aC.interpolate({ inputRange: [0, 1], outputRange: [c1, 0] });
  const offF = aF.interpolate({ inputRange: [0, 1], outputRange: [c2, 0] });
  const offP = aP.interpolate({ inputRange: [0, 1], outputRange: [c3, 0] });

  const ratio     = target > 0 ? calories / target : 0;
  const calColor  = ratio > 0.95 ? Colors.danger : ratio > 0.75 ? Colors.warning : Colors.accentTeal;
  const remaining = Math.max(0, target - calories);

  return (
    <View style={{ width: RING_SIZE, height: RING_SIZE, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={RING_SIZE} height={RING_SIZE} style={StyleSheet.absoluteFill}>
        {/* Track */}
        <Circle cx={CX} cy={CX} r={R1} stroke={Colors.border} strokeWidth={STROKE} fill="none" opacity={0.5} />
        <Circle cx={CX} cy={CX} r={R2} stroke={Colors.border} strokeWidth={STROKE} fill="none" opacity={0.5} />
        <Circle cx={CX} cy={CX} r={R3} stroke={Colors.border} strokeWidth={STROKE} fill="none" opacity={0.5} />
        {/* Carbs outer ring */}
        <AnimatedCircle cx={CX} cy={CX} r={R1} stroke={Colors.accentPurple} strokeWidth={STROKE} fill="none"
          strokeDasharray={`${c1} ${c1}`} strokeDashoffset={offC}
          strokeLinecap="round" rotation="-90" origin={`${CX}, ${CX}`}
        />
        {/* Fat middle ring */}
        <AnimatedCircle cx={CX} cy={CX} r={R2} stroke={Colors.pink} strokeWidth={STROKE} fill="none"
          strokeDasharray={`${c2} ${c2}`} strokeDashoffset={offF}
          strokeLinecap="round" rotation="-90" origin={`${CX}, ${CX}`}
        />
        {/* Protein inner ring */}
        <AnimatedCircle cx={CX} cy={CX} r={R3} stroke={Colors.accentTeal} strokeWidth={STROKE} fill="none"
          strokeDasharray={`${c3} ${c3}`} strokeDashoffset={offP}
          strokeLinecap="round" rotation="-90" origin={`${CX}, ${CX}`}
        />
      </Svg>
      <View style={{ alignItems: 'center' }}>
        <Text style={s.calLabel}>КАЛОРИИ</Text>
        <Text style={[s.calValue, { color: calColor }]}>
          {calories > 0 ? calories.toLocaleString('ru-RU') : '—'}
        </Text>
        <Text style={s.calTarget}>из {target.toLocaleString('ru-RU')}</Text>
        {remaining > 0 && calories > 0 && (
          <View style={[s.remainBadge, { borderColor: calColor + '50', backgroundColor: calColor + '18' }]}>
            <Text style={[s.remainText, { color: calColor }]}>−{remaining.toLocaleString('ru-RU')} осталось</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Legend Item ──────────────────────────────────────────────────────────────

function LegendItem({ color, label, value, target, unit }: {
  color: string; label: string; value: number; target: number; unit: string;
}) {
  return (
    <View style={s.legendItem}>
      <View style={[s.legendDot, { backgroundColor: color }]} />
      <View>
        <Text style={s.legendLabel}>{label}</Text>
        <Text style={[s.legendValue, { color }]}>
          {value}
          <Text style={s.legendTarget}> / {target}{unit}</Text>
        </Text>
      </View>
    </View>
  );
}

// ─── Macro Card ───────────────────────────────────────────────────────────────

function MacroCard({ label, value, target, unit, color, icon }: {
  label: string; value: number; target: number; unit: string; color: string; icon: string;
}) {
  const pct = target > 0 ? Math.min(value / target, 1) : 0;
  return (
    <View style={[s.macroCard, { borderColor: color + '40' }]}>
      <LinearGradient
        colors={[color + '22', 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Text style={s.macroIcon}>{icon}</Text>
      <Text style={[s.macroValue, { color }]}>
        {value}<Text style={s.macroUnit}>{unit}</Text>
      </Text>
      <Text style={s.macroLabel}>{label}</Text>
      <Text style={s.macroMeta}>/ {target}{unit}</Text>
      <View style={s.macroTrack}>
        <View style={{ height: 3, borderRadius: 2, backgroundColor: color, width: `${Math.round(pct * 100)}%` as any }} />
      </View>
    </View>
  );
}

// ─── Mini Ring ────────────────────────────────────────────────────────────────

function MiniRing({ progress, color, size = 52 }: { progress: number; color: string; size?: number }) {
  const stroke = 5;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: progress, duration: 900, delay: 400, useNativeDriver: false }).start();
  }, [progress]);

  const offset = anim.interpolate({ inputRange: [0, 1], outputRange: [circ, 0] });

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={Colors.border} strokeWidth={stroke} fill="none" />
        <AnimatedCircle
          cx={size / 2} cy={size / 2} r={r}
          stroke={color} strokeWidth={stroke} fill="none"
          strokeDasharray={`${circ} ${circ}`} strokeDashoffset={offset}
          strokeLinecap="round" rotation="-90" origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ fontSize: 10, fontWeight: '700', color }}>{Math.round(progress * 100)}%</Text>
      </View>
    </View>
  );
}

// ─── Vitamin Card ─────────────────────────────────────────────────────────────

function VitaminCard({ name, icon, current, status }: VitaminEntry) {
  const color = statusColor(status);
  return (
    <View style={[s.vitCard, { borderColor: color + '35' }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1, marginRight: Spacing.sm }}>
          <Text style={{ fontSize: 20, marginBottom: 4 }}>{icon}</Text>
          <Text style={s.vitName}>{name}</Text>
          <View style={[s.vitBadge, { backgroundColor: color + '20' }]}>
            <Text style={[s.vitBadgeText, { color }]}>{statusLabel(status)}</Text>
          </View>
        </View>
        <MiniRing progress={current} color={color} size={52} />
      </View>
    </View>
  );
}

// ─── AI Card ─────────────────────────────────────────────────────────────────

function AiCard({ text }: { text: string }) {
  return (
    <View style={s.aiCard}>
      <LinearGradient
        colors={[Colors.accentPurple + '35', Colors.accentTeal + '20']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md }}>
        <Text style={s.aiStar}>✦</Text>
        <Text style={s.aiTitle}>AI Рекомендации</Text>
      </View>
      <Text style={s.aiText}>{text}</Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function NutritionScreen() {
  const { user } = useAuthStore();
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [macros, setMacros]       = useState<MacroData>({ calories: 0, protein: 0, fat: 0, carbs: 0 });
  const [vitamins, setVitamins]   = useState<VitaminEntry[]>(() => buildVitamins(0, 0, 0, 0));

  async function loadNutrition() {
    if (!user) return;

    const { data: fridgeItems } = await supabase
      .from('fridge_items')
      .select('product_id, quantity')
      .eq('user_id', user.id);

    if (!fridgeItems?.length) {
      setMacros({ calories: 0, protein: 0, fat: 0, carbs: 0 });
      setVitamins(buildVitamins(0, 0, 0, 0));
      return;
    }

    const productIds = fridgeItems.map(i => i.product_id).filter(Boolean) as string[];
    if (!productIds.length) return;

    const { data: products } = await supabase
      .from('products')
      .select('id, calories_per_100g, protein_per_100g, fat_per_100g, carbs_per_100g')
      .in('id', productIds);

    if (!products) return;

    let cal = 0, prot = 0, fat = 0, carbs = 0;
    const pm = new Map(products.map(p => [p.id, p]));

    for (const item of fridgeItems) {
      const p = item.product_id ? pm.get(item.product_id) : null;
      if (!p) continue;
      const g = (item.quantity * 100) / 30;
      cal   += ((p.calories_per_100g ?? 0) * g) / 100;
      prot  += ((p.protein_per_100g  ?? 0) * g) / 100;
      fat   += ((p.fat_per_100g      ?? 0) * g) / 100;
      carbs += ((p.carbs_per_100g    ?? 0) * g) / 100;
    }

    setMacros({ calories: Math.round(cal), protein: Math.round(prot), fat: Math.round(fat), carbs: Math.round(carbs) });
    setVitamins(buildVitamins(cal, prot, fat, carbs));
  }

  useEffect(() => {
    loadNutrition().finally(() => setLoading(false));
  }, [user]);

  async function onRefresh() {
    setRefreshing(true);
    await loadNutrition();
    setRefreshing(false);
  }

  const hasData    = macros.calories > 0;
  const deficits   = vitamins.filter(v => v.status === 'deficit');
  const aiText     = hasData ? buildAiText(deficits) : null;
  const proteinPct = Math.min(macros.protein / TARGETS.protein, 1);
  const fatPct     = Math.min(macros.fat     / TARGETS.fat,     1);
  const carbsPct   = Math.min(macros.carbs   / TARGETS.carbs,   1);
  const today      = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });

  if (loading) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.center}>
          <ActivityIndicator color={Colors.accentTeal} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        indicatorStyle="white"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accentTeal} />}
      >
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.title}>Нутриция</Text>
            <Text style={s.subtitle}>{today}</Text>
          </View>
          {hasData && (
            <View style={s.scoreBadge}>
              <Text style={s.scoreLabel}>Здоровье</Text>
              <Text style={s.scoreValue}>{calcScore(vitamins)}%</Text>
            </View>
          )}
        </View>

        {/* Activity Rings Hero */}
        <View style={s.heroCard}>
          <LinearGradient
            colors={['#1D1E38', '#131427']}
            style={StyleSheet.absoluteFill}
          />
          <View style={{ alignItems: 'center', paddingTop: Spacing.xxl, paddingBottom: Spacing.lg }}>
            <ActivityRings
              proteinPct={proteinPct}
              fatPct={fatPct}
              carbsPct={carbsPct}
              calories={macros.calories}
              target={TARGETS.calories}
            />
          </View>
          <View style={s.legendRow}>
            <LegendItem color={Colors.accentPurple} label="Углеводы" value={macros.carbs}   target={TARGETS.carbs}   unit="г" />
            <LegendItem color={Colors.pink}         label="Жиры"     value={macros.fat}     target={TARGETS.fat}     unit="г" />
            <LegendItem color={Colors.accentTeal}   label="Белки"    value={macros.protein} target={TARGETS.protein} unit="г" />
          </View>
        </View>

        {/* Macro Cards */}
        <View style={s.macroRow}>
          <MacroCard label="Белки"   value={macros.protein} target={TARGETS.protein} unit="г" color={Colors.accentTeal}   icon="🥩" />
          <MacroCard label="Жиры"    value={macros.fat}     target={TARGETS.fat}     unit="г" color={Colors.pink}         icon="🥑" />
          <MacroCard label="Углев."  value={macros.carbs}   target={TARGETS.carbs}   unit="г" color={Colors.accentPurple} icon="🌾" />
        </View>

        {/* Vitamins & Minerals */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Микронутриенты</Text>
          {hasData && deficits.length > 0 && (
            <View style={s.deficitBadge}>
              <Text style={s.deficitText}>{deficits.length} дефицит{deficits.length > 1 ? 'а' : ''}</Text>
            </View>
          )}
        </View>

        <View style={s.vitaminGrid}>
          {vitamins.map(v => <VitaminCard key={v.name} {...v} />)}
        </View>

        {/* AI Recommendation */}
        {aiText && <AiCard text={aiText} />}

        {/* Empty state info */}
        {!hasData && (
          <View style={s.howCard}>
            <LinearGradient
              colors={[Colors.surfaceElevated, Colors.surface]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Text style={s.howTitle}>💡 Как работает нутрициология</Text>
            <Text style={s.howText}>
              Нутриционный профиль строится автоматически на основе продуктов из холодильника.{'\n\n'}
              Данные о составе берутся из OpenFoodFacts (3M+ продуктов). Дефицит рассчитывается за 30 дней.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.bg },
  scroll:  { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: Layout.tabBarClearance },
  center:  { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: Spacing.lg },
  title:      { fontSize: Typography.sizeXL, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  subtitle:   { fontSize: Typography.sizeSM, color: Colors.textMuted, marginTop: 2 },
  scoreBadge: { alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.lg, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderWidth: 1, borderColor: Colors.success + '40' },
  scoreLabel: { fontSize: Typography.sizeXS, color: Colors.textMuted },
  scoreValue: { fontSize: Typography.sizeLG, fontWeight: Typography.weightBold, color: Colors.success },

  heroCard:   { borderRadius: Radius.xl, overflow: 'hidden', marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  legendRow:  { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  legendDot:  { width: 10, height: 10, borderRadius: 5 },
  legendLabel:  { fontSize: Typography.sizeXS, color: Colors.textMuted },
  legendValue:  { fontSize: Typography.sizeSM, fontWeight: Typography.weightSemiBold },
  legendTarget: { color: Colors.textMuted },

  calLabel:    { fontSize: 10, color: Colors.textMuted, letterSpacing: 1.5, textTransform: 'uppercase' },
  calValue:    { fontSize: 34, fontWeight: Typography.weightBold, lineHeight: 38 },
  calTarget:   { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  remainBadge: { marginTop: 8, borderRadius: Radius.full, borderWidth: 1, paddingHorizontal: Spacing.md, paddingVertical: 3 },
  remainText:  { fontSize: 10, fontWeight: Typography.weightSemiBold },

  macroRow:   { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  macroCard:  { flex: 1, borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.md, overflow: 'hidden', backgroundColor: Colors.surface },
  macroIcon:  { fontSize: 20, marginBottom: Spacing.xs },
  macroValue: { fontSize: Typography.sizeLG, fontWeight: Typography.weightBold },
  macroUnit:  { fontSize: Typography.sizeXS, color: Colors.textSecondary },
  macroLabel: { fontSize: Typography.sizeXS, color: Colors.textSecondary, marginTop: 2 },
  macroMeta:  { fontSize: Typography.sizeXS, color: Colors.textMuted },
  macroTrack: { height: 3, borderRadius: 2, backgroundColor: Colors.border, marginTop: Spacing.sm, overflow: 'hidden' },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  sectionTitle:  { fontSize: Typography.sizeMD, fontWeight: Typography.weightSemiBold, color: Colors.textPrimary },
  deficitBadge:  { backgroundColor: Colors.danger + '20', borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  deficitText:   { fontSize: Typography.sizeXS, color: Colors.danger, fontWeight: Typography.weightSemiBold },

  vitaminGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: Spacing.lg },
  vitCard:     { width: '49%', borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.md, backgroundColor: Colors.surface, marginBottom: Spacing.sm },
  vitName:     { fontSize: Typography.sizeSM, color: Colors.textPrimary, fontWeight: Typography.weightSemiBold, marginBottom: Spacing.xs },
  vitBadge:    { borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2, alignSelf: 'flex-start', marginTop: Spacing.xs },
  vitBadgeText: { fontSize: 9, fontWeight: Typography.weightBold },

  aiCard:  { borderRadius: Radius.xl, overflow: 'hidden', borderWidth: 1, borderColor: Colors.accentPurple + '50', padding: Spacing.lg, marginBottom: Spacing.md },
  aiStar:  { fontSize: 16, color: Colors.accentPurple, marginRight: Spacing.sm },
  aiTitle: { fontSize: Typography.sizeMD, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  aiText:  { fontSize: Typography.sizeSM, color: Colors.textSecondary, lineHeight: 20 },

  howCard:  { borderRadius: Radius.xl, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg, marginBottom: Spacing.md },
  howTitle: { fontSize: Typography.sizeMD, fontWeight: Typography.weightSemiBold, color: Colors.textPrimary, marginBottom: Spacing.sm },
  howText:  { fontSize: Typography.sizeSM, color: Colors.textSecondary, lineHeight: 20 },
});
