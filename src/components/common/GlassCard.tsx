import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Glass, Gradient, Radius } from '../../constants/tokens';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  accentColor?: string;
  accent?: boolean;
  elev?: boolean;
  noPad?: boolean;
}

// Splits a flat style into layout-only (for outer wrapper) vs visual (for inner card).
// The outer LinearGradient needs margin/position/flex but must keep padding:1 for the border.
function splitStyle(style: StyleProp<ViewStyle>) {
  const flat: Record<string, any> = StyleSheet.flatten(style) ?? {};
  const LAYOUT_KEYS = [
    'margin', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight',
    'marginHorizontal', 'marginVertical', 'marginStart', 'marginEnd',
    'width', 'height', 'minWidth', 'minHeight', 'maxWidth', 'maxHeight',
    'flex', 'flexGrow', 'flexShrink', 'flexBasis', 'alignSelf',
    'position', 'top', 'left', 'right', 'bottom', 'zIndex',
  ];
  const outer: Record<string, any> = {};
  const inner: Record<string, any> = {};
  for (const [k, v] of Object.entries(flat)) {
    if (LAYOUT_KEYS.includes(k)) outer[k] = v;
    else inner[k] = v;
  }
  return { outer, inner };
}

export function GlassCard({ children, style, accentColor, elev, noPad }: GlassCardProps) {
  const strokeStart = accentColor ? `${accentColor}8C` : Gradient.strokeTeal;
  const strokeEnd   = accentColor ? `${accentColor}44` : Gradient.strokePurple;
  const bg = elev ? Glass.elev : Glass.surface;

  const { outer, inner } = splitStyle(style);

  return (
    <LinearGradient
      colors={[strokeStart, strokeEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.gradient, outer]}
    >
      <View style={[
        styles.card,
        { backgroundColor: bg },
        inner,
        noPad && styles.noPad,
      ]}>
        {/* Inner shine */}
        <LinearGradient
          colors={[Glass.highlight, 'rgba(255,255,255,0.00)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        {children}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    borderRadius: Radius.xl,
    padding: 1,
  },
  card: {
    borderRadius: Radius.xl - 1,
    padding: 16,
    overflow: 'hidden',
  },
  noPad: {
    padding: 0,
  },
});
