import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Radius, Spacing, Glass } from '../../constants/tokens';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  elevated?: boolean;
  accent?: boolean;
}

export function Card({ children, style, elevated = false, accent = false }: CardProps) {
  const cardStyle = [
    styles.card,
    elevated && styles.elevated,
    accent && styles.accent,
    style,
  ];

  if (Platform.OS === 'ios') {
    return (
      <BlurView intensity={28} tint="dark" style={[styles.card, elevated && styles.elevated, accent && styles.accent, style]}>
        {/* top shine */}
        <View style={styles.shine} pointerEvents="none" />
        {children}
      </BlurView>
    );
  }

  return (
    <View style={cardStyle}>
      {/* top shine */}
      <View style={styles.shine} pointerEvents="none" />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Glass.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Glass.borderStrong,
    overflow: 'hidden',
    // CSS: box-shadow 0 8px 24px rgba(0,0,0,0.35)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 8,
  },
  elevated: {
    backgroundColor: Glass.surfaceMid,
    borderColor: Glass.borderStrong,
  },
  accent: {
    borderColor: 'rgba(0,212,200,0.45)',
    backgroundColor: 'rgba(0,212,200,0.06)',
  },
  // inset 0 1px 0 rgba(255,255,255,0.10) — top highlight line
  shine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: Glass.highlight,
  },
});
