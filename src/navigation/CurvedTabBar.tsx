import React, { useRef, useState, useEffect } from 'react';
import {
  View, TouchableOpacity, Text, StyleSheet, Animated, Dimensions, Image,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Colors } from '../constants/tokens';
import { GlyphIcon } from '../components/common/GlyphIcon';
import type { GlyphName } from '../components/common/GlyphIcon';
import { useWallpaperStore, WALLPAPERS } from '../store/useWallpaperStore';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const BAR_H      = 68;
const NOTCH_R    = 30;
const NOTCH_D    = 20;   // notch depth
const FLOAT      = 54;   // floating button diameter
const STREAK_W   = 18;   // shimmer streak width

// ─── Tab config ───────────────────────────────────────────────────────────────

const ICON_NAMES: Record<string, GlyphName> = {
  Dashboard: 'home',
  Scan:      'scan',
  Nutrition: 'nutrition',
  More:      'star',
};

const TAB_LABELS: Record<string, string> = {
  Dashboard: 'Главная',
  Scan:      'Скан',
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
  activeIndex, tabCount, barH, fillColor = '#0B0C1B',
}: {
  activeIndex: Animated.Value; tabCount: number; barH: number; fillColor?: string;
}) {
  const tabW = SCREEN_W / tabCount;
  const [cx, setCx] = useState(tabW / 2);

  useEffect(() => {
    const id = activeIndex.addListener(({ value }) => setCx(tabW * value + tabW / 2));
    return () => activeIndex.removeListener(id);
  }, [tabW]);

  return (
    <Svg width={SCREEN_W} height={barH} style={StyleSheet.absoluteFill}>
      <Path d={buildBarPath(SCREEN_W, barH, cx)} fill={fillColor} />
    </Svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CurvedTabBar({ state, navigation }: BottomTabBarProps) {
  const insets          = useSafeAreaInsets();
  const bottomPad       = Math.max(insets.bottom, 8);
  const totalH          = BAR_H + bottomPad;
  const { wallpaperId } = useWallpaperStore();
  const wallpaperSource = wallpaperId !== null ? WALLPAPERS[wallpaperId] : null;
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

  return (
    <View style={{ width: SCREEN_W, height: totalH, backgroundColor: 'transparent' }} pointerEvents="box-none">

      {/* ── Wallpaper continuation: same Image at SCREEN_H, offset so it aligns with DashboardScreen ── */}
      {wallpaperSource && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }} pointerEvents="none">
          <Image
            source={wallpaperSource}
            style={{ position: 'absolute', left: 0, right: 0, top: totalH - SCREEN_H, height: SCREEN_H }}
            resizeMode="cover"
          />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(5,5,18,0.55)' }]} />
        </View>
      )}

      {/* ── Bar shape ── */}
      <AnimatedBarSvg
        activeIndex={activeAnim}
        tabCount={tabCount}
        barH={totalH}
        fillColor={wallpaperSource ? 'transparent' : '#0B0C1B'}
      />


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
                left:   tabW * index,
                width:  tabW,
                top:    0,
                height: BAR_H,
              },
            ]}
            activeOpacity={0.7}
          >
            {!isFocused && (
              <GlyphIcon name={iconName} size={22} color={Colors.t3} />
            )}
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
            colors={['#00D4C8', '#7B6CF6', '#FF6B9D']}
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
  tabBtn: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: '#7B6CF6',
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
