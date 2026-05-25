import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Gradient, Radius } from '../../constants/tokens';

interface ProgressBarProps {
  progress: number; // 0–1
  color?: string;
  height?: number;
  style?: ViewStyle;
  animated?: boolean;
  gradient?: boolean;
}

export function ProgressBar({
  progress,
  color = Colors.accentTeal,
  height = 6,
  style,
  animated = true,
  gradient = false,
}: ProgressBarProps) {
  const anim = useRef(new Animated.Value(0)).current;
  const [trackWidth, setTrackWidth] = useState(0);
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
    <View
      style={[styles.track, { height }, style]}
      onLayout={e => setTrackWidth(e.nativeEvent.layout.width)}
    >
      <Animated.View style={[{ width, height, overflow: 'hidden', borderRadius: Radius.full }]}>
        {gradient && trackWidth > 0 ? (
          <LinearGradient
            colors={[...Gradient.primaryColors]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ width: trackWidth, height }}
          />
        ) : (
          <View style={[styles.fill, { backgroundColor: color, height }]} />
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: Radius.full,
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    borderRadius: Radius.full,
    width: '100%',
  },
});
