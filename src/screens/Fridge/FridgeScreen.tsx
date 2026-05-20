import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassCard, GlyphIcon, Chip, Toast } from '../../components/common';
import { Colors, Radius, fontMono } from '../../constants/tokens';

type FilterKey = 'all' | 'expiring' | 'fresh';

const FRIDGE_ITEMS = [
  { id: '1', name: 'Греческий йогурт', qty: '500г', expires: 1, cat: 'dairy' },
  { id: '2', name: 'Куриная грудка',   qty: '400г', expires: 2, cat: 'meat' },
  { id: '3', name: 'Шпинат',           qty: '200г', expires: 1, cat: 'veggie' },
  { id: '4', name: 'Молоко',           qty: '1л',   expires: 4, cat: 'dairy' },
  { id: '5', name: 'Яйца',             qty: '10 шт',expires: 8, cat: 'other' },
  { id: '6', name: 'Лосось',           qty: '300г', expires: 3, cat: 'meat' },
  { id: '7', name: 'Помидоры',         qty: '4 шт', expires: 5, cat: 'veggie' },
  { id: '8', name: 'Сыр Гауда',        qty: '200г', expires: 12, cat: 'dairy' },
];

function expiryColor(days: number) {
  if (days <= 1) return Colors.coral;
  if (days <= 3) return Colors.gold;
  return Colors.green;
}

function expiryLabel(days: number) {
  if (days === 1) return 'Истекает завтра';
  if (days <= 3) return `${days} дня`;
  return `${days} дней`;
}

export function FridgeScreen() {
  const [filter, setFilter] = useState<FilterKey>('all');
  const [items, setItems] = useState(FRIDGE_ITEMS);
  const [showAdd, setShowAdd] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newQty, setNewQty] = useState('');
  const [newDays, setNewDays] = useState('7');

  const filtered = items.filter(i => {
    if (filter === 'expiring') return i.expires <= 3;
    if (filter === 'fresh') return i.expires > 3;
    return true;
  });

  function removeItem(id: string) {
    setItems(prev => prev.filter(i => i.id !== id));
    setToast('Продукт удалён');
  }

  function addItem() {
    if (!newName) return;
    setItems(prev => [...prev, {
      id: Date.now().toString(), name: newName, qty: newQty || '1 шт',
      expires: parseInt(newDays) || 7, cat: 'other',
    }]);
    setNewName(''); setNewQty(''); setNewDays('7');
    setShowAdd(false);
    setToast(`${newName} добавлен`);
  }

  const expiring = items.filter(i => i.expires <= 3).length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Холодильник</Text>
          <Text style={styles.sub}>{items.length} продуктов · {expiring} скоро истекает</Text>
        </View>
        <TouchableOpacity onPress={() => setShowAdd(true)} style={styles.addBtn}>
          <GlyphIcon name="plus" size={16} color={Colors.cyan} />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
        <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 18 }}>
          {([
            { k: 'all' as FilterKey, label: 'Все' },
            { k: 'expiring' as FilterKey, label: `Истекают (${expiring})` },
            { k: 'fresh' as FilterKey, label: 'Свежие' },
          ]).map(f => (
            <Chip key={f.k} active={filter === f.k} onPress={() => setFilter(f.k)} color={Colors.cyan}>
              {f.label}
            </Chip>
          ))}
        </View>
      </ScrollView>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100, gap: 10 }}>
        {filtered.map(item => {
          const color = expiryColor(item.expires);
          return (
            <GlassCard key={item.id} style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View style={[styles.itemIcon, { backgroundColor: `${color}18` }]}>
                <GlyphIcon name="groceries" size={18} color={color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.t1 }}>{item.name}</Text>
                <Text style={{ fontSize: 11, color: Colors.t3, marginTop: 1 }}>{item.qty}</Text>
              </View>
              <View style={[styles.expiryBadge, { backgroundColor: `${color}22`, borderColor: `${color}50` }]}>
                <Text style={{ fontSize: 10, color, fontWeight: '700' }}>{expiryLabel(item.expires)}</Text>
              </View>
              <TouchableOpacity onPress={() => removeItem(item.id)} style={{ padding: 4 }}>
                <GlyphIcon name="close" size={14} color={Colors.t4} />
              </TouchableOpacity>
            </GlassCard>
          );
        })}
        {filtered.length === 0 && (
          <View style={{ alignItems: 'center', paddingTop: 40, gap: 12 }}>
            <GlyphIcon name="groceries" size={40} color={Colors.t4} />
            <Text style={{ color: Colors.t3 }}>Ничего не найдено</Text>
          </View>
        )}
      </ScrollView>

      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}>
        <View style={styles.modalOverlay}>
          <GlassCard style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Добавить продукт</Text>
            <Text style={styles.fieldLabel}>НАЗВАНИЕ</Text>
            <TextInput value={newName} onChangeText={setNewName} placeholder="Молоко, курица..." placeholderTextColor={Colors.t4} style={styles.input} />
            <Text style={styles.fieldLabel}>КОЛИЧЕСТВО</Text>
            <TextInput value={newQty} onChangeText={setNewQty} placeholder="500г, 1л, 2 шт..." placeholderTextColor={Colors.t4} style={styles.input} />
            <Text style={styles.fieldLabel}>ИСТЕКАЕТ ЧЕРЕЗ (ДНЕЙ)</Text>
            <TextInput value={newDays} onChangeText={setNewDays} keyboardType="number-pad" placeholderTextColor={Colors.t4} style={styles.input} />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
              <TouchableOpacity onPress={() => setShowAdd(false)} style={[styles.cancelBtn, { flex: 1 }]}>
                <Text style={{ color: Colors.t2, fontWeight: '600' }}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={addItem} style={{ flex: 2 }} activeOpacity={0.85}>
                <LinearGradient colors={[Colors.cyan, Colors.purple]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradBtn}>
                  <Text style={styles.gradBtnLabel}>Добавить</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </GlassCard>
        </View>
      </Modal>
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 20, paddingVertical: 14 },
  title: { fontSize: 26, fontWeight: '700', color: Colors.t1 },
  sub: { fontSize: 12, color: Colors.t3, marginTop: 2 },
  addBtn: { width: 38, height: 38, borderRadius: 12, marginLeft: 'auto', backgroundColor: `${Colors.cyan}1A`, borderWidth: 1, borderColor: `${Colors.cyan}40`, alignItems: 'center', justifyContent: 'center' },
  itemIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  expiryBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalSheet: { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, padding: 24, paddingBottom: 40 },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.border2, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: Colors.t1, marginBottom: 18 },
  fieldLabel: { fontFamily: fontMono, fontSize: 10, letterSpacing: 1.8, color: Colors.t3, textTransform: 'uppercase', marginBottom: 6 },
  input: { backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: Colors.border2, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: Colors.t1, marginBottom: 14 },
  cancelBtn: { paddingVertical: 16, borderRadius: Radius.full, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: Colors.border2 },
  gradBtn: { paddingVertical: 16, borderRadius: Radius.full, alignItems: 'center' },
  gradBtnLabel: { fontSize: 15, fontWeight: '700', color: '#06070D' },
});
