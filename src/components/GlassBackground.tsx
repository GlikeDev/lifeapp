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
  // teal — top right
  blobTR: {
    width: 320,
    height: 200,
    top: -60,
    right: -80,
    backgroundColor: 'rgba(0,212,200,0.18)',
    transform: [{ scaleX: 1.4 }],
  },
  // purple — center left
  blobCL: {
    width: 280,
    height: 220,
    top: '28%',
    left: -100,
    backgroundColor: 'rgba(123,108,246,0.14)',
    transform: [{ scaleY: 1.3 }],
  },
  // pink — bottom right
  blobBR: {
    width: 300,
    height: 200,
    bottom: 80,
    right: -80,
    backgroundColor: 'rgba(255,107,157,0.10)',
    transform: [{ scaleX: 1.3 }],
  },
});
