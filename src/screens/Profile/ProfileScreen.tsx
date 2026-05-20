import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassCard, GlyphIcon, Avatar, ProgressBar } from '../../components/common';
import { Colors, Radius, fontMono } from '../../constants/tokens';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../lib/supabase';

const SETTINGS = [
  { icon: 'bolt' as const,    color: Colors.cyan,    label: 'Уведомления', sub: 'Включены' },
  { icon: 'chart' as const,   color: Colors.purple,  label: 'Бюджет',      sub: '€1 800 / мес' },
  { icon: 'sparkle' as const, color: Colors.magenta, label: 'AI-ассистент',sub: 'Активен' },
  { icon: 'travel' as const,  color: Colors.green,   label: 'Валюта',      sub: 'EUR €' },
  { icon: 'home' as const,    color: Colors.gold,    label: 'Язык',        sub: 'Русский' },
];

const STREAK_DAYS = [true, true, true, false, true, true, true];

export function ProfileScreen() {
  const { user, setUser } = useAuthStore();
  const initials = (user?.full_name ?? 'U').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);

  async function signOut() {
    Alert.alert('Выйти из аккаунта?', 'Все локальные данные будут сохранены.', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Выйти', style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          setUser(null);
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Профиль</Text>

        <GlassCard style={styles.heroCard}>
          <LinearGradient
            colors={[`${Colors.cyan}22`, `${Colors.purple}14`, 'transparent']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={{ alignItems: 'center', gap: 12 }}>
            <Avatar initials={initials} size={76} />
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.name}>{user?.full_name ?? 'Пользователь'}</Text>
              <Text style={styles.email}>{user?.email ?? ''}</Text>
            </View>
            <View style={styles.levelBadge}>
              <GlyphIcon name="star" size={12} color={Colors.gold} />
              <Text style={styles.levelText}>Уровень 7 · Мастер бюджета</Text>
            </View>
          </View>
          <View style={{ gap: 6, marginTop: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 11, color: Colors.t3 }}>2 340 / 3 000 XP</Text>
              <Text style={{ fontSize: 11, color: Colors.cyan }}>78%</Text>
            </View>
            <ProgressBar progress={0.78} color={Colors.cyan} height={6} />
            <Text style={{ fontSize: 10, color: Colors.t4, textAlign: 'right' }}>660 XP до ур. 8</Text>
          </View>
        </GlassCard>

        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 4 }}>
          {[
            { label: 'Стрик', val: '92', icon: 'fire' as const, color: Colors.coral },
            { label: 'Сохранено', val: '€840', icon: 'chart' as const, color: Colors.green },
            { label: 'Ачивок', val: '8', icon: 'star' as const, color: Colors.gold },
          ].map(s => (
            <GlassCard key={s.label} style={{ flex: 1, padding: 14, alignItems: 'center', gap: 6 }}>
              <GlyphIcon name={s.icon} size={18} color={s.color} />
              <Text style={{ fontSize: 18, fontWeight: '800', color: Colors.t1 }}>{s.val}</Text>
              <Text style={{ fontSize: 10, color: Colors.t3 }}>{s.label}</Text>
            </GlassCard>
          ))}
        </View>

        <GlassCard style={{ padding: 16, gap: 10 }}>
          <Text style={styles.sectionLabel}>СТРИК ЗА НЕДЕЛЮ</Text>
          <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center' }}>
            {STREAK_DAYS.map((active, i) => (
              <View key={i} style={{ alignItems: 'center', gap: 4 }}>
                <View style={[
                  styles.streakDot,
                  { backgroundColor: active ? Colors.cyan : 'rgba(255,255,255,0.08)', borderColor: active ? `${Colors.cyan}60` : Colors.border },
                  active && { shadowColor: Colors.cyan, shadowOpacity: 0.6, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } },
                ]} />
                <Text style={{ fontSize: 9, color: Colors.t4 }}>
                  {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'][i]}
                </Text>
              </View>
            ))}
          </View>
        </GlassCard>

        <Text style={[styles.sectionLabel, { paddingHorizontal: 0, marginTop: 8 }]}>НАСТРОЙКИ</Text>
        <GlassCard style={{ overflow: 'hidden' }}>
          {SETTINGS.map((s, i) => (
            <TouchableOpacity key={s.label} activeOpacity={0.7}>
              <View style={[styles.settingRow, i < SETTINGS.length - 1 && { borderBottomWidth: 1, borderBottomColor: Colors.border }]}>
                <View style={[styles.settingIcon, { backgroundColor: `${s.color}18` }]}>
                  <GlyphIcon name={s.icon} size={16} color={s.color} />
                </View>
                <Text style={{ flex: 1, fontSize: 14, color: Colors.t1 }}>{s.label}</Text>
                <Text style={{ fontSize: 13, color: Colors.t3 }}>{s.sub}</Text>
                <GlyphIcon name="arrow-right" size={12} color={Colors.t4} />
              </View>
            </TouchableOpacity>
          ))}
        </GlassCard>

        <TouchableOpacity onPress={signOut} activeOpacity={0.85} style={{ marginTop: 8 }}>
          <View style={styles.signOutBtn}>
            <GlyphIcon name="close" size={14} color={Colors.coral} />
            <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.coral }}>Выйти из аккаунта</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: 18, paddingBottom: 100, gap: 12 },
  title: { fontSize: 26, fontWeight: '700', color: Colors.t1 },
  heroCard: { padding: 24, gap: 20, overflow: 'hidden' },
  name: { fontSize: 20, fontWeight: '700', color: Colors.t1 },
  email: { fontSize: 12, color: Colors.t3, marginTop: 2 },
  levelBadge: { flexDirection: 'row', gap: 6, alignItems: 'center', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, backgroundColor: `${Colors.gold}18`, borderWidth: 1, borderColor: `${Colors.gold}40` },
  levelText: { fontSize: 12, fontWeight: '600', color: Colors.gold },
  sectionLabel: { fontFamily: fontMono, fontSize: 10, letterSpacing: 1.8, color: Colors.t3, textTransform: 'uppercase', marginBottom: 4 },
  streakDot: { width: 32, height: 32, borderRadius: 16, borderWidth: 1 },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingVertical: 14 },
  settingIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, borderRadius: Radius.full, backgroundColor: `${Colors.coral}12`, borderWidth: 1, borderColor: `${Colors.coral}35` },
});
