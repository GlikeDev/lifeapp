import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassCard, ProgressBar, Chip, GlyphIcon, Toast } from '../../components/common';
import { Colors, CATEGORIES, Radius } from '../../constants/tokens';
import { useBudgetStore } from '../../store/useBudgetStore';
import type { Transaction } from '../../types';

type Mode = 'choose' | 'scan' | 'manual';

export function ScanScreen() {
  const { addTransaction } = useBudgetStore();
  const [mode, setMode] = useState<Mode>('choose');
  const [scanProgress, setScanProgress] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [cat, setCat] = useState('food');
  const [store, setStore] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (mode !== 'scan') { setScanProgress(0); return; }
    let p = 0;
    const id = setInterval(() => {
      p += 0.04 + Math.random() * 0.02;
      setScanProgress(Math.min(p, 1));
      if (p >= 1) {
        clearInterval(id);
        setTimeout(() => {
          setAmount('42.30'); setStore('Fresh Market'); setCat('food');
          setMode('manual');
        }, 350);
      }
    }, 60);
    return () => clearInterval(id);
  }, [mode]);

  function save() {
    const amt = parseFloat(amount);
    if (!amt || isNaN(amt)) return;
    addTransaction({
      id: `tx-${Date.now()}`,
      amount: amt, category: cat, store: store || 'Manual', note,
      date: new Date().toISOString().slice(0, 10),
    } as Transaction);
    setAmount(''); setStore(''); setNote('');
    setToast('Транзакция добавлена');
    setMode('choose');
  }

  if (mode === 'scan') {
    return <View style={StyleSheet.absoluteFill}><ScanCamera progress={scanProgress} onCancel={() => setMode('choose')} /></View>;
  }

  if (mode === 'manual') {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ManualForm onBack={() => setMode('choose')} onSave={save}
          amount={amount} setAmount={setAmount} cat={cat} setCat={setCat}
          store={store} setStore={setStore} note={note} setNote={setNote} />
        {toast && <Toast message={toast} onDone={() => setToast(null)} />}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}><Text style={styles.title}>Добавить расход</Text></View>
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 18, gap: 12 }}>
        <TouchableOpacity onPress={() => setMode('scan')} activeOpacity={0.85}>
          <GlassCard style={styles.scanTile} accentColor={Colors.cyan}>
            <View style={styles.scanIcon}><GlyphIcon name="scan" size={36} color={Colors.cyan} /></View>
            <Text style={styles.scanLabel}>Сканировать чек</Text>
            <Text style={styles.scanSub}>Наведите камеру на чек</Text>
          </GlassCard>
        </TouchableOpacity>
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerLabel}>или</Text>
          <View style={styles.dividerLine} />
        </View>
        <TouchableOpacity onPress={() => setMode('manual')} activeOpacity={0.85}>
          <GlassCard style={styles.manualRow}>
            <View style={styles.manualIcon}><GlyphIcon name="edit" size={22} color={Colors.t2} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.manualLabel}>Ввести вручную</Text>
              <Text style={styles.manualSub}>Загрузить из галереи</Text>
            </View>
            <GlyphIcon name="arrow-right" size={14} color={Colors.t3} />
          </GlassCard>
        </TouchableOpacity>
      </View>
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </SafeAreaView>
  );
}

function Corner({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) {
  const base: any = { position: 'absolute', width: 22, height: 22, borderColor: Colors.cyan, borderRadius: 4 };
  const map = {
    tl: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 },
    tr: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
    bl: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
    br: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },
  };
  return <View style={[base, map[pos]]} />;
}

function ScanCamera({ progress, onCancel }: { progress: number; onCancel: () => void }) {
  const corners: Array<'tl' | 'tr' | 'bl' | 'br'> = ['tl', 'tr', 'bl', 'br'];
  return (
    <View style={styles.camera}>
      <LinearGradient colors={['#0a0a14', '#1a1d2e']} style={StyleSheet.absoluteFill} />
      <View style={styles.receipt}>
        <Text style={styles.receiptStore}>FRESH MARKET</Text>
        {[['Spinach 250g', '1.49'], ['Yogurt 500g', '2.49'], ['Bread', '1.89'], ['Salmon', '6.20'], ['Eggs x10', '2.79']].map(([k, v]) => (
          <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
            <Text style={styles.receiptItem}>{k}</Text>
            <Text style={styles.receiptItem}>EU{v}</Text>
          </View>
        ))}
        <View style={styles.receiptTotal}>
          <Text style={styles.receiptTotalLabel}>TOTAL</Text>
          <Text style={styles.receiptTotalLabel}>EU42.30</Text>
        </View>
      </View>
      <View style={styles.viewfinder}>
        {corners.map(pos => <Corner key={pos} pos={pos} />)}
        <View style={[styles.scanLine, { top: (progress * 100) + '%' as any }]} />
        <Text style={styles.hint}>{progress >= 1 ? 'Распознано EU42.30' : 'Наведите на чек'}</Text>
      </View>
      <View style={{ position: 'absolute', bottom: 110, left: 24, right: 24 }}>
        <ProgressBar progress={progress} color={Colors.cyan} height={3} />
        <Text style={styles.ocrLabel}>OCR {Math.round(progress * 100)}%</Text>
      </View>
      <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
        <GlyphIcon name="close" size={16} color="#fff" />
        <Text style={styles.cancelLabel}>Отмена</Text>
      </TouchableOpacity>
    </View>
  );
}

function ManualForm({ onBack, onSave, amount, setAmount, cat, setCat, store, setStore, note, setNote }: any) {
  return (
    <View style={{ flex: 1 }}>
      <View style={styles.subHeader}>
        <TouchableOpacity onPress={onBack} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <GlyphIcon name="arrow-left" size={14} color={Colors.cyan} />
          <Text style={{ fontSize: 13, color: Colors.cyan }}>Назад</Text>
        </TouchableOpacity>
        <Text style={styles.subTitle}>Новая транзакция</Text>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 18, paddingBottom: 100 }}>
        <GlassCard style={{ marginBottom: 14, padding: 20, alignItems: 'center' }}>
          <Text style={styles.fieldLabel}>СУММА</Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 8 }}>
            <Text style={{ fontSize: 24, color: Colors.cyan, fontWeight: '700' }}>EU</Text>
            <TextInput
              value={amount} onChangeText={t => setAmount(t.replace(/[^\d.]/g, ''))}
              placeholder="0.00" placeholderTextColor={Colors.t4} keyboardType="decimal-pad"
              style={{ fontSize: 44, fontWeight: '800', color: Colors.t1, width: 160, textAlign: 'center' }}
            />
          </View>
        </GlassCard>
        <Text style={styles.fieldLabel}>КАТЕГОРИЯ</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
          <View style={{ flexDirection: 'row', gap: 8, paddingBottom: 4 }}>
            {CATEGORIES.map(c => (
              <Chip key={c.key} active={cat === c.key} onPress={() => setCat(c.key)} color={c.color}>{c.label}</Chip>
            ))}
          </View>
        </ScrollView>
        <Text style={styles.fieldLabel}>МАГАЗИН</Text>
        <TextInput value={store} onChangeText={setStore} placeholder="Fresh Market" placeholderTextColor={Colors.t4} style={styles.input} />
        <GlassCard style={{ padding: 12, marginBottom: 14 }}>
          <Text style={{ color: Colors.t2 }}>{new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
        </GlassCard>
        <Text style={styles.fieldLabel}>ЗАМЕТКА</Text>
        <TextInput value={note} onChangeText={setNote} placeholder="Необязательно" placeholderTextColor={Colors.t4} style={[styles.input, { marginBottom: 24 }]} />
        <TouchableOpacity onPress={onSave} activeOpacity={0.85}>
          <LinearGradient colors={[Colors.cyan, Colors.purple]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.saveBtn}>
            <Text style={styles.saveBtnLabel}>Сохранить</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingHorizontal: 20, paddingVertical: 14 },
  title: { fontSize: 26, fontWeight: '700', color: Colors.t1 },
  scanTile: { padding: 24, alignItems: 'center', gap: 10 },
  scanIcon: { width: 72, height: 72, borderRadius: 24, backgroundColor: Colors.cyan + '2E', borderWidth: 1, borderColor: Colors.cyan + '80', alignItems: 'center', justifyContent: 'center' },
  scanLabel: { fontSize: 18, fontWeight: '700', color: Colors.t1 },
  scanSub: { fontSize: 12, color: Colors.t3 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerLabel: { fontFamily: 'monospace', fontSize: 10, letterSpacing: 1.5, color: Colors.t3, textTransform: 'uppercase' },
  manualRow: { padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14 },
  manualIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'center', justifyContent: 'center' },
  manualLabel: { fontSize: 15, fontWeight: '600', color: Colors.t1 },
  manualSub: { fontSize: 11, color: Colors.t3, marginTop: 2 },
  camera: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  receipt: { backgroundColor: '#f8f5e9', borderRadius: 4, padding: 16, width: 220, shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 20, shadowOffset: { width: 0, height: 20 }, elevation: 12, marginBottom: 20, transform: [{ rotate: '-3deg' }] },
  receiptStore: { fontFamily: 'monospace', fontSize: 9, color: '#3a3a3a', textAlign: 'center', borderBottomWidth: 1, borderBottomColor: '#999', paddingBottom: 4, marginBottom: 6 },
  receiptItem: { fontFamily: 'monospace', fontSize: 8, color: '#3a3a3a' },
  receiptTotal: { borderTopWidth: 1, borderTopColor: '#999', marginTop: 6, paddingTop: 4, flexDirection: 'row', justifyContent: 'space-between' },
  receiptTotalLabel: { fontFamily: 'monospace', fontSize: 10, fontWeight: '700', color: '#222' },
  viewfinder: { width: 280, height: 320, position: 'relative' },
  scanLine: { position: 'absolute', left: 12, right: 12, height: 2, backgroundColor: Colors.cyan, shadowColor: Colors.cyan, shadowOpacity: 0.8, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } },
  hint: { position: 'absolute', bottom: -34, left: 0, right: 0, textAlign: 'center', color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  ocrLabel: { fontFamily: 'monospace', fontSize: 10, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: 6 },
  cancelBtn: { position: 'absolute', top: 64, right: 18, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 6 },
  cancelLabel: { color: '#fff', fontSize: 13, fontWeight: '600' },
  subHeader: { padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  subTitle: { fontSize: 18, fontWeight: '700', color: Colors.t1 },
  fieldLabel: { fontFamily: 'monospace', fontSize: 10, letterSpacing: 1.8, color: Colors.t3, textTransform: 'uppercase', marginBottom: 6 },
  input: { backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: Colors.border2, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: Colors.t1, marginBottom: 12 },
  saveBtn: { paddingVertical: 16, borderRadius: Radius.full, alignItems: 'center' },
  saveBtnLabel: { fontSize: 15, fontWeight: '700', color: '#06070D' },
});
