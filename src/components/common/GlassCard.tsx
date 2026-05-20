import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Radius } from '../../constants/tokens';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  accentColor?: string;
  accent?: boolean;
  elev?: boolean;
  noPad?: boolean;
}

export function GlassCard({ children, style, accentColor, elev, noPad }: GlassCardProps) {
  const borderColor = accentColor ? `${accentColor}50` : Colors.border;
  const bg = elev ? Colors.surfaceElevated : Colors.surface;

  return (
    <View style={[
      styles.card,
      { backgroundColor: bg, borderColor },
      noPad && { padding: 0 },
      style as ViewStyle,
    ]}>
      <LinearGradient
        colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.01)']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: 16,
    overflow: 'hidden',
  },
});
