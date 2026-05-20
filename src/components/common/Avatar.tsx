import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/tokens';

interface AvatarProps {
  initials: string;
  size?: number;
}

export function Avatar({ initials, size = 48 }: AvatarProps) {
  const ring = size + 6;
  return (
    <View style={{ width: ring, height: ring, borderRadius: ring / 2, padding: 2 }}>
      <LinearGradient
        colors={Colors.HoloStops as any}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={{
        width: size, height: size, borderRadius: size / 2,
        backgroundColor: Colors.surface,
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Text style={{ fontSize: size * 0.36, fontWeight: '700', color: Colors.t1 }}>{initials}</Text>
      </View>
    </View>
  );
}
