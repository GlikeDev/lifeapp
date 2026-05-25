import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';
import { Colors } from '../../constants/tokens';

export type GlyphName =
  // Navigation
  | 'home' | 'scan' | 'fridge' | 'nutrition' | 'profile'
  // Common UI
  | 'plus' | 'minus' | 'chevron' | 'settings' | 'bell' | 'search'
  | 'close' | 'check' | 'arrow-right' | 'arrow-left' | 'edit' | 'lock'
  // Brand-specific
  | 'wallet' | 'goal' | 'receipt' | 'ai' | 'leaf' | 'calendar' | 'camera' | 'chart'
  // Legacy (welcome screen tiles)
  | 'star' | 'bolt' | 'fire' | 'sparkle' | 'cart' | 'groceries' | 'travel';

function renderIcon(name: GlyphName, s: number, c: string) {
  // ── Navigation ──────────────────────────────────────────────────────────────
  if (name === 'home') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M3.5 11.2L12 4l8.5 7.2v8.3a1.5 1.5 0 0 1-1.5 1.5h-14a1.5 1.5 0 0 1-1.5-1.5z" stroke={c} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M9.5 21v-5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v5" stroke={c} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>);

  if (name === 'scan') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M3 8V5a2 2 0 0 1 2-2h3" stroke={c} strokeWidth={1.75} strokeLinecap="round"/>
      <Path d="M21 8V5a2 2 0 0 0-2-2h-3" stroke={c} strokeWidth={1.75} strokeLinecap="round"/>
      <Path d="M3 16v3a2 2 0 0 0 2 2h3" stroke={c} strokeWidth={1.75} strokeLinecap="round"/>
      <Path d="M21 16v3a2 2 0 0 1-2 2h-3" stroke={c} strokeWidth={1.75} strokeLinecap="round"/>
      <Path d="M3 12H21" stroke={c} strokeWidth={1.75} strokeLinecap="round"/>
    </Svg>);

  if (name === 'fridge') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Rect x="5" y="3" width="14" height="18" rx="2.5" stroke={c} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M5 10H19" stroke={c} strokeWidth={1.75} strokeLinecap="round"/>
      <Path d="M8 6V8" stroke={c} strokeWidth={1.75} strokeLinecap="round"/>
      <Path d="M8 13V15" stroke={c} strokeWidth={1.75} strokeLinecap="round"/>
    </Svg>);

  if (name === 'nutrition') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={c} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M9 15L15 9" stroke={c} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M10.5 9H15V13.5" stroke={c} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>);

  if (name === 'profile') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3.5l2.6 5.3 5.9.9-4.25 4.1 1 5.85L12 17l-5.25 2.65 1-5.85L3.5 9.7l5.9-.9z" stroke={c} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>);

  // ── Common UI ────────────────────────────────────────────────────────────────
  if (name === 'plus') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5V19M5 12H19" stroke={c} strokeWidth={1.75} strokeLinecap="round"/>
    </Svg>);

  if (name === 'minus') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12H19" stroke={c} strokeWidth={1.75} strokeLinecap="round"/>
    </Svg>);

  if (name === 'chevron') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M9 5l7 7-7 7" stroke={c} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>);

  if (name === 'settings') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="3.2" stroke={c} strokeWidth={1.75}/>
      <Path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.2 5.2l2.1 2.1M16.7 16.7l2.1 2.1M5.2 18.8l2.1-2.1M16.7 7.3l2.1-2.1" stroke={c} strokeWidth={1.75} strokeLinecap="round"/>
    </Svg>);

  if (name === 'bell') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2H4.5z" stroke={c} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M10 20a2 2 0 0 0 4 0" stroke={c} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>);

  if (name === 'search') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="6.5" stroke={c} strokeWidth={1.75}/>
      <Path d="M16 16L20 20" stroke={c} strokeWidth={1.75} strokeLinecap="round"/>
    </Svg>);

  if (name === 'close') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6L6 18M6 6l12 12" stroke={c} strokeWidth={1.75} strokeLinecap="round"/>
    </Svg>);

  if (name === 'check') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M20 6L9 17l-5-5" stroke={c} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>);

  if (name === 'arrow-right') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12h14M12 5l7 7-7 7" stroke={c} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>);

  if (name === 'arrow-left') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={c} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>);

  if (name === 'edit') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke={c} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke={c} strokeWidth={1.75}/>
    </Svg>);

  if (name === 'lock') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="11" width="18" height="11" rx="2" stroke={c} strokeWidth={1.75}/>
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={c} strokeWidth={1.75} strokeLinecap="round"/>
    </Svg>);

  // ── Brand-specific ───────────────────────────────────────────────────────────
  if (name === 'wallet') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M3.5 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2" stroke={c} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"/>
      <Rect x="3.5" y="7.5" width="17" height="12.5" rx="2.5" stroke={c} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"/>
      <Circle cx="16" cy="14" r="1.2" fill={c}/>
    </Svg>);

  if (name === 'goal') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="8.5" stroke={c} strokeWidth={1.75}/>
      <Circle cx="12" cy="12" r="5" stroke={c} strokeWidth={1.75}/>
      <Circle cx="12" cy="12" r="1.5" fill={c}/>
    </Svg>);

  if (name === 'receipt') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M6 3H18V20L16 19L14 20L12 19L10 20L8 19L6 20Z" stroke={c} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M9 8H15M9 12H15M9 16H13" stroke={c} strokeWidth={1.75} strokeLinecap="round"/>
    </Svg>);

  if (name === 'ai') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3L14 10L21 12L14 14L12 21L10 14L3 12L10 10Z" stroke={c} strokeWidth={1.75} strokeLinejoin="round"/>
    </Svg>);

  if (name === 'leaf') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M5 19C4 11 11 4 20 4C20 13 13 20 5 19Z" stroke={c} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M5 19L13 11" stroke={c} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>);

  if (name === 'calendar') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="5" width="16" height="16" rx="2.5" stroke={c} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M4 10H20M9 3V7M15 3V7" stroke={c} strokeWidth={1.75} strokeLinecap="round"/>
      <Circle cx="12" cy="15" r="1.4" fill={c}/>
    </Svg>);

  if (name === 'camera') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M3 8a2 2 0 0 1 2-2h2.5L9 4h6l1.5 2H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke={c} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"/>
      <Circle cx="12" cy="13" r="3.5" stroke={c} strokeWidth={1.75}/>
    </Svg>);

  if (name === 'chart') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M4 20H20" stroke={c} strokeWidth={1.75} strokeLinecap="round"/>
      <Rect x="6" y="13" width="3" height="6" rx="0.8" stroke={c} strokeWidth={1.75}/>
      <Rect x="11" y="9" width="3" height="10" rx="0.8" stroke={c} strokeWidth={1.75}/>
      <Rect x="16" y="5" width="3" height="14" rx="0.8" stroke={c} strokeWidth={1.75}/>
    </Svg>);

  // ── Legacy (welcome screen) ──────────────────────────────────────────────────
  if (name === 'star') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke={c} strokeWidth={1.75} strokeLinejoin="round"/>
    </Svg>);

  if (name === 'bolt') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke={c} strokeWidth={1.75} strokeLinejoin="round"/>
    </Svg>);

  if (name === 'fire') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2c0 0-4 4-4 9a4 4 0 0 0 8 0c0-2.5-1.5-4-2-5 0 1.5-.5 2.5-2 2.5C11 8.5 12 6 12 2z" stroke={c} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>);

  if (name === 'sparkle') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3L14 10L21 12L14 14L12 21L10 14L3 12L10 10Z" stroke={c} strokeWidth={1.75} strokeLinejoin="round"/>
    </Svg>);

  if (name === 'cart') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Circle cx="9" cy="21" r="1" stroke={c} strokeWidth={1.75}/>
      <Circle cx="20" cy="21" r="1" stroke={c} strokeWidth={1.75}/>
      <Path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" stroke={c} strokeWidth={1.75} strokeLinecap="round"/>
    </Svg>);

  if (name === 'groceries') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M6 2h12l2 7H4L6 2z" stroke={c} strokeWidth={1.75} strokeLinejoin="round"/>
      <Path d="M4 9l1.5 10a2 2 0 0 0 2 1.5h9a2 2 0 0 0 2-1.5L20 9" stroke={c} strokeWidth={1.75}/>
      <Path d="M10 13v3M14 13v3" stroke={c} strokeWidth={1.75} strokeLinecap="round"/>
    </Svg>);

  if (name === 'travel') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M12 22s8-4 8-10a8 8 0 1 0-16 0c0 6 8 10 8 10z" stroke={c} strokeWidth={1.75}/>
      <Circle cx="12" cy="12" r="3" stroke={c} strokeWidth={1.75}/>
    </Svg>);

  // Fallback
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="5" stroke={c} strokeWidth={1.75}/>
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
