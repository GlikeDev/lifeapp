import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Circle, Rect, Line, Polyline } from 'react-native-svg';
import { Colors } from '../../constants/tokens';

export type GlyphName =
  | 'scan' | 'edit' | 'arrow-right' | 'arrow-left' | 'plus' | 'close' | 'check'
  | 'search' | 'home' | 'chart' | 'star' | 'bolt' | 'fire' | 'sparkle'
  | 'cart' | 'groceries' | 'travel' | 'nutrition' | 'camera' | 'bell' | 'settings' | 'lock';

function renderIcon(name: GlyphName, size: number, color: string) {
  const s = size;
  const c = color;
  if (name === 'scan') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M3 7V5a2 2 0 0 1 2-2h2" stroke={c} strokeWidth={1.8} strokeLinecap="round"/>
      <Path d="M17 3h2a2 2 0 0 1 2 2v2" stroke={c} strokeWidth={1.8} strokeLinecap="round"/>
      <Path d="M21 17v2a2 2 0 0 1-2 2h-2" stroke={c} strokeWidth={1.8} strokeLinecap="round"/>
      <Path d="M7 21H5a2 2 0 0 1-2-2v-2" stroke={c} strokeWidth={1.8} strokeLinecap="round"/>
      <Line x1="3" y1="12" x2="21" y2="12" stroke={c} strokeWidth={1.8}/>
    </Svg>);
  if (name === 'edit') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke={c} strokeWidth={1.8}/>
    </Svg>);
  if (name === 'arrow-right') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12h14M12 5l7 7-7 7" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>);
  if (name === 'arrow-left') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>);
  if (name === 'plus') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={c} strokeWidth={2} strokeLinecap="round"/>
    </Svg>);
  if (name === 'close') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6L6 18M6 6l12 12" stroke={c} strokeWidth={2} strokeLinecap="round"/>
    </Svg>);
  if (name === 'check') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M20 6L9 17l-5-5" stroke={c} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>);
  if (name === 'search') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="8" stroke={c} strokeWidth={1.8}/>
      <Path d="m21 21-4.35-4.35" stroke={c} strokeWidth={1.8} strokeLinecap="round"/>
    </Svg>);
  if (name === 'home') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke={c} strokeWidth={1.8} strokeLinejoin="round"/>
      <Polyline points="9,22 9,12 15,12 15,22" stroke={c} strokeWidth={1.8}/>
    </Svg>);
  if (name === 'chart') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M18 20V10M12 20V4M6 20v-6" stroke={c} strokeWidth={2} strokeLinecap="round"/>
    </Svg>);
  if (name === 'star') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke={c} strokeWidth={1.8} strokeLinejoin="round"/>
    </Svg>);
  if (name === 'bolt') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke={c} strokeWidth={1.8} strokeLinejoin="round"/>
    </Svg>);
  if (name === 'fire') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2c0 0-4 4-4 9a4 4 0 0 0 8 0c0-2.5-1.5-4-2-5 0 1.5-.5 2.5-2 2.5C11 8.5 12 6 12 2z" stroke={c} strokeWidth={1.6}/>
    </Svg>);
  if (name === 'sparkle') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke={c} strokeWidth={1.8} strokeLinecap="round"/>
      <Circle cx="12" cy="12" r="3" stroke={c} strokeWidth={1.4}/>
    </Svg>);
  if (name === 'cart') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M9 22a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM20 22a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" stroke={c} strokeWidth={1.8}/>
      <Path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" stroke={c} strokeWidth={1.8}/>
    </Svg>);
  if (name === 'groceries') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M6 2h12l2 7H4L6 2z" stroke={c} strokeWidth={1.7} strokeLinejoin="round"/>
      <Path d="M4 9l1.5 10a2 2 0 0 0 2 1.5h9a2 2 0 0 0 2-1.5L20 9" stroke={c} strokeWidth={1.7}/>
      <Path d="M10 13v3M14 13v3" stroke={c} strokeWidth={1.6} strokeLinecap="round"/>
    </Svg>);
  if (name === 'travel') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M12 22s8-4 8-10a8 8 0 1 0-16 0c0 6 8 10 8 10z" stroke={c} strokeWidth={1.8}/>
      <Circle cx="12" cy="12" r="3" stroke={c} strokeWidth={1.8}/>
    </Svg>);
  if (name === 'nutrition') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2a10 10 0 1 0 10 10" stroke={c} strokeWidth={1.8} strokeLinecap="round"/>
      <Path d="M22 2L12 12M22 8V2h-6" stroke={c} strokeWidth={1.8} strokeLinecap="round"/>
    </Svg>);
  if (name === 'camera') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke={c} strokeWidth={1.8}/>
      <Circle cx="12" cy="13" r="4" stroke={c} strokeWidth={1.8}/>
    </Svg>);
  if (name === 'bell') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" stroke={c} strokeWidth={1.8} strokeLinecap="round"/>
    </Svg>);
  if (name === 'settings') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="3" stroke={c} strokeWidth={1.8}/>
      <Path d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" stroke={c} strokeWidth={1.4} strokeLinecap="round"/>
    </Svg>);
  if (name === 'lock') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke={c} strokeWidth={1.8}/>
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={c} strokeWidth={1.8} strokeLinecap="round"/>
    </Svg>);
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="5" stroke={c} strokeWidth={2}/>
    </Svg>);
}

interface GlyphIconProps { name: GlyphName; size?: number; color?: string; }
export function GlyphIcon({ name, size = 20, color = Colors.t2 }: GlyphIconProps) {
  return renderIcon(name, size, color);
}

interface IconChipProps { name: GlyphName; color?: string; size?: number; radius?: number; }
export function IconChip({ name, color = Colors.cyan, size = 44, radius = 14 }: IconChipProps) {
  return (
    <View style={{
      width: size, height: size, borderRadius: radius,
      backgroundColor: (color + '20') as any,
      borderWidth: 1, borderColor: (color + '40') as any,
      alignItems: 'center', justifyContent: 'center',
    }}>
      <GlyphIcon name={name} size={Math.round(size * 0.5)} color={color} />
    </View>
  );
}
