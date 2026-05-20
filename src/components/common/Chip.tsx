import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Colors, Radius } from '../../constants/tokens';

interface ChipProps {
  children: React.ReactNode;
  active?: boolean;
  onPress?: () => void;
  color?: string;
}

export function Chip({ children, active, onPress, color = Colors.cyan }: ChipProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[
        styles.chip,
        active
          ? { backgroundColor: `${color}22`, borderColor: `${color}80` }
          : { backgroundColor: 'rgba(255,255,255,0.04)', borderColor: Colors.border2 },
      ]}
    >
      <Text style={[styles.label, { color: active ? color : Colors.t2 }]}>{children}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
});
