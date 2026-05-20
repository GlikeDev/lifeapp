import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassCard, GlyphIcon, Chip, Confetti, IconChip } from '../../components/common';
import { Colors, Radius, fontMono } from '../../constants/tokens';

type FilterKey = 'all' | 'unlocked' | 'locked';

const ACHIEVEMENTS = [
  { id: 'streak7',    icon: 'fire',      color: Colors.coral,   title: 'Неделя подряд',      sub: '7 дней стрик',               unlocked: true,  xp: 50  },
  { id: 'streak30',   icon: 'fire',      color: Colors.gold,    title: 'Месяц без перерыва',  sub: '30 дней стрик',              unlocked: false, xp: 200 },
  { id: 'firstscan',  icon: 'scan',      color: Colors.cyan,    title: 'Первый чек',          sub: 'Отсканируй первый чек',       unlocked: true,  xp: 30  },
  { id: 'budget1',    icon: 'chart',     color: Colors.green,   title: 'Эконом-мастер',       sub: 'Сохрани €100 за месяц',      unlocked: true,  xp: 100 },
  { id: 'goal1',      icon: 'travel',    color: Colors.purple,  title: 'Первая цель',         sub: 'Создай финансовую цель',      unlocked: true,  xp: 40  },
  { id: 'fridge10',   icon: 'groceries', color: Colors.green,   title: 'Полный холодильник',  sub: '10+ продуктов в наличии',    unlocked: false, xp: 60  },
  { id: 'nutrition7', icon: 'bolt',      color: Colors.magenta, title: 'Нутри-гуру',          sub: '7 дней норма калорий',       unlocked: false, xp: 150 },
  { id: 'streak92',   icon: 'star',      color: Colors.gold,    title: 'Легенда',             sub: '92 дня подряд (достигнуто)', unlocked: true,  xp: 500 },
  { id: 'save500',    icon: 'chart',     color: Colors.cyan,    title: 'Копилка',             sub: 'Сохрани €500 за год',        unlocked: false, xp: 250 },
  { id: 'scan10',     icon: 'scan',      color: Colors.purple,  title: 'Сканер-про',          sub: 'Отсканируй 10 чеков',        unlocked: true,  xp: 80  },
  { id: 'macro7',     icon: 'fire',      color: Colors.coral,   title: 'Макро-баланс',        sub: '7 дней в норме белков',      unlocked: false, xp: 120 },
  { id: 'level5',     icon: 'star',      color: Colors.gold,    title: 'Уровень 5',           sub: 'Достигни 5-го уровня',       unlocked: false, xp: 300 },
] as const;

function AchievementCard({ item, onPress }: { item: typeof ACHIEVEMENTS[number]; onPress: () => void }) {
  const locked = !item.unlocked;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={locked ? 1 : 0.82} style={{ width: '48%' }}>
      <GlassCard style={[styles.achCard, ...(locked ? [styles.achCardLocked] : [])] as any} accentColor={locked ? undefined : item.color}>
        <View style={[styles.achIcon, { backgroundColor: locked ? 'rgba(255,255,255,0.05)' : `${item.color}20` }]}>
          <GlyphIcon name={item.icon as any} size={26} color={locked ? Colors.t4 : item.color} />
          {locked && (
            <View style={styles.lockOverlay}>
              <GlyphIcon name="close" size={10} color={Colors.t4} />
            </View>
          )}
        </View>
        <Text style={[styles.achTitle, locked && { color: Colors.t3 }]}>{item.title}</Text>
        <Text style={styles.achSub} numberOfLines={2}>{item.sub}</Text>
        <View style={[styles.xpBadge, { backgroundColor: locked ? 'rgba(255,255,255,0.06)' : `${item.color}20` }]}>
          <Text style={[styles.xpText, { color: locked ? Colors.t4 : item.color }]}>+{item.xp} XP</Text>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
}

export function AchievementsScreen() {
  const [filter, setFilter] = useState<FilterKey>('all');
  const [selected, setSelected] = useState<typeof ACHIEVEMENTS[number] | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0.6)).current;

  const filtered = ACHIEVEMENTS.filter(a => {
    if (filter === 'unlocked') return a.unlocked;
    if (filter === 'locked') return !a.unlocked;
    return true;
  });

  const unlocked = ACHIEVEMENTS.filter(a => a.unlocked).length;

  function openDetail(item: typeof ACHIEVEMENTS[number]) {
    if (!item.unlocked) return;
    setSelected(item);
    setShowModal(true);
    setShowConfetti(true);
    scaleAnim.setValue(0.6);
    Animated.spring(scaleAnim, { toValue: 1, damping: 14, stiffness: 200, useNativeDriver: true }).start();
    setTimeout(() => setShowConfetti(false), 3000);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Достижения</Text>
            <Text style={styles.sub}>{unlocked} из {ACHIEVEMENTS.length} получено</Text>
          </View>
          <View style={styles.xpTotal}>
            <GlyphIcon name="star" size={14} color={Colors.gold} />
            <Text style={styles.xpTotalText}>2 340 XP</Text>
          </View>
        </View>

        <GlassCard style={{ padding: 16, marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ fontSize: 13, color: Colors.t2 }}>Прогресс коллекции</Text>
            <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.cyan }}>
              {Math.round((unlocked / ACHIEVEMENTS.length) * 100)}%
            </Text>
          </View>
          <View style={{ height: 8, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
            <LinearGradient
              colors={[Colors.cyan, Colors.purple]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{ height: '100%', width: `${(unlocked / ACHIEVEMENTS.length) * 100}%`, borderRadius: 4 }}
            />
          </View>
        </GlassCard>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
          <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 18 }}>
            {([
              { k: 'all' as FilterKey, label: 'Все' },
              { k: 'unlocked' as FilterKey, label: `Получены (${unlocked})` },
              { k: 'locked' as FilterKey, label: 'Заблокированы' },
            ]).map(f => (
              <Chip key={f.k} active={filter === f.k} onPress={() => setFilter(f.k)} color={Colors.cyan}>
                {f.label}
              </Chip>
            ))}
          </View>
        </ScrollView>

        <View style={styles.grid}>
          {filtered.map(item => (
            <AchievementCard key={item.id} item={item} onPress={() => openDetail(item)} />
          ))}
        </View>
      </ScrollView>

      <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowModal(false)}>
          {showConfetti && <Confetti count={60} />}
          {selected && (
            <Animated.View style={[styles.modalCard, { transform: [{ scale: scaleAnim }] }]}>
              <LinearGradient
                colors={[`${selected.color}30`, `${Colors.bg}00`]}
                style={StyleSheet.absoluteFill}
              />
              <View style={[styles.modalIcon, { backgroundColor: `${selected.color}22` }]}>
                <GlyphIcon name={selected.icon as any} size={44} color={selected.color} />
              </View>
              <Text style={{ fontFamily: fontMono, fontSize: 10, color: Colors.t4, letterSpacing: 2, textTransform: 'uppercase' }}>
                Достижение разблокировано
              </Text>
              <Text style={{ fontSize: 22, fontWeight: '800', color: Colors.t1, textAlign: 'center', marginTop: 4 }}>
                {selected.title}
              </Text>
              <Text style={{ fontSize: 13, color: Colors.t2, textAlign: 'center', lineHeight: 20 }}>
                {selected.sub}
              </Text>
              <View style={[styles.xpBadgeLarge, { backgroundColor: `${selected.color}20`, borderColor: `${selected.color}50` }]}>
                <GlyphIcon name="star" size={14} color={selected.color} />
                <Text style={{ fontSize: 16, fontWeight: '800', color: selected.color }}>+{selected.xp} XP</Text>
              </View>
            </Animated.View>
          )}
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingBottom: 100 },
  header: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 20, paddingVertical: 14 },
  title: { fontSize: 26, fontWeight: '700', color: Colors.t1 },
  sub: { fontSize: 12, color: Colors.t3, marginTop: 2 },
  xpTotal: { flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 'auto', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: `${Colors.gold}18`, borderWidth: 1, borderColor: `${Colors.gold}40` },
  xpTotalText: { fontSize: 13, fontWeight: '700', color: Colors.gold },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 18 },
  achCard: { padding: 16, gap: 8 },
  achCardLocked: { opacity: 0.55 },
  achIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  lockOverlay: { position: 'absolute', bottom: 0, right: 0, width: 18, height: 18, borderRadius: 9, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  achTitle: { fontSize: 13, fontWeight: '700', color: Colors.t1, lineHeight: 18 },
  achSub: { fontSize: 10, color: Colors.t3, lineHeight: 14 },
  xpBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start' },
  xpText: { fontSize: 10, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center' },
  modalCard: { width: 300, borderRadius: 28, padding: 32, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', gap: 12, overflow: 'hidden' },
  modalIcon: { width: 88, height: 88, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  xpBadgeLarge: { flexDirection: 'row', gap: 6, alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 24, borderWidth: 1, marginTop: 4 },
});
