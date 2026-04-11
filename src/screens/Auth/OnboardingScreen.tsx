import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../types';
import { Colors, Typography, Spacing, Radius } from '../../constants/tokens';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { useBudgetStore } from '../../store/useBudgetStore';

type Nav = NativeStackNavigationProp<AuthStackParamList>;

const GOAL_OPTIONS = [
  { label: 'Контролировать расходы', emoji: '📊' },
  { label: 'Накопить на отпуск',     emoji: '✈️' },
  { label: 'Купить жильё',           emoji: '🏠' },
  { label: 'Экономить на продуктах', emoji: '🛒' },
  { label: 'Питаться правильно',     emoji: '🥗' },
];

// ─── Step 1: Profile ─────────────────────────────────────────────────────────
export function OnboardingProfileScreen() {
  const nav = useNavigation<Nav>();
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Progress */}
        <View style={styles.dots}>
          <View style={[styles.dot, styles.dotDone]} />
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
        </View>

        <Text style={styles.title}>Ваша главная цель</Text>
        <Text style={styles.subtitle}>Это поможет настроить AI-инсайты</Text>

        <View style={styles.goalList}>
          {GOAL_OPTIONS.map((g) => (
            <TouchableOpacity
              key={g.label}
              style={[styles.goalItem, selectedGoal === g.label && styles.goalItemSelected]}
              onPress={() => setSelectedGoal(g.label)}
            >
              <Text style={styles.goalEmoji}>{g.emoji}</Text>
              <Text style={[styles.goalLabel, selectedGoal === g.label && styles.goalLabelSelected]}>
                {g.label}
              </Text>
              {selectedGoal === g.label && <Text style={styles.goalCheck}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.btnPrimary, !selectedGoal && styles.btnDisabled]}
          disabled={!selectedGoal}
          onPress={() => nav.navigate('OnboardingBudget')}
        >
          <Text style={styles.btnPrimaryText}>Далее →</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Step 2: Budget ───────────────────────────────────────────────────────────
export function OnboardingBudgetScreen() {
  const nav = useNavigation<Nav>();
  const { setUser } = useAuthStore();
  const { setMonthlyBudget } = useBudgetStore();

  const [budget, setBudget] = useState('');
  const [loading, setLoading] = useState(false);

  const PRESETS = ['500', '1000', '1500', '2000', '3000'];

  async function handleFinish() {
    const amount = parseFloat(budget);
    if (!budget || isNaN(amount) || amount <= 0) {
      Alert.alert('Введите корректный бюджет');
      return;
    }
    setLoading(true);
    try {
      // Try session first, then getUser as fallback
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user ?? (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('Сессия не найдена. Отключите подтверждение email в Supabase Dashboard → Authentication → Providers → Email → Confirm email OFF');

      await supabase
        .from('profiles')
        .update({ monthly_budget: amount })
        .eq('id', user.id);

      // Load full profile into store
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) setUser({ ...profile, email: user.email! });
      setMonthlyBudget(amount);
      // RootNavigator will auto-navigate to Main via onAuthStateChange
    } catch (e: any) {
      Alert.alert('Ошибка', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Progress */}
          <View style={styles.dots}>
            <View style={[styles.dot, styles.dotDone]} />
            <View style={[styles.dot, styles.dotDone]} />
            <View style={[styles.dot, styles.dotActive]} />
          </View>

          <Text style={styles.title}>Месячный бюджет</Text>
          <Text style={styles.subtitle}>Сколько планируете тратить в месяц?</Text>

          {/* Amount input */}
          <View style={styles.amountRow}>
            <Text style={styles.currency}>€</Text>
            <TextInput
              style={styles.amountInput}
              value={budget}
              onChangeText={setBudget}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={Colors.textMuted}
            />
          </View>

          {/* Presets */}
          <View style={styles.presets}>
            {PRESETS.map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.preset, budget === p && styles.presetSelected]}
                onPress={() => setBudget(p)}
              >
                <Text style={[styles.presetText, budget === p && styles.presetTextSelected]}>
                  €{p}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.hint}>
            <Text style={styles.hintText}>💡 Можно изменить в любой момент в настройках</Text>
          </View>

          <TouchableOpacity
            style={[styles.btnPrimary, (!budget || loading) && styles.btnDisabled]}
            onPress={handleFinish}
            disabled={!budget || loading}
          >
            {loading
              ? <ActivityIndicator color={Colors.bg} />
              : <Text style={styles.btnPrimaryText}>Начать →</Text>
            }
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  content: { flexGrow: 1, padding: Spacing.xl, paddingBottom: 40 },

  dots: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xxxl },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.border },
  dotActive: { backgroundColor: Colors.accentTeal, width: 24 },
  dotDone: { backgroundColor: Colors.success },

  title: { fontSize: 28, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  subtitle: { fontSize: Typography.sizeMD, color: Colors.textSecondary, marginTop: Spacing.xs, marginBottom: Spacing.xl },

  goalList: { gap: Spacing.sm, marginBottom: Spacing.xl },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  goalItemSelected: { borderColor: Colors.accentTeal, backgroundColor: Colors.accentTeal + '15' },
  goalEmoji: { fontSize: 22 },
  goalLabel: { flex: 1, fontSize: Typography.sizeMD, color: Colors.textSecondary },
  goalLabelSelected: { color: Colors.textPrimary, fontWeight: Typography.weightSemiBold },
  goalCheck: { color: Colors.accentTeal, fontWeight: Typography.weightBold, fontSize: Typography.sizeMD },

  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  currency: { fontSize: 40, fontWeight: Typography.weightBold, color: Colors.accentTeal },
  amountInput: {
    fontSize: 48,
    fontWeight: Typography.weightBold,
    color: Colors.textPrimary,
    minWidth: 120,
    textAlign: 'center',
  },

  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.xl },
  preset: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  presetSelected: { borderColor: Colors.accentTeal, backgroundColor: Colors.accentTeal + '22' },
  presetText: { color: Colors.textSecondary, fontSize: Typography.sizeSM },
  presetTextSelected: { color: Colors.accentTeal, fontWeight: Typography.weightSemiBold },

  hint: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
  },
  hintText: { color: Colors.textSecondary, fontSize: Typography.sizeSM },

  btnPrimary: {
    backgroundColor: Colors.accentTeal,
    borderRadius: Radius.full,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.4 },
  btnPrimaryText: { color: Colors.bg, fontSize: Typography.sizeMD, fontWeight: Typography.weightBold },
});
