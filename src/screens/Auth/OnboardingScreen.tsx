import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassCard, Chip, IconChip, GlyphIcon } from '../../components/common';
import { Colors, Radius } from '../../constants/tokens';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../types';

const GOALS = [
  { k: 'expenses',  icon: 'chart',     tone: Colors.cyan,    label: 'Контролировать расходы' },
  { k: 'trip',      icon: 'travel',    tone: Colors.purple,  label: 'Накопить на отпуск'     },
  { k: 'home',      icon: 'home',      tone: Colors.magenta, label: 'Купить жильё'           },
  { k: 'groceries', icon: 'groceries', tone: Colors.green,   label: 'Экономить на продуктах' },
  { k: 'nutrition', icon: 'nutrition', tone: Colors.coral,   label: 'Питаться правильно'     },
] as const;

const BUDGET_PRESETS = ['500', '1000', '1500', '1800', '2500', '3500'];

function ProgressDots({ step }: { step: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
      {[1, 2].map(i => (
        <View key={i} style={[
          styles.dot,
          { width: i === step ? 28 : 6, backgroundColor: i <= step ? Colors.cyan : Colors.border2 },
        ]} />
      ))}
    </View>
  );
}

type Props = NativeStackScreenProps<AuthStackParamList, 'OnboardingProfile'>;

export function OnboardingProfileScreen({ navigation }: Props) {
  const [picked, setPicked] = useState<string | null>(null);
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ProgressDots step={1} />
        <Text style={styles.title}>Ваша главная цель</Text>
        <Text style={styles.sub}>Это поможет настроить AI-инсайты</Text>
        <View style={{ gap: 8 }}>
          {GOALS.map(g => (
            <TouchableOpacity
              key={g.k}
              onPress={() => setPicked(g.k)}
              style={[styles.goalRow, picked === g.k && { borderColor: Colors.cyan + '99', backgroundColor: Colors.cyan + '1A' }]}
              activeOpacity={0.8}
            >
              <IconChip name={g.icon as any} color={g.tone} size={38} radius={12} />
              <Text style={[styles.goalLabel, picked === g.k && { fontWeight: '600' }]}>{g.label}</Text>
              {picked === g.k && <GlyphIcon name="check" size={14} color={Colors.cyan} />}
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ flex: 1, minHeight: 40 }} />
        <TouchableOpacity onPress={() => navigation.navigate('OnboardingBudget')} disabled={!picked} activeOpacity={0.85}>
          <LinearGradient
            colors={[Colors.cyan, Colors.purple]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={[styles.btn, !picked && { opacity: 0.4 }]}
          >
            <Text style={styles.btnLabel}>Далее →</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

type BudgetProps = NativeStackScreenProps<AuthStackParamList, 'OnboardingBudget'>;

export function OnboardingBudgetScreen({ navigation }: BudgetProps) {
  const [budget, setBudget] = useState('1800');
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ProgressDots step={2} />
        <Text style={styles.title}>Месячный бюджет</Text>
        <Text style={styles.sub}>Сколько планируете тратить в месяц?</Text>
        <View style={styles.budgetDisplay}>
          <Text style={styles.budgetCurrency}>€</Text>
          <TextInput
            style={styles.budgetInput}
            value={budget}
            onChangeText={t => setBudget(t.replace(/[^\d]/g, ''))}
            keyboardType="number-pad"
          />
        </View>
        <View style={styles.presets}>
          {BUDGET_PRESETS.map(p => (
            <Chip key={p} active={budget === p} onPress={() => setBudget(p)} color={Colors.cyan}>€{p}</Chip>
          ))}
        </View>
        <GlassCard style={styles.hintCard}>
          <GlyphIcon name="sparkle" size={16} color={Colors.cyan} />
          <Text style={styles.hint}>Можно изменить в любой момент в настройках</Text>
        </GlassCard>
        <View style={{ flex: 1, minHeight: 40 }} />
        <TouchableOpacity onPress={() => navigation.replace('Login')} activeOpacity={0.85}>
          <LinearGradient colors={[Colors.cyan, Colors.purple]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btn}>
            <Text style={styles.btnLabel}>Начать →</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  content: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40, gap: 12 },
  title: { fontSize: 28, fontWeight: '700', color: Colors.t1, marginTop: 28, letterSpacing: -0.5 },
  sub: { fontSize: 14, color: Colors.t2, marginBottom: 8 },
  goalRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 18, paddingVertical: 16,
    borderRadius: 18, backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
  },
  goalLabel: { flex: 1, fontSize: 15, color: Colors.t1 },
  budgetDisplay: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', paddingVertical: 28, gap: 8 },
  budgetCurrency: { fontSize: 36, color: Colors.cyan, fontWeight: '700' },
  budgetInput: { fontSize: 64, fontWeight: '800', letterSpacing: -2, color: Colors.t1, width: 200, textAlign: 'center', backgroundColor: 'transparent' },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  hintCard: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  hint: { flex: 1, fontSize: 12, color: Colors.t3, lineHeight: 18 },
  btn: { paddingVertical: 16, borderRadius: Radius.full, alignItems: 'center' },
  btnLabel: { fontSize: 15, fontWeight: '700', color: '#06070D' },
  dot: { height: 6, borderRadius: 3 },
});
