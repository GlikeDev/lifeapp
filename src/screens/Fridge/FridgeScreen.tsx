import React, { useEffect, useState, useCallback } from 'react';
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
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, ProgressBar, Badge } from '../../components/common';
import { Colors, Typography, Spacing, Radius } from '../../constants/tokens';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { scheduleItemNotifications, cancelItemNotifications } from '../../lib/notifications';
import type { FridgeItem } from '../../types';

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expires = new Date(dateStr);
  return Math.round((expires.getTime() - today.getTime()) / 86400000);
}

function expiryColor(days: number): string {
  if (days <= 0) return Colors.danger;
  if (days <= 1) return Colors.danger;
  if (days <= 3) return Colors.warning;
  return Colors.success;
}

function expiryLabel(days: number): string {
  if (days < 0) return 'Истёк';
  if (days === 0) return 'Сег.';
  return `${days} д.`;
}

// ─── Add Item Modal ───────────────────────────────────────────────────────────
function AddItemModal({
  visible,
  onClose,
  onAdd,
}: {
  visible: boolean;
  onClose: () => void;
  onAdd: (item: { name: string; quantity: number; unit: string; expires_at: string }) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('шт');
  const [days, setDays] = useState('7');
  const [saving, setSaving] = useState(false);

  const UNITS = ['шт', 'г', 'кг', 'мл', 'л', 'пач.'];
  const DAY_PRESETS = [
    { label: '1 д.', value: '1' },
    { label: '3 д.', value: '3' },
    { label: '7 д.', value: '7' },
    { label: '14 д.', value: '14' },
    { label: '30 д.', value: '30' },
  ];

  async function handleAdd() {
    if (!name.trim()) { Alert.alert('Введите название'); return; }
    const d = parseInt(days);
    if (isNaN(d) || d < 1) { Alert.alert('Укажите срок годности'); return; }

    const expires = new Date();
    expires.setDate(expires.getDate() + d);

    setSaving(true);
    await onAdd({
      name: name.trim(),
      quantity: parseFloat(quantity) || 1,
      unit,
      expires_at: expires.toISOString().slice(0, 10),
    });
    setSaving(false);
    setName(''); setQuantity('1'); setDays('7');
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={Keyboard.dismiss}
        >
          <TouchableOpacity activeOpacity={1} style={styles.modalSheet}>
            {/* Drag handle */}
            <View style={styles.dragHandle} />

            <Text style={styles.modalTitle}>Добавить продукт</Text>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.modalLabel}>Название</Text>
              <TextInput
                style={styles.modalInput}
                value={name}
                onChangeText={setName}
                placeholder="Молоко 1л"
                placeholderTextColor={Colors.textMuted}
                autoFocus
                returnKeyType="next"
              />

              <View style={styles.modalRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalLabel}>Количество</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={quantity}
                    onChangeText={setQuantity}
                    keyboardType="decimal-pad"
                    returnKeyType="done"
                    onSubmitEditing={Keyboard.dismiss}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalLabel}>Единица</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.unitChips}>
                      {UNITS.map((u) => (
                        <TouchableOpacity
                          key={u}
                          style={[styles.chip, unit === u && styles.chipSelected]}
                          onPress={() => setUnit(u)}
                        >
                          <Text style={[styles.chipText, unit === u && styles.chipTextSelected]}>{u}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              </View>

              <Text style={styles.modalLabel}>Срок годности</Text>
              <View style={styles.dayPresets}>
                {DAY_PRESETS.map((p) => (
                  <TouchableOpacity
                    key={p.value}
                    style={[styles.chip, days === p.value && styles.chipSelected]}
                    onPress={() => { setDays(p.value); Keyboard.dismiss(); }}
                  >
                    <Text style={[styles.chipText, days === p.value && styles.chipTextSelected]}>{p.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={[styles.modalInput, { marginTop: Spacing.xs }]}
                value={days}
                onChangeText={setDays}
                keyboardType="number-pad"
                placeholder="или введите дни"
                placeholderTextColor={Colors.textMuted}
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                  <Text style={styles.cancelText}>Отмена</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleAdd} disabled={saving}>
                  {saving ? <ActivityIndicator color={Colors.bg} /> : <Text style={styles.saveBtnText}>Добавить</Text>}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export function FridgeScreen() {
  const { user } = useAuthStore();
  const [items, setItems] = useState<FridgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);

  async function loadItems() {
    if (!user) return;
    const { data } = await supabase
      .from('fridge_items')
      .select('*')
      .eq('user_id', user.id)
      .order('expires_at', { ascending: true });
    if (data) setItems(data as FridgeItem[]);
  }

  useEffect(() => {
    loadItems().finally(() => setLoading(false));
  }, [user]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadItems();
    setRefreshing(false);
  }, [user]);

  async function handleAdd(item: { name: string; quantity: number; unit: string; expires_at: string }) {
    if (!user) return;
    const { data, error } = await supabase
      .from('fridge_items')
      .insert({ ...item, user_id: user.id })
      .select()
      .single();
    if (error) { Alert.alert('Ошибка', error.message); return; }
    const newItem = data as FridgeItem;
    setItems((prev) => [...prev, newItem].sort(
      (a, b) => new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime()
    ));
    scheduleItemNotifications(newItem).catch(() => {});
  }

  async function handleDelete(id: string) {
    Alert.alert('Удалить продукт?', '', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить', style: 'destructive',
        onPress: async () => {
          await supabase.from('fridge_items').delete().eq('id', id);
          cancelItemNotifications(id).catch(() => {});
          setItems((prev) => prev.filter((i) => i.id !== id));
        },
      },
    ]);
  }

  // Derived
  const expiringSoon = items.filter((i) => daysUntil(i.expires_at) <= 3);
  const normal = items.filter((i) => daysUntil(i.expires_at) > 3);
  const wastedThisMonth = items.filter((i) => daysUntil(i.expires_at) < 0).length;

  // Max shelf life for progress bar (30 days)
  const MAX_DAYS = 30;

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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accentTeal} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Мой холодильник</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
            <Text style={styles.addBtnText}>+ Добавить</Text>
          </TouchableOpacity>
        </View>

        {/* Summary row */}
        <View style={styles.summaryRow}>
          <SummaryCard value={String(items.length)} label="продуктов" color={Colors.textPrimary} />
          <SummaryCard value={String(expiringSoon.length)} label="истекают" color={Colors.warning} />
          <SummaryCard value={String(wastedThisMonth)} label="выброшено" color={Colors.danger} />
        </View>

        {/* Expiring soon */}
        {expiringSoon.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>
              <Text style={{ color: Colors.danger }}>Скоро истекает</Text>
            </Text>
            {expiringSoon.map((item) => {
              const days = daysUntil(item.expires_at);
              const color = expiryColor(days);
              return (
                <TouchableOpacity key={item.id} onLongPress={() => handleDelete(item.id)}>
                  <Card style={[styles.itemCard, { borderLeftColor: color, borderLeftWidth: 3 }]}>
                    <View style={styles.itemRow}>
                      <View style={[styles.alertDot, { backgroundColor: color }]} />
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <Text style={styles.itemQty}>{item.quantity} {item.unit}</Text>
                      </View>
                      <Text style={[styles.itemDays, { color }]}>{expiryLabel(days)}</Text>
                    </View>
                  </Card>
                </TouchableOpacity>
              );
            })}
          </>
        )}

        {/* All items */}
        {normal.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Все продукты</Text>
            {normal.map((item) => {
              const days = daysUntil(item.expires_at);
              const color = expiryColor(days);
              const progress = Math.min(days / MAX_DAYS, 1);
              return (
                <TouchableOpacity key={item.id} onLongPress={() => handleDelete(item.id)}>
                  <Card style={styles.itemCard}>
                    <View style={styles.itemRow}>
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <Text style={styles.itemQty}>{item.quantity} {item.unit}</Text>
                      </View>
                      <Text style={[styles.itemDays, { color }]}>{days} д.</Text>
                    </View>
                    <ProgressBar progress={progress} color={color} height={4} style={{ marginTop: Spacing.xs }} />
                  </Card>
                </TouchableOpacity>
              );
            })}
          </>
        )}

        {items.length === 0 && (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🧊</Text>
            <Text style={styles.emptyTitle}>Холодильник пуст</Text>
            <Text style={styles.emptySub}>Добавьте продукты вручную или через Smart Shop</Text>
          </Card>
        )}

        <Text style={styles.hint}>Удержите продукт чтобы удалить</Text>
      </ScrollView>

      <AddItemModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onAdd={handleAdd}
      />
    </SafeAreaView>
  );
}

function SummaryCard({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <Card style={styles.summaryCard}>
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
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

  summaryRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  summaryCard: { flex: 1, padding: Spacing.md, alignItems: 'center' },
  summaryValue: { fontSize: Typography.sizeLG, fontWeight: Typography.weightBold },
  summaryLabel: { fontSize: Typography.sizeXS, color: Colors.textSecondary, marginTop: 2 },

  sectionTitle: { fontSize: Typography.sizeMD, fontWeight: Typography.weightSemiBold, color: Colors.textPrimary, marginBottom: Spacing.sm, marginTop: Spacing.sm },

  itemCard: { marginBottom: Spacing.sm, padding: Spacing.md },
  itemRow: { flexDirection: 'row', alignItems: 'center' },
  alertDot: { width: 10, height: 10, borderRadius: 5, marginRight: Spacing.sm },
  itemInfo: { flex: 1 },
  itemName: { fontSize: Typography.sizeMD, color: Colors.textPrimary, fontWeight: Typography.weightSemiBold },
  itemQty: { fontSize: Typography.sizeXS, color: Colors.textSecondary, marginTop: 2 },
  itemDays: { fontSize: Typography.sizeSM, fontWeight: Typography.weightBold, minWidth: 36, textAlign: 'right' },

  emptyCard: { alignItems: 'center', padding: Spacing.xl, marginTop: Spacing.lg },
  emptyIcon: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { fontSize: Typography.sizeLG, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  emptySub: { fontSize: Typography.sizeSM, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.xs },

  hint: { textAlign: 'center', color: Colors.textMuted, fontSize: Typography.sizeXS, marginTop: Spacing.md },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: Colors.surface, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: Spacing.xl, paddingBottom: 40 },
  dragHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: Spacing.md },
  modalTitle: { fontSize: Typography.sizeLG, fontWeight: Typography.weightBold, color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing.lg },
  modalLabel: { fontSize: Typography.sizeSM, color: Colors.textSecondary, marginBottom: Spacing.xs, marginTop: Spacing.md },
  modalInput: { backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md, padding: Spacing.md, color: Colors.textPrimary, fontSize: Typography.sizeMD, borderWidth: 1, borderColor: Colors.border },
  modalRow: { flexDirection: 'row', gap: Spacing.md },
  unitChips: { flexDirection: 'row', gap: Spacing.xs, paddingVertical: Spacing.xs },
  dayPresets: { flexDirection: 'row', gap: Spacing.xs, flexWrap: 'wrap' },
  chip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.full, backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.border },
  chipSelected: { borderColor: Colors.accentTeal, backgroundColor: Colors.accentTeal + '22' },
  chipText: { color: Colors.textSecondary, fontSize: Typography.sizeSM },
  chipTextSelected: { color: Colors.accentTeal, fontWeight: Typography.weightSemiBold },
  modalButtons: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.xl },
  cancelBtn: { flex: 1, backgroundColor: Colors.surfaceElevated, borderRadius: Radius.full, paddingVertical: Spacing.md, alignItems: 'center' },
  cancelText: { color: Colors.textSecondary, fontWeight: Typography.weightSemiBold },
  saveBtn: { flex: 1, backgroundColor: Colors.accentTeal, borderRadius: Radius.full, paddingVertical: Spacing.md, alignItems: 'center' },
  saveBtnText: { color: Colors.bg, fontWeight: Typography.weightBold },
});
