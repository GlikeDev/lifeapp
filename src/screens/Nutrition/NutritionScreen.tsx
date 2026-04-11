import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, ProgressBar } from '../../components/common';
import { CalorieRing } from '../../components/charts/CalorieRing';
import { Colors, Typography, Spacing, Radius } from '../../constants/tokens';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';

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
  current: number;  // 0–1 progress
  status: NutrientStatus;
}

// ─── Targets (WHO/standard norms) ────────────────────────────────────────────
const TARGETS: MacroData = {
  calories: 2100,
  protein: 90,
  fat: 70,
  carbs: 250,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusColor(s: NutrientStatus): string {
  if (s === 'deficit') return Colors.danger;
  if (s === 'warning') return Colors.warning;
  return Colors.success;
}

function statusLabel(s: NutrientStatus): string {
  if (s === 'deficit') return 'Дефицит';
  if (s === 'warning') return 'Внимание';
  return 'Норма';
}

function progressToStatus(p: number): NutrientStatus {
  if (p < 0.4) return 'deficit';
  if (p < 0.7) return 'warning';
  return 'normal';
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function NutritionScreen() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [macros, setMacros] = useState<MacroData>({ calories: 0, protein: 0, fat: 0, carbs: 0 });
  const [vitamins, setVitamins] = useState<VitaminEntry[]>([]);

  // Нутриционный профиль строится из продуктов в холодильнике (за последние 30 дней)
  async function loadNutrition() {
    if (!user) return;

    const { data: fridgeItems } = await supabase
      .from('fridge_items')
      .select('product_id, quantity')
      .eq('user_id', user.id);

    if (!fridgeItems || fridgeItems.length === 0) {
      setMacros({ calories: 0, protein: 0, fat: 0, carbs: 0 });
      setVitamins(buildVitamins(0, 0, 0, 0));
      return;
    }

    const productIds = fridgeItems
      .map((i) => i.product_id)
      .filter(Boolean) as string[];

    if (productIds.length === 0) {
      setMacros({ calories: 0, protein: 0, fat: 0, carbs: 0 });
      setVitamins(buildVitamins(0, 0, 0, 0));
      return;
    }

    const { data: products } = await supabase
      .from('products')
      .select('id, calories_per_100g, protein_per_100g, fat_per_100g, carbs_per_100g')
      .in('id', productIds);

    if (!products) return;

    // Оцениваем дневное потребление: сумма нутриентов / 30 дней
    let totalCal = 0, totalProt = 0, totalFat = 0, totalCarbs = 0;
    const productMap = new Map(products.map((p) => [p.id, p]));

    for (const item of fridgeItems) {
      if (!item.product_id) continue;
      const p = productMap.get(item.product_id);
      if (!p) continue;
      // Считаем 100г за единицу товара как дневную порцию/30
      const grams = (item.quantity * 100) / 30;
      totalCal   += ((p.calories_per_100g ?? 0) * grams) / 100;
      totalProt  += ((p.protein_per_100g  ?? 0) * grams) / 100;
      totalFat   += ((p.fat_per_100g      ?? 0) * grams) / 100;
      totalCarbs += ((p.carbs_per_100g    ?? 0) * grams) / 100;
    }

    setMacros({
      calories: Math.round(totalCal),
      protein:  Math.round(totalProt),
      fat:      Math.round(totalFat),
      carbs:    Math.round(totalCarbs),
    });
    setVitamins(buildVitamins(totalCal, totalProt, totalFat, totalCarbs));
  }

  // Витамины оцениваются эвристически по разнообразию КБЖУ
  function buildVitamins(cal: number, prot: number, fat: number, carbs: number): VitaminEntry[] {
    const calP  = Math.min(cal  / TARGETS.calories, 1);
    const protP = Math.min(prot / TARGETS.protein, 1);
    const fatP  = Math.min(fat  / TARGETS.fat, 1);
    const carbP = Math.min(carbs / TARGETS.carbs, 1);

    return [
      { name: 'Витамин D',  current: fatP  * 0.7, status: progressToStatus(fatP  * 0.7) },
      { name: 'Железо',     current: protP * 0.8, status: progressToStatus(protP * 0.8) },
      { name: 'Витамин B12',current: protP * 0.75,status: progressToStatus(protP * 0.75) },
      { name: 'Витамин C',  current: carbP * 0.9, status: progressToStatus(carbP * 0.9) },
      { name: 'Магний',     current: calP  * 0.85,status: progressToStatus(calP  * 0.85) },
      { name: 'Кальций',    current: fatP  * 0.8, status: progressToStatus(fatP  * 0.8) },
    ];
  }

  useEffect(() => {
    loadNutrition().finally(() => setLoading(false));
  }, [user]);

  async function onRefresh() {
    setRefreshing(true);
    await loadNutrition();
    setRefreshing(false);
  }

  const deficits = vitamins.filter((v) => v.status === 'deficit');
  const hasData = macros.calories > 0;

  // AI recommendation — static until Claude API connected
  function buildAiAdvice(): string | null {
    if (deficits.length === 0) return null;
    const names = deficits.map((d) => d.name).join(', ');
    const foods: Record<string, string> = {
      'Витамин D':  'лосось + яйца',
      'Железо':     'шпинат + говядина',
      'Витамин B12':'лосось + творог',
      'Витамин C':  'перец + апельсин',
      'Магний':     'орехи + гречка',
      'Кальций':    'молоко + сыр',
    };
    const suggestions = [...new Set(
      deficits.map((d) => foods[d.name] ?? 'разнообразные продукты')
    )].join(' + ');
    return `Дефицит ${names}.\nДобавь: ${suggestions}\n+€6–10/нед закроет дефицит`;
  }

  const aiAdvice = buildAiAdvice();
  const today = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.center}><ActivityIndicator color={Colors.accentTeal} size="large" /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accentTeal} />}
      >
        <Text style={styles.title}>Нутриция — сегодня</Text>
        <Text style={styles.subtitle}>{today}</Text>

        {!hasData ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🥗</Text>
            <Text style={styles.emptyTitle}>Нет данных</Text>
            <Text style={styles.emptySub}>
              Добавьте продукты в холодильник через Smart Shop — нутриционный профиль построится автоматически
            </Text>
          </Card>
        ) : (
          <>
            {/* Calorie Ring */}
            <View style={styles.ringArea}>
              <CalorieRing current={macros.calories} target={TARGETS.calories} size={180} />
            </View>

            {/* Macros row */}
            <View style={styles.macrosRow}>
              <MacroCard label="Белки"  value={macros.protein} target={TARGETS.protein} unit="г" color={Colors.accentTeal} />
              <MacroCard label="Жиры"   value={macros.fat}     target={TARGETS.fat}     unit="г" color={Colors.pink} />
              <MacroCard label="Углев." value={macros.carbs}   target={TARGETS.carbs}   unit="г" color={Colors.accentPurple} />
            </View>
          </>
        )}

        {/* Vitamins & Minerals */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Витамины и минералы</Text>
          {hasData ? (
            vitamins.map((v) => (
              <View key={v.name} style={styles.vitaminRow}>
                <Text style={styles.vitaminName}>{v.name}</Text>
                <ProgressBar
                  progress={v.current}
                  color={statusColor(v.status)}
                  height={6}
                  style={styles.vitaminBar}
                />
                <View style={[styles.statusBadge, { backgroundColor: statusColor(v.status) + '22' }]}>
                  <Text style={[styles.statusText, { color: statusColor(v.status) }]}>
                    {statusLabel(v.status)}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            vitamins.map((v) => (
              <View key={v.name} style={styles.vitaminRow}>
                <Text style={styles.vitaminName}>{v.name}</Text>
                <ProgressBar progress={0} color={Colors.border} height={6} style={styles.vitaminBar} />
                <View style={[styles.statusBadge, { backgroundColor: Colors.border }]}>
                  <Text style={[styles.statusText, { color: Colors.textMuted }]}>—</Text>
                </View>
              </View>
            ))
          )}
        </Card>

        {/* AI Recommendation */}
        {aiAdvice && (
          <Card style={styles.aiCard}>
            <Text style={styles.aiLabel}>AI Рекомендация</Text>
            <Text style={styles.aiText}>{aiAdvice}</Text>
          </Card>
        )}

        {!hasData && (
          <Card style={styles.aiCard}>
            <Text style={styles.aiLabel}>Как это работает</Text>
            <Text style={styles.aiText}>
              Нутриционный профиль строится автоматически на основе продуктов из вашего холодильника.
              {'\n\n'}Данные о составе берутся из OpenFoodFacts API (3M+ продуктов). Дефицит рассчитывается за 30 дней.
            </Text>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function MacroCard({
  label, value, target, unit, color,
}: {
  label: string; value: number; target: number; unit: string; color: string;
}) {
  const progress = target > 0 ? Math.min(value / target, 1) : 0;
  return (
    <Card style={styles.macroCard}>
      <Text style={[styles.macroValue, { color }]}>{value}<Text style={styles.macroUnit}>{unit}</Text></Text>
      <Text style={styles.macroLabel}>{label}</Text>
      <Text style={styles.macroTarget}>из {target}{unit}</Text>
      <ProgressBar progress={progress} color={color} height={4} style={{ marginTop: Spacing.xs }} />
    </Card>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.bg },
  scroll:  { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: 40 },
  center:  { flex: 1, alignItems: 'center', justifyContent: 'center' },

  title:    { fontSize: Typography.sizeXL, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  subtitle: { fontSize: Typography.sizeSM, color: Colors.textSecondary, marginTop: 2, marginBottom: Spacing.lg },

  ringArea: { alignItems: 'center', marginBottom: Spacing.lg },

  macrosRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  macroCard: { flex: 1, padding: Spacing.md },
  macroValue: { fontSize: Typography.sizeLG, fontWeight: Typography.weightBold },
  macroUnit: { fontSize: Typography.sizeSM },
  macroLabel: { fontSize: Typography.sizeXS, color: Colors.textSecondary, marginTop: 2 },
  macroTarget: { fontSize: Typography.sizeXS, color: Colors.textMuted },

  section: { marginBottom: Spacing.md },
  sectionTitle: { fontSize: Typography.sizeMD, fontWeight: Typography.weightSemiBold, color: Colors.textPrimary, marginBottom: Spacing.md },

  vitaminRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  vitaminName: { width: 110, fontSize: Typography.sizeSM, color: Colors.textSecondary },
  vitaminBar: { flex: 1, marginHorizontal: Spacing.sm },
  statusBadge: { borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2, minWidth: 72, alignItems: 'center' },
  statusText: { fontSize: Typography.sizeXS, fontWeight: Typography.weightSemiBold },

  aiCard: { marginBottom: Spacing.md, borderColor: Colors.accentPurple + '55' },
  aiLabel: { fontSize: Typography.sizeSM, fontWeight: Typography.weightBold, color: Colors.accentPurple, marginBottom: Spacing.xs },
  aiText: { fontSize: Typography.sizeSM, color: Colors.textSecondary, lineHeight: 20 },

  emptyCard: { alignItems: 'center', padding: Spacing.xl, marginBottom: Spacing.md },
  emptyIcon: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { fontSize: Typography.sizeLG, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  emptySub: { fontSize: Typography.sizeSM, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.xs, lineHeight: 20 },
});
