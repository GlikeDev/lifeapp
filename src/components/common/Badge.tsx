import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../../constants/tokens';

interface BadgeProps {
  label: string;
  color?: string;
  textColor?: string;
  style?: ViewStyle;
}

export function Badge({
  label,
  color = Colors.accentPurple,
  textColor = Colors.textPrimary,
  style,
}: BadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: color + '33' }, style]}>
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: Typography.sizeXS,
    fontWeight: Typography.weightSemiBold,
  },
});
