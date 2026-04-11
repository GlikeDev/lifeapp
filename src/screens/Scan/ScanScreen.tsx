import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Typography, Spacing, Radius } from '../../constants/tokens';
import { Card } from '../../components/common';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { useBudgetStore } from '../../store/useBudgetStore';
import type { Transaction, TransactionCategory } from '../../types';

const CATEGORIES: { key: TransactionCategory; label: string; color: string }[] = [
  { key: 'food',      label: 'Еда',       color: Colors.categoryFood },
  { key: 'transport', label: 'Транспорт', color: Colors.categoryTransport },
  { key: 'home',      label: 'Дом',       color: Colors.categoryHome },
  { key: 'health',    label: 'Здоровье',  color: Colors.accentTeal },
  { key: 'other',     label: 'Прочее',    color: Colors.categoryOther },
];

type Mode = 'choose' | 'scan' | 'manual';

export function ScanScreen() {
  const { user } = useAuthStore();
  const { addTransaction } = useBudgetStore();

  const [mode, setMode] = useState<Mode>('choose');
  const [permission, requestPermission] = useCameraPermissions();

  // Manual form state
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<TransactionCategory>('food');
  const [store, setStore] = useState('');
  const [note, setNote] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleOpenCamera() {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Нет доступа к камере', 'Разрешите доступ в настройках телефона');
        return;
      }
    }
    setMode('scan');
  }

  async function handlePickFromGallery() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled) {
      // TODO: send to OCR (Google ML Kit / Vision API)
      Alert.alert('Изображение выбрано', 'OCR будет подключён в следующей итерации');
      setMode('manual');
    }
  }

  async function handleSave() {
    if (!user || !amount || isNaN(parseFloat(amount))) {
      Alert.alert('Ошибка', 'Введите корректную сумму');
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          amount: parseFloat(amount),
          category,
          store: store || 'Не указан',
          note: note || null,
          date: new Date().toISOString().slice(0, 10),
        })
        .select()
        .single();

      if (error) throw error;
      addTransaction(data as Transaction);
      resetForm();
      Alert.alert('Сохранено', 'Транзакция добавлена');
    } catch (e: any) {
      Alert.alert('Ошибка', e.message);
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setAmount('');
    setStore('');
    setNote('');
    setAiSuggestion(null);
    setMode('choose');
  }

  // ── Choose Mode ───────────────────────────────────────────────────────────
  if (mode === 'choose') {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.container}>
          <Text style={styles.title}>Добавить расход</Text>

          <TouchableOpacity style={styles.bigBtn} onPress={handleOpenCamera}>
            <Text style={styles.bigBtnIcon}>📷</Text>
            <Text style={styles.bigBtnText}>Сканировать чек</Text>
            <Text style={styles.bigBtnSub}>Наведите на чек</Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>или</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={[styles.bigBtn, styles.bigBtnSecondary]} onPress={() => setMode('manual')}>
            <Text style={styles.bigBtnIcon}>✏️</Text>
            <Text style={styles.bigBtnText}>Ввести вручную</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.galleryBtn} onPress={handlePickFromGallery}>
            <Text style={styles.galleryText}>📂 Загрузить из галереи</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Scan Mode ─────────────────────────────────────────────────────────────
  if (mode === 'scan') {
    return (
      <View style={styles.cameraContainer}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
        />
        {/* Viewfinder overlay */}
        <View style={styles.overlay}>
          <View style={styles.viewfinder}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
            <Text style={styles.scanHint}>Наведите на чек</Text>
          </View>
        </View>
        {/* Controls */}
        <View style={styles.cameraControls}>
          <TouchableOpacity style={styles.cameraBtn} onPress={() => setMode('choose')}>
            <Text style={styles.cameraBtnText}>Отмена</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.cameraBtn, { backgroundColor: Colors.accentTeal }]}
            onPress={() => {
              // TODO: capture + OCR
              setMode('manual');
            }}
          >
            <Text style={[styles.cameraBtnText, { color: Colors.bg }]}>Сканирование</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Manual Mode ───────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.formContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formHeader}>
            <TouchableOpacity onPress={() => setMode('choose')}>
              <Text style={styles.backBtn}>← Назад</Text>
            </TouchableOpacity>
            <Text style={styles.formTitle}>Новая транзакция</Text>
          </View>

          {/* Amount */}
          <Card style={styles.amountCard}>
            <Text style={styles.inputLabel}>Сумма</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={Colors.textMuted}
            />
          </Card>

          {/* Category Chips */}
          <Text style={styles.inputLabel}>Категория</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
            <View style={styles.chips}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.key}
                  style={[
                    styles.chip,
                    category === cat.key && { backgroundColor: cat.color },
                  ]}
                  onPress={() => setCategory(cat.key)}
                >
                  <Text style={[
                    styles.chipText,
                    category === cat.key && { color: Colors.bg, fontWeight: Typography.weightBold },
                  ]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* AI suggestion */}
          {aiSuggestion && (
            <Card style={styles.aiCard}>
              <Text style={styles.aiText}>AI: {aiSuggestion}</Text>
            </Card>
          )}

          {/* Store */}
          <Text style={styles.inputLabel}>Магазин</Text>
          <Card style={styles.inputCard}>
            <TextInput
              style={styles.textInput}
              value={store}
              onChangeText={setStore}
              placeholder="Название магазина"
              placeholderTextColor={Colors.textMuted}
            />
          </Card>

          {/* Date (readonly — today) */}
          <Text style={styles.inputLabel}>Дата</Text>
          <Card style={styles.inputCard}>
            <Text style={styles.dateText}>
              {new Date().toLocaleDateString('ru-RU')}
            </Text>
          </Card>

          {/* Note */}
          <Text style={styles.inputLabel}>Заметка</Text>
          <Card style={styles.inputCard}>
            <TextInput
              style={styles.textInput}
              value={note}
              onChangeText={setNote}
              placeholder="Необязательно"
              placeholderTextColor={Colors.textMuted}
            />
          </Card>

          {/* Save */}
          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color={Colors.bg} />
              : <Text style={styles.saveBtnText}>Сохранить</Text>
            }
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  container: { flex: 1, padding: Spacing.lg, justifyContent: 'center' },
  scroll: { flex: 1 },
  formContent: { padding: Spacing.lg, paddingBottom: 40 },

  title: {
    fontSize: Typography.sizeXL,
    fontWeight: Typography.weightBold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.xxxl,
  },

  bigBtn: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  bigBtnSecondary: { borderColor: Colors.accentTeal + '66' },
  bigBtnIcon: { fontSize: 36, marginBottom: Spacing.sm },
  bigBtnText: { fontSize: Typography.sizeLG, fontWeight: Typography.weightSemiBold, color: Colors.textPrimary },
  bigBtnSub: { fontSize: Typography.sizeSM, color: Colors.textSecondary, marginTop: 4 },

  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: Spacing.md },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { marginHorizontal: Spacing.md, color: Colors.textMuted, fontSize: Typography.sizeSM },

  galleryBtn: { alignItems: 'center', marginTop: Spacing.md },
  galleryText: { color: Colors.textSecondary, fontSize: Typography.sizeSM },

  // Camera
  cameraContainer: { flex: 1, backgroundColor: '#000' },
  overlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  viewfinder: {
    width: 280,
    height: 200,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: Spacing.md,
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: Colors.accentTeal,
    borderWidth: 3,
  },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  scanHint: { color: 'rgba(255,255,255,0.7)', fontSize: Typography.sizeSM },
  cameraControls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  cameraBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: Radius.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  cameraBtnText: { color: Colors.textPrimary, fontWeight: Typography.weightSemiBold },

  // Form
  formHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xl, gap: Spacing.md },
  backBtn: { color: Colors.accentTeal, fontSize: Typography.sizeMD },
  formTitle: { fontSize: Typography.sizeLG, fontWeight: Typography.weightBold, color: Colors.textPrimary },

  amountCard: { alignItems: 'center', marginBottom: Spacing.lg },
  amountInput: {
    fontSize: 36,
    fontWeight: Typography.weightBold,
    color: Colors.textPrimary,
    textAlign: 'center',
    minWidth: 150,
    paddingVertical: Spacing.sm,
  },

  inputLabel: { fontSize: Typography.sizeSM, color: Colors.textSecondary, marginBottom: Spacing.xs, marginTop: Spacing.md },
  inputCard: { padding: Spacing.md },
  textInput: { color: Colors.textPrimary, fontSize: Typography.sizeMD },
  dateText: { color: Colors.textSecondary, fontSize: Typography.sizeMD },

  chipsScroll: { marginBottom: Spacing.sm },
  chips: { flexDirection: 'row', gap: Spacing.sm, paddingVertical: Spacing.xs },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipText: { fontSize: Typography.sizeSM, color: Colors.textSecondary },

  aiCard: { backgroundColor: Colors.accentPurple + '22', borderColor: Colors.accentPurple + '66', marginBottom: Spacing.sm },
  aiText: { color: Colors.accentPurple, fontSize: Typography.sizeSM },

  saveBtn: {
    backgroundColor: Colors.accentTeal,
    borderRadius: Radius.full,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: Colors.bg, fontSize: Typography.sizeMD, fontWeight: Typography.weightBold },
});
