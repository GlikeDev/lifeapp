import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Colors, Typography } from '../../constants/tokens';

interface CalorieRingProps {
  current: number;
  target: number;
  size?: number;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function CalorieRing({ current, target, size = 160 }: CalorieRingProps) {
  const progress = target > 0 ? Math.min(current / target, 1) : 0;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: progress,
      duration: 900,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const strokeDashoffset = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  const color = progress > 0.95 ? Colors.danger : progress > 0.75 ? Colors.warning : Colors.accentTeal;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={Colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={styles.center}>
        <Text style={[styles.value, { color }]}>{Math.round(current).toLocaleString()}</Text>
        <Text style={styles.label}>ккал</Text>
        <Text style={styles.target}>из {Math.round(target).toLocaleString()}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  center: { position: 'absolute', alignItems: 'center' },
  value: { fontSize: Typography.sizeXL, fontWeight: Typography.weightBold },
  label: { fontSize: Typography.sizeSM, color: Colors.textSecondary, marginTop: -2 },
  target: { fontSize: Typography.sizeXS, color: Colors.textMuted, marginTop: 2 },
});
