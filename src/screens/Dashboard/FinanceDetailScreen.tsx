import React, { useMemo, useRef, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Platform, Image, Dimensions, Animated, TextInput,
  Modal, KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Svg, { Circle } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, Radius } from '../../constants/tokens';
import { FlowingBar } from '../../components/common/FlowingBar';
import { useBudgetStore } from '../../store/useBudgetStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useWallpaperStore, WALLPAPERS } from '../../store/useWallpaperStore';
import { supabase } from '../../lib/supabase';
import type { Goal } from '../../types';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ─── Palette ──────────────────────────────────────────────────────────────────
const JAR_COLORS = [
  '#22D3EE', '#A78BFA', '#E879F9', '#4ADE80',
  '#FBBF24', '#FB7185', '#60A5FA', '#F97316',
];

// ─── Category config ──────────────────────────────────────────────────────────
const CAT_CONFIG: Record<string, { label: string; color: string; emoji: string }> = {
  food:          { label: 'Питание',     color: Colors.categoryFood,      emoji: '🍕' },
  transport:     { label: 'Транспорт',   color: Colors.categoryTransport, emoji: '🚗' },
  home:          { label: 'Дом',         color: Colors.categoryHome,      emoji: '🏠' },
  health:        { label: 'Здоровье',    color: Colors.accentTeal,        emoji: '💊' },
  entertainment: { label: 'Развлечения', color: '#E879F9',                emoji: '🎮' },
  shopping:      { label: 'Покупки',     color: '#FB7185',                emoji: '🛍️' },
  salary:        { label: 'Зарплата',    color: '#4ADE80',                emoji: '💰' },
  freelance:     { label: 'Фриланс',     color: '#34D399',                emoji: '💻' },
  transfer:      { label: 'Перевод',     color: '#60A5FA',                emoji: '🔄' },
  gift:          { label: 'Подарок',     color: '#F472B6',                emoji: '🎁' },
  cashback:      { label: 'Кэшбэк',      color: '#FBBF24',                emoji: '💸' },
  other:         { label: 'Прочее',      color: Colors.categoryOther,     emoji: '📦' },
};

// ─── Currency ─────────────────────────────────────────────────────────────────
const SYM: Record<string, string> = {
  EUR: '€', USD: '$', GBP: '£', RUB: '₽', CHF: 'CHF',
  JPY: '¥', CNY: '¥', CAD: 'CA$', AUD: 'A$', UAH: '₴',
  TRY: '₺', KZT: '₸', GEL: '₾', INR: '₹', BRL: 'R$',
  KRW: '₩', ILS: '₪', AED: 'د.إ',
};
function sym(code: string) { return SYM[code] ?? code; }
function fmtK(n: number, s: string) {
  const a = Math.abs(n);
  if (a >= 1_000_000) return `${s}${(a / 1_000_000).toFixed(1)}M`;
  if (a >= 1_000)     return `${s}${(a / 1_000).toFixed(1)}к`;
  return `${s}${Math.round(a)}`;
}

// ─── Period ───────────────────────────────────────────────────────────────────
type Period = 'month' | 'day' | 'all';
const PERIODS: { key: Period; label: string }[] = [
  { key: 'month', label: 'Месяц' },
  { key: 'day',   label: 'День'  },
  { key: 'all',   label: 'Всё'   },
];

// Expense-only categories (exclude income)
const EXPENSE_CATS = new Set(['food','transport','home','health','entertainment','shopping','other']);

// ─── GlassCard ────────────────────────────────────────────────────────────────
function GlassCard({ children, accent = Colors.accentTeal, style }: {
  children: React.ReactNode; accent?: string; style?: object;
}) {
  const ia = Platform.OS === 'android';
  return (
    <View style={[s.card, {
      borderColor: accent + (ia ? '70' : '40'),
      borderWidth: ia ? 1.5 : 1,
      elevation:   ia ? 12 : 6,
    }, style]}>
      <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: accent + (ia ? '1A' : '0D') }]} pointerEvents="none" />
      <View style={{ position: 'absolute', top: 0, left: Radius.xl, right: Radius.xl,
        height: ia ? 1.5 : 1, backgroundColor: accent + (ia ? '80' : '55') }} pointerEvents="none" />
      {children}
    </View>
  );
}

// ─── Trend emoji ──────────────────────────────────────────────────────────────
type TrendKind = 'great' | 'ok' | 'over';
const TREND_EMOJI: Record<TrendKind, string> = { great: '🎉', ok: '😊', over: '😰' };

function TrendEmoji({ kind }: { kind: TrendKind }) {
  const scale      = useRef(new Animated.Value(0)).current;
  const rotate     = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const pulse      = useRef(new Animated.Value(1)).current;
  const scalePulse = useRef(Animated.multiply(scale, pulse)).current;

  useEffect(() => {
    Animated.spring(scale, { toValue: 1, damping: 8, stiffness: 180, mass: 0.6, useNativeDriver: true }).start();
    if (kind === 'great') {
      Animated.loop(Animated.sequence([
        Animated.timing(rotate, { toValue: 1,  duration: 220, useNativeDriver: true }),
        Animated.timing(rotate, { toValue: -1, duration: 220, useNativeDriver: true }),
        Animated.timing(rotate, { toValue: 1,  duration: 220, useNativeDriver: true }),
        Animated.timing(rotate, { toValue: 0,  duration: 220, useNativeDriver: true }),
        Animated.delay(900),
      ])).start();
    } else if (kind === 'ok') {
      Animated.loop(Animated.sequence([
        Animated.timing(pulse, { toValue: 1.12, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1.0,  duration: 800, useNativeDriver: true }),
      ])).start();
    } else {
      Animated.loop(Animated.sequence([
        Animated.timing(translateX, { toValue: 5,  duration: 70, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: -5, duration: 70, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: 4,  duration: 70, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: -4, duration: 70, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: 0,  duration: 70, useNativeDriver: true }),
        Animated.delay(1400),
      ])).start();
    }
  }, [kind]);

  const rotDeg = rotate.interpolate({ inputRange: [-1, 1], outputRange: ['-18deg', '18deg'] });
  return (
    <Animated.Text style={[s.trendEmoji, { transform: [
      { scale: scalePulse }, { rotate: rotDeg }, { translateX },
    ]}]}>
      {TREND_EMOJI[kind]}
    </Animated.Text>
  );
}

// ─── Budget donut chart ───────────────────────────────────────────────────────
const DONUT_SIZE = Math.min(SCREEN_W - Spacing.lg * 2 - Spacing.md * 2, 260);
const DONUT_R    = DONUT_SIZE * 0.36;
const DONUT_SW   = DONUT_SIZE * 0.12;
const DONUT_CX   = DONUT_SIZE / 2;
const DONUT_CY   = DONUT_SIZE / 2;
const DONUT_CIRC = 2 * Math.PI * DONUT_R;

interface SegmentEntry {
  key: string;
  cfg: { label: string; color: string; emoji: string };
  amount: number;
  pct: number;
  start: number; // cumulative start fraction
}

function BudgetDonut({ entries, total, currency, highlighted, onHighlight }: {
  entries: SegmentEntry[];
  total: number;
  currency: string;
  highlighted: string | null;
  onHighlight: (key: string | null) => void;
}) {
  const ringOpacity   = useRef(new Animated.Value(0)).current;
  const centerOpacity = useRef(new Animated.Value(1)).current;
  const centerScale   = useRef(new Animated.Value(1)).current;
  const barAnims      = useRef<Record<string, Animated.Value>>({});
  const tapAnims      = useRef<Record<string, Animated.Value>>({});

  const dataKey = entries.map(e => `${e.key}:${Math.round(e.amount)}`).join('|');

  // Init per-entry anims
  entries.forEach(e => {
    if (!barAnims.current[e.key]) barAnims.current[e.key] = new Animated.Value(0);
    if (!tapAnims.current[e.key]) tapAnims.current[e.key] = new Animated.Value(1);
  });

  // Ring fade-in (native driver — always reliable) + staggered bar animations
  useEffect(() => {
    ringOpacity.setValue(0);
    entries.forEach(e => { barAnims.current[e.key]?.setValue(0); });

    Animated.timing(ringOpacity, { toValue: 1, duration: 550, useNativeDriver: true }).start();

    entries.forEach((e, i) => {
      const barA = barAnims.current[e.key];
      if (!barA) return;
      Animated.sequence([
        Animated.delay(180 + i * 80),
        Animated.spring(barA, { toValue: e.pct, damping: 16, stiffness: 200, useNativeDriver: false }),
      ]).start();
    });
  }, [dataKey]);

  // Center crossfade when selection changes
  useEffect(() => {
    centerScale.setValue(0.82);
    Animated.parallel([
      Animated.spring(centerScale,   { toValue: 1, damping: 10, stiffness: 220, useNativeDriver: true }),
      Animated.sequence([
        Animated.timing(centerOpacity, { toValue: 0, duration: 90,  useNativeDriver: true }),
        Animated.timing(centerOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]),
    ]).start();
  }, [highlighted]);

  function tapEntry(key: string) {
    const tapA = tapAnims.current[key];
    if (tapA) {
      Animated.sequence([
        Animated.spring(tapA, { toValue: 0.91, damping: 6, stiffness: 500, useNativeDriver: true }),
        Animated.spring(tapA, { toValue: 1,    damping: 8, stiffness: 300, useNativeDriver: true }),
      ]).start();
    }
    onHighlight(highlighted === key ? null : key);
  }

  const hlEntry = highlighted ? entries.find(e => e.key === highlighted) ?? null : null;

  if (total === 0) return (
    <View style={dn.empty}>
      <Text style={{ fontSize: 32, marginBottom: 8 }}>📭</Text>
      <Text style={dn.emptyTxt}>Нет трат за период</Text>
    </View>
  );

  const GAP   = 0.012;
  const HL_SW = DONUT_SW * 1.45;

  return (
    <View style={{ alignItems: 'center' }}>

      {/* ── SVG ring — fades in via native driver ── */}
      <Animated.View style={{ width: DONUT_SIZE, height: DONUT_SIZE, opacity: ringOpacity }}>
        <Svg width={DONUT_SIZE} height={DONUT_SIZE}>

          {/* Ambient glow tint for selected segment */}
          <Circle
            cx={DONUT_CX} cy={DONUT_CY} r={DONUT_R}
            stroke={hlEntry ? hlEntry.cfg.color + '1A' : 'transparent'}
            strokeWidth={DONUT_SW * 3}
            fill="none"
          />
          {/* Base track */}
          <Circle
            cx={DONUT_CX} cy={DONUT_CY} r={DONUT_R}
            stroke="rgba(255,255,255,0.07)"
            strokeWidth={DONUT_SW}
            fill="none"
          />

          {/* Segments — full size immediately */}
          {entries.map(seg => {
            const dash     = (seg.pct - GAP) * DONUT_CIRC;
            const rotation = (seg.start + GAP / 2) * 360 - 90;
            const isActive = highlighted === seg.key;
            const isHL     = highlighted === null || isActive;
            const sw       = isActive ? HL_SW : DONUT_SW;
            const opacity  = isActive ? 0.75 : isHL ? 0.62 : 0.10;

            return (
              <React.Fragment key={seg.key}>
                {/* Glow halo for active segment */}
                {isActive && (
                  <Circle
                    cx={DONUT_CX} cy={DONUT_CY} r={DONUT_R}
                    stroke={seg.cfg.color}
                    strokeWidth={HL_SW + 16}
                    fill="none"
                    strokeDasharray={`${Math.max(0, dash)} ${DONUT_CIRC - Math.max(0, dash)}`}
                    strokeLinecap="butt"
                    rotation={rotation}
                    origin={`${DONUT_CX}, ${DONUT_CY}`}
                    opacity={0.12}
                  />
                )}
                {/* Main arc — tappable */}
                <Circle
                  cx={DONUT_CX} cy={DONUT_CY} r={DONUT_R}
                  stroke={seg.cfg.color}
                  strokeWidth={sw}
                  fill="none"
                  strokeDasharray={`${Math.max(0, dash)} ${DONUT_CIRC - Math.max(0, dash)}`}
                  strokeLinecap="butt"
                  rotation={rotation}
                  origin={`${DONUT_CX}, ${DONUT_CY}`}
                  opacity={opacity}
                  onPress={() => tapEntry(seg.key)}
                />
              </React.Fragment>
            );
          })}
        </Svg>

        {/* Center — crossfades on selection change */}
        <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
          <Animated.View style={{ alignItems: 'center', opacity: centerOpacity, transform: [{ scale: centerScale }] }}>
            {hlEntry ? (
              <TouchableOpacity onPress={() => onHighlight(null)} activeOpacity={0.7} style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 26, marginBottom: 3 }}>{hlEntry.cfg.emoji}</Text>
                <Text style={[dn.centerAmt, { color: hlEntry.cfg.color }]}>{fmtK(hlEntry.amount, currency)}</Text>
                <Text style={dn.centerSub}>{Math.round(hlEntry.pct * 100)}%</Text>
                <Text style={[dn.centerHint, { color: hlEntry.cfg.color + '80' }]}>✕ сброс</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ alignItems: 'center' }}>
                <Text style={dn.centerTotal}>{fmtK(total, currency)}</Text>
                <Text style={dn.centerSub}>расходы</Text>
              </View>
            )}
          </Animated.View>
        </View>
      </Animated.View>

      {/* ── Legend ── */}
      <View style={dn.legend}>
        {entries.map(seg => {
          const isHL  = highlighted === null || highlighted === seg.key;
          const isSel = highlighted === seg.key;
          const tapA  = tapAnims.current[seg.key];
          const barA  = barAnims.current[seg.key];

          return (
            <Animated.View key={seg.key} style={{ transform: [{ scale: tapA ?? 1 }] }}>
              <TouchableOpacity
                style={[
                  dn.legendRow,
                  isSel && { backgroundColor: seg.cfg.color + '16', borderColor: seg.cfg.color + '40' },
                ]}
                onPress={() => tapEntry(seg.key)}
                activeOpacity={0.78}
              >
                {/* Dot */}
                <View style={[dn.dot, {
                  backgroundColor: seg.cfg.color,
                  opacity: isHL ? 1 : 0.22,
                  ...(isSel ? { shadowColor: seg.cfg.color, shadowOpacity: 1, shadowRadius: 6, elevation: 5 } : {}),
                }]} />

                {/* Emoji + name */}
                <Text
                  style={[dn.legendName, { opacity: isHL ? 1 : 0.35, color: isSel ? seg.cfg.color : Colors.textSecondary }]}
                  numberOfLines={1}
                >
                  {seg.cfg.emoji} {seg.cfg.label}
                </Text>

                {/* Animated bar */}
                <View style={dn.barTrack}>
                  {barA && (
                    <Animated.View style={[dn.barFill, {
                      width: barA.interpolate({
                        inputRange:  [0, seg.pct > 0 ? seg.pct : 0.001],
                        outputRange: ['0%', `${Math.round(seg.pct * 100)}%`],
                        extrapolate: 'clamp',
                      }),
                      backgroundColor: seg.cfg.color,
                      opacity: isHL ? 1 : 0.15,
                    }]} />
                  )}
                </View>

                {/* Amount */}
                <Text style={[dn.legendAmt, { color: isHL ? seg.cfg.color : Colors.textFaint }]}>
                  {fmtK(seg.amount, currency)}
                </Text>

                {/* Pct */}
                <Text style={[dn.legendPct, { opacity: isHL ? 0.75 : 0.22 }]}>
                  {Math.round(seg.pct * 100)}%
                </Text>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

const dn = StyleSheet.create({
  empty:      { alignItems: 'center', paddingVertical: 40 },
  emptyTxt:   { fontSize: 13, fontFamily: 'Onest-Medium', color: Colors.textMuted },
  centerTotal:{ fontSize: 24, fontFamily: 'Sora-SemiBold', color: Colors.textPrimary, letterSpacing: -0.5 },
  centerAmt:  { fontSize: 20, fontFamily: 'Sora-SemiBold', letterSpacing: -0.5 },
  centerSub:  { fontSize: 11, fontFamily: 'Onest-Medium', color: Colors.textMuted, marginTop: 2 },
  centerHint: { fontSize: 10, fontFamily: 'Onest-Medium', marginTop: 5 },
  legend:     { width: '100%', gap: 2, marginTop: Spacing.sm },
  legendRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: Spacing.sm, borderRadius: 12, borderWidth: 1, borderColor: 'transparent' },
  dot:        { width: 9, height: 9, borderRadius: 4.5, flexShrink: 0 },
  legendName: { fontSize: 12, fontFamily: 'Onest-SemiBold', width: 90 },
  barTrack:   { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.06)', overflow: 'hidden' },
  barFill:    { height: '100%', borderRadius: 2 },
  legendAmt:  { fontSize: 12, fontFamily: 'Onest-SemiBold', minWidth: 48, textAlign: 'right' },
  legendPct:  { fontSize: 11, fontFamily: 'Onest-Medium', color: Colors.textMuted, minWidth: 28, textAlign: 'right' },
});

// ─── Savings jar ──────────────────────────────────────────────────────────────
function SavingsJar({ goal, color, delay, currency, onPress }: {
  goal: Goal; color: string; delay: number; currency: string; onPress: () => void;
}) {
  const R    = 30;
  const SW   = 6;
  const SIZE = (R + SW / 2) * 2 + 4;
  const circ = 2 * Math.PI * R;
  const pct  = goal.target_amount > 0 ? Math.min(goal.current_amount / goal.target_amount, 1) : 0;
  const done = pct >= 1;

  const offsetAnim = useRef(new Animated.Value(circ)).current;
  const isFirst    = useRef(true);

  useEffect(() => {
    const d        = isFirst.current ? delay : 0;
    const duration = isFirst.current ? 1000 : 700;
    isFirst.current = false;
    Animated.timing(offsetAnim, { toValue: circ * (1 - pct), duration, delay: d, useNativeDriver: false }).start();
  }, [pct]);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75} style={sj.jar}>
      <View style={{ width: SIZE, height: SIZE }}>
        <Svg width={SIZE} height={SIZE}>
          <Circle cx={SIZE / 2} cy={SIZE / 2} r={R}
            stroke="rgba(255,255,255,0.07)" strokeWidth={SW} fill="none" />
          <AnimatedCircle
            cx={SIZE / 2} cy={SIZE / 2} r={R}
            stroke={done ? '#4ADE80' : color}
            strokeWidth={SW}
            fill="none"
            strokeDasharray={circ}
            strokeDashoffset={offsetAnim}
            strokeLinecap="round"
            rotation="-90"
            origin={`${SIZE / 2}, ${SIZE / 2}`}
          />
        </Svg>
        <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
          <Text style={{ fontSize: done ? 18 : 20 }}>{done ? '✅' : goal.emoji}</Text>
        </View>
      </View>
      <Text numberOfLines={1} style={sj.title}>{goal.title}</Text>
      <Text style={[sj.pct, { color: done ? '#4ADE80' : color }]}>
        {done ? 'Готово!' : `${Math.round(pct * 100)}%`}
      </Text>
      <Text style={sj.amounts}>
        {fmtK(goal.current_amount, currency)} / {fmtK(goal.target_amount, currency)}
      </Text>
      {!done && (
        <View style={[sj.addBtn, { borderColor: color + '50' }]}>
          <Text style={[sj.addTxt, { color }]}>+ пополнить</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const sj = StyleSheet.create({
  jar:    { width: 90, alignItems: 'center' },
  title:  { fontSize: 11, fontFamily: 'Onest-Medium', color: Colors.textSecondary, marginTop: 6, textAlign: 'center' },
  pct:    { fontSize: 13, fontFamily: 'Sora-SemiBold', marginTop: 2 },
  amounts:{ fontSize: 9,  fontFamily: 'Onest-Medium', color: Colors.textMuted, textAlign: 'center', marginTop: 1 },
  addBtn: { marginTop: 7, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  addTxt: { fontSize: 10, fontFamily: 'Onest-SemiBold' },
});

// ─── Deposit sheet ────────────────────────────────────────────────────────────
function DepositSheet({ goal, color, currency, available, onDeposit, onClose }: {
  goal: Goal; color: string; currency: string; available: number;
  onDeposit: (amount: number) => Promise<void>; onClose: () => void;
}) {
  const [amtStr,  setAmtStr]  = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const slideY     = useRef(new Animated.Value(600)).current;
  const successScl = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(slideY, { toValue: 0, damping: 18, stiffness: 180, useNativeDriver: true }).start();
  }, []);

  function close() {
    Animated.timing(slideY, { toValue: 600, duration: 260, useNativeDriver: true }).start(onClose);
  }

  const maxDeposit = Math.max(0, goal.target_amount - goal.current_amount);
  const amount     = parseFloat(amtStr.replace(',', '.').replace(/\s/g, '')) || 0;
  const capped     = Math.min(amount, maxDeposit);
  const pct        = goal.target_amount > 0 ? Math.min(goal.current_amount / goal.target_amount, 1) : 0;
  const newPct     = goal.target_amount > 0 ? Math.min((goal.current_amount + capped) / goal.target_amount, 1) : 0;
  const isDone     = pct >= 1;

  const quickAmounts = useMemo(() => {
    const m = goal.monthly_contribution;
    const candidates: number[] = [];
    if (m > 0) candidates.push(m);
    if (maxDeposit > 0) {
      [0.25, 0.5, 1].forEach(f => {
        const v = Math.round(maxDeposit * f);
        if (v > 0 && !candidates.includes(v)) candidates.push(v);
      });
    }
    return candidates.slice(0, 4);
  }, [goal]);

  async function submit() {
    if (!amount || loading || isDone) return;
    setLoading(true);
    await onDeposit(capped);
    setLoading(false);
    setSuccess(true);
    Animated.spring(successScl, { toValue: 1, damping: 10, stiffness: 150, useNativeDriver: true }).start();
    setTimeout(close, 1800);
  }

  return (
    <Modal transparent visible animationType="none" onRequestClose={close}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <TouchableOpacity style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.65)' }]}
          onPress={close} activeOpacity={1} />

        <Animated.View style={[ds.sheet, { transform: [{ translateY: slideY }] }]}>
          <BlurView intensity={40} tint="dark" style={[StyleSheet.absoluteFill,
            { borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl }]} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(8,9,18,0.78)',
            borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl }]} />
          <View style={{ position: 'absolute', top: 0, left: 60, right: 60, height: 1, backgroundColor: color + '60' }} />

          {success ? (
            <Animated.View style={[ds.successWrap, { transform: [{ scale: successScl }] }]}>
              <Text style={{ fontSize: 60 }}>🎉</Text>
              <Text style={ds.successTitle}>Пополнено!</Text>
              <Text style={[ds.successSub, { color }]}>{fmtK(capped, currency)} → {goal.emoji} {goal.title}</Text>
            </Animated.View>
          ) : (
            <>
              <View style={ds.handle} />

              <View style={ds.goalRow}>
                <View style={[ds.goalIcon, { backgroundColor: color + '20' }]}>
                  <Text style={{ fontSize: 26 }}>{goal.emoji}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={ds.goalName}>{goal.title}</Text>
                  <Text style={ds.goalMeta}>
                    {fmtK(goal.current_amount, currency)} из {fmtK(goal.target_amount, currency)}
                    {' · '}{Math.round(pct * 100)}%
                  </Text>
                </View>
                <TouchableOpacity onPress={close} style={ds.closeBtn}>
                  <Text style={ds.closeTxt}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Progress preview */}
              <View style={{ paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm }}>
                <View style={ds.progTrack}>
                  <View style={[ds.progCurrent, { width: `${Math.round(pct * 100)}%` as any, backgroundColor: color + '55' }]} />
                  {amount > 0 && newPct > pct && (
                    <View style={[ds.progDelta, { width: `${Math.round((newPct - pct) * 100)}%` as any, backgroundColor: color }]} />
                  )}
                </View>
                {amount > 0 && (
                  <Text style={ds.previewTxt}>
                    Станет{' '}
                    <Text style={{ color, fontFamily: 'Onest-SemiBold' }}>
                      {fmtK(goal.current_amount + capped, currency)} ({Math.round(newPct * 100)}%)
                    </Text>
                    {newPct >= 1 ? '  🎯' : ''}
                  </Text>
                )}
              </View>

              <View style={[ds.inputRow, { marginHorizontal: Spacing.lg }]}>
                <Text style={ds.inputSym}>{currency}</Text>
                <TextInput
                  style={ds.input}
                  value={amtStr}
                  onChangeText={setAmtStr}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={Colors.textFaint}
                  autoFocus
                />
                {amtStr.length > 0 && (
                  <TouchableOpacity onPress={() => setAmtStr('')} style={{ padding: 8 }}>
                    <Text style={{ color: Colors.textMuted, fontSize: 15 }}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false}
                contentContainerStyle={[ds.quickRow, { marginHorizontal: Spacing.lg }]}>
                {quickAmounts.map((qa, i) => {
                  const isMonthly = i === 0 && qa === goal.monthly_contribution;
                  const isActive  = amtStr === String(qa);
                  return (
                    <TouchableOpacity key={qa}
                      style={[ds.quickBtn, isActive && { backgroundColor: color, borderColor: color }]}
                      onPress={() => setAmtStr(String(qa))} activeOpacity={0.7}>
                      <Text style={[ds.quickTxt, isActive && { color: '#fff' }]}>
                        {fmtK(qa, currency)}{isMonthly ? '/мес' : ''}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Text style={[ds.availHint, { marginHorizontal: Spacing.lg }]}>
                Доступно в бюджете:{' '}
                <Text style={{ color: available > 0 ? Colors.success : Colors.danger, fontFamily: 'Onest-SemiBold' }}>
                  {fmtK(available, currency)}
                </Text>
              </Text>

              <TouchableOpacity
                style={[ds.cta, { marginHorizontal: Spacing.lg, opacity: (!amount || isDone) ? 0.4 : 1 }]}
                onPress={submit} disabled={!amount || isDone || loading} activeOpacity={0.82}>
                <LinearGradient
                  colors={isDone ? ['#444', '#444'] : [color, color + 'CC']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
                />
                <Text style={ds.ctaTxt}>
                  {isDone ? '✅ Цель уже достигнута'
                  : loading ? 'Сохраняем...'
                  : amount > 0 ? `Пополнить ${fmtK(capped, currency)}`
                  : 'Введи сумму'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const ds = StyleSheet.create({
  sheet:       { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, paddingBottom: 36 },
  handle:      { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.18)', alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  goalRow:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  goalIcon:    { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  goalName:    { fontSize: 17, fontFamily: 'Sora-SemiBold', color: Colors.textPrimary },
  goalMeta:    { fontSize: 12, fontFamily: 'Onest-Regular', color: Colors.textMuted, marginTop: 2 },
  closeBtn:    { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.07)', alignItems: 'center', justifyContent: 'center' },
  closeTxt:    { fontSize: 12, color: Colors.textMuted },
  progTrack:   { height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.07)', flexDirection: 'row', overflow: 'hidden', marginBottom: 6 },
  progCurrent: { height: '100%', borderRadius: 4 },
  progDelta:   { height: '100%', borderRadius: 4 },
  previewTxt:  { fontSize: 12, fontFamily: 'Onest-Regular', color: Colors.textMuted },
  inputRow:    { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', paddingHorizontal: Spacing.md, marginBottom: Spacing.md },
  inputSym:    { fontSize: 20, fontFamily: 'Sora-SemiBold', color: Colors.textMuted, marginRight: 4 },
  input:       { flex: 1, fontSize: 30, fontFamily: 'Sora-SemiBold', color: Colors.textPrimary, paddingVertical: 14 },
  quickRow:    { flexDirection: 'row', gap: 8, paddingBottom: Spacing.md },
  quickBtn:    { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  quickTxt:    { fontSize: 13, fontFamily: 'Onest-SemiBold', color: Colors.textSecondary },
  availHint:   { fontSize: 12, fontFamily: 'Onest-Regular', color: Colors.textMuted, marginBottom: Spacing.lg },
  cta:         { height: 52, borderRadius: 20, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  ctaTxt:      { fontSize: 16, fontFamily: 'Sora-SemiBold', color: '#fff' },
  successWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 56 },
  successTitle:{ fontSize: 24, fontFamily: 'Sora-SemiBold', color: Colors.textPrimary, marginTop: 14 },
  successSub:  { fontSize: 14, fontFamily: 'Onest-Regular', marginTop: 6 },
});

// ─── Main screen ──────────────────────────────────────────────────────────────
export function FinanceDetailScreen() {
  const navigation  = useNavigation();
  const { user }    = useAuthStore();
  const { transactions, monthlyBudget, getTotalSpent, goals, updateGoal } = useBudgetStore();
  const { wallpaperId } = useWallpaperStore();
  const wallpaperSource = wallpaperId !== null ? WALLPAPERS[wallpaperId] : null;

  const currency   = sym(user?.currency ?? 'EUR');
  const totalSpent = getTotalSpent();
  const remaining  = monthlyBudget - totalSpent;
  const spentPct   = monthlyBudget > 0 ? totalSpent / monthlyBudget : 0;

  // Deposit
  const [depositTarget, setDepositTarget] = useState<{ goal: Goal; color: string } | null>(null);

  // Donut period + highlight
  const [period,      setPeriod]      = useState<Period>('month');
  const [highlighted, setHighlighted] = useState<string | null>(null);

  // Trend
  const dayOfMonth  = new Date().getDate();
  const expectedPct = dayOfMonth / 31;
  const isAhead     = spentPct > expectedPct * 1.1;
  const trendKind: TrendKind = isAhead ? 'over' : spentPct < expectedPct * 0.85 ? 'great' : 'ok';
  const trendLabel  = trendKind === 'over'  ? 'Темп расходов\nвыше нормы'
                    : trendKind === 'great' ? 'Отличный\nтемп!'
                    : 'В норме';
  const trendSub    = trendKind === 'over'  ? 'Осторожно с тратами'
                    : trendKind === 'great' ? 'Так держать!'
                    : 'Идёте по плану';
  const trendColor  = trendKind === 'over'  ? Colors.danger
                    : trendKind === 'great' ? Colors.success
                    : Colors.accentTeal;

  const todayAmount = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return transactions.filter(t => t.date === today).reduce((s, t) => s + t.amount, 0);
  }, [transactions]);

  // Filtered transactions by period
  const filteredTx = useMemo(() => {
    const today      = new Date().toISOString().slice(0, 10);
    const monthStart = today.slice(0, 7) + '-01';
    if (period === 'day')   return transactions.filter(t => t.date === today);
    if (period === 'month') return transactions.filter(t => t.date >= monthStart && t.date <= today);
    return transactions;
  }, [transactions, period]);

  // Category entries for donut — expense categories only, amount always positive
  const { donutEntries, donutTotal } = useMemo(() => {
    const byKey: Record<string, number> = {};
    for (const tx of filteredTx) {
      if (!EXPENSE_CATS.has(tx.category)) continue;
      byKey[tx.category] = (byKey[tx.category] ?? 0) + Math.abs(tx.amount);
    }

    const total = Object.values(byKey).reduce((s, v) => s + v, 0);
    if (total === 0) return { donutEntries: [], donutTotal: 0 };

    let cumPct = 0;
    const entries: SegmentEntry[] = Object.entries(CAT_CONFIG)
      .map(([key, cfg]) => ({ key, cfg, amount: byKey[key] ?? 0, pct: 0, start: 0 }))
      .filter(e => e.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .map(e => {
        const pct   = e.amount / total;
        const start = cumPct;
        cumPct += pct;
        return { ...e, pct, start };
      });

    return { donutEntries: entries, donutTotal: total };
  }, [filteredTx]);

  // Reset highlight when period changes
  useEffect(() => { setHighlighted(null); }, [period]);

  // Deposit handler
  async function handleDeposit(amount: number) {
    if (!depositTarget) return;
    const { goal } = depositTarget;
    const newAmount = goal.current_amount + amount;
    try {
      await supabase.from('goals').update({ current_amount: newAmount }).eq('id', goal.id);
      updateGoal(goal.id, { current_amount: newAmount });
    } catch (e) { /* silent */ }
  }

  function fmt(n: number) {
    return `${currency}${Math.abs(n).toLocaleString('ru-RU', { maximumFractionDigits: 0 })}`;
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>

      {wallpaperSource ? (
        <>
          <Image source={wallpaperSource} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: SCREEN_H }} resizeMode="cover" />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(5,5,18,0.72)' }]} pointerEvents="none" />
        </>
      ) : (
        <>
          <View style={[s.blob, s.blobTR]} pointerEvents="none" />
          <View style={[s.blob, s.blobCL]} pointerEvents="none" />
        </>
      )}

      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top']}>

        {/* Header */}
        <View style={[s.header, { paddingTop: Spacing.sm }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.7}>
            <Text style={s.backArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Финансы</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingBottom: 48 }}
          showsVerticalScrollIndicator={false}
        >

          {/* ── Бюджет ── */}
          <GlassCard accent={Colors.accentTeal}>
            <LinearGradient
              colors={['rgba(34,211,238,0.10)', 'rgba(167,139,250,0.06)', 'rgba(11,12,27,0)']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={{ padding: Spacing.md }}>
              <Text style={s.cardLabel}>ДОСТУПНЫЙ БЮДЖЕТ</Text>
              <Text style={[s.bigAmount, { color: remaining < 0 ? Colors.danger : Colors.accentTeal }]}>
                {remaining < 0 ? '-' : ''}{fmt(Math.abs(remaining))}
              </Text>
              <View style={{ marginBottom: Spacing.sm }}>
                <FlowingBar pct={spentPct} overBudget={spentPct > 1} height={6} borderRadius={3} trackColor="rgba(255,255,255,0.08)" />
              </View>
              <View style={s.budgetMeta}>
                <View style={s.metaItem}>
                  <Text style={s.metaLabel}>Потрачено</Text>
                  <Text style={[s.metaValue, { color: spentPct > 1 ? Colors.danger : Colors.textSecondary }]}>{fmt(totalSpent)}</Text>
                </View>
                <View style={s.metaItem}>
                  <Text style={s.metaLabel}>День месяца</Text>
                  <Text style={s.metaValue}>{dayOfMonth} / 31</Text>
                </View>
                <View style={[s.metaItem, { alignItems: 'flex-end' }]}>
                  <Text style={s.metaLabel}>Бюджет</Text>
                  <Text style={s.metaValue}>{fmt(monthlyBudget)}</Text>
                </View>
              </View>
            </View>
          </GlassCard>

          {/* ── Темп + Сегодня ── */}
          <View style={s.statsRow}>
            <GlassCard accent={trendColor} style={[s.statFlex3, { marginRight: Spacing.sm }]}>
              <View style={s.trendInner}>
                <TrendEmoji kind={trendKind} />
                <View style={{ flex: 1 }}>
                  <Text style={s.statLabel}>ТЕМП РАСХОДОВ</Text>
                  <Text style={[s.trendLabel, { color: trendColor }]}>{trendLabel}</Text>
                  <Text style={s.trendSub}>{trendSub}</Text>
                </View>
              </View>
            </GlassCard>
            <GlassCard accent={Colors.accentPurple} style={s.statFlex14}>
              <View style={s.todayInner}>
                <Text style={s.statLabel}>СЕГОДНЯ</Text>
                <Text style={[s.statValue, { color: Colors.accentPurple }]}>{fmt(todayAmount)}</Text>
              </View>
            </GlassCard>
          </View>

          {/* ── Доnut диаграмма ── */}
          <GlassCard accent={Colors.accentPurple}>
            <View style={{ padding: Spacing.md }}>

              {/* Period selector */}
              <View style={{ marginBottom: Spacing.md }}>
                <View style={s.periodRow}>
                  <Text style={s.sectionTitle}>РАСХОДЫ ПО КАТЕГОРИЯМ</Text>
                  <View style={s.periodTabs}>
                    {PERIODS.map(p => {
                      const active = period === p.key;
                      return (
                        <TouchableOpacity
                          key={p.key}
                          style={[s.periodTab, active && { backgroundColor: Colors.accentPurple }]}
                          onPress={() => setPeriod(p.key)}
                          activeOpacity={0.7}
                        >
                          <Text style={[s.periodTabTxt, active && { color: '#fff' }]}>{p.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>

              <BudgetDonut
                entries={donutEntries}
                total={donutTotal}
                currency={currency}
                highlighted={highlighted}
                onHighlight={setHighlighted}
              />
            </View>
          </GlassCard>

          {/* ── Копилки ── */}
          <GlassCard accent={Colors.accentTeal}>
            <View style={{ paddingHorizontal: Spacing.md, paddingTop: Spacing.md }}>
              <View style={s.sectionRow}>
                <Text style={s.sectionTitle}>КОПИЛКИ</Text>
                {goals.length > 0 && (
                  <Text style={s.sectionBadge}>
                    {goals.length} {goals.length === 1 ? 'цель' : goals.length < 5 ? 'цели' : 'целей'}
                  </Text>
                )}
              </View>
            </View>

            {goals.length > 0 ? (
              <ScrollView
                horizontal showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, gap: Spacing.xl }}
              >
                {goals.map((goal, i) => (
                  <SavingsJar
                    key={goal.id}
                    goal={goal}
                    color={JAR_COLORS[i % JAR_COLORS.length]}
                    delay={i * 100}
                    currency={currency}
                    onPress={() => setDepositTarget({ goal, color: JAR_COLORS[i % JAR_COLORS.length] })}
                  />
                ))}
              </ScrollView>
            ) : (
              <View style={[s.emptyState, { margin: Spacing.md }]}>
                <Text style={{ fontSize: 36, marginBottom: Spacing.sm }}>🏦</Text>
                <Text style={s.emptyTitle}>Пока нет копилок</Text>
                <Text style={s.emptyText}>Добавь цель на главном экране — она появится здесь</Text>
              </View>
            )}
          </GlassCard>

        </ScrollView>
      </SafeAreaView>

      {depositTarget && (
        <DepositSheet
          goal={depositTarget.goal}
          color={depositTarget.color}
          currency={currency}
          available={remaining}
          onDeposit={handleDeposit}
          onClose={() => setDepositTarget(null)}
        />
      )}

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  blob:   { position: 'absolute', borderRadius: 999 },
  blobTR: { width: 300, height: 200, top: -60, right: -80, backgroundColor: 'rgba(34,211,238,0.18)', transform: [{ scaleX: 1.4 }] },
  blobCL: { width: 250, height: 200, top: '30%', left: -80, backgroundColor: 'rgba(167,139,250,0.14)', transform: [{ scaleY: 1.3 }] },

  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
  backBtn:      { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  backArrow:    { fontSize: 28, color: Colors.accentTeal, marginTop: -2, lineHeight: 32 },
  headerTitle:  { fontSize: 18, fontFamily: 'Sora-SemiBold', color: Colors.textPrimary },

  card:          { borderRadius: Radius.xl, overflow: 'hidden', marginBottom: Spacing.md },
  cardLabel:     { fontSize: 10, fontFamily: 'Onest-Medium', color: Colors.textMuted, letterSpacing: 1.4, marginBottom: 4 },
  bigAmount:     { fontSize: 38, fontFamily: 'Sora-SemiBold', letterSpacing: -1.2, marginBottom: Spacing.sm },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginBottom: Spacing.sm },
  progressFill:  { height: '100%', borderRadius: 3 },
  budgetMeta:    { flexDirection: 'row', justifyContent: 'space-between' },
  metaItem:      { alignItems: 'center' },
  metaLabel:     { fontSize: 10, fontFamily: 'Onest-Medium', color: Colors.textMuted, marginBottom: 2 },
  metaValue:     { fontSize: 13, fontFamily: 'Onest-SemiBold', color: Colors.textSecondary },

  statsRow:   { flexDirection: 'row', marginBottom: Spacing.md, alignItems: 'stretch' },
  statFlex3:  { flex: 3 },
  statFlex14: { flex: 1.4 },
  trendInner: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.md },
  trendEmoji: { fontSize: 44 },
  trendLabel: { fontSize: 14, fontFamily: 'Sora-SemiBold', lineHeight: 20 },
  trendSub:   { fontSize: 11, fontFamily: 'Onest-Regular', color: Colors.textMuted, marginTop: 2 },
  statLabel:  { fontSize: 10, fontFamily: 'Onest-Medium', color: Colors.textMuted, letterSpacing: 1, marginBottom: 3 },
  statValue:  { fontSize: 17, fontFamily: 'Sora-SemiBold', color: Colors.textPrimary },
  todayInner: { padding: Spacing.md, alignItems: 'center', justifyContent: 'center', flex: 1 },

  periodRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 10, fontFamily: 'Onest-Medium', color: Colors.textMuted, letterSpacing: 1.4 },
  periodTabs:   { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 3, gap: 2 },
  periodTab:    { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  periodTabTxt: { fontSize: 11, fontFamily: 'Onest-SemiBold', color: Colors.textMuted },

  sectionRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  sectionBadge: { fontSize: 11, fontFamily: 'Onest-SemiBold', color: Colors.textSecondary },

  emptyState: { alignItems: 'center', paddingVertical: Spacing.xl },
  emptyTitle: { fontSize: 14, fontFamily: 'Sora-SemiBold', color: Colors.textSecondary, marginBottom: Spacing.sm },
  emptyText:  { fontSize: 12, fontFamily: 'Onest-Medium', color: Colors.textMuted, textAlign: 'center', lineHeight: 18, paddingHorizontal: Spacing.lg },
});
