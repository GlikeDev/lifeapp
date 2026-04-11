import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { Colors, Radius } from '../../constants/tokens';

interface ProgressBarProps {
  progress: number; // 0–1
  color?: string;
  height?: number;
  style?: ViewStyle;
  animated?: boolean;
}

export function ProgressBar({
  progress,
  color = Colors.accentTeal,
  height = 6,
  style,
  animated = true,
}: ProgressBarProps) {
  const anim = useRef(new Animated.Value(0)).current;
  const clamped = Math.min(Math.max(progress, 0), 1);

  useEffect(() => {
    if (animated) {
      Animated.timing(anim, {
        toValue: clamped,
        duration: 600,
        useNativeDriver: false,
      }).start();
    } else {
      anim.setValue(clamped);
    }
  }, [clamped]);

  const width = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.track, { height }, style]}>
      <Animated.View style={[styles.fill, { width, backgroundColor: color, height }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: Colors.border,
    borderRadius: Radius.full,
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    borderRadius: Radius.full,
  },
});
