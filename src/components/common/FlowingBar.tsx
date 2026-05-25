import React, { useRef, useEffect, useState } from 'react';
import { View, Animated, Easing, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
  pct:          number;   // 0–1
  overBudget?:  boolean;
  height?:      number;
  borderRadius?: number;
  trackColor?:  string;
  duration?:    number;
}

// Seamless loop: last color = first color so the gradient tiles perfectly
const FLOW_COLORS = ['#00D4C8', '#7B6CF6', '#FF6B9D', '#00D4C8'] as const;
const OVER_COLORS = ['#F5554A', '#FB7185', '#F5554A']             as const;

export function FlowingBar({
  pct,
  overBudget  = false,
  height      = 6,
  borderRadius = 3,
  trackColor  = 'rgba(255,255,255,0.08)',
  duration    = 3000,
}: Props) {
  const flowAnim = useRef(new Animated.Value(0)).current;
  const [barW, setBarW] = useState(0);

  useEffect(() => {
    Animated.loop(
      Animated.timing(flowAnim, {
        toValue: 1,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const colors      = overBudget ? OVER_COLORS : FLOW_COLORS;
  const fillPercent = `${Math.min(pct * 100, 100)}%` as any;

  return (
    <View style={[styles.track, { height, borderRadius, backgroundColor: trackColor }]}>
      <View
        style={{ width: fillPercent, height, borderRadius, overflow: 'hidden' }}
        onLayout={e => setBarW(e.nativeEvent.layout.width)}
      >
        {barW > 0 && (
          <Animated.View
            style={{
              width: barW * 2,
              height: '100%',
              transform: [{
                translateX: flowAnim.interpolate({
                  inputRange:  [0, 1],
                  outputRange: [0, -barW],
                }),
              }],
            }}
          >
            <LinearGradient
              colors={colors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ width: barW * 2, height: '100%' }}
            />
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: { overflow: 'hidden' },
});
