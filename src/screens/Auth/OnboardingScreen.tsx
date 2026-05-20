import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius, Glass } from '../../constants/tokens';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { useBudgetStore } from '../../store/useBudgetStore';
import { useTranslation } from '../../i18n';

// ─── Data ─────────────────────────────────────────────────────────────────────

const COUNTRIES = [
  'Россия', 'Германия', 'Франция', 'Испания', 'Италия', 'Великобритания',
  'США', 'Канада', 'Австралия', 'Польша', 'Нидерланды', 'Швеция', 'Норвегия',
  'Дания', 'Финляндия', 'Швейцария', 'Австрия', 'Бельгия', 'Португалия',
  'Чехия', 'Венгрия', 'Румыния', 'Украина', 'Беларусь', 'Казахстан',
  'Грузия', 'Армения', 'Азербайджан', 'Узбекистан', 'Турция', 'ОАЭ',
  'Израиль', 'Индия', 'Китай', 'Япония', 'Южная Корея', 'Таиланд',
  'Вьетнам', 'Индонезия', 'Малайзия', 'Сингапур', 'Бразилия', 'Мексика',
  'Аргентина', 'Чили', 'ЮАР', 'Египет', 'Марокко', 'Нигерия',
];

const CURRENCIES: { code: string; label: string }[] = [
  { code: 'EUR', label: '€ Евро' },
  { code: 'USD', label: '$ Доллар' },
  { code: 'GBP', label: '£ Фунт' },
  { code: 'RUB', label: '₽ Рубль' },
  { code: 'CHF', label: 'CHF Франк' },
  { code: 'PLN', label: 'zł Злотый' },
  { code: 'CZK', label: 'Kč Крона' },
  { code: 'UAH', label: '₴ Гривна' },
  { code: 'KZT', label: '₸ Тенге' },
  { code: 'GEL', label: '₾ Лари' },
  { code: 'TRY', label: '₺ Лира' },
  { code: 'AED', label: 'AED Дирхам' },
  { code: 'INR', label: '₹ Рупия' },
  { code: 'CNY', label: '¥ Юань' },
  { code: 'JPY', label: '¥ Иена' },
  { code: 'BRL', label: 'R$ Реал' },
];

const GOALS = [
  { key: 'budget',    emoji: '📊', tKey: 'ob.goal.budget' },
  { key: 'save',      emoji: '💰', tKey: 'ob.goal.save' },
  { key: 'travel',    emoji: '✈️', tKey: 'ob.goal.travel' },
  { key: 'home',      emoji: '🏠', tKey: 'ob.goal.home' },
  { key: 'groceries', emoji: '🛒', tKey: 'ob.goal.groceries' },
  { key: 'health',    emoji: '🥗', tKey: 'ob.goal.health' },
  { key: 'debt',      emoji: '💳', tKey: 'ob.goal.debt' },
];

const DIETARY = [
  { key: 'none',       emoji: '🍽️', tKey: 'ob.diet.none' },
  { key: 'vegetarian', emoji: '🥦', tKey: 'ob.diet.vegetarian' },
  { key: 'vegan',      emoji: '🌱', tKey: 'ob.diet.vegan' },
  { key: 'halal',      emoji: '☪️', tKey: 'ob.diet.halal' },
  { key: 'gluten',     emoji: '🌾', tKey: 'ob.diet.gluten' },
  { key: 'keto',       emoji: '🥩', tKey: 'ob.diet.keto' },
];

const BUDGET_PRESETS = ['500', '1000', '1500', '2000', '3000', '5000'];

const TOTAL_STEPS = 5;

// ─── Progress bar ─────────────────────────────────────────────────────────────

function StepProgress({ step }: { step: number }) {
  return (
    <View style={ps.row}>
      {Array.from({ length: TOTAL_STEPS }, (_, i) => (
        <View key={i} style={[ps.seg, i < step ? ps.done : i === step ? ps.active : ps.idle]} />
      ))}
    </View>
  );
}
const ps = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6, marginBottom: Spacing.xl },
  seg: { flex: 1, height: 4, borderRadius: 2 },
  idle: { backgroundColor: Glass.border },
  active: { backgroundColor: Colors.accentTeal },
  done: { backgroundColor: Colors.success },
});

// ─── Option chip ──────────────────────────────────────────────────────────────

function Chip({
  emoji, label, selected, onPress,
}: { emoji?: string; label: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[cs.chip, selected && cs.chipSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {emoji ? <Text style={cs.chipEmoji}>{emoji}</Text> : null}
      <Text style={[cs.chipLabel, selected && cs.chipLabelSelected]}>{label}</Text>
      {selected && <Text style={cs.chipCheck}>✓</Text>}
    </TouchableOpacity>
  );
}
const cs = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: Glass.border },
  chipSelected: { borderColor: Colors.accentTeal, backgroundColor: Colors.accentTeal + '15' },
  chipEmoji: { fontSize: 20 },
  chipLabel: { flex: 1, fontSize: Typography.sizeMD, color: Colors.textSecondary },
  chipLabelSelected: { color: Colors.textPrimary, fontWeight: Typography.weightSemiBold },
  chipCheck: { color: Colors.accentTeal, fontWeight: Typography.weightBold, fontSize: Typography.sizeMD },
});

// ─── Main Onboarding Screen ───────────────────────────────────────────────────

export function OnboardingScreen() {
  const { setUser } = useAuthStore();
  const { setMonthlyBudget } = useBudgetStore();
  const { t } = useTranslation();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<string | null>(null);
  const [country, setCountry] = useState<string | null>(null);
  const [currency, setCurrency] = useState<string | null>(null);
  const [goal, setGoal] = useState<string | null>(null);
  const [dietary, setDietary] = useState<string | null>(null);
  const [budget, setBudget] = useState('');
  const [countrySearch, setCountrySearch] = useState('');

  const filteredCountries = COUNTRIES.filter(c =>
    c.toLowerCase().includes(countrySearch.toLowerCase())
  );

  function canProceed() {
    if (step === 0) return name.trim().length > 0 && gender !== null;
    if (step === 1) return country !== null && currency !== null;
    if (step === 2) return goal !== null;
    if (step === 3) return dietary !== null;
    if (step === 4) return budget.trim().length > 0 && !isNaN(parseFloat(budget));
    return false;
  }

  async function handleFinish() {
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const authUser = sessionData.session?.user ?? (await supabase.auth.getUser()).data.user;
      if (!authUser) throw new Error('Сессия не найдена');

      const budgetAmount = parseFloat(budget);
      const ageNum = age ? parseInt(age, 10) : null;

      await supabase.from('profiles').update({
        full_name: name.trim(),
        age: ageNum,
        gender,
        country,
        currency,
        main_goal: goal,
        dietary,
        monthly_budget: budgetAmount,
        onboarding_done: true,
      }).eq('id', authUser.id);

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', authUser.id).single();
      if (profile) setUser({ ...profile, email: authUser.email! });
      setMonthlyBudget(budgetAmount);
    } catch (e: any) {
      Alert.alert(t('ob.errTitle'), e.message);
    } finally {
      setLoading(false);
    }
  }

  const STEP_TITLE_KEYS = ['ob.step0.title', 'ob.step1.title', 'ob.step2.title', 'ob.step3.title', 'ob.step4.title'];
  const STEP_SUB_KEYS   = ['ob.step0.sub',   'ob.step1.sub',   'ob.step2.sub',   'ob.step3.sub',   'ob.step4.sub'];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          <StepProgress step={step} />

          <Text style={styles.stepNum}>{t('ob.stepOf', { step: step + 1, total: TOTAL_STEPS })}</Text>
          <Text style={styles.title}>{t(STEP_TITLE_KEYS[step])}</Text>
          <Text style={styles.subtitle}>{t(STEP_SUB_KEYS[step])}</Text>

          {/* ── Step 0: Personal ── */}
          {step === 0 && (
            <View style={styles.stepContent}>
              <Text style={styles.label}>{t('ob.name')}</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder={t('ob.namePh')}
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="words"
                autoFocus
              />

              <Text style={styles.label}>{t('ob.age')}</Text>
              <TextInput
                style={styles.input}
                value={age}
                onChangeText={setAge}
                placeholder="25"
                placeholderTextColor={Colors.textMuted}
                keyboardType="number-pad"
              />

              <Text style={styles.label}>{t('ob.gender')}</Text>
              <View style={styles.chipGrid}>
                {[
                  { key: 'male',       emoji: '👨', tKey: 'ob.male' },
                  { key: 'female',     emoji: '👩', tKey: 'ob.female' },
                  { key: 'other',      emoji: '🧑', tKey: 'ob.other' },
                  { key: 'prefer_not', emoji: '🤐', tKey: 'ob.preferNot' },
                ].map(g => (
                  <Chip key={g.key} emoji={g.emoji} label={t(g.tKey)} selected={gender === g.key} onPress={() => setGender(g.key)} />
                ))}
              </View>
            </View>
          )}

          {/* ── Step 1: Region ── */}
          {step === 1 && (
            <View style={styles.stepContent}>
              <Text style={styles.label}>{t('ob.country')}</Text>
              <TextInput
                style={styles.input}
                value={countrySearch}
                onChangeText={setCountrySearch}
                placeholder={t('ob.countrySearch')}
                placeholderTextColor={Colors.textMuted}
              />
              <View style={styles.countryList}>
                {filteredCountries.slice(0, 12).map(c => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.countryChip, country === c && styles.countryChipSelected]}
                    onPress={() => setCountry(c)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.countryText, country === c && styles.countryTextSelected]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.label, { marginTop: Spacing.lg }]}>{t('ob.currency')}</Text>
              <View style={styles.chipGrid}>
                {CURRENCIES.map(c => (
                  <Chip key={c.code} label={c.label} selected={currency === c.code} onPress={() => setCurrency(c.code)} />
                ))}
              </View>
            </View>
          )}

          {/* ── Step 2: Goal ── */}
          {step === 2 && (
            <View style={styles.stepContent}>
              <View style={styles.chipGrid}>
                {GOALS.map(g => (
                  <Chip key={g.key} emoji={g.emoji} label={t(g.tKey)} selected={goal === g.key} onPress={() => setGoal(g.key)} />
                ))}
              </View>
            </View>
          )}

          {/* ── Step 3: Dietary ── */}
          {step === 3 && (
            <View style={styles.stepContent}>
              <View style={styles.chipGrid}>
                {DIETARY.map(d => (
                  <Chip key={d.key} emoji={d.emoji} label={t(d.tKey)} selected={dietary === d.key} onPress={() => setDietary(d.key)} />
                ))}
              </View>
            </View>
          )}

          {/* ── Step 4: Budget ── */}
          {step === 4 && (
            <View style={styles.stepContent}>
              <View style={styles.amountRow}>
                <Text style={styles.currencySymbol}>
                  {CURRENCIES.find(c => c.code === currency)?.label.split(' ')[0] ?? '€'}
                </Text>
                <TextInput
                  style={styles.amountInput}
                  value={budget}
                  onChangeText={setBudget}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={Colors.textMuted}
                  autoFocus
                />
              </View>

              <View style={styles.presets}>
                {BUDGET_PRESETS.map(p => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.preset, budget === p && styles.presetSelected]}
                    onPress={() => setBudget(p)}
                  >
                    <Text style={[styles.presetText, budget === p && styles.presetTextSelected]}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.hintBox}>
                <Text style={styles.hintText}>{t('ob.hint')}</Text>
              </View>
            </View>
          )}

          {/* ── Navigation ── */}
          <View style={styles.navRow}>
            {step > 0 && (
              <TouchableOpacity style={styles.btnBack} onPress={() => setStep(s => s - 1)} activeOpacity={0.7}>
                <Text style={styles.btnBackText}>{t('ob.back')}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.btnNext, !canProceed() && styles.btnDisabled, step === 0 && { flex: 1 }]}
              disabled={!canProceed() || loading}
              onPress={step < TOTAL_STEPS - 1 ? () => setStep(s => s + 1) : handleFinish}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={Colors.bg} />
              ) : (
                <Text style={styles.btnNextText}>
                  {step < TOTAL_STEPS - 1 ? t('ob.next') : t('ob.start')}
                </Text>
              )}
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Legacy exports for backward compatibility
export function OnboardingProfileScreen() { return <OnboardingScreen />; }
export function OnboardingBudgetScreen() { return <OnboardingScreen />; }

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  content: { flexGrow: 1, padding: Spacing.xl, paddingBottom: 60 },

  stepNum: { fontSize: Typography.sizeXS, color: Colors.textMuted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 },
  title: { fontSize: 28, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  subtitle: { fontSize: Typography.sizeMD, color: Colors.textSecondary, marginTop: Spacing.xs, marginBottom: Spacing.xl },

  stepContent: { gap: Spacing.xs, marginBottom: Spacing.xl },
  label: { fontSize: Typography.sizeSM, color: Colors.textSecondary, marginBottom: Spacing.xs, marginTop: Spacing.md, fontWeight: Typography.weightSemiBold },

  input: {
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    padding: Spacing.md, color: Colors.textPrimary, fontSize: Typography.sizeMD,
    borderWidth: 1, borderColor: Glass.border,
  },

  chipGrid: { gap: Spacing.sm },

  countryList: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.xs },
  countryChip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.full, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Glass.border },
  countryChipSelected: { borderColor: Colors.accentTeal, backgroundColor: Colors.accentTeal + '15' },
  countryText: { fontSize: Typography.sizeSM, color: Colors.textSecondary },
  countryTextSelected: { color: Colors.accentTeal, fontWeight: Typography.weightSemiBold },

  amountRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, marginBottom: Spacing.xl },
  currencySymbol: { fontSize: 40, fontWeight: Typography.weightBold, color: Colors.accentTeal },
  amountInput: { fontSize: 52, fontWeight: Typography.weightBold, color: Colors.textPrimary, minWidth: 120, textAlign: 'center' },

  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.xl, justifyContent: 'center' },
  preset: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: Radius.full, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Glass.border },
  presetSelected: { borderColor: Colors.accentTeal, backgroundColor: Colors.accentTeal + '22' },
  presetText: { color: Colors.textSecondary, fontSize: Typography.sizeSM },
  presetTextSelected: { color: Colors.accentTeal, fontWeight: Typography.weightSemiBold },

  hintBox: { backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md },
  hintText: { color: Colors.textSecondary, fontSize: Typography.sizeSM },

  navRow: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.md },
  btnBack: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg, borderRadius: Radius.full, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Glass.border },
  btnBackText: { color: Colors.textSecondary, fontSize: Typography.sizeMD },
  btnNext: { flex: 1, backgroundColor: Colors.accentTeal, borderRadius: Radius.full, paddingVertical: Spacing.md, alignItems: 'center' },
  btnDisabled: { opacity: 0.4 },
  btnNextText: { color: Colors.bg, fontSize: Typography.sizeMD, fontWeight: Typography.weightBold },
});
