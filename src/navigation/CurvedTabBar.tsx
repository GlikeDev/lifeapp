import React, { useRef, useState, useEffect } from 'react';
import {
  View, TouchableOpacity, Text, StyleSheet, Animated, Dimensions,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Colors } from '../constants/tokens';
import { GlyphIcon } from '../components/common/GlyphIcon';
import type { GlyphName } from '../components/common/GlyphIcon';

const { width: SCREEN_W } = Dimensions.get('window');
const BAR_H      = 68;
const NOTCH_R    = 30;
const NOTCH_D    = 20;   // notch depth
const FLOAT      = 54;   // floating button diameter
const STREAK_W   = 18;   // shimmer streak width

// ─── Tab config ───────────────────────────────────────────────────────────────

const ICON_NAMES: Record<string, GlyphName> = {
  Dashboard: 'home',
  Scan:      'scan',
  Fridge:    'fridge',
  Nutrition: 'nutrition',
  More:      'star',
};

const TAB_LABELS: Record<string, string> = {
  Dashboard: 'Главная',
  Scan:      'Скан',
  Fridge:    'Холодильник',
  Nutrition: 'Нутри',
  More:      'Профиль',
};

// ─── SVG bar path ─────────────────────────────────────────────────────────────

function buildBarPath(w: number, h: number, cx: number): string {
  const r = NOTCH_R;
  const d = NOTCH_D;
  return [
    `M0,0`,
    `L${cx - r * 1.8},0`,
    `Q${cx - r * 0.8},0 ${cx - r},${d * 0.5}`,
    `Q${cx - r * 0.2},${d + r * 0.15} ${cx},${d + r * 0.15}`,
    `Q${cx + r * 0.2},${d + r * 0.15} ${cx + r},${d * 0.5}`,
    `Q${cx + r * 0.8},0 ${cx + r * 1.8},0`,
    `L${w},0 L${w},${h} L0,${h} Z`,
  ].join(' ');
}

// ─── Animated bar SVG (no borders, no strokes) ───────────────────────────────

function AnimatedBarSvg({
  activeIndex, tabCount, barH,
}: {
  activeIndex: Animated.Value; tabCount: number; barH: number;
}) {
  const tabW = SCREEN_W / tabCount;
  const [cx, setCx] = useState(tabW / 2);

  useEffect(() => {
    const id = activeIndex.addListener(({ value }) => setCx(tabW * value + tabW / 2));
    return () => activeIndex.removeListener(id);
  }, [tabW]);

  return (
    <Svg width={SCREEN_W} height={barH} style={StyleSheet.absoluteFill}>
      <Path d={buildBarPath(SCREEN_W, barH, cx)} fill="#0B0C1B" />
    </Svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CurvedTabBar({ state, navigation }: BottomTabBarProps) {
  const insets       = useSafeAreaInsets();
  const bottomPad    = Math.max(insets.bottom, 8);
  const totalH       = BAR_H + bottomPad;
  const tabCount     = state.routes.length;
  const tabW         = SCREEN_W / tabCount;

  const activeAnim  = useRef(new Animated.Value(state.index)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim   = useRef(new Animated.Value(0)).current;

  // Notch follows active tab
  useEffect(() => {
    Animated.spring(activeAnim, {
      toValue: state.index,
      damping: 18, stiffness: 220, mass: 0.8,
      useNativeDriver: false,
    }).start();
  }, [state.index]);

  // Shimmer: continuous sweep 0→1 every 2.2s
  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerAnim, { toValue: 1, duration: 2200, useNativeDriver: true })
    ).start();
    // Pulse glow: breathes 0.3→0.85→0.3
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1100, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 1100, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Floating button X position
  const floatX = activeAnim.interpolate({
    inputRange:  state.routes.map((_, i) => i),
    outputRange: state.routes.map((_, i) => tabW * i + tabW / 2 - FLOAT / 2),
  });

  // Shimmer streak sweeps left → right across the button
  const streakX = shimmerAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [-FLOAT - STREAK_W, FLOAT * 2 + STREAK_W],
  });

  // Pulsing glow opacity
  const glowOpacity = pulseAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [0.25, 0.65],
  });

  // Aurora line: slides right across the bar width
  const auroraX = shimmerAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [-SCREEN_W, SCREEN_W],
  });

  return (
    <View style={{ width: SCREEN_W, height: totalH, backgroundColor: 'transparent' }} pointerEvents="box-none">

      {/* ── Bar shape (no border) ── */}
      <AnimatedBarSvg activeIndex={activeAnim} tabCount={tabCount} barH={totalH} />

      {/* ── Aurora shimmer line along the top edge ── */}
      <View style={styles.auroraClip} pointerEvents="none">
        <Animated.View style={{ transform: [{ translateX: auroraX }] }}>
          <LinearGradient
            colors={['transparent', '#22D3EE70', '#A78BFA90', '#E879F970', '#22D3EE70', 'transparent']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={{ width: SCREEN_W * 3, height: 1.5 }}
          />
        </Animated.View>
      </View>

      {/* ── Tab buttons ── */}
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const onPress = () => {
          const ev = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !ev.defaultPrevented) navigation.navigate(route.name);
        };
        const iconName = ICON_NAMES[route.name] ?? 'home';
        const label    = TAB_LABELS[route.name] ?? route.name;

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={[
              styles.tabBtn,
              {
                left:  tabW * index,
                width: tabW,
                top:   isFocused ? NOTCH_D + 6 : 12,
                height: BAR_H - (isFocused ? NOTCH_D + 6 : 12),
              },
            ]}
            activeOpacity={0.7}
          >
            {!isFocused && (
              <GlyphIcon name={iconName} size={22} color={Colors.t3} />
            )}
            <Text
              style={[styles.label, isFocused && styles.labelActive]}
              numberOfLines={1}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}

      {/* ── Floating button ── */}
      <Animated.View
        style={[styles.floatWrap, { transform: [{ translateX: floatX }] }]}
        pointerEvents="box-none"
      >
        {/* Pulsing glow halo */}
        <Animated.View style={[styles.floatGlow, { opacity: glowOpacity }]} pointerEvents="none" />

        <TouchableOpacity
          onPress={() => {
            const route = state.routes[state.index];
            const ev = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!ev.defaultPrevented) navigation.navigate(route.name);
          }}
          style={styles.floatBtn}
          activeOpacity={0.88}
        >
          {/* Holo gradient base */}
          <LinearGradient
            colors={['#22D3EE', '#A78BFA', '#E879F9']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          {/* Shimmer streak (перелив) */}
          <Animated.View
            style={[styles.streakWrap, { transform: [{ translateX: streakX }] }]}
            pointerEvents="none"
          >
            <LinearGradient
              colors={['transparent', 'rgba(255,255,255,0.30)', 'transparent']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{ width: STREAK_W * 3, height: FLOAT * 3, top: -FLOAT }}
            />
          </Animated.View>
          {/* Icon */}
          <GlyphIcon
            name={ICON_NAMES[state.routes[state.index]?.name] ?? 'home'}
            size={26}
            color="#fff"
          />
        </TouchableOpacity>
      </Animated.View>

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  auroraClip: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_W,
    height: 2,
    overflow: 'hidden',
  },
  tabBtn: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 2,
    gap: 3,
  },
  label: {
    fontSize: 10,
    color: Colors.t3,
    fontFamily: 'Onest-Medium',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  labelActive: {
    color: Colors.accentTeal,
    fontFamily: 'Onest-SemiBold',
    fontWeight: '600',
  },
  floatWrap: {
    position: 'absolute',
    top: -NOTCH_D + 2,
    width: FLOAT,
    height: FLOAT,
    borderRadius: FLOAT / 2,
  },
  floatGlow: {
    position: 'absolute',
    top: -10,
    left: -10,
    width:  FLOAT + 20,
    height: FLOAT + 20,
    borderRadius: (FLOAT + 20) / 2,
    backgroundColor: '#A78BFA',
  },
  floatBtn: {
    width: FLOAT,
    height: FLOAT,
    borderRadius: FLOAT / 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 12,
    shadowColor: '#7C3AED',
    shadowOpacity: 0.55,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 5 },
  },
  streakWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: STREAK_W * 3,
    height: FLOAT,
    overflow: 'visible',
  },
});
