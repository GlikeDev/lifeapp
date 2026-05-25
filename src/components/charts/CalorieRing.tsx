import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Animated } from 'react-native';
import { Colors } from '../../constants/tokens';

let _ringId = 0;

interface CalorieRingProps {
  consumed: number;
  goal: number;
  size?: number;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function CalorieRing({ consumed, goal, size = 180 }: CalorieRingProps) {
  const id = useRef(`ring_${++_ringId}`).current;
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(consumed / goal, 1);
  const dashoffset = useRef(new Animated.Value(circumference)).current;

  useEffect(() => {
    Animated.timing(dashoffset, {
      toValue: circumference * (1 - progress),
      duration: 1200,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor={Colors.accentTeal}/>
            <Stop offset="100%" stopColor={Colors.accentPurple}/>
          </LinearGradient>
        </Defs>
        <Circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={12} fill="none"
        />
        <AnimatedCircle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={`url(#${id})`}
          strokeWidth={12} fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
    </View>
  );
}
