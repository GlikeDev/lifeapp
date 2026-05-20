// SaveSmart — Liquid Glass Design Tokens

export const Colors = {
  bgDeep: '#05060C',
  bg: '#0D0E1A',
  surface: '#1A1B2E',
  surfaceElevated: '#232438',
  border: '#2A2B40',
  border2: '#363752',
  cyan:    '#22D3EE',
  purple:  '#A78BFA',
  magenta: '#E879F9',
  pink:    '#F472B6',
  coral:   '#FB7185',
  green:   '#34D399',
  gold:    '#FBBF24',
  t1: '#F0F0FF',
  t2: '#9FA3C7',
  t3: '#6366A0',
  t4: '#3E4070',
  HoloStops: ['#22D3EE', '#A78BFA', '#E879F9', '#FB7185'] as string[],
  accentTeal: '#22D3EE',
  accentPurple: '#A78BFA',
  success: '#34D399',
  warning: '#FBBF24',
  danger: '#FB7185',
  textPrimary: '#F0F0FF',
  textSecondary: '#9FA3C7',
  textMuted: '#6366A0',
  categoryFood: '#34D399',
  categoryTransport: '#A78BFA',
  categoryHome: '#FBBF24',
  categoryOther: '#FB7185',
  tierBronze: '#CD7F32',
  tierSilver: '#C0C0C0',
  tierGold: '#FBBF24',
  tierPlatinum: '#E5E4E2',
  tierLegend: '#FB7185',
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

export const Typography = {
  fontRegular: 'System',
  fontSemiBold: 'System',
  fontBold: 'System',
  size2XL: 32, sizeXL: 24, sizeLG: 18, sizeMD: 14, sizeSM: 12, sizeXS: 10,
  weightRegular: '400' as const,
  weightSemiBold: '600' as const,
  weightBold: '700' as const,
};

export const Spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 };

export const Radius = { sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, full: 999 };

export const Shadow = {
  card: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  glow: (color: string, radius = 12) => ({
    shadowColor: color, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7, shadowRadius: radius, elevation: 8,
  }),
};
