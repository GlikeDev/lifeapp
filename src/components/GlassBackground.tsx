import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '../constants/tokens';

export function GlassBackground({ children }: { children: React.ReactNode }) {
  return (
    <View style={s.root}>
      {/* Holographic blob — cyan top-right */}
      <View style={[s.blob, s.blobTR]} pointerEvents="none" />
      {/* Holographic blob — purple center-left */}
      <View style={[s.blob, s.blobCL]} pointerEvents="none" />
      {/* Holographic blob — magenta bottom-right */}
      <View style={[s.blob, s.blobBR]} pointerEvents="none" />
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.55,
  },
  // cyan — top right (~90% x, 8% y)
  blobTR: {
    width: 320,
    height: 200,
    top: -60,
    right: -80,
    backgroundColor: 'rgba(34,211,238,0.22)',
    transform: [{ scaleX: 1.4 }],
    // Soft edge via nested view trick
  },
  // purple — center left (~-5% x, 35% y)
  blobCL: {
    width: 280,
    height: 220,
    top: '28%',
    left: -100,
    backgroundColor: 'rgba(167,139,250,0.18)',
    transform: [{ scaleY: 1.3 }],
  },
  // magenta — bottom right
  blobBR: {
    width: 300,
    height: 200,
    bottom: 80,
    right: -80,
    backgroundColor: 'rgba(232,121,249,0.16)',
    transform: [{ scaleX: 1.3 }],
  },
});
