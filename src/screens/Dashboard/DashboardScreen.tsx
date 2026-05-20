import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassCard, GlyphIcon, ProgressBar, HoloNumber } from '../../components/common';
import { Colors, CATEGORIES, Radius, fontMono } from '../../constants/tokens';
import { useBudgetStore } from '../../store/useBudgetStore';
import { useAuthStore } from '../../store/useAuthStore';

type Variant = 'v1' | 'v2' | 'v3';

const SPEND_BY_CAT = [
  { key: 'food', label: 'Питание', spent: 280, budget: 400 },
  { key: 'transport', label: 'Транспорт', spent: 80, budget: 150 },
  { key: 'home', label: 'Дом', spent: 320, budget: 500 },
  { key: 'health', label: 'Здоровье', spent: 60, budget: 100 },
  { key: 'other', label: 'Прочее', spent: 40, budget: 80 },
];

function ThemeSwitcher({ variant, setVariant }: { variant: Variant; setVariant: (v: Variant) => void }) {
  const [open, setOpen] = useState(false);
  const labels: Record<Variant, string> = { v1: 'Дашборд', v2: 'Редакция', v3: 'Компакт' };
  return (
    <View style={styles.switcher}>
      <TouchableOpacity onPress={() => setOpen(o => !o)} style={styles.switcherPill}>
        <GlyphIcon name="sparkle" size={12} color={Colors.cyan} />
        <Text style={styles.switcherLabel}>{labels[variant]}</Text>
      </TouchableOpacity>
      {open && (
        <View style={styles.switcherMenu}>
          {(['v1', 'v2', 'v3'] as Variant[]).map(v => (
            <TouchableOpacity key={v} onPress={() => { setVariant(v); setOpen(false); }} style={styles.switcherItem}>
              <Text style={[styles.switcherItemLabel, v === variant && { color: Colors.cyan }]}>{labels[v]}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

function DashV1({ spent, budget, user }: { spent: number; budget: number; user: any }) {
  const progress = spent / (budget || 1);
  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 100 }}>
      <LinearGradient colors={[Colors.cyan + '30', Colors.purple + '20']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroCard}>
        <Text style={styles.heroGreeting}>Привет, {user?.full_name?.split(' ')[0] ?? 'друг'} 👋</Text>
        <Text style={styles.heroAmount}>€{spent.toFixed(0)}</Text>
        <Text style={styles.heroSub}>из €{budget} бюджета</Text>
        <ProgressBar progress={progress} color={Colors.cyan} height={6} />
      </LinearGradient>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
        {[
          { label: 'Осталось', val: `€${(budget - spent).toFixed(0)}`, color: Colors.green },
          { label: 'В день', val: `€${(spent / 20).toFixed(0)}`, color: Colors.cyan },
          { label: 'Категорий', val: '5', color: Colors.purple },
        ].map(m => (
          <GlassCard key={m.label} style={{ flex: 1, padding: 12, alignItems: 'center', gap: 4 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: m.color }}>{m.val}</Text>
            <Text style={{ fontSize: 10, color: Colors.t3 }}>{m.label}</Text>
          </GlassCard>
        ))}
      </View>
      <Text style={styles.sectionLabel}>РАСХОДЫ ПО КАТЕГОРИЯМ</Text>
      {SPEND_BY_CAT.map(c => {
        const cat = CATEGORIES.find(x => x.key === c.key);
        return (
          <GlassCard key={c.key} style={{ padding: 14, marginBottom: 8, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <View style={[styles.catDot, { backgroundColor: cat?.color ?? Colors.t3 }]} />
            <View style={{ flex: 1, gap: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 13, color: Colors.t1 }}>{c.label}</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: Colors.t1 }}>€{c.spent}</Text>
              </View>
              <ProgressBar progress={c.spent / c.budget} color={cat?.color ?? Colors.cyan} height={4} />
            </View>
          </GlassCard>
        );
      })}
      <GlassCard style={{ padding: 16, flexDirection: 'row', gap: 12, marginTop: 6 }} accentColor={Colors.purple}>
        <GlyphIcon name="sparkle" size={16} color={Colors.purple} />
        <Text style={{ flex: 1, fontSize: 12, color: Colors.t2, lineHeight: 18 }}>
          Вы тратите на 12% меньше, чем в прошлом месяце. Отличная работа!
        </Text>
      </GlassCard>
    </ScrollView>
  );
}

function DashV2({ spent, budget }: { spent: number; budget: number }) {
  const progress = spent / (budget || 1);
  const now = new Date();
  const monthLabel = now.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }).toUpperCase();
  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 100 }}>
      <Text style={styles.editorialMonth}>{monthLabel}</Text>
      <View style={{ alignItems: 'center', paddingVertical: 16 }}>
        <HoloNumber value={spent.toFixed(0)} fontSize={72} strokeWidth={6} />
        <Text style={{ fontSize: 13, color: Colors.t3, marginTop: 8 }}>потрачено из €{budget}</Text>
      </View>
      <ProgressBar progress={progress} color={Colors.cyan} height={8} />
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 14, marginBottom: 18 }}>
        {[
          { label: '—', color: Colors.green, val: `€${(budget - spent).toFixed(0)}`, sub: 'остаток' },
          { label: '↑', color: Colors.coral, val: `${Math.round(progress * 100)}%`, sub: 'использовано' },
        ].map(s => (
          <GlassCard key={s.sub} style={{ flex: 1, padding: 14, gap: 4 }}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: s.color }}>{s.val}</Text>
            <Text style={{ fontSize: 10, color: Colors.t3 }}>{s.sub}</Text>
          </GlassCard>
        ))}
      </View>
      <Text style={styles.sectionLabel}>КАТЕГОРИИ</Text>
      {SPEND_BY_CAT.map(c => {
        const cat = CATEGORIES.find(x => x.key === c.key);
        const pct = Math.round((c.spent / c.budget) * 100);
        return (
          <View key={c.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <View style={{ width: 80 }}>
              <Text style={{ fontSize: 11, color: Colors.t3, textAlign: 'right' }}>{c.label}</Text>
            </View>
            <View style={{ flex: 1, height: 28, backgroundColor: Colors.surface, borderRadius: 6, overflow: 'hidden' }}>
              <View style={{ height: '100%', width: `${pct}%`, backgroundColor: cat?.color ?? Colors.cyan, borderRadius: 6 }} />
            </View>
            <Text style={{ width: 36, fontSize: 11, color: Colors.t2, textAlign: 'right' }}>€{c.spent}</Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

function DashV3({ spent, budget }: { spent: number; budget: number }) {
  const heatData = useMemo(() => Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    intensity: Math.random(),
  })), []);
  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 100 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 18 }}>
        {[
          { label: 'Потрачено', val: `€${spent}`, color: Colors.cyan },
          { label: 'Бюджет', val: `€${budget}`, color: Colors.t2 },
          { label: 'Стрик', val: '92д', color: Colors.gold },
          { label: 'Сэкономлено', val: `€${(budget - spent).toFixed(0)}`, color: Colors.green },
        ].map(kpi => (
          <GlassCard key={kpi.label} style={{ width: '47%', padding: 14, gap: 4 }}>
            <Text style={{ fontSize: 22, fontWeight: '800', color: kpi.color }}>{kpi.val}</Text>
            <Text style={{ fontSize: 11, color: Colors.t3 }}>{kpi.label}</Text>
          </GlassCard>
        ))}
      </View>
      <Text style={styles.sectionLabel}>АКТИВНОСТЬ ЗА МЕСЯЦ</Text>
      <GlassCard style={{ padding: 14, marginBottom: 14 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
          {heatData.map(d => (
            <View
              key={d.day}
              style={{
                width: 28, height: 20, borderRadius: 4,
                backgroundColor: d.intensity > 0.7 ? Colors.coral : d.intensity > 0.4 ? Colors.gold : Colors.surface,
              }}
            />
          ))}
        </View>
      </GlassCard>
      <Text style={styles.sectionLabel}>КАТЕГОРИИ</Text>
      {SPEND_BY_CAT.map(c => {
        const cat = CATEGORIES.find(x => x.key === c.key);
        return (
          <View key={c.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border }}>
            <View style={[styles.catDot, { backgroundColor: cat?.color ?? Colors.t3 }]} />
            <Text style={{ flex: 1, fontSize: 13, color: Colors.t2 }}>{c.label}</Text>
            <View style={{ width: 80 }}>
              <ProgressBar progress={c.spent / c.budget} color={cat?.color ?? Colors.cyan} height={4} />
            </View>
            <Text style={{ width: 44, fontSize: 13, fontWeight: '600', color: Colors.t1, textAlign: 'right' }}>€{c.spent}</Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

export function DashboardScreen() {
  const [variant, setVariant] = useState<Variant>('v2');
  const { transactions, monthlyBudget } = useBudgetStore();
  const { user } = useAuthStore();
  const now = new Date();
  const monthStr = now.toISOString().slice(0, 7);
  const spent = transactions
    .filter(t => t.date.startsWith(monthStr))
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Дашборд</Text>
        <ThemeSwitcher variant={variant} setVariant={setVariant} />
      </View>
      {variant === 'v1' && <DashV1 spent={spent} budget={monthlyBudget} user={user} />}
      {variant === 'v2' && <DashV2 spent={spent} budget={monthlyBudget} />}
      {variant === 'v3' && <DashV3 spent={spent} budget={monthlyBudget} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 12 },
  title: { flex: 1, fontSize: 26, fontWeight: '700', color: Colors.t1 },
  heroCard: { borderRadius: 24, padding: 22, marginBottom: 14, gap: 8 },
  heroGreeting: { fontSize: 13, color: Colors.t2 },
  heroAmount: { fontSize: 48, fontWeight: '800', color: Colors.t1, letterSpacing: -2 },
  heroSub: { fontSize: 13, color: Colors.t3, marginBottom: 6 },
  editorialMonth: {
    fontFamily: fontMono, fontSize: 10, letterSpacing: 2.5,
    color: Colors.t4, textTransform: 'uppercase', marginBottom: 4,
  },
  sectionLabel: {
    fontFamily: fontMono, fontSize: 10, letterSpacing: 1.8, color: Colors.t3,
    textTransform: 'uppercase', marginBottom: 10, marginTop: 4,
  },
  catDot: { width: 8, height: 8, borderRadius: 4 },
  switcher: { position: 'relative', zIndex: 10 },
  switcherPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    backgroundColor: Colors.surface + 'CC', borderWidth: 1, borderColor: Colors.border,
  },
  switcherLabel: { fontSize: 12, color: Colors.t2, fontWeight: '600' },
  switcherMenu: {
    position: 'absolute', top: 34, right: 0,
    backgroundColor: Colors.surfaceElevated, borderRadius: 14, borderWidth: 1, borderColor: Colors.border,
    overflow: 'hidden', width: 120,
  },
  switcherItem: { paddingHorizontal: 14, paddingVertical: 10 },
  switcherItemLabel: { fontSize: 13, color: Colors.t2, fontWeight: '500' },
});
