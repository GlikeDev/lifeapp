import React from 'react';
import { View } from 'react-native';
import Svg, {
  Path, Circle, Rect, G, Ellipse,
  Defs, LinearGradient as SvgLG, Stop,
} from 'react-native-svg';
import { Colors } from '../../constants/tokens';

// ─── Plain (monochrome) icons ────────────────────────────────────────────────

export type GlyphName =
  | 'home' | 'scan' | 'fridge' | 'nutrition' | 'profile'
  | 'plus' | 'minus' | 'chevron' | 'settings' | 'bell' | 'search'
  | 'close' | 'check' | 'arrow-right' | 'arrow-left' | 'edit' | 'lock'
  | 'wallet' | 'goal' | 'receipt' | 'ai' | 'leaf' | 'calendar' | 'camera' | 'chart'
  | 'star' | 'bolt' | 'fire' | 'sparkle' | 'cart' | 'groceries' | 'travel'
  | 'trash' | 'arrow-up' | 'arrow-down' | 'play' | 'pause' | 'share' | 'currency' | 'image' | 'document';

function renderIcon(name: GlyphName, s: number, c: string) {
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
      <Rect x="5" y="3" width="14" height="18" rx="2.5" stroke={c} strokeWidth={1.75}/>
      <Path d="M5 10H19M8 6V8M8 13V15" stroke={c} strokeWidth={1.75} strokeLinecap="round"/>
    </Svg>);

  if (name === 'nutrition') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={c} strokeWidth={1.75}/>
      <Path d="M9 15L15 9M10.5 9H15V13.5" stroke={c} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>);

  if (name === 'profile') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3.5l2.6 5.3 5.9.9-4.25 4.1 1 5.85L12 17l-5.25 2.65 1-5.85L3.5 9.7l5.9-.9z" stroke={c} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>);

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
      <Path d="M10 20a2 2 0 0 0 4 0" stroke={c} strokeWidth={1.75} strokeLinecap="round"/>
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

  if (name === 'wallet') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M3.5 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2" stroke={c} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"/>
      <Rect x="3.5" y="7.5" width="17" height="12.5" rx="2.5" stroke={c} strokeWidth={1.75}/>
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
      <Path d="M5 19L13 11" stroke={c} strokeWidth={1.75} strokeLinecap="round"/>
    </Svg>);

  if (name === 'calendar') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="5" width="16" height="16" rx="2.5" stroke={c} strokeWidth={1.75}/>
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

  if (name === 'trash') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M3.5 6H20.5" stroke={c} strokeWidth={1.75} strokeLinecap="round"/>
      <Path d="M9.5 6V4.5A1 1 0 0 1 10.5 3.5H13.5A1 1 0 0 1 14.5 4.5V6" stroke={c} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M5.5 6L6.4 19.5A1.5 1.5 0 0 0 7.9 21H16.1A1.5 1.5 0 0 0 17.6 19.5L18.5 6" stroke={c} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M10 10V17M14 10V17" stroke={c} strokeWidth={1.75} strokeLinecap="round"/>
    </Svg>);

  if (name === 'arrow-up') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M12 19V5M6 11L12 5L18 11" stroke={c} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>);

  if (name === 'arrow-down') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5V19M6 13L12 19L18 13" stroke={c} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>);

  if (name === 'play') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M7.5 5L19 12L7.5 19Z" fill={c} stroke={c} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>);

  if (name === 'pause') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Rect x="6.5" y="5" width="3.5" height="14" rx="1" fill={c} stroke={c} strokeWidth={1.75}/>
      <Rect x="14" y="5" width="3.5" height="14" rx="1" fill={c} stroke={c} strokeWidth={1.75}/>
    </Svg>);

  if (name === 'share') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3.5V14" stroke={c} strokeWidth={1.75} strokeLinecap="round"/>
      <Path d="M8 7.5L12 3.5L16 7.5" stroke={c} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M5 11V19A1.5 1.5 0 0 0 6.5 20.5H17.5A1.5 1.5 0 0 0 19 19V11" stroke={c} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>);

  if (name === 'currency') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M8.5 6H6.2A1.7 1.7 0 0 0 6.2 9.4H7.8A1.7 1.7 0 0 1 7.8 12.8H5.5" stroke={c} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M7 4.5V14.5" stroke={c} strokeWidth={1.75} strokeLinecap="round"/>
      <Path d="M18.5 16.5A3.5 3.5 0 1 1 18.5 11" stroke={c} strokeWidth={1.75} strokeLinecap="round"/>
      <Path d="M14 13H17M14 14.5H17" stroke={c} strokeWidth={1.75} strokeLinecap="round"/>
      <Path d="M11 7L13 7L11 9" stroke={c} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M13 17L11 17L13 15" stroke={c} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>);

  if (name === 'image') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Rect x="3.5" y="4.5" width="17" height="15" rx="2.5" stroke={c} strokeWidth={1.75}/>
      <Circle cx="8.5" cy="10" r="1.5" stroke={c} strokeWidth={1.75}/>
      <Path d="M3.5 17L9 12L13.5 16L17 13L20.5 17" stroke={c} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>);

  if (name === 'document') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M6 3H14L18.5 7.5V19.5A1.5 1.5 0 0 1 17 21H6A1.5 1.5 0 0 1 4.5 19.5V4.5A1.5 1.5 0 0 1 6 3Z" stroke={c} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M14 3V7.5H18.5" stroke={c} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M8 12H15M8 15H15M8 18H12" stroke={c} strokeWidth={1.75} strokeLinecap="round"/>
    </Svg>);

  return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="5" stroke={c} strokeWidth={1.75}/>
    </Svg>);
}

export interface GlyphIconProps { name: GlyphName; size?: number; color?: string; }
export function GlyphIcon({ name, size = 20, color = Colors.textSecondary }: GlyphIconProps) {
  return renderIcon(name, size, color);
}

export interface IconChipProps { name: GlyphName; color?: string; size?: number; radius?: number; }
export function IconChip({ name, color = Colors.accentTeal, size = 44, radius = 14 }: IconChipProps) {
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

// ─── Gradient icons (teal → purple, from design system) ──────────────────────

export type GradientGlyphName =
  | 'grad-coffee' | 'grad-pizza' | 'grad-taxi' | 'grad-car'
  | 'grad-dumbbell' | 'grad-coins' | 'grad-cart' | 'grad-bolt'
  | 'grad-sparkle' | 'grad-star' | 'grad-graduation' | 'grad-beach'
  | 'grad-ring' | 'grad-confetti' | 'grad-plane' | 'grad-phone' | 'grad-salad' | 'grad-currency';

const G1 = '#00D4C8';
const G2 = '#7B6CF6';

function GG({ id }: { id: string }) {
  return (
    <Defs>
      <SvgLG id={id} x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0%" stopColor={G1}/>
        <Stop offset="100%" stopColor={G2}/>
      </SvgLG>
      <SvgLG id={id + 's'} x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0%" stopColor={G1} stopOpacity="0.35"/>
        <Stop offset="100%" stopColor={G2} stopOpacity="0.35"/>
      </SvgLG>
    </Defs>
  );
}

function renderGradIcon(name: GradientGlyphName, s: number) {
  const id = 'gg';
  const gr = `url(#${id})`;
  const gs = `url(#${id}s)`;
  const sw = { strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

  if (name === 'grad-coffee') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <GG id={id}/>
      <Path d="M4 10H18L16.5 20Q16.3 21 15.3 21H6.7Q5.7 21 5.5 20Z" stroke={gr} {...sw}/>
      <Path d="M3 21H19" stroke={gr} {...sw}/>
      <Path d="M18 12Q21.5 12 21.5 15Q21.5 18 17.5 18" stroke={gr} {...sw}/>
      <Path d="M9 6Q8 4 9 2.5M12.5 6Q11.5 4 12.5 2.5" stroke={gr} {...sw}/>
    </Svg>);

  if (name === 'grad-pizza') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <GG id={id}/>
      <Path d="M12 2L4 19Q12 22 20 19Z" stroke={gr} {...sw}/>
      <Path d="M6 18Q12 20.5 18 18" stroke={gr} {...sw}/>
      <Circle cx="10" cy="11" r="1.3" fill={gr}/>
      <Circle cx="14" cy="13" r="1.3" fill={gr}/>
      <Circle cx="11.5" cy="16" r="1" fill={gr}/>
    </Svg>);

  if (name === 'grad-taxi') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <GG id={id}/>
      <Rect x="9" y="3" width="6" height="2" rx="0.5" fill={gs} stroke={gr} strokeWidth={2}/>
      <Path d="M6.5 13L8.5 9Q9 8 10 8H14Q15 8 15.5 9L17.5 13" stroke={gr} {...sw}/>
      <Path d="M3.5 16V13.5Q4 12.5 5 12.5H19Q20 12.5 20.5 13.5V16" stroke={gr} {...sw}/>
      <Path d="M3.5 16H5Q7.2 13.8 9.4 16H14.6Q16.8 13.8 19 16H20.5" stroke={gr} {...sw}/>
      <Path d="M12 8V12.5" stroke={gr} {...sw}/>
      <Circle cx="7.2" cy="16.5" r="1.4" fill="none" stroke={gr} strokeWidth={2}/>
      <Circle cx="16.8" cy="16.5" r="1.4" fill="none" stroke={gr} strokeWidth={2}/>
    </Svg>);

  if (name === 'grad-car') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <GG id={id}/>
      <Path d="M6.5 12L8.5 8Q9 7 10 7H14Q15 7 15.5 8L17.5 12" stroke={gr} {...sw}/>
      <Path d="M3.5 15H5Q7.2 12.8 9.4 15H14.6Q16.8 12.8 19 15H20.5" stroke={gr} {...sw}/>
      <Path d="M3.5 15V12.5Q4 11.5 5 11.5H19Q20 11.5 20.5 12.5V15" stroke={gr} {...sw}/>
      <Path d="M12 7V11.5" stroke={gr} {...sw}/>
      <Circle cx="7.2" cy="15.5" r="1.4" fill="none" stroke={gr} strokeWidth={2}/>
      <Circle cx="16.8" cy="15.5" r="1.4" fill="none" stroke={gr} strokeWidth={2}/>
    </Svg>);

  if (name === 'grad-dumbbell') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <GG id={id}/>
      <Path d="M7 12H17" stroke={gr} {...sw}/>
      <Rect x="3" y="9" width="2.5" height="6" rx="0.8" stroke={gr} strokeWidth={2}/>
      <Rect x="5.5" y="7.5" width="2" height="9" rx="0.8" stroke={gr} strokeWidth={2}/>
      <Rect x="16.5" y="7.5" width="2" height="9" rx="0.8" stroke={gr} strokeWidth={2}/>
      <Rect x="18.5" y="9" width="2.5" height="6" rx="0.8" stroke={gr} strokeWidth={2}/>
    </Svg>);

  if (name === 'grad-coins') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <GG id={id}/>
      <Ellipse cx="12" cy="6.5" rx="7" ry="2.5" stroke={gr} {...sw}/>
      <Path d="M5 6.5V12Q5 14.5 12 14.5Q19 14.5 19 12V6.5" stroke={gr} {...sw}/>
      <Path d="M5 9.5Q12 12 19 9.5" stroke={gr} {...sw}/>
      <Path d="M5 15.5V18Q5 20.5 12 20.5Q19 20.5 19 18V15.5" stroke={gr} {...sw}/>
      <Path d="M5 15.5Q12 18 19 15.5" stroke={gr} {...sw}/>
    </Svg>);

  if (name === 'grad-cart') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <GG id={id}/>
      <Path d="M2 4H4.5L6 7" stroke={gr} {...sw}/>
      <Path d="M6 7H21L19 15H8Z" stroke={gr} {...sw}/>
      <Path d="M8 15L8.5 18M19 15L18.5 18" stroke={gr} {...sw}/>
      <Circle cx="9" cy="20" r="1.6" fill={gs} stroke={gr} strokeWidth={2}/>
      <Circle cx="18" cy="20" r="1.6" fill={gs} stroke={gr} strokeWidth={2}/>
    </Svg>);

  if (name === 'grad-bolt') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <GG id={id}/>
      <Path d="M13 2L4 13H11L10 22L20 11H13Z" fill={gs} stroke={gr} {...sw}/>
    </Svg>);

  if (name === 'grad-sparkle') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <GG id={id}/>
      <Path d="M12 3L13.5 10.5L21 12L13.5 13.5L12 21L10.5 13.5L3 12L10.5 10.5Z" stroke={gr} {...sw}/>
      <Circle cx="5" cy="5" r="0.8" fill={gr}/>
      <Circle cx="19" cy="6" r="0.6" fill={gr}/>
      <Circle cx="6" cy="19" r="0.6" fill={gr}/>
    </Svg>);

  if (name === 'grad-star') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <GG id={id}/>
      <Path d="M12 3L14.6 8.8L21 9.7L16.3 14L17.5 20.4L12 17.4L6.5 20.4L7.7 14L3 9.7L9.4 8.8Z" fill={gs} stroke={gr} {...sw}/>
    </Svg>);

  if (name === 'grad-graduation') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <GG id={id}/>
      <Path d="M12 5L22 9L12 13L2 9Z" stroke={gr} {...sw}/>
      <Path d="M6 11V16Q12 19 18 16V11" stroke={gr} {...sw}/>
      <Path d="M22 9V14" stroke={gr} {...sw}/>
      <Circle cx="22" cy="15" r="1.1" fill={gr}/>
    </Svg>);

  if (name === 'grad-beach') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <GG id={id}/>
      <Path d="M3 12Q12 2.5 21 12" stroke={gr} {...sw}/>
      <Path d="M3 12Q6.5 9.5 9 12M9 12Q12 9 15 12M15 12Q17.5 9.5 21 12" stroke={gr} {...sw}/>
      <Path d="M12 11L12 21" stroke={gr} {...sw}/>
      <Path d="M12 21Q10 21.5 9.5 19.5" stroke={gr} {...sw}/>
      <Circle cx="12" cy="6.3" r="0.9" fill={gr}/>
    </Svg>);

  if (name === 'grad-ring') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <GG id={id}/>
      <Ellipse cx="12" cy="16" rx="6.5" ry="5" stroke={gr} {...sw}/>
      <Path d="M9.5 7L12 3L14.5 7L12 10.5Z" stroke={gr} {...sw}/>
      <Path d="M9.5 7H14.5" stroke={gr} {...sw}/>
    </Svg>);

  if (name === 'grad-confetti') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <GG id={id}/>
      <Path d="M3 21L9 6L18 15L3 21Z" stroke={gr} {...sw}/>
      <Path d="M9 6L15 12" stroke={gr} {...sw}/>
      <Circle cx="14" cy="4" r="1" fill={gr}/>
      <Circle cx="19" cy="7" r="0.9" fill={gr}/>
      <Circle cx="21" cy="11" r="0.8" fill={gr}/>
      <Circle cx="20" cy="17" r="0.8" fill={gr}/>
      <Circle cx="17" cy="3" r="0.7" fill={gr}/>
      <Path d="M15 6Q17 5 16 3" stroke={gr} strokeWidth={1.6} strokeLinecap="round"/>
    </Svg>);

  if (name === 'grad-plane') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <GG id={id}/>
      <Path d="M21 3L3 11L10 14L14 21Z" stroke={gr} {...sw}/>
      <Path d="M21 3L10 14" stroke={gr} {...sw}/>
    </Svg>);

  if (name === 'grad-phone') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <GG id={id}/>
      <Rect x="6" y="2.5" width="12" height="19" rx="2.5" stroke={gr} strokeWidth={2}/>
      <Path d="M10 5H14M10.5 19H13.5" stroke={gr} {...sw}/>
    </Svg>);

  if (name === 'grad-currency') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <GG id={id}/>
      <Path d="M8.5 6H6.2A1.7 1.7 0 0 0 6.2 9.4H7.8A1.7 1.7 0 0 1 7.8 12.8H5.5" stroke={gr} {...sw}/>
      <Path d="M7 4.5V14.5" stroke={gr} {...sw}/>
      <Path d="M18.5 16.5A3.5 3.5 0 1 1 18.5 11" stroke={gr} {...sw}/>
      <Path d="M14 13H17M14 14.5H17" stroke={gr} {...sw}/>
      <Path d="M11 7L13 7L11 9" stroke={gr} {...sw}/>
      <Path d="M13 17L11 17L13 15" stroke={gr} {...sw}/>
    </Svg>);

  if (name === 'grad-salad') return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <GG id={id}/>
      <Path d="M3 13H21Q21 20 12 20Q3 20 3 13Z" stroke={gr} {...sw}/>
      <Path d="M5 14.5Q12 16 19 14.5" stroke={gr} {...sw}/>
      <Path d="M6.5 12Q6 7 10.5 7Q10.5 11 6.5 12Z" stroke={gr} {...sw}/>
      <Path d="M11 11Q9.5 4 14 4Q14 10 11 11Z" stroke={gr} {...sw}/>
      <Path d="M15 12Q15 7 19 8Q18.5 12 15 12Z" stroke={gr} {...sw}/>
    </Svg>);

  return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <GG id={id}/>
      <Circle cx="12" cy="12" r="5" stroke={gr} strokeWidth={2}/>
    </Svg>);
}

export interface GradientGlyphIconProps { name: GradientGlyphName; size?: number; }
export function GradientGlyphIcon({ name, size = 22 }: GradientGlyphIconProps) {
  return renderGradIcon(name, size);
}
