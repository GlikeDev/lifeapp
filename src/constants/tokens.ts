import { Platform } from 'react-native';

export const Colors = {
  bg:      '#0A0B14',
  bgDeep:  '#05060C',

  surface:         'rgba(255,255,255,0.035)',
  surfaceElevated: 'rgba(255,255,255,0.06)',
  border:          'rgba(255,255,255,0.08)',
  border2:         'rgba(255,255,255,0.14)',

  accentTeal:   '#22D3EE',
  accentPurple: '#A78BFA',
  accent2:      '#E879F9',
  accent3:      '#A78BFA',
  pink:         '#F472B6',
  coral:        '#FB7185',
  success:      '#4ADE80',
  warning:      '#F59E0B',
  danger:       '#FB7185',
  gold:         '#FBBF24',
  silver:       '#CBD5E1',
  bronze:       '#D97706',
  platinum:     '#E2E8F0',

  cyan:    '#22D3EE',
  purple:  '#A78BFA',
  magenta: '#E879F9',
  green:   '#34D399',

  HoloStops: ['#22D3EE', '#A78BFA', '#E879F9', '#FB7185'] as string[],

  textPrimary:   '#FFFFFF',
  textSecondary: '#C7CADC',
  textMuted:     '#7A7E9C',
  textFaint:     '#44475F',

  t1: '#F0F0FF',
  t2: '#9FA3C7',
  t3: '#6366A0',
  t4: '#3E4070',

  categoryFood:      '#4ADE80',
  categoryTransport: '#A78BFA',
  categoryHome:      '#F59E0B',
  categoryOther:     '#F472B6',

  tierBronze:   '#D97706',
  tierSilver:   '#CBD5E1',
  tierGold:     '#FBBF24',
  tierPlatinum: '#E2E8F0',
  tierLegend:   '#F472B6',
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
  surface:      'rgba(255,255,255,0.025)',
  surfaceMid:   'rgba(255,255,255,0.045)',
  surface2:     'rgba(255,255,255,0.06)',
  elev:         'rgba(255,255,255,0.08)',
  border:       'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.14)',
  borderBright: 'rgba(255,255,255,0.22)',
  highlight:    'rgba(255,255,255,0.10)',
  shadow:       'rgba(0,0,0,0.55)',
};

export const Holo = {
  blob1: 'rgba(34,211,238,0.18)',
  blob2: 'rgba(167,139,250,0.14)',
  blob3: 'rgba(232,121,249,0.14)',
};

export const fontMono = Platform.select({ ios: 'Courier New', android: 'monospace' }) ?? 'monospace';
