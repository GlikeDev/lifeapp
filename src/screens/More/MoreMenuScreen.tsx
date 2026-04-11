import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card } from '../../components/common';
import { Colors, Typography, Spacing, Radius } from '../../constants/tokens';
import type { MoreStackParamList } from '../../types';

type Nav = NativeStackNavigationProp<MoreStackParamList>;

const MENU_ITEMS = [
  { screen: 'Goals',        icon: '🎯', title: 'Цели',          subtitle: 'Накопления и прогресс' },
  { screen: 'Fridge',       icon: '🧊', title: 'Холодильник',   subtitle: 'Сроки годности, потери' },
  { screen: 'Profile',      icon: '👤', title: 'Профиль',       subtitle: 'Статистика, настройки' },
  { screen: 'Achievements', icon: '🏆', title: 'Ачивки',        subtitle: '48 достижений, уровни' },
] as const;

export function MoreMenuScreen() {
  const nav = useNavigation<Nav>();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Ещё</Text>

        {MENU_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.screen}
            onPress={() => nav.navigate(item.screen as any)}
          >
            <Card style={styles.menuCard}>
              <View style={styles.menuRow}>
                <Text style={styles.menuIcon}>{item.icon}</Text>
                <View style={styles.menuInfo}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                </View>
                <Text style={styles.menuArrow}>›</Text>
              </View>
            </Card>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.lg, paddingBottom: 40 },
  title: { fontSize: Typography.sizeXL, fontWeight: Typography.weightBold, color: Colors.textPrimary, marginBottom: Spacing.lg },
  menuCard: { marginBottom: Spacing.sm, padding: Spacing.md },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  menuIcon: { fontSize: 28, width: 40 },
  menuInfo: { flex: 1 },
  menuTitle: { fontSize: Typography.sizeMD, fontWeight: Typography.weightSemiBold, color: Colors.textPrimary },
  menuSubtitle: { fontSize: Typography.sizeSM, color: Colors.textSecondary, marginTop: 2 },
  menuArrow: { fontSize: 22, color: Colors.textMuted },
});
