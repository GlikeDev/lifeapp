import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { GlassCard, GlyphIcon, Chip, ProgressBar } from '../../components/common';
import { Colors, Radius, fontMono } from '../../constants/tokens';

const MEALS = [
  { id: 'b', label: 'Завтрак', icon: 'bolt' as const, color: Colors.gold, kcal: 420, items: ['Овсянка 150г', 'Банан', 'Миндаль 30г'] },
  { id: 'l', label: 'Обед', icon: 'groceries' as const, color: Colors.green, kcal: 680, items: ['Куриная грудка 200г', 'Рис 150г', 'Салат'] },
  { id: 's', label: 'Перекус', icon: 'sparkle' as const, color: Colors.cyan, kcal: 180, items: ['Греческий йогурт', 'Ягоды'] },
  { id: 'd', label: 'Ужин', icon: 'travel' as const, color: Colors.purple, kcal: 520, items: ['Лосось 200г', 'Овощи на гриле'] },
];

const GOAL_KCAL = 2000;
const total = MEALS.reduce((s, m) => s + m.kcal, 0);

type FilterKey = 'day' | 'week';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function HoloRing({ progress }: { progress: number }) {
  const R = 80;
  const STROKE = 14;
  const cx = R + STROKE;
  const circumference = 2 * Math.PI * R;
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: progress, duration: 1200, useNativeDriver: false }).start();
  }, [progress]);

  const dashOffset = anim.interpolate({ inputRange: [0, 1], outputRange: [circumference, 0] });

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: (R + STROKE) * 2, height: (R + STROKE) * 2 }}>
      <Svg width={(R + STROKE) * 2} height={(R + STROKE) * 2}>
        <Defs>
          <SvgLinearGradient id="holoGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor={Colors.cyan} />
            <Stop offset="33%" stopColor={Colors.purple} />
            <Stop offset="66%" stopColor={Colors.magenta} />
            <Stop offset="100%" stopColor={Colors.coral} />
          </SvgLinearGradient>
        </Defs>
        <Circle cx={cx} cy={cx} r={R} stroke="rgba(255,255,255,0.06)" strokeWidth={STROKE} fill="none" />
        <AnimatedCircle
          cx={cx} cy={cx} r={R}
          stroke="url(#holoGrad)"
          strokeWidth={STROKE}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          rotation="-90"
          origin={`${cx},${cx}`}
        />
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center' }}>
        <Text style={{ fontSize: 32, fontWeight: '900', color: Colors.t1 }}>{total}</Text>
        <Text style={{ fontSize: 11, color: Colors.t3 }}>/ {GOAL_KCAL} ккал</Text>
      </View>
    </View>
  );
}

export function NutritionScreen() {
  const [filter, setFilter] = useState<FilterKey>('day');
  const progress = total / GOAL_KCAL;
  const remaining = GOAL_KCAL - total;
  const MACROS = [
    { label: 'Белки', val: 142, goal: 160, color: Colors.cyan, unit: 'г' },
    { label: 'Жиры', val: 68, goal: 70, color: Colors.gold, unit: 'г' },
    { label: 'Углеводы', val: 210, goal: 250, color: Colors.purple, unit: 'г' },
    { label: 'Клетчатка', val: 28, goal: 35, color: Colors.green, unit: 'г' },
  ];

  return (
    <SafeAreaView style={st.safe} edges={['top']}>
      <ScrollView contentContainerStyle={st.scroll} showsVerticalScrollIndicator={false}>
        <View style={st.header}>
          <View>
            <Text style={st.title}>Питание</Text>
            <Text style={st.sub}>Сегодня, {new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {(['day', 'week'] as FilterKey[]).map(k => (
                <Chip key={k} active={filter === k} onPress={() => setFilter(k)} color={Colors.cyan}>
                  {k === 'day' ? 'День' : 'Неделя'}
                </Chip>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Holo ring hero */}
        <GlassCard style={{ alignItems: 'center', padding: 28, gap: 20 }}>
          <LinearGradient
            colors={[`${Colors.cyan}18`, `${Colors.purple}10`, 'transparent']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <HoloRing progress={Math.min(progress, 1)} />
          <View style={{ flexDirection: 'row', gap: 20 }}>
            {[
              { label: 'Сожжено', val: '320 ккал', color: Colors.coral },
              { label: 'Чистые', val: `${total - 320} ккал`, color: Colors.cyan },
              { label: 'Осталось', val: `${remaining} ккал`, color: Colors.green },
            ].map(s => (
              <View key={s.label} style={{ alignItems: 'center', gap: 2 }}>
                <Text style={{ fontSize: 14, fontWeight: '800', color: s.color }}>{s.val}</Text>
                <Text style={{ fontSize: 9, color: Colors.t3 }}>{s.label}</Text>
              </View>
            ))}
          </View>
        </GlassCard>

        {/* Macros */}
        <GlassCard style={{ padding: 18, gap: 14 }}>
          <Text style={st.sectionLabel}>МАКРОСЫ</Text>
          {MACROS.map(m => (
            <View key={m.label} style={{ gap: 5 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 13, color: Colors.t2 }}>{m.label}</Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: m.color }}>
                  {m.val}{m.unit} <Text style={{ fontWeight: '400', color: Colors.t4 }}>/ {m.goal}{m.unit}</Text>
                </Text>
              </View>
              <ProgressBar progress={m.val / m.goal} color={m.color} height={6} />
            </View>
          ))}
        </GlassCard>

        {/* Meals */}
        <Text style={[st.sectionLabel, { paddingHorizontal: 0 }]}>ПРИЁМЫ ПИЩИ</Text>
        {MEALS.map(meal => (
          <GlassCard key={meal.id} style={{ padding: 16 }} accentColor={meal.color}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: `${meal.color}20`, alignItems: 'center', justifyContent: 'center' }}>
                <GlyphIcon name={meal.icon} size={20} color={meal.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.t1 }}>{meal.label}</Text>
                <Text style={{ fontSize: 10, color: Colors.t3 }}>{meal.items.length} позиции</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: meal.color }}>{meal.kcal}</Text>
                <Text style={{ fontSize: 9, color: Colors.t4 }}>ккал</Text>
              </View>
            </View>
            {meal.items.map(item => (
              <View key={item} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 3 }}>
                <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: meal.color }} />
                <Text style={{ fontSize: 12, color: Colors.t2 }}>{item}</Text>
              </View>
            ))}
          </GlassCard>
        ))}

        {/* Add meal button */}
        <TouchableOpacity activeOpacity={0.85}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: Radius.full, borderWidth: 1, borderColor: `${Colors.cyan}40`, backgroundColor: `${Colors.cyan}0D` }}>
            <GlyphIcon name="plus" size={16} color={Colors.cyan} />
            <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.cyan }}>Добавить приём пищи</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: 18, paddingBottom: 100, gap: 14 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 },
  title: { fontSize: 26, fontWeight: '700', color: Colors.t1 },
  sub: { fontSize: 12, color: Colors.t3, marginTop: 2 },
  sectionLabel: { fontFamily: fontMono, fontSize: 10, letterSpacing: 1.8, color: Colors.t3, textTransform: 'uppercase', marginBottom: 2 },
});
