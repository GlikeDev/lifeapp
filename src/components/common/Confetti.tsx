import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, Dimensions } from 'react-native';
import { Colors } from '../../constants/tokens';

const { width: W, height: H } = Dimensions.get('window');
const COLORS = [Colors.cyan, Colors.purple, Colors.coral, Colors.green, Colors.gold];

function Particle({ color, startX }: { color: string; startX: number }) {
  const y = useRef(new Animated.Value(-20)).current;
  const x = useRef(new Animated.Value(startX)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const duration = 1800 + Math.random() * 1200;
    const drift = (Math.random() - 0.5) * 80;
    Animated.parallel([
      Animated.timing(y, { toValue: H * 0.7, duration, useNativeDriver: true }),
      Animated.timing(x, { toValue: startX + drift, duration, useNativeDriver: true }),
      Animated.timing(rotate, { toValue: 1, duration, useNativeDriver: true }),
      Animated.sequence([
        Animated.delay(duration * 0.6),
        Animated.timing(opacity, { toValue: 0, duration: duration * 0.4, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${360 + Math.random() * 360}deg`] });

  return (
    <Animated.View style={[
      styles.particle,
      { backgroundColor: color, transform: [{ translateY: y }, { translateX: x }, { rotate: spin }], opacity },
    ]} />
  );
}

interface ConfettiProps {
  count?: number;
}

export function Confetti({ count = 40 }: ConfettiProps) {
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    color: COLORS[i % COLORS.length],
    startX: (Math.random() - 0.5) * W,
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map(p => <Particle key={p.id} color={p.color} startX={p.startX} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
    top: 0,
    left: '50%',
    width: 8,
    height: 8,
    borderRadius: 2,
  },
});
