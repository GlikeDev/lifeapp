import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, View } from 'react-native';
import { Colors, Radius } from '../../constants/tokens';

interface ToastProps {
  message: string;
  onDone: () => void;
  duration?: number;
}

export function Toast({ message, onDone, duration = 2400 }: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.delay(duration - 440),
      Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(onDone);
  }, []);

  return (
    <Animated.View style={[styles.toast, { opacity }]}>
      <Text style={styles.check}>✓</Text>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 110,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: `${Colors.green}60`,
    borderRadius: Radius.full,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  check: { color: Colors.green, fontSize: 14, fontWeight: '700' },
  text: { color: Colors.t1, fontSize: 14, fontWeight: '600' },
});
