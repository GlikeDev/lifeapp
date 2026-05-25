import { Platform } from 'react-native';

export const Colors = {
  bg:      '#0D0E1A',
  bgDeep:  '#05060C',

  surface:         'rgba(255,255,255,0.06)',
  surfaceElevated: 'rgba(255,255,255,0.09)',
  border:          'rgba(255,255,255,0.08)',
  border2:         'rgba(255,255,255,0.14)',

  accentTeal:   '#00D4C8',
  accentPurple: '#7B6CF6',
  accent2:      '#FF6B9D',
  accent3:      '#7B6CF6',
  pink:         '#FF6B9D',
  coral:        '#FB7185',
  success:      '#39D98A',
  warning:      '#FAAD14',
  danger:       '#F5554A',
  gold:         '#FBBF24',
  silver:       '#CBD5E1',
  bronze:       '#D97706',
  platinum:     '#E2E8F0',

  cyan:    '#00D4C8',
  purple:  '#7B6CF6',
  magenta: '#FF6B9D',
  green:   '#39D98A',

  HoloStops: ['#00D4C8', '#7B6CF6', '#FF6B9D', '#00D4C8'] as string[],

  textPrimary:   '#FFFFFF',
  textSecondary: '#8E8FA8',
  textMuted:     '#5A5B72',
  textFaint:     '#3E3F58',

  t1: '#F4F4FF',
  t2: '#C8CADF',
  t3: '#8E8FA8',
  t4: '#5A5B72',

  categoryFood:      '#39D98A',
  categoryTransport: '#7B6CF6',
  categoryHome:      '#FAAD14',
  categoryOther:     '#FF6B9D',

  tierBronze:   '#D97706',
  tierSilver:   '#CBD5E1',
  tierGold:     '#FBBF24',
  tierPlatinum: '#E2E8F0',
  tierLegend:   '#FF6B9D',
};

export const CATEGORIES = [
  { key: 'food',      label: 'Питание',   color: Colors.green   },
  { key: 'transport', label: 'Транспорт', color: Colors.purple  },
  { key: 'home',      label: 'Дом',       color: Colors.gold    },
  { key: 'health',    label: 'Здоровье',  color: Colors.cyan    },
  { key: 'other',     label: 'Прочее',    color: Colors.coral   },
];

export const TIER_COLORS: Record<string, string> = {
  bronze:   Colors.tierBronze,
  silver:   Colors.tierSilver,
  gold:     Colors.tierGold,
  platinum: Colors.tierPlatinum,
  legend:   Colors.tierLegend,
};

export const Fonts = {
  soraRegular:   'Sora-Regular',
  soraSemiBold:  'Sora-SemiBold',
  soraBold:      'Sora-Bold',
  onestRegular:  'Onest-Regular',
  onestMedium:   'Onest-Medium',
  onestSemiBold: 'Onest-SemiBold',
  onestBold:     'Onest-Bold',
};

export const Typography = {
  fontRegular:  'Onest-Regular',
  fontMedium:   'Onest-Medium',
  fontSemiBold: 'Onest-SemiBold',
  fontBold:     'Onest-Bold',
  fontDisplay:  'Sora-Bold',

  size2XL: 32,
  sizeXL:  26,
  sizeLG:  20,
  sizeMD:  15,
  sizeSM:  12,
  sizeXS:  10,

  weightRegular:  '400' as const,
  weightMedium:   '500' as const,
  weightSemiBold: '600' as const,
  weightBold:     '700' as const,
};

export const Spacing = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  24,
  xxxl: 32,
};

export const Radius = {
  sm:   12,
  md:   18,
  lg:   22,
  xl:   30,
  full: 999,
};

export const Layout = {
  tabBarHeight:       64,
  tabBarBottomMargin: 20,
  tabBarClearance:    110,
};

export const Shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 8,
  },
  glow: (color: string, radius = 12) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: radius,
    elevation: 8,
  }),
};

export const Glass = {
  surface:      'rgba(15,18,32,0.55)',
  surfaceMid:   'rgba(15,18,32,0.62)',
  surface2:     'rgba(15,18,32,0.68)',
  elev:         'rgba(13,14,26,0.72)',
  border:       'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.14)',
  borderBright: 'rgba(255,255,255,0.22)',
  highlight:    'rgba(255,255,255,0.06)',
  shadow:       'rgba(0,0,0,0.55)',
};

export const Gradient = {
  primaryColors: ['#00D4C8', '#7B6CF6'] as const,
  fabColors:     ['#7B6CF6', '#00D4C8'] as const,
  holoColors:    ['#00D4C8', '#7B6CF6', '#FF6B9D', '#00D4C8'] as const,
  strokeTeal:    'rgba(0,212,200,0.55)',
  strokePurple:  'rgba(123,108,246,0.55)',
};

export const Holo = {
  blob1: 'rgba(0,212,200,0.18)',
  blob2: 'rgba(123,108,246,0.14)',
  blob3: 'rgba(255,107,157,0.10)',
};

export const fontMono = Platform.select({ ios: 'Courier New', android: 'monospace' }) ?? 'monospace';
