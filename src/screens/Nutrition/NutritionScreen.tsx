import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { Colors, Typography, Spacing, Radius, Layout, Glass } from '../../constants/tokens';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const { width: SCREEN_W } = Dimensions.get('window');

// ─── Types & Interfaces ───────────────────────────────────────────────────────

type NutrientStatus = 'deficit' | 'warning' | 'normal';
type DietMode = 'lose' | 'maintain' | 'gain';
type TabKey = 'diet' | 'vitamins';
type CalGoalTab = 'custom' | 'calculate';
type Gender = 'male' | 'female';

interface MacroData {
  calories: number;
  protein:  number;
  fat:      number;
  carbs:    number;
}

interface Meal {
  id:       string;
  name:     string;
  calories: number;
  protein:  number;
  fat:      number;
  carbs:    number;
}

interface VitaminEntry {
  name:    string;
  icon:    string;
  current: number;
  status:  NutrientStatus;
}

interface ActivityLevel {
  label:      string;
  multiplier: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_CALORIE_GOAL = 2000;

const MACRO_RATIOS = { protein: 0.25, fat: 0.30, carbs: 0.45 };
// calories per gram
const KCAL_PG = { protein: 4, fat: 9, carbs: 4 };

const ACTIVITY_LEVELS: ActivityLevel[] = [
  { label: 'Сидячий',   multiplier: 1.2   },
  { label: 'Лёгкий',    multiplier: 1.375 },
  { label: 'Умеренный', multiplier: 1.55  },
  { label: 'Активный',  multiplier: 1.725 },
  { label: 'Атлет',     multiplier: 1.9   },
];

const RING_SIZE = 240;
const STROKE    = 12;
const GAP       = 8;
const R1        = 108;
const R2        = R1 - STROKE - GAP;
const R3        = R2 - STROKE - GAP;
const CX        = RING_SIZE / 2;

const DIET_MODES: { key: DietMode; label: string; delta: number; color: string }[] = [
  { key: 'lose',     label: 'Похудение',   delta: -500, color: Colors.danger       },
  { key: 'maintain', label: 'Поддержание', delta: 0,    color: Colors.accentTeal   },
  { key: 'gain',     label: 'Набор',       delta: +300, color: Colors.success      },
];

// Nutrient targets for vitamins tab (used in buildVitamins)
const VIT_TARGETS: MacroData = { calories: 2100, protein: 90, fat: 70, carbs: 250 };

// ─── Helper Functions ─────────────────────────────────────────────────────────

function macroTargets(kcal: number): { protein: number; fat: number; carbs: number } {
  return {
    protein: Math.round((kcal * MACRO_RATIOS.protein) / KCAL_PG.protein),
    fat:     Math.round((kcal * MACRO_RATIOS.fat)     / KCAL_PG.fat),
    carbs:   Math.round((kcal * MACRO_RATIOS.carbs)   / KCAL_PG.carbs),
  };
}

function calcBMR(gender: Gender, weight: number, height: number, age: number): number {
  const base = 10 * weight + 6.25 * height - 5 * age;
  return gender === 'male' ? base + 5 : base - 161;
}

function calcTDEE(bmr: number, multiplier: number): number {
  return Math.round(bmr * multiplier);
}

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
  const calP  = Math.min(cal   / VIT_TARGETS.calories, 1);
  const protP = Math.min(prot  / VIT_TARGETS.protein,  1);
  const fatP  = Math.min(fat   / VIT_TARGETS.fat,      1);
  const carbP = Math.min(carbs / VIT_TARGETS.carbs,    1);
  return [
    { name: 'Витамин D',   icon: '☀️', current: fatP  * 0.70, status: progressToStatus(fatP  * 0.70) },
    { name: 'Железо',      icon: '🩸', current: protP * 0.80, status: progressToStatus(protP * 0.80) },
    { name: 'Витамин B12', icon: '💊', current: protP * 0.75, status: progressToStatus(protP * 0.75) },
    { name: 'Витамин C',   icon: '🍊', current: carbP * 0.90, status: progressToStatus(carbP * 0.90) },
    { name: 'Магний',      icon: '⚡', current: calP  * 0.85, status: progressToStatus(calP  * 0.85) },
    { name: 'Кальций',     icon: '🦴', current: fatP  * 0.80, status: progressToStatus(fatP  * 0.80) },
  ];
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
  const food  = [...new Set(deficits.map(d => foods[d.name] ?? 'разнообразные продукты'))].join(' · ');
  return `Обнаружен дефицит: ${names}.\n\nРекомендую добавить: ${food}\n\nПоможет восполнить дефицит за 1–2 недели.`;
}

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

// Segmented Control
function SegmentedControl({ tabs, active, onPress, accentColor }: {
  tabs: { key: string; label: string }[];
  active: string;
  onPress: (key: string) => void;
  accentColor?: string;
}) {
  const accent = accentColor ?? Colors.accentTeal;
  return (
    <View style={sc.wrapper}>
      {tabs.map(tab => {
        const isActive = tab.key === active;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[sc.pill, isActive && { backgroundColor: accent }]}
            onPress={() => onPress(tab.key)}
            activeOpacity={0.75}
          >
            <Text style={[sc.label, isActive && sc.labelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
const sc = StyleSheet.create({
  wrapper:     { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: Radius.full, padding: 3 },
  pill:        { flex: 1, alignItems: 'center', paddingVertical: Spacing.sm, borderRadius: Radius.full },
  label:       { fontSize: Typography.sizeSM, fontWeight: Typography.weightSemiBold, color: Colors.textMuted },
  labelActive: { color: Colors.bg },
});

// Activity Rings (Apple Watch style)
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
        <Circle cx={CX} cy={CX} r={R1} stroke={Colors.border} strokeWidth={STROKE} fill="none" opacity={0.5} />
        <Circle cx={CX} cy={CX} r={R2} stroke={Colors.border} strokeWidth={STROKE} fill="none" opacity={0.5} />
        <Circle cx={CX} cy={CX} r={R3} stroke={Colors.border} strokeWidth={STROKE} fill="none" opacity={0.5} />
        <AnimatedCircle cx={CX} cy={CX} r={R1} stroke={Colors.accentPurple} strokeWidth={STROKE} fill="none"
          strokeDasharray={`${c1} ${c1}`} strokeDashoffset={offC}
          strokeLinecap="round" rotation="-90" origin={`${CX}, ${CX}`}
        />
        <AnimatedCircle cx={CX} cy={CX} r={R2} stroke={Colors.pink} strokeWidth={STROKE} fill="none"
          strokeDasharray={`${c2} ${c2}`} strokeDashoffset={offF}
          strokeLinecap="round" rotation="-90" origin={`${CX}, ${CX}`}
        />
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

// Legend Item
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

// Macro Card
function MacroCard({ label, value, target, unit, color, icon }: {
  label: string; value: number; target: number; unit: string; color: string; icon: string;
}) {
  const pct = target > 0 ? Math.min(value / target, 1) : 0;
  return (
    <View style={[s.macroCard]}>
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

// Mini Ring
function MiniRing({ progress, color, size = 52 }: { progress: number; color: string; size?: number }) {
  const stroke = 5;
  const r      = (size - stroke) / 2;
  const circ   = 2 * Math.PI * r;
  const anim   = useRef(new Animated.Value(0)).current;

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

// Vitamin Card — PRO variant (with ring)
function VitaminCardPro({ name, icon, current, status }: VitaminEntry) {
  const color = statusColor(status);
  return (
    <View style={[s.vitCard, { borderColor: color + '30' }]}>
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

// Vitamin Card — Free variant (name + status only)
function VitaminCardFree({ name, icon, status }: Pick<VitaminEntry, 'name' | 'icon' | 'status'>) {
  const color = statusColor(status);
  return (
    <View style={[s.vitCard, { borderColor: color + '30' }]}>
      <Text style={{ fontSize: 20, marginBottom: 4 }}>{icon}</Text>
      <Text style={s.vitName}>{name}</Text>
      <View style={[s.vitBadge, { backgroundColor: color + '20' }]}>
        <Text style={[s.vitBadgeText, { color }]}>{statusLabel(status)}</Text>
      </View>
    </View>
  );
}

// AI Card
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

// PRO Upsell Card
function ProUpsellCard() {
  return (
    <View style={s.proCard}>
      <LinearGradient
        colors={[Colors.gold + '18', Colors.accentPurple + '18']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Text style={s.proCardText}>
        {'📊 Детализация по витаминам — только в PRO. Узнайте точные проценты и получите AI‑рекомендации по восполнению.'}
      </Text>
      <TouchableOpacity style={s.proBtn} activeOpacity={0.85}>
        <Text style={s.proBtnText}>Разблокировать PRO</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── CalorieSettingsModal ─────────────────────────────────────────────────────

function CalorieSettingsModal({ visible, currentGoal, onSave, onClose }: {
  visible: boolean;
  currentGoal: number;
  onSave: (kcal: number) => void;
  onClose: () => void;
}) {
  const insets                        = useSafeAreaInsets();
  const [tab, setTab]                 = useState<CalGoalTab>('custom');
  const [customVal, setCustomVal]     = useState(String(currentGoal));
  const [gender, setGender]           = useState<Gender>('male');
  const [age, setAge]                 = useState('');
  const [weight, setWeight]           = useState('');
  const [height, setHeight]           = useState('');
  const [activityIdx, setActivityIdx] = useState(1);
  const [tdeeResult, setTdeeResult]   = useState<number | null>(null);

  function handleCalc() {
    const a = parseInt(age, 10);
    const w = parseFloat(weight);
    const h = parseFloat(height);
    if (!a || !w || !h || isNaN(a) || isNaN(w) || isNaN(h)) return;
    const bmr  = calcBMR(gender, w, h, a);
    const tdee = calcTDEE(bmr, ACTIVITY_LEVELS[activityIdx].multiplier);
    setTdeeResult(tdee);
  }

  function handleSaveCustom() {
    const v = parseInt(customVal, 10);
    if (v > 0) { onSave(v); onClose(); }
  }

  function handleAcceptTdee() {
    if (tdeeResult) { onSave(tdeeResult); onClose(); }
  }

  const TABS = [
    { key: 'custom' as CalGoalTab,    label: 'Своя цель'  },
    { key: 'calculate' as CalGoalTab, label: 'Рассчитать' },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={onClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[s.sheet, { paddingBottom: insets.bottom + Spacing.lg }]}
      >
        <View style={s.sheetHandle} />
        <Text style={s.sheetTitle}>Цель по калориям</Text>

        <View style={{ marginBottom: Spacing.lg }}>
          <SegmentedControl tabs={TABS} active={tab} onPress={k => { setTab(k as CalGoalTab); setTdeeResult(null); }} />
        </View>

        {tab === 'custom' ? (
          <View>
            <Text style={s.inputLabel}>Калорий в день (ккал)</Text>
            <TextInput
              style={s.input}
              value={customVal}
              onChangeText={setCustomVal}
              keyboardType="numeric"
              placeholderTextColor={Colors.textMuted}
              placeholder="2000"
            />
            <TouchableOpacity style={s.primaryBtn} onPress={handleSaveCustom} activeOpacity={0.85}>
              <Text style={s.primaryBtnText}>Сохранить</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            {/* Gender */}
            <Text style={s.inputLabel}>Пол</Text>
            <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md }}>
              {(['male', 'female'] as Gender[]).map(g => (
                <TouchableOpacity
                  key={g}
                  style={[s.modePill, gender === g && { backgroundColor: Colors.accentTeal }]}
                  onPress={() => { setGender(g); setTdeeResult(null); }}
                  activeOpacity={0.8}
                >
                  <Text style={[s.modePillText, gender === g && { color: Colors.bg }]}>
                    {g === 'male' ? 'М' : 'Ж'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Age / Weight / Height */}
            <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md }}>
              {[
                { label: 'Возраст (лет)', val: age,    set: setAge    },
                { label: 'Вес (кг)',      val: weight, set: setWeight },
                { label: 'Рост (см)',     val: height, set: setHeight },
              ].map(({ label, val, set }) => (
                <View key={label} style={{ flex: 1 }}>
                  <Text style={[s.inputLabel, { marginBottom: 4 }]}>{label}</Text>
                  <TextInput
                    style={s.input}
                    value={val}
                    onChangeText={t => { set(t); setTdeeResult(null); }}
                    keyboardType="numeric"
                    placeholderTextColor={Colors.textMuted}
                    placeholder="0"
                  />
                </View>
              ))}
            </View>

            {/* Activity level */}
            <Text style={s.inputLabel}>Активность</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
              <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                {ACTIVITY_LEVELS.map((lv, i) => (
                  <TouchableOpacity
                    key={lv.label}
                    style={[s.modePill, activityIdx === i && { backgroundColor: Colors.accentTeal }]}
                    onPress={() => { setActivityIdx(i); setTdeeResult(null); }}
                    activeOpacity={0.8}
                  >
                    <Text style={[s.modePillText, activityIdx === i && { color: Colors.bg }]}>{lv.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {tdeeResult === null ? (
              <TouchableOpacity style={s.primaryBtn} onPress={handleCalc} activeOpacity={0.85}>
                <Text style={s.primaryBtnText}>Рассчитать</Text>
              </TouchableOpacity>
            ) : (
              <View style={s.tdeeResult}>
                <LinearGradient
                  colors={[Colors.accentTeal + '20', Colors.accentPurple + '15']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <Text style={s.tdeeLabel}>Ваша норма</Text>
                <Text style={[s.tdeeValue, { color: Colors.accentTeal }]}>{tdeeResult.toLocaleString('ru-RU')} ккал/день</Text>
                <TouchableOpacity style={[s.primaryBtn, { marginTop: Spacing.md }]} onPress={handleAcceptTdee} activeOpacity={0.85}>
                  <Text style={s.primaryBtnText}>Принять</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── AddMealModal ─────────────────────────────────────────────────────────────

function AddMealModal({ visible, onAdd, onClose }: {
  visible: boolean;
  onAdd: (meal: Meal) => void;
  onClose: () => void;
}) {
  const insets                    = useSafeAreaInsets();
  const [name, setName]           = useState('');
  const [calories, setCalories]   = useState('');
  const [protein, setProtein]     = useState('');
  const [fat, setFat]             = useState('');
  const [carbs, setCarbs]         = useState('');

  function handleAdd() {
    const kcal = parseInt(calories, 10) || 0;
    if (!name.trim() || kcal <= 0) return;
    onAdd({
      id:       uid(),
      name:     name.trim(),
      calories: kcal,
      protein:  parseFloat(protein) || 0,
      fat:      parseFloat(fat)     || 0,
      carbs:    parseFloat(carbs)   || 0,
    });
    setName(''); setCalories(''); setProtein(''); setFat(''); setCarbs('');
    onClose();
  }

  const fields: { label: string; val: string; set: (v: string) => void; placeholder: string }[] = [
    { label: 'Белки (г)',    val: protein,  set: setProtein,  placeholder: '0' },
    { label: 'Жиры (г)',     val: fat,      set: setFat,      placeholder: '0' },
    { label: 'Углеводы (г)', val: carbs,    set: setCarbs,    placeholder: '0' },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={onClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[s.sheet, { paddingBottom: insets.bottom + Spacing.lg }]}
      >
        <View style={s.sheetHandle} />
        <Text style={s.sheetTitle}>Добавить блюдо</Text>

        <Text style={s.inputLabel}>Название блюда</Text>
        <TextInput
          style={[s.input, { marginBottom: Spacing.md }]}
          value={name}
          onChangeText={setName}
          placeholderTextColor={Colors.textMuted}
          placeholder="Например: Овсяная каша"
        />

        <Text style={s.inputLabel}>Калории (ккал)</Text>
        <TextInput
          style={[s.input, { marginBottom: Spacing.md }]}
          value={calories}
          onChangeText={setCalories}
          keyboardType="numeric"
          placeholderTextColor={Colors.textMuted}
          placeholder="0"
        />

        <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg }}>
          {fields.map(f => (
            <View key={f.label} style={{ flex: 1 }}>
              <Text style={[s.inputLabel, { marginBottom: 4 }]}>{f.label}</Text>
              <TextInput
                style={s.input}
                value={f.val}
                onChangeText={f.set}
                keyboardType="numeric"
                placeholderTextColor={Colors.textMuted}
                placeholder={f.placeholder}
              />
            </View>
          ))}
        </View>

        <TouchableOpacity style={s.primaryBtn} onPress={handleAdd} activeOpacity={0.85}>
          <Text style={s.primaryBtnText}>Добавить</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Diet Tab ─────────────────────────────────────────────────────────────────

function DietTab({ meals, onAddMeal, onDeleteMeal, calorieGoal, onOpenCalSettings }: {
  meals:            Meal[];
  onAddMeal:        () => void;
  onDeleteMeal:     (id: string) => void;
  calorieGoal:      number;
  onOpenCalSettings: () => void;
}) {
  const [dietMode, setDietMode] = useState<DietMode>('maintain');

  const modeCfg       = DIET_MODES.find(m => m.key === dietMode)!;
  const adjustedGoal  = Math.max(1200, calorieGoal + modeCfg.delta);
  const targets       = macroTargets(adjustedGoal);

  const totalMacros = meals.reduce<MacroData>(
    (acc, m) => ({
      calories: acc.calories + m.calories,
      protein:  acc.protein  + m.protein,
      fat:      acc.fat      + m.fat,
      carbs:    acc.carbs    + m.carbs,
    }),
    { calories: 0, protein: 0, fat: 0, carbs: 0 }
  );

  const proteinPct = Math.min(totalMacros.protein / Math.max(targets.protein, 1), 1);
  const fatPct     = Math.min(totalMacros.fat     / Math.max(targets.fat,     1), 1);
  const carbsPct   = Math.min(totalMacros.carbs   / Math.max(targets.carbs,   1), 1);

  // Macro distribution bar
  const totalKcalFromMacros =
    totalMacros.protein * KCAL_PG.protein +
    totalMacros.fat     * KCAL_PG.fat +
    totalMacros.carbs   * KCAL_PG.carbs;

  const pPct = totalKcalFromMacros > 0 ? (totalMacros.protein * KCAL_PG.protein) / totalKcalFromMacros : 0;
  const fPct = totalKcalFromMacros > 0 ? (totalMacros.fat     * KCAL_PG.fat)     / totalKcalFromMacros : 0;
  const cPct = totalKcalFromMacros > 0 ? (totalMacros.carbs   * KCAL_PG.carbs)   / totalKcalFromMacros : 0;

  return (
    <>
      {/* ── Calorie Header ── */}
      <TouchableOpacity style={s.calHeader} onPress={onOpenCalSettings} activeOpacity={0.8}>
        <LinearGradient
          colors={['#1a1b2e', '#0f1020']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={s.calHeaderLabel}>ЦЕЛЬ ПО КАЛОРИЯМ</Text>
            <Text style={s.calHeaderValue}>
              {adjustedGoal.toLocaleString('ru-RU')}
              <Text style={s.calHeaderUnit}> ккал</Text>
            </Text>
          </View>
          <View style={s.editBadge}>
            <Text style={s.editBadgeText}>✏️ Изменить</Text>
          </View>
        </View>

        {/* Diet Mode Pills */}
        <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md }}>
          {DIET_MODES.map(m => {
            const isActive = dietMode === m.key;
            const deltaStr = m.delta === 0 ? 'базовый' : m.delta > 0 ? `+${m.delta} ккал` : `${m.delta} ккал`;
            return (
              <TouchableOpacity
                key={m.key}
                style={[s.dietPill, isActive && { backgroundColor: m.color + 'CC' }]}
                onPress={e => { e.stopPropagation?.(); setDietMode(m.key); }}
                activeOpacity={0.8}
              >
                <Text style={[s.dietPillLabel, isActive && { color: '#fff' }]}>{m.label}</Text>
                <Text style={[s.dietPillDelta, isActive && { color: 'rgba(255,255,255,0.8)' }]}>{deltaStr}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </TouchableOpacity>

      {/* ── Activity Rings Hero ── */}
      <View style={s.heroCard}>
        <LinearGradient colors={['#1E1F3C', '#111224']} style={StyleSheet.absoluteFill} />
        <View style={s.heroShine} pointerEvents="none" />
        <View style={{ alignItems: 'center', paddingTop: Spacing.xxl, paddingBottom: Spacing.lg }}>
          <ActivityRings
            proteinPct={proteinPct}
            fatPct={fatPct}
            carbsPct={carbsPct}
            calories={totalMacros.calories}
            target={adjustedGoal}
          />
        </View>
        <View style={s.legendRow}>
          <LegendItem color={Colors.accentPurple} label="Углеводы" value={Math.round(totalMacros.carbs)}   target={targets.carbs}   unit="г" />
          <LegendItem color={Colors.pink}         label="Жиры"     value={Math.round(totalMacros.fat)}     target={targets.fat}     unit="г" />
          <LegendItem color={Colors.accentTeal}   label="Белки"    value={Math.round(totalMacros.protein)} target={targets.protein} unit="г" />
        </View>
      </View>

      {/* ── Macro Cards ── */}
      <View style={s.macroRow}>
        <MacroCard label="Белки"  value={Math.round(totalMacros.protein)} target={targets.protein} unit="г" color={Colors.accentTeal}   icon="🥩" />
        <MacroCard label="Жиры"   value={Math.round(totalMacros.fat)}     target={targets.fat}     unit="г" color={Colors.pink}         icon="🥑" />
        <MacroCard label="Углев." value={Math.round(totalMacros.carbs)}   target={targets.carbs}   unit="г" color={Colors.accentPurple} icon="🌾" />
      </View>

      {/* ── Рацион сегодня ── */}
      <View style={{ marginBottom: Spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md }}>
          <Text style={s.sectionTitle}>РАЦИОН СЕГОДНЯ</Text>
          <TouchableOpacity onPress={onAddMeal} activeOpacity={0.75} style={s.addMealBtn}>
            <Text style={s.addMealBtnText}>＋ Добавить блюдо</Text>
          </TouchableOpacity>
        </View>

        {meals.length === 0 ? (
          <View style={s.emptyMeals}>
            <Text style={s.emptyMealsText}>
              {'Пока ничего не добавлено.\nНажмите ＋ чтобы начать'}
            </Text>
          </View>
        ) : (
          <>
            {meals.map(meal => (
              <View key={meal.id} style={s.mealRow}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.04)', 'rgba(255,255,255,0.02)']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
                <Text style={s.mealDishIcon}>🍽</Text>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={s.mealName} numberOfLines={1}>{meal.name}</Text>
                    <Text style={s.mealKcal}>{meal.calories} ккал</Text>
                  </View>
                  <Text style={s.mealMacros}>
                    Б:{Math.round(meal.protein)}г{'  '}Ж:{Math.round(meal.fat)}г{'  '}У:{Math.round(meal.carbs)}г
                  </Text>
                </View>
                <TouchableOpacity style={s.mealDeleteBtn} onPress={() => onDeleteMeal(meal.id)} activeOpacity={0.7}>
                  <Text style={s.mealDeleteText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}

            {/* Distribution bar */}
            {totalKcalFromMacros > 0 && (
              <View style={s.distCard}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
                  style={StyleSheet.absoluteFill}
                />
                <Text style={[s.sectionTitle, { marginBottom: Spacing.md, fontSize: Typography.sizeXS }]}>
                  СТРУКТУРА РАЦИОНА
                </Text>
                <View style={s.distBar}>
                  {pPct > 0.01 && (
                    <View style={[s.distSegment, { flex: pPct, backgroundColor: Colors.accentTeal }]} />
                  )}
                  {fPct > 0.01 && (
                    <View style={[s.distSegment, { flex: fPct, backgroundColor: Colors.pink }]} />
                  )}
                  {cPct > 0.01 && (
                    <View style={[s.distSegment, { flex: cPct, backgroundColor: Colors.accentPurple }]} />
                  )}
                </View>
                <View style={{ flexDirection: 'row', gap: Spacing.lg, marginTop: Spacing.sm }}>
                  {[
                    { label: 'Белки',    color: Colors.accentTeal,   pct: pPct },
                    { label: 'Жиры',     color: Colors.pink,         pct: fPct },
                    { label: 'Углеводы', color: Colors.accentPurple, pct: cPct },
                  ].map(item => (
                    <View key={item.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: item.color }} />
                      <Text style={{ fontSize: Typography.sizeXS, color: Colors.textSecondary }}>
                        {item.label} {Math.round(item.pct * 100)}%
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        )}
      </View>
    </>
  );
}

// ─── Vitamins Tab ─────────────────────────────────────────────────────────────

function VitaminsTab({ vitamins, isPro }: { vitamins: VitaminEntry[]; isPro: boolean }) {
  const deficits = vitamins.filter(v => v.status === 'deficit');
  const aiText   = buildAiText(deficits);

  return (
    <>
      {/* Section header */}
      <View style={[s.sectionHeader, { marginBottom: Spacing.md }]}>
        <Text style={s.sectionTitle}>МИКРОНУТРИЕНТЫ</Text>
        {deficits.length > 0 && (
          <View style={s.deficitBadge}>
            <Text style={s.deficitText}>{deficits.length} дефицит{deficits.length > 1 ? 'а' : ''}</Text>
          </View>
        )}
      </View>

      <View style={s.vitaminGrid}>
        {isPro
          ? vitamins.map(v => <VitaminCardPro key={v.name} {...v} />)
          : vitamins.map(v => <VitaminCardFree key={v.name} name={v.name} icon={v.icon} status={v.status} />)
        }
      </View>

      {isPro && aiText && <AiCard text={aiText} />}
      {!isPro && <ProUpsellCard />}
    </>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function NutritionScreen() {
  const { user } = useAuthStore();
  const isPro    = user?.is_pro === true;

  const [activeTab,      setActiveTab]      = useState<TabKey>('diet');
  const [meals,          setMeals]          = useState<Meal[]>([]);
  const [calorieGoal,    setCalorieGoal]    = useState(DEFAULT_CALORIE_GOAL);
  const [calModalOpen,   setCalModalOpen]   = useState(false);
  const [addMealOpen,    setAddMealOpen]    = useState(false);
  const [vitamins,       setVitamins]       = useState<VitaminEntry[]>(() => buildVitamins(0, 0, 0, 0));

  // Load vitamins from fridge_items
  async function loadNutrition() {
    if (!user) return;

    const { data: fridgeItems } = await supabase
      .from('fridge_items')
      .select('product_id, quantity')
      .eq('user_id', user.id);

    if (!fridgeItems?.length) {
      setVitamins(buildVitamins(0, 0, 0, 0));
      return;
    }

    const productIds = fridgeItems.map((i: any) => i.product_id).filter(Boolean) as string[];
    if (!productIds.length) return;

    const { data: products } = await supabase
      .from('products')
      .select('id, calories_per_100g, protein_per_100g, fat_per_100g, carbs_per_100g')
      .in('id', productIds);

    if (!products) return;

    let cal = 0, prot = 0, fat = 0, carbs = 0;
    const pm = new Map(products.map((p: any) => [p.id, p]));

    for (const item of fridgeItems) {
      const p = item.product_id ? pm.get(item.product_id) : null;
      if (!p) continue;
      const g = (item.quantity * 100) / 30;
      cal   += ((p.calories_per_100g ?? 0) * g) / 100;
      prot  += ((p.protein_per_100g  ?? 0) * g) / 100;
      fat   += ((p.fat_per_100g      ?? 0) * g) / 100;
      carbs += ((p.carbs_per_100g    ?? 0) * g) / 100;
    }

    setVitamins(buildVitamins(cal, prot, fat, carbs));
  }

  useEffect(() => {
    loadNutrition();
  }, [user]);

  function handleAddMeal(meal: Meal) {
    setMeals(prev => [...prev, meal]);
  }

  function handleDeleteMeal(id: string) {
    setMeals(prev => prev.filter(m => m.id !== id));
  }

  const TOP_TABS = [
    { key: 'diet'     as TabKey, label: 'Рацион'   },
    { key: 'vitamins' as TabKey, label: 'Витамины'  },
  ];

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Screen Header */}
        <View style={s.screenHeader}>
          <Text style={s.screenTitle}>Мой Рацион</Text>
        </View>

        {/* Top Tabs */}
        <View style={{ marginBottom: Spacing.lg }}>
          <SegmentedControl tabs={TOP_TABS} active={activeTab} onPress={k => setActiveTab(k as TabKey)} />
        </View>

        {activeTab === 'diet' ? (
          <DietTab
            meals={meals}
            onAddMeal={() => setAddMealOpen(true)}
            onDeleteMeal={handleDeleteMeal}
            calorieGoal={calorieGoal}
            onOpenCalSettings={() => setCalModalOpen(true)}
          />
        ) : (
          <VitaminsTab vitamins={vitamins} isPro={isPro} />
        )}
      </ScrollView>

      <CalorieSettingsModal
        visible={calModalOpen}
        currentGoal={calorieGoal}
        onSave={setCalorieGoal}
        onClose={() => setCalModalOpen(false)}
      />

      <AddMealModal
        visible={addMealOpen}
        onAdd={handleAddMeal}
        onClose={() => setAddMealOpen(false)}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.bg },
  scroll:  { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: Layout.tabBarClearance },

  screenHeader: { marginBottom: Spacing.lg },
  screenTitle:  { fontSize: Typography.sizeXL, fontWeight: Typography.weightBold, color: Colors.textPrimary },

  // ── Calorie Header
  calHeader: {
    borderRadius:  Radius.lg,
    overflow:      'hidden',
    padding:       Spacing.lg,
    marginBottom:  Spacing.md,
    borderWidth:   StyleSheet.hairlineWidth,
    borderColor:   'rgba(255,255,255,0.06)',
  },
  calHeaderLabel: { fontSize: Typography.sizeXS, color: Colors.textMuted, letterSpacing: 1.2 },
  calHeaderValue: { fontSize: 28, fontWeight: Typography.weightBold, color: Colors.textPrimary, marginTop: 2 },
  calHeaderUnit:  { fontSize: Typography.sizeMD, color: Colors.textSecondary },
  editBadge:      { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs },
  editBadgeText:  { fontSize: Typography.sizeXS, color: Colors.textSecondary },

  dietPill: {
    flex: 1,
    alignItems:      'center',
    paddingVertical: Spacing.sm,
    borderRadius:    Radius.md,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  dietPillLabel: { fontSize: Typography.sizeXS, fontWeight: Typography.weightSemiBold, color: Colors.textSecondary },
  dietPillDelta: { fontSize: 9, color: Colors.textMuted, marginTop: 2 },

  // ── Hero Card
  heroCard: {
    borderRadius:  Radius.xl,
    overflow:      'hidden',
    marginBottom:  Spacing.md,
    borderWidth:   StyleSheet.hairlineWidth,
    borderColor:   Glass.border,
    shadowColor:   '#000',
    shadowOffset:  { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius:  20,
  },
  heroShine: {
    position:        'absolute',
    top:             0,
    left:            0,
    right:           0,
    height:          StyleSheet.hairlineWidth,
    backgroundColor: Glass.highlight,
    zIndex:          1,
  },
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

  // ── Macro Cards
  macroRow:   { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  macroCard:  { flex: 1, borderRadius: Radius.lg, padding: Spacing.md, overflow: 'hidden', backgroundColor: Colors.surface },
  macroIcon:  { fontSize: 20, marginBottom: Spacing.xs },
  macroValue: { fontSize: Typography.sizeLG, fontWeight: Typography.weightBold },
  macroUnit:  { fontSize: Typography.sizeXS, color: Colors.textSecondary },
  macroLabel: { fontSize: Typography.sizeXS, color: Colors.textSecondary, marginTop: 2 },
  macroMeta:  { fontSize: Typography.sizeXS, color: Colors.textMuted },
  macroTrack: { height: 3, borderRadius: 2, backgroundColor: Colors.border, marginTop: Spacing.sm, overflow: 'hidden' },

  // ── Meal List
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  sectionTitle:  { fontSize: Typography.sizeXS, fontWeight: Typography.weightBold, color: Colors.textMuted, letterSpacing: 1.2 },
  addMealBtn:    { backgroundColor: Colors.accentTeal + '20', borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs },
  addMealBtnText: { fontSize: Typography.sizeXS, fontWeight: Typography.weightSemiBold, color: Colors.accentTeal },

  emptyMeals:     { padding: Spacing.xl, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: Radius.lg },
  emptyMealsText: { fontSize: Typography.sizeSM, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },

  mealRow: {
    flexDirection:  'row',
    alignItems:     'center',
    borderRadius:   Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    marginBottom:   Spacing.sm,
    overflow:       'hidden',
  },
  mealDishIcon:   { fontSize: 24, marginRight: Spacing.md },
  mealName:       { fontSize: Typography.sizeSM, fontWeight: Typography.weightSemiBold, color: Colors.textPrimary, flex: 1, marginRight: Spacing.sm },
  mealKcal:       { fontSize: Typography.sizeSM, fontWeight: Typography.weightBold, color: Colors.accentTeal },
  mealMacros:     { fontSize: 10, color: Colors.textMuted, marginTop: 2 },
  mealDeleteBtn:  { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(251,113,133,0.15)', alignItems: 'center', justifyContent: 'center', marginLeft: Spacing.sm },
  mealDeleteText: { fontSize: 18, color: Colors.danger, lineHeight: 22 },

  distCard: {
    borderRadius:   Radius.lg,
    overflow:       'hidden',
    padding:        Spacing.md,
    marginTop:      Spacing.sm,
    marginBottom:   Spacing.md,
  },
  distBar: {
    flexDirection: 'row',
    height:        8,
    borderRadius:  4,
    overflow:      'hidden',
    backgroundColor: Colors.border,
  },
  distSegment: { height: '100%' },

  // ── Vitamins
  deficitBadge:  { backgroundColor: Colors.danger + '20', borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  deficitText:   { fontSize: Typography.sizeXS, color: Colors.danger, fontWeight: Typography.weightSemiBold },
  vitaminGrid:   { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: Spacing.lg },
  vitCard:       { width: '49%', borderRadius: Radius.lg, borderWidth: StyleSheet.hairlineWidth, padding: Spacing.md, backgroundColor: Colors.surface, marginBottom: Spacing.sm },
  vitName:       { fontSize: Typography.sizeSM, color: Colors.textPrimary, fontWeight: Typography.weightSemiBold, marginBottom: Spacing.xs },
  vitBadge:      { borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2, alignSelf: 'flex-start', marginTop: Spacing.xs },
  vitBadgeText:  { fontSize: 9, fontWeight: Typography.weightBold },

  // ── AI Card
  aiCard:  { borderRadius: Radius.xl, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: Glass.border, padding: Spacing.lg, marginBottom: Spacing.md },
  aiStar:  { fontSize: 16, color: Colors.accentPurple, marginRight: Spacing.sm },
  aiTitle: { fontSize: Typography.sizeMD, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  aiText:  { fontSize: Typography.sizeSM, color: Colors.textSecondary, lineHeight: 20 },

  // ── PRO Upsell
  proCard: {
    borderRadius:  Radius.xl,
    overflow:      'hidden',
    borderWidth:   StyleSheet.hairlineWidth,
    borderColor:   Colors.gold + '40',
    padding:       Spacing.lg,
    marginBottom:  Spacing.md,
  },
  proCardText: { fontSize: Typography.sizeSM, color: Colors.textSecondary, lineHeight: 20, marginBottom: Spacing.lg },
  proBtn:      { backgroundColor: Colors.gold, borderRadius: Radius.full, paddingVertical: Spacing.md, alignItems: 'center' },
  proBtnText:  { fontSize: Typography.sizeSM, fontWeight: Typography.weightBold, color: '#0A0B14' },

  // ── Modal / Sheet
  modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: {
    backgroundColor:      '#0D0E1C',
    borderTopLeftRadius:  28,
    borderTopRightRadius: 28,
    padding:              Spacing.lg,
    paddingTop:           Spacing.md,
  },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.18)', alignSelf: 'center', marginBottom: Spacing.lg },
  sheetTitle:  { fontSize: Typography.sizeLG, fontWeight: Typography.weightBold, color: Colors.textPrimary, marginBottom: Spacing.lg },

  inputLabel: { fontSize: Typography.sizeXS, color: Colors.textMuted, letterSpacing: 0.8, marginBottom: Spacing.sm },
  input: {
    backgroundColor:  'rgba(255,255,255,0.07)',
    borderRadius:     Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical:  Spacing.md,
    fontSize:         Typography.sizeMD,
    color:            Colors.textPrimary,
    borderWidth:      StyleSheet.hairlineWidth,
    borderColor:      'rgba(255,255,255,0.10)',
  },

  primaryBtn:     { backgroundColor: Colors.accentTeal, borderRadius: Radius.full, paddingVertical: Spacing.md, alignItems: 'center' },
  primaryBtnText: { fontSize: Typography.sizeSM, fontWeight: Typography.weightBold, color: Colors.bg },

  modePill: {
    paddingHorizontal: Spacing.lg,
    paddingVertical:   Spacing.sm,
    borderRadius:      Radius.full,
    backgroundColor:   'rgba(255,255,255,0.07)',
  },
  modePillText: { fontSize: Typography.sizeSM, fontWeight: Typography.weightSemiBold, color: Colors.textSecondary },

  tdeeResult: {
    borderRadius:  Radius.lg,
    overflow:      'hidden',
    padding:       Spacing.lg,
    borderWidth:   StyleSheet.hairlineWidth,
    borderColor:   Colors.accentTeal + '40',
    alignItems:    'center',
    marginBottom:  Spacing.sm,
  },
  tdeeLabel: { fontSize: Typography.sizeSM, color: Colors.textMuted, marginBottom: Spacing.xs },
  tdeeValue: { fontSize: 26, fontWeight: Typography.weightBold },
});
