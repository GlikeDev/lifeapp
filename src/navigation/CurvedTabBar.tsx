import React, { useRef, useState, useEffect } from 'react';
import {
  View, TouchableOpacity, Text, StyleSheet, Animated, Dimensions,
} from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Colors, Radius } from '../constants/tokens';
import { GlyphIcon } from '../components/common/GlyphIcon';
import type { GlyphName } from '../components/common/GlyphIcon';

const { width: SCREEN_W } = Dimensions.get('window');
const BAR_H = 72;
const NOTCH_R = 32;
const NOTCH_DEPTH = 22;
const ICON_NAMES: Record<string, GlyphName> = {
  Dashboard: 'home',
  Scan:      'scan',
  Shop:      'cart',
  Nutrition: 'nutrition',
  More:      'settings',
};
const TAB_LABELS: Record<string, string> = {
  Dashboard: 'Главная',
  Scan:      'Скан',
  Shop:      'Магазин',
  Nutrition: 'Нутри',
  More:      'Ещё',
};

function buildBarPath(w: number, h: number, cx: number, r: number, depth: number): string {
  const lx = cx - r * 1.8;
  const rx = cx + r * 1.8;
  return [
    `M0,0`,
    `L${lx},0`,
    `Q${cx - r * 0.8},0 ${cx - r},${depth * 0.5}`,
    `Q${cx - r * 0.2},${depth + r * 0.15} ${cx},${depth + r * 0.15}`,
    `Q${cx + r * 0.2},${depth + r * 0.15} ${cx + r},${depth * 0.5}`,
    `Q${cx + r * 0.8},0 ${rx},0`,
    `L${w},0 L${w},${h} L0,${h} Z`,
  ].join(' ');
}

function AnimatedBarSvg({ activeIndex, tabCount }: { activeIndex: Animated.Value; tabCount: number }) {
  const tabW = SCREEN_W / tabCount;
  const [cx, setCx] = useState(tabW * 0 + tabW / 2);

  useEffect(() => {
    const id = activeIndex.addListener(({ value }) => {
      setCx(tabW * value + tabW / 2);
    });
    return () => activeIndex.removeListener(id);
  }, [tabW]);

  const path = buildBarPath(SCREEN_W, BAR_H, cx, NOTCH_R, NOTCH_DEPTH);
  return (
    <Svg width={SCREEN_W} height={BAR_H} style={StyleSheet.absoluteFill}>
      <Defs>
        <LinearGradient id="notch_glow" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0%" stopColor={Colors.cyan} stopOpacity="0.9"/>
          <Stop offset="100%" stopColor={Colors.purple} stopOpacity="0.9"/>
        </LinearGradient>
      </Defs>
      <Path d={path} fill={Colors.surface}/>
      <Path d={path} fill="none" stroke="url(#notch_glow)" strokeWidth="1.5" opacity="0.5"/>
    </Svg>
  );
}

export function CurvedTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const tabCount = state.routes.length;
  const tabW = SCREEN_W / tabCount;
  const activeIndexAnim = useRef(new Animated.Value(state.index)).current;

  useEffect(() => {
    Animated.spring(activeIndexAnim, {
      toValue: state.index,
      damping: 18, stiffness: 220, mass: 0.8,
      useNativeDriver: false,
    }).start();
  }, [state.index]);

  const floatX = activeIndexAnim.interpolate({
    inputRange: state.routes.map((_, i) => i),
    outputRange: state.routes.map((_, i) => tabW * i + tabW / 2 - 28),
  });

  return (
    <View style={[styles.bar, { width: SCREEN_W }]}>
      <AnimatedBarSvg activeIndex={activeIndexAnim} tabCount={tabCount} />

      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
        };
        if (isFocused) return null;
        const iconName = ICON_NAMES[route.name] ?? 'home';
        const label = TAB_LABELS[route.name] ?? route.name;
        return (
          <TouchableOpacity key={route.key} onPress={onPress} style={[styles.tabBtn, { left: tabW * index, width: tabW }]} activeOpacity={0.7}>
            <GlyphIcon name={iconName} size={22} color={Colors.t3}/>
            <Text style={styles.tabLabel}>{label}</Text>
          </TouchableOpacity>
        );
      })}

      <Animated.View style={[styles.floatBtn, { transform: [{ translateX: floatX }] }]}>
        <TouchableOpacity
          onPress={() => {
            const route = state.routes[state.index];
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!event.defaultPrevented) navigation.navigate(route.name);
          }}
          style={styles.floatBtnInner}
          activeOpacity={0.85}
        >
          <GlyphIcon name={ICON_NAMES[state.routes[state.index].name] ?? 'home'} size={26} color={Colors.bg}/>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: BAR_H + 16,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  tabBtn: {
    position: 'absolute',
    top: 10,
    height: BAR_H,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabLabel: {
    fontSize: 10,
    color: Colors.t3,
    fontWeight: '500',
  },
  floatBtn: {
    position: 'absolute',
    top: -NOTCH_DEPTH + 2,
    width: 56,
    height: 56,
  },
  floatBtnInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.cyan,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.cyan,
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
});
