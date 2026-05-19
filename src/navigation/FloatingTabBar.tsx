import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { Colors, Radius, Spacing } from '../constants/tokens';

interface IconProps { color: string; size: number }

function HomeIcon({ color, size }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z" stroke={color} strokeWidth={1.8} strokeLinejoin="round"/>
      <Path d="M9 21V12h6v9" stroke={color} strokeWidth={1.8} strokeLinecap="round"/>
    </Svg>
  );
}

function ScanIcon({ color, size }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" stroke={color} strokeWidth={1.8} strokeLinecap="round"/>
      <Rect x="7" y="7" width="10" height="10" rx="1" stroke={color} strokeWidth={1.8}/>
      <Path d="M10 12h4" stroke={color} strokeWidth={1.8} strokeLinecap="round"/>
    </Svg>
  );
}

function TagIcon({ color, size }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" stroke={color} strokeWidth={1.8} strokeLinejoin="round"/>
      <Circle cx="7" cy="7" r="1.5" fill={color}/>
    </Svg>
  );
}

function LeafIcon({ color, size }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" stroke={color} strokeWidth={1.8} strokeLinejoin="round"/>
    </Svg>
  );
}

function GridIcon({ color, size }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="7" height="7" rx="1" stroke={color} strokeWidth={1.8}/>
      <Rect x="14" y="3" width="7" height="7" rx="1" stroke={color} strokeWidth={1.8}/>
      <Rect x="3" y="14" width="7" height="7" rx="1" stroke={color} strokeWidth={1.8}/>
      <Rect x="14" y="14" width="7" height="7" rx="1" stroke={color} strokeWidth={1.8}/>
    </Svg>
  );
}

const TAB_CONFIG: Record<string, { label: string; Icon: React.FC<IconProps> }> = {
  Dashboard: { label: 'Главная', Icon: HomeIcon },
  Scan:      { label: 'Скан',    Icon: ScanIcon },
  Shop:      { label: 'Продукты', Icon: TagIcon },
  Nutrition: { label: 'Нутри',   Icon: LeafIcon },
  More:      { label: 'Ещё',     Icon: GridIcon },
};

export function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, 16) + 8;

  const tabs = state.routes.map((route, index) => {
    const focused = state.index === index;
    const config = TAB_CONFIG[route.name];
    if (!config) return null;

    const color = focused ? Colors.accentTeal : Colors.textMuted;

    const onPress = () => {
      const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      if (!focused && !event.defaultPrevented) {
        if (Platform.OS === 'ios') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        navigation.navigate(route.name);
      }
    };

    return (
      <TouchableOpacity key={route.key} onPress={onPress} activeOpacity={0.7} style={styles.tab}>
        <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
          <config.Icon color={color} size={22} />
        </View>
        <Text style={[styles.label, { color }]}>{config.label}</Text>
      </TouchableOpacity>
    );
  });

  if (Platform.OS === 'ios') {
    return (
      <BlurView
        intensity={75}
        tint="dark"
        style={[styles.container, styles.containerIos, { bottom }]}
      >
        {tabs}
      </BlurView>
    );
  }

  return (
    <View style={[styles.container, { bottom }]}>
      {tabs}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    backgroundColor: 'rgba(20, 21, 35, 0.96)',
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
  },
  containerIos: {
    backgroundColor: 'rgba(14, 15, 26, 0.55)',
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  iconWrap: {
    width: 40,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    marginBottom: 2,
  },
  iconWrapActive: {
    backgroundColor: 'rgba(0, 212, 200, 0.15)',
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
  },
});
