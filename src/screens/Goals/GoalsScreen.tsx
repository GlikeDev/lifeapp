import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, ProgressBar, Badge } from '../../components/common';
import { Colors, Typography, Spacing, Radius } from '../../constants/tokens';
import { useBudgetStore } from '../../store/useBudgetStore';
import { useAuthStore } from '../../store/useAuthStore';
import { formatCurrency, monthsLeft } from '../../utils/format';
import { supabase } from '../../lib/supabase';
import type { Goal } from '../../types';

const EMOJIS = ['🏖️', '🏠', '🚗', '💍', '✈️', '📱', '🎓', '🏋️', '💰', '🎯'];

// What-if: показывает на сколько быстрее достигнешь цели, отказавшись от траты
function WhatIfSimulator({ goal }: { goal: Goal }) {
  const monthly = goal.monthly_contribution;
  const remaining = goal.target_amount - goal.current_amount;
  const baseMonths = monthly > 0 ? Math.ceil(remaining / monthly) : 0;

  const scenarios = [
    { label: 'Кофе навынос', saving: 47, emoji: '☕' },
    { label: 'Доставка еды',  saving: 80, emoji: '🍕' },
    { label: 'Такси',         saving: 60, emoji: '🚕' },
  ];

  return (
    <Card style={styles.whatif}>
      <Text style={styles.whatifTitle}>What-if симулятор</Text>
      <Text style={styles.whatifSub}>Откажись от расхода и цель станет ближе</Text>
      {scenarios.map((s) => {
        const newMonthly = monthly + s.saving;
        const newMonths = Math.ceil(remaining / newMonthly);
        const diff = baseMonths - newMonths;
        return (
          <View key={s.label} style={styles.whatifRow}>
            <Text style={styles.whatifEmoji}>{s.emoji}</Text>
            <View style={styles.whatifInfo}>
              <Text style={styles.whatifLabel}>{s.label} — {formatCurrency(s.saving)}/мес</Text>
              <Text style={styles.whatifEffect}>
                цель на <Text style={styles.whatifHighlight}>{diff} нед.</Text> ближе
              </Text>
            </View>
          </View>
        );
      })}

      <View style={styles.scenariosRow}>
        <Text style={styles.scenariosTitle}>Нужно откладывать</Text>
        <View style={styles.scenarios}>
          {[
            { label: 'Оптимально', amount: remaining / Math.max(baseMonths - 2, 1) },
            { label: 'Реалистично', amount: monthly },
            { label: 'Минимум', amount: remaining / (baseMonths + 3) },
          ].map((sc) => (
            <View key={sc.label} style={styles.scenarioCard}>
              <Text style={styles.scenarioAmount}>{formatCurrency(Math.round(sc.amount))}</Text>
              <Text style={styles.scenarioLabel}>{sc.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </Card>
  );
}

// Add Goal Modal
function AddGoalModal({
  visible,
  onClose,
  onSave,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (goal: Omit<Goal, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
}) {
  const [title, setTitle] = useState('');
  const [emoji, setEmoji] = useState('🎯');
  const [target, setTarget] = useState('');
  const [monthly, setMonthly] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!title || !target || isNaN(parseFloat(target))) {
      Alert.alert('Заполните название и сумму цели');
      return;
    }
    setSaving(true);
    await onSave({
      title,
      emoji,
      target_amount: parseFloat(target),
      current_amount: 0,
      monthly_contribution: parseFloat(monthly) || 0,
    });
    setSaving(false);
    setTitle(''); setTarget(''); setMonthly(''); setEmoji('🎯');
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <Text style={styles.modalTitle}>Новая цель</Text>

          {/* Emoji picker */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.emojiScroll}>
            <View style={styles.emojis}>
              {EMOJIS.map((e) => (
                <TouchableOpacity
                  key={e}
                  style={[styles.emojiBtn, emoji === e && styles.emojiSelected]}
                  onPress={() => setEmoji(e)}
                >
                  <Text style={styles.emojiChar}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <Text style={styles.modalLabel}>Название</Text>
          <TextInput
            style={styles.modalInput}
            value={title}
            onChangeText={setTitle}
            placeholder="Отпуск в Греции"
            placeholderTextColor={Colors.textMuted}
          />

          <Text style={styles.modalLabel}>Сумма цели</Text>
          <TextInput
            style={styles.modalInput}
            value={target}
            onChangeText={setTarget}
            keyboardType="decimal-pad"
            placeholder="2000"
            placeholderTextColor={Colors.textMuted}
          />

          <Text style={styles.modalLabel}>Откладываю в месяц</Text>
          <TextInput
            style={styles.modalInput}
            value={monthly}
            onChangeText={setMonthly}
            keyboardType="decimal-pad"
            placeholder="170"
            placeholderTextColor={Colors.textMuted}
          />

          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Отмена</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
              {saving
                ? <ActivityIndicator color={Colors.bg} />
                : <Text style={styles.saveBtnText}>Сохранить</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function GoalsScreen() {
  const { user } = useAuthStore();
  const { goals, addGoal } = useBudgetStore();
  const [showModal, setShowModal] = useState(false);

  async function handleAddGoal(data: Omit<Goal, 'id' | 'user_id' | 'created_at'>) {
    if (!user) return;
    const { data: row, error } = await supabase
      .from('goals')
      .insert({ ...data, user_id: user.id })
      .select()
      .single();
    if (error) { Alert.alert('Ошибка', error.message); return; }
    addGoal(row as Goal);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Мои цели</Text>
          {goals.length < 5 && (
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
              <Text style={styles.addBtnText}>+ Добавить</Text>
            </TouchableOpacity>
          )}
        </View>

        {goals.length === 0 && (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🎯</Text>
            <Text style={styles.emptyTitle}>Нет активных целей</Text>
            <Text style={styles.emptySub}>Поставьте финансовую цель и отслеживайте прогресс</Text>
            <TouchableOpacity style={styles.saveBtn} onPress={() => setShowModal(true)}>
              <Text style={styles.saveBtnText}>Поставить цель</Text>
            </TouchableOpacity>
          </Card>
        )}

        {goals.map((goal, i) => {
          const progress = goal.target_amount > 0
            ? goal.current_amount / goal.target_amount
            : 0;
          const months = monthsLeft(goal.current_amount, goal.target_amount, goal.monthly_contribution);

          return (
            <Card key={goal.id} style={[styles.goalCard, i === 0 && styles.goalCardActive]}>
              <View style={styles.goalTop}>
                <Text style={styles.goalEmoji}>{goal.emoji}</Text>
                <View style={styles.goalInfo}>
                  <Text style={styles.goalTitle}>{goal.title}</Text>
                  <Text style={styles.goalTarget}>Цель: {formatCurrency(goal.target_amount)}</Text>
                </View>
                <View style={styles.goalRight}>
                  <Text style={styles.goalAmount}>{formatCurrency(goal.current_amount)}</Text>
                  <Badge label={`${Math.round(progress * 100)}%`} color={Colors.success} />
                </View>
              </View>
              <ProgressBar progress={progress} color={Colors.success} height={8} style={styles.goalBar} />
              <Text style={styles.goalSub}>
                +{formatCurrency(goal.monthly_contribution)}/мес
                {months > 0 ? ` | ${months} месяцев до цели` : ' | Цель достигнута! 🎉'}
              </Text>
            </Card>
          );
        })}

        {/* What-if simulator for first goal */}
        {goals.length > 0 && goals[0].monthly_contribution > 0 && (
          <WhatIfSimulator goal={goals[0]} />
        )}
      </ScrollView>

      <AddGoalModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleAddGoal}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: 40 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.lg },
  title: { fontSize: Typography.sizeXL, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  addBtn: {
    backgroundColor: Colors.accentTeal + '22',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.accentTeal + '66',
  },
  addBtnText: { color: Colors.accentTeal, fontSize: Typography.sizeSM, fontWeight: Typography.weightSemiBold },

  emptyCard: { alignItems: 'center', padding: Spacing.xl, marginBottom: Spacing.lg },
  emptyIcon: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { fontSize: Typography.sizeLG, fontWeight: Typography.weightBold, color: Colors.textPrimary, marginBottom: Spacing.xs },
  emptySub: { fontSize: Typography.sizeSM, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.lg },

  goalCard: { marginBottom: Spacing.md },
  goalCardActive: { borderColor: Colors.success + '66' },
  goalTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.md },
  goalEmoji: { fontSize: 28, marginRight: Spacing.md },
  goalInfo: { flex: 1 },
  goalTitle: { fontSize: Typography.sizeMD, fontWeight: Typography.weightSemiBold, color: Colors.textPrimary },
  goalTarget: { fontSize: Typography.sizeSM, color: Colors.textSecondary, marginTop: 2 },
  goalRight: { alignItems: 'flex-end', gap: Spacing.xs },
  goalAmount: { fontSize: Typography.sizeMD, fontWeight: Typography.weightBold, color: Colors.success },
  goalBar: { marginBottom: Spacing.sm },
  goalSub: { fontSize: Typography.sizeXS, color: Colors.textSecondary },

  // What-if
  whatif: { marginBottom: Spacing.md, borderColor: Colors.warning + '44' },
  whatifTitle: { fontSize: Typography.sizeMD, fontWeight: Typography.weightBold, color: Colors.warning, marginBottom: 2 },
  whatifSub: { fontSize: Typography.sizeXS, color: Colors.textSecondary, marginBottom: Spacing.md },
  whatifRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  whatifEmoji: { fontSize: 20, marginRight: Spacing.sm },
  whatifInfo: { flex: 1 },
  whatifLabel: { fontSize: Typography.sizeSM, color: Colors.textPrimary },
  whatifEffect: { fontSize: Typography.sizeXS, color: Colors.textSecondary },
  whatifHighlight: { color: Colors.success, fontWeight: Typography.weightBold },

  scenariosRow: { borderTopWidth: 1, borderTopColor: Colors.border, marginTop: Spacing.md, paddingTop: Spacing.md },
  scenariosTitle: { fontSize: Typography.sizeSM, color: Colors.textSecondary, marginBottom: Spacing.sm },
  scenarios: { flexDirection: 'row', gap: Spacing.sm },
  scenarioCard: { flex: 1, backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md, padding: Spacing.sm, alignItems: 'center' },
  scenarioAmount: { fontSize: Typography.sizeMD, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  scenarioLabel: { fontSize: Typography.sizeXS, color: Colors.textSecondary, marginTop: 2, textAlign: 'center' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.xl,
    paddingBottom: 40,
  },
  modalTitle: { fontSize: Typography.sizeLG, fontWeight: Typography.weightBold, color: Colors.textPrimary, marginBottom: Spacing.lg, textAlign: 'center' },
  modalLabel: { fontSize: Typography.sizeSM, color: Colors.textSecondary, marginBottom: Spacing.xs, marginTop: Spacing.md },
  modalInput: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    padding: Spacing.md,
    color: Colors.textPrimary,
    fontSize: Typography.sizeMD,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emojiScroll: { marginBottom: Spacing.sm },
  emojis: { flexDirection: 'row', gap: Spacing.sm },
  emojiBtn: { width: 44, height: 44, borderRadius: Radius.md, backgroundColor: Colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  emojiSelected: { borderWidth: 2, borderColor: Colors.accentTeal },
  emojiChar: { fontSize: 24 },
  modalButtons: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.xl },
  cancelBtn: { flex: 1, backgroundColor: Colors.surfaceElevated, borderRadius: Radius.full, paddingVertical: Spacing.md, alignItems: 'center' },
  cancelText: { color: Colors.textSecondary, fontWeight: Typography.weightSemiBold },
  saveBtn: { flex: 1, backgroundColor: Colors.accentTeal, borderRadius: Radius.full, paddingVertical: Spacing.md, alignItems: 'center' },
  saveBtnText: { color: Colors.bg, fontWeight: Typography.weightBold, fontSize: Typography.sizeMD },
});
