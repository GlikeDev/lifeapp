import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GlassCard, GlyphIcon, Avatar } from '../../components/common';
import { Colors, Radius, fontMono } from '../../constants/tokens';
import { useAuthStore } from '../../store/useAuthStore';
import type { MoreStackParamList } from '../../types';

type Nav = NativeStackNavigationProp<MoreStackParamList, 'MoreMenu'>;

const MENU_ITEMS = [
  { screen: 'Goals' as const,        icon: 'travel' as const,    color: Colors.purple,  label: 'Финансовые цели',  sub: '3 активные цели' },
  { screen: 'Fridge' as const,       icon: 'groceries' as const, color: Colors.green,   label: 'Холодильник',      sub: '8 продуктов' },
  { screen: 'Achievements' as const, icon: 'star' as const,      color: Colors.gold,    label: 'Достижения',       sub: '6 из 12 получено' },
  { screen: 'Profile' as const,      icon: 'settings' as const,  color: Colors.cyan,    label: 'Профиль',          sub: 'Уровень 7 · Мастер' },
];

export function MoreMenuScreen() {
  const nav = useNavigation<Nav>();
  const { user } = useAuthStore();
  const initials = (user?.full_name ?? 'U').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <SafeAreaView style={st.safe} edges={['top']}>
      <ScrollView contentContainerStyle={st.scroll} showsVerticalScrollIndicator={false}>
        <Text style={st.title}>Ещё</Text>

        {/* User hero */}
        <GlassCard style={{ padding: 20, overflow: 'hidden' }}>
          <LinearGradient
            colors={[`${Colors.purple}22`, `${Colors.cyan}14`, 'transparent']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <Avatar initials={initials} size={56} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 17, fontWeight: '700', color: Colors.t1 }}>{user?.full_name ?? 'Пользователь'}</Text>
              <Text style={{ fontSize: 12, color: Colors.t3, marginTop: 2 }}>{user?.email ?? ''}</Text>
            </View>
            <TouchableOpacity onPress={() => nav.navigate('Profile')} style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' }}>
              <GlyphIcon name="arrow-right" size={14} color={Colors.t3} />
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* Quick stats */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {[
            { label: 'Стрик', val: '92', icon: 'fire' as const, color: Colors.coral },
            { label: 'XP', val: '2340', icon: 'star' as const, color: Colors.gold },
            { label: 'Сохранено', val: '€840', icon: 'chart' as const, color: Colors.green },
          ].map(s => (
            <GlassCard key={s.label} style={{ flex: 1, padding: 14, alignItems: 'center', gap: 6 }}>
              <GlyphIcon name={s.icon} size={16} color={s.color} />
              <Text style={{ fontSize: 16, fontWeight: '800', color: Colors.t1 }}>{s.val}</Text>
              <Text style={{ fontSize: 9, color: Colors.t3 }}>{s.label}</Text>
            </GlassCard>
          ))}
        </View>

        {/* Menu list */}
        <GlassCard style={{ overflow: 'hidden' }}>
          {MENU_ITEMS.map((item, i) => (
            <TouchableOpacity key={item.screen} onPress={() => nav.navigate(item.screen)} activeOpacity={0.75}>
              <View style={[st.row, i < MENU_ITEMS.length - 1 && { borderBottomWidth: 1, borderBottomColor: Colors.border }]}>
                <View style={[st.iconBox, { backgroundColor: `${item.color}18` }]}>
                  <GlyphIcon name={item.icon} size={18} color={item.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: Colors.t1 }}>{item.label}</Text>
                  <Text style={{ fontSize: 11, color: Colors.t3, marginTop: 1 }}>{item.sub}</Text>
                </View>
                <GlyphIcon name="arrow-right" size={14} color={Colors.t4} />
              </View>
            </TouchableOpacity>
          ))}
        </GlassCard>

        {/* App version */}
        <Text style={{ fontSize: 11, color: Colors.t4, textAlign: 'center', marginTop: 8 }}>
          SaveSmart v1.0.0 · Liquid Glass Edition
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: 18, paddingBottom: 100, gap: 14 },
  title: { fontSize: 26, fontWeight: '700', color: Colors.t1, marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingVertical: 16 },
  iconBox: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
});
