import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassCard, GlyphIcon, ProgressBar, IconChip } from '../../components/common';
import { Colors, Radius, fontMono } from '../../constants/tokens';

const GOALS_DATA = [
  {
    id: 'trip', icon: 'travel' as const, color: Colors.purple, label: 'Отпуск на Мальдивах',
    saved: 1840, target: 4200, deadline: '2026-08', monthly: 370,
  },
  {
    id: 'home', icon: 'home' as const, color: Colors.magenta, label: 'Первый взнос на жильё',
    saved: 8200, target: 25000, deadline: '2028-06', monthly: 700,
  },
  {
    id: 'expenses', icon: 'chart' as const, color: Colors.cyan, label: 'Сократить расходы',
    saved: 420, target: 600, deadline: '2026-06', monthly: 60,
  },
];

function GoalFrame({ goal }: { goal: typeof GOALS_DATA[0] }) {
  const progress = goal.saved / goal.target;
  const months = Math.ceil((goal.target - goal.saved) / goal.monthly);
  return (
    <GlassCard style={styles.goalCard} accentColor={goal.color}>
      <LinearGradient
        colors={[`${goal.color}28`, 'transparent']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14 }}>
        <IconChip name={goal.icon} color={goal.color} size={44} radius={14} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.t1, lineHeight: 22 }}>{goal.label}</Text>
          <Text style={{ fontSize: 11, color: Colors.t3, marginTop: 2 }}>
            ~{months} мес. до цели · €{goal.monthly}/мес
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 11, fontFamily: fontMono, color: Colors.t4 }}>{goal.deadline}</Text>
        </View>
      </View>

      <View style={{ gap: 6, marginTop: 14 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 13, color: Colors.t2 }}>Накоплено</Text>
          <Text style={{ fontSize: 13, fontWeight: '700', color: goal.color }}>
            €{goal.saved.toLocaleString()} <Text style={{ fontWeight: '400', color: Colors.t3 }}>/ €{goal.target.toLocaleString()}</Text>
          </Text>
        </View>
        <ProgressBar progress={progress} color={goal.color} height={6} />
        <Text style={{ fontSize: 11, color: Colors.t3, textAlign: 'right' }}>{Math.round(progress * 100)}%</Text>
      </View>
    </GlassCard>
  );
}

function WhatIfSimulator() {
  const [extra, setExtra] = useState('100');
  const base = 370;
  const added = parseInt(extra) || 0;
  const total = base + added;
  const basePeriod = Math.ceil(2360 / base);
  const newPeriod = total > 0 ? Math.ceil(2360 / total) : basePeriod;
  const saved = basePeriod - newPeriod;

  return (
    <GlassCard style={styles.whatIfCard}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <GlyphIcon name="sparkle" size={16} color={Colors.cyan} />
        <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.t1 }}>What-if симулятор</Text>
      </View>
      <Text style={{ fontSize: 12, color: Colors.t2, marginBottom: 12 }}>
        Что если откладывать на €{extra || '…'} больше каждый месяц?
      </Text>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <Text style={{ fontSize: 15, color: Colors.cyan, fontWeight: '700' }}>+€</Text>
        <TextInput
          value={extra}
          onChangeText={t => setExtra(t.replace(/[^\d]/g, ''))}
          keyboardType="number-pad"
          style={styles.whatIfInput}
          placeholderTextColor={Colors.t4}
          placeholder="0"
        />
        <Text style={{ fontSize: 13, color: Colors.t3 }}>/ месяц</Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={styles.whatIfStat}>
          <Text style={styles.whatIfStatVal}>{basePeriod}</Text>
          <Text style={styles.whatIfStatLabel}>мес. сейчас</Text>
        </View>
        <GlyphIcon name="arrow-right" size={16} color={Colors.t4} />
        <View style={[styles.whatIfStat, { backgroundColor: `${Colors.green}18` }]}>
          <Text style={[styles.whatIfStatVal, { color: Colors.green }]}>{newPeriod}</Text>
          <Text style={styles.whatIfStatLabel}>мес. с допл.</Text>
        </View>
        {saved > 0 && (
          <View style={[styles.whatIfStat, { backgroundColor: `${Colors.cyan}18`, flex: 1 }]}>
            <Text style={[styles.whatIfStatVal, { color: Colors.cyan, fontSize: 16 }]}>−{saved}</Text>
            <Text style={styles.whatIfStatLabel}>мес. быстрее</Text>
          </View>
        )}
      </View>
    </GlassCard>
  );
}

export function GoalsScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Цели</Text>
          <TouchableOpacity style={styles.addBtn}>
            <GlyphIcon name="plus" size={16} color={Colors.cyan} />
          </TouchableOpacity>
        </View>

        {GOALS_DATA.map(g => <GoalFrame key={g.id} goal={g} />)}
        <WhatIfSimulator />

        <GlassCard style={{ padding: 16, flexDirection: 'row', gap: 20, justifyContent: 'center', marginTop: 6 }}>
          {[
            { label: 'Всего целей', val: '3' },
            { label: 'Откладываю', val: '€1 130/мес' },
            { label: 'Ближ. дедлайн', val: '3 мес.' },
          ].map(s => (
            <View key={s.label} style={{ alignItems: 'center', gap: 2 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.t1 }}>{s.val}</Text>
              <Text style={{ fontSize: 10, color: Colors.t3 }}>{s.label}</Text>
            </View>
          ))}
        </GlassCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: 18, paddingBottom: 100, gap: 14 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  title: { flex: 1, fontSize: 26, fontWeight: '700', color: Colors.t1 },
  addBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: `${Colors.cyan}1A`, borderWidth: 1, borderColor: `${Colors.cyan}40`, alignItems: 'center', justifyContent: 'center' },
  goalCard: { padding: 20, overflow: 'hidden' },
  whatIfCard: { padding: 18 },
  whatIfInput: { flex: 1, fontSize: 24, fontWeight: '800', color: Colors.t1, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: Colors.border2, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10 },
  whatIfStat: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'center', gap: 2 },
  whatIfStatVal: { fontSize: 22, fontWeight: '800', color: Colors.t1 },
  whatIfStatLabel: { fontSize: 10, color: Colors.t3 },
});
