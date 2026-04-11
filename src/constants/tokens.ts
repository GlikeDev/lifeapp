// SaveSmart Design Tokens
// Source: SaveSmart UI/UX Concept | Origami 2026

export const Colors = {
  // Backgrounds
  bg: '#0D0E1A',
  surface: '#1A1B2E',
  surfaceElevated: '#232438',
  border: '#2E2F45',

  // Accents (from PDF palette)
  accentPurple: '#7B6CF6',
  accentTeal: '#00D4C8',
  success: '#39D98A',
  warning: '#FAAD14',
  danger: '#F5554A',
  pink: '#FF6B9D',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#8E8FA8',
  textMuted: '#5A5B72',

  // Categories
  categoryFood: '#39D98A',
  categoryTransport: '#7B6CF6',
  categoryHome: '#FAAD14',
  categoryOther: '#FF6B9D',

  // Achievement tiers
  tierBronze: '#CD7F32',
  tierSilver: '#C0C0C0',
  tierGold: '#FFD700',
  tierPlatinum: '#E5E4E2',
  tierLegend: '#FF6B9D',
};

export const Typography = {
  // Font families (resolved at runtime via Platform)
  fontRegular: 'System',
  fontSemiBold: 'System',
  fontBold: 'System',

  // Sizes (from PDF: 24 / 18 / 14 / 12 / 10 px)
  size2XL: 32,
  sizeXL: 24,
  sizeLG: 18,
  sizeMD: 14,
  sizeSM: 12,
  sizeXS: 10,

  // Weights
  weightRegular: '400' as const,
  weightSemiBold: '600' as const,
  weightBold: '700' as const,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
};

export const Shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
};
