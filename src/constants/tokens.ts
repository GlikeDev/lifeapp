// SaveSmart Design Tokens — Liquid Glass Dark
// Synced with styles.css prototype

export const Colors = {
  // Backgrounds
  bg:      '#0A0B14',   // --bg
  bgDeep:  '#05060C',   // --bg-deep

  // Legacy aliases (used across screens)
  surface:         'rgba(255,255,255,0.035)',
  surfaceElevated: 'rgba(255,255,255,0.06)',
  border:          'rgba(255,255,255,0.08)',

  // Neon accents — electric, bright
  accentTeal:   '#22D3EE',  // --cyan (primary accent)
  accentPurple: '#A78BFA',  // --purple
  accent2:      '#E879F9',  // --magenta
  accent3:      '#A78BFA',  // --purple
  pink:         '#F472B6',  // --pink
  coral:        '#FB7185',  // --coral / --danger
  success:      '#4ADE80',  // --green
  warning:      '#F59E0B',  // --warning
  danger:       '#FB7185',  // --danger
  gold:         '#FBBF24',  // --gold
  silver:       '#CBD5E1',  // --silver
  bronze:       '#D97706',  // --bronze
  platinum:     '#E2E8F0',  // --platinum

  // Text hierarchy
  textPrimary:   '#FFFFFF',  // --t-1
  textSecondary: '#C7CADC',  // --t-2
  textMuted:     '#7A7E9C',  // --t-3
  textFaint:     '#44475F',  // --t-4

  // Categories
  categoryFood:      '#4ADE80',
  categoryTransport: '#A78BFA',
  categoryHome:      '#F59E0B',
  categoryOther:     '#F472B6',

  // Achievement tiers
  tierBronze:   '#D97706',
  tierSilver:   '#CBD5E1',
  tierGold:     '#FBBF24',
  tierPlatinum: '#E2E8F0',
  tierLegend:   '#F472B6',
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
  sm:   12,   // --r-sm
  md:   18,   // --r-md
  lg:   22,   // --r-lg
  xl:   30,   // --r-xl
  full: 999,  // --r-pill
};

export const Layout = {
  tabBarHeight:    64,
  tabBarBottomMargin: 20,
  tabBarClearance: 110,
};

export const Shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 8,
  },
};

// Liquid Glass surface recipe — exact values from styles.css
export const Glass = {
  surface:       'rgba(255,255,255,0.025)',  // --surface
  surfaceMid:    'rgba(255,255,255,0.045)',  // .card.elev
  surface2:      'rgba(255,255,255,0.06)',   // --surface-2
  elev:          'rgba(255,255,255,0.08)',   // --elev
  border:        'rgba(255,255,255,0.08)',   // --border
  borderStrong:  'rgba(255,255,255,0.14)',   // --border-2
  borderBright:  'rgba(255,255,255,0.22)',   // --border-3
  highlight:     'rgba(255,255,255,0.10)',   // inset top shine
  shadow:        'rgba(0,0,0,0.55)',
};

// Holographic blob colors for screen backgrounds
export const Holo = {
  blob1: 'rgba(34,211,238,0.18)',   // cyan top-right
  blob2: 'rgba(167,139,250,0.14)',  // purple center
  blob3: 'rgba(232,121,249,0.14)',  // magenta bottom-right
};
