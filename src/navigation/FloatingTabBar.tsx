import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, useWindowDimensions, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Colors } from '../constants/tokens';
import { useTranslation } from '../i18n';

// ─── Icons ────────────────────────────────────────────────────────────────────

interface IconProps { color: string; size: number }

import Svg2, { Path as P, Circle as C, Rect as R, Line as L } from 'react-native-svg';

function HomeIcon({ color, size }: IconProps) {
  return (
    <Svg2 width={size} height={size} viewBox="0 0 24 24" fill="none">
      <P d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z" stroke={color} strokeWidth={1.8} strokeLinejoin="round"/>
      <P d="M9 21V12h6v9" stroke={color} strokeWidth={1.8} strokeLinecap="round"/>
    </Svg2>
  );
}

function ScanIcon({ color, size }: IconProps) {
  return (
    <Svg2 width={size} height={size} viewBox="0 0 24 24" fill="none">
      <P d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" stroke={color} strokeWidth={1.8} strokeLinecap="round"/>
      <R x="7" y="7" width="10" height="10" rx="1" stroke={color} strokeWidth={1.8}/>
      <P d="M10 12h4" stroke={color} strokeWidth={1.8} strokeLinecap="round"/>
    </Svg2>
  );
}

function FridgeIcon({ color, size }: IconProps) {
  return (
    <Svg2 width={size} height={size} viewBox="0 0 24 24" fill="none">
      <R x="4" y="2" width="16" height="20" rx="2" stroke={color} strokeWidth={1.8}/>
      <P d="M4 9h16" stroke={color} strokeWidth={1.8} strokeLinecap="round"/>
      <P d="M9 6h0.01" stroke={color} strokeWidth={2} strokeLinecap="round"/>
      <P d="M9 14v3" stroke={color} strokeWidth={1.8} strokeLinecap="round"/>
    </Svg2>
  );
}

function LeafIcon({ color, size }: IconProps) {
  return (
    <Svg2 width={size} height={size} viewBox="0 0 24 24" fill="none">
      <P d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" stroke={color} strokeWidth={1.8} strokeLinejoin="round"/>
    </Svg2>
  );
}

function GridIcon({ color, size }: IconProps) {
  return (
    <Svg2 width={size} height={size} viewBox="0 0 24 24" fill="none">
      <R x="3" y="3" width="7" height="7" rx="1" stroke={color} strokeWidth={1.8}/>
      <R x="14" y="3" width="7" height="7" rx="1" stroke={color} strokeWidth={1.8}/>
      <R x="3" y="14" width="7" height="7" rx="1" stroke={color} strokeWidth={1.8}/>
      <R x="14" y="14" width="7" height="7" rx="1" stroke={color} strokeWidth={1.8}/>
    </Svg2>
  );
}

// ─── Config ───────────────────────────────────────────────────────────────────

const TAB_ICONS: Record<string, React.FC<IconProps>> = {
  Dashboard: HomeIcon,
  Scan:      ScanIcon,
  Fridge:    FridgeIcon,
  Nutrition: LeafIcon,
  More:      GridIcon,
};

const TAB_KEYS: Record<string, string> = {
  Dashboard: 'tabs.home',
  Scan:      'tabs.scan',
  Fridge:    'tabs.fridge',
  Nutrition: 'tabs.nutrition',
  More:      'tabs.profile',
};

// ─── Layout constants ─────────────────────────────────────────────────────────

const NOTCH_H  = 30;   // extra height above bar for the notch cut-out
const BAR_H    = 62;   // solid bar height
const CIRCLE   = 58;   // floating button diameter
const SPREAD   = 48;   // half-width of the notch spread

// ─── Path builder ─────────────────────────────────────────────────────────────

function buildPath(cx: number, W: number): string {
  const d = NOTCH_H;          // y-coordinate of the bar's flat top
  const s = SPREAD;
  const H = d + BAR_H;
  return [
    `M 0 ${d}`,
    `L ${cx - s - 10} ${d}`,
    `C ${cx - s} ${d} ${cx - s / 2} 0 ${cx} 0`,
    `C ${cx + s / 2} 0 ${cx + s} ${d} ${cx + s + 10} ${d}`,
    `L ${W} ${d}`,
    `L ${W} ${H}`,
    `L 0 ${H}`,
    `Z`,
  ].join(' ');
}

function buildShinePath(cx: number, W: number): string {
  // Same notch outline as the bar, used as a subtle highlight stroke
  const d = NOTCH_H;
  const s = SPREAD;
  return [
    `M 0 ${d}`,
    `L ${cx - s - 10} ${d}`,
    `C ${cx - s} ${d} ${cx - s / 2} 0 ${cx} 0`,
    `C ${cx + s / 2} 0 ${cx + s} ${d} ${cx + s + 10} ${d}`,
    `L ${W} ${d}`,
  ].join(' ');
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const { width: W } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const tabW = W / state.routes.length;

  const initialCx = state.index * tabW + tabW / 2;
  const animCx = useRef(new Animated.Value(initialCx)).current;
  const [cx, setCx] = useState(initialCx);

  // Spring-animate the notch center X on tab change
  useEffect(() => {
    const target = state.index * tabW + tabW / 2;
    Animated.spring(animCx, {
      toValue: target,
      useNativeDriver: false,
      tension: 80,
      friction: 11,
    }).start();
  }, [state.index, tabW]);

  // Drive the SVG path re-render from the animated value
  useEffect(() => {
    const id = animCx.addListener(({ value }) => setCx(value));
    return () => animCx.removeListener(id);
  }, [animCx]);

  // Animated left position for the floating circle
  const circleLeft = animCx.interpolate({
    inputRange: [0, W],
    outputRange: [-CIRCLE / 2, W - CIRCLE / 2],
  });

  const safeBottom = insets.bottom;
  const containerH = NOTCH_H + BAR_H + safeBottom;

  // Active tab icon
  const activeRoute = state.routes[state.index];
  const ActiveIcon = activeRoute ? TAB_ICONS[activeRoute.name] : null;

  return (
    <View style={[styles.container, { height: containerH }]} pointerEvents="box-none">

      {/* ── Curved bar background (SVG) ── */}
      <Svg width={W} height={NOTCH_H + BAR_H} style={styles.svg}>
        {/* Dark fill */}
        <Path d={buildPath(cx, W)} fill="rgba(10,11,20,0.97)" />
        {/* Subtle shine along the curved top edge */}
        <Path
          d={buildShinePath(cx, W)}
          fill="none"
          stroke="rgba(255,255,255,0.09)"
          strokeWidth={1}
        />
      </Svg>

      {/* ── Tab buttons row ── */}
      <View style={[styles.tabsRow, { top: NOTCH_H, height: BAR_H }]}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const Icon = TAB_ICONS[route.name];
          const labelKey = TAB_KEYS[route.name];
          if (!Icon || !labelKey) return null;
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
            <TouchableOpacity
              key={route.key}
              style={styles.tab}
              onPress={onPress}
              activeOpacity={0.7}
            >
              {/* Icon hidden for active tab — circle shows above it */}
              <View style={{ opacity: focused ? 0 : 1 }}>
                <Icon color={color} size={22} />
              </View>
              <Text style={[styles.label, { color }]}>{t(labelKey)}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Floating gradient circle ── */}
      <Animated.View
        style={[styles.circleWrap, { left: circleLeft, top: 0 }]}
        pointerEvents="none"
      >
        <LinearGradient
          colors={['#A78BFA', '#22D3EE']}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={styles.circleGrad}
        >
          {ActiveIcon && <ActiveIcon color="#fff" size={26} />}
        </LinearGradient>
      </Animated.View>

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  tabsRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'Onest-Medium',
    letterSpacing: 0.2,
    marginTop: 3,
  },
  circleWrap: {
    position: 'absolute',
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    elevation: 14,
    shadowColor: '#A78BFA',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 18,
  },
  circleGrad: {
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
