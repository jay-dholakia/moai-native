// Instagram-inspired design tokens for Moai Native
// Based on Instagram's clean, minimal aesthetic with vibrant accent colors

export const InstagramColors = {
  // Instagram brand colors - clean and minimal
  moai: {
    teal: '#00D9FF', // Bright, vibrant teal (Instagram story ring style)
    coral: '#FF3040', // Instagram-like coral/red
    purple: '#833AB4', // Instagram gradient purple
    pink: '#FD1D1D', // Instagram gradient pink
    orange: '#F77737', // Instagram gradient orange
    yellow: '#FCAF45', // Instagram gradient yellow
  },
  
  // Light theme (Instagram's default clean look)
  light: {
    background: '#FFFFFF', // Pure white background
    foreground: '#262626', // Instagram's text color
    card: '#FFFFFF',
    cardForeground: '#262626',
    popover: '#FFFFFF',
    popoverForeground: '#262626',
    primary: '#0095F6', // Instagram's signature blue
    primaryForeground: '#FFFFFF',
    secondary: '#EFEFEF', // Instagram's light gray
    secondaryForeground: '#262626',
    muted: '#FAFAFA', // Very light gray background
    mutedForeground: '#8E8E8E', // Instagram's secondary text color
    accent: '#833AB4', // Instagram purple
    accentForeground: '#FFFFFF',
    destructive: '#ED4956', // Instagram's red
    destructiveForeground: '#FFFFFF',
    border: '#DBDBDB', // Instagram's border color
    input: '#FAFAFA', // Light input background
    ring: '#0095F6',
    success: '#00A652', // Instagram green
    warning: '#FFD600', // Instagram yellow
    info: '#0095F6', // Instagram blue
    error: '#ED4956', // Instagram error color
  },
  
  // Dark theme (Instagram's dark mode)
  dark: {
    background: '#000000', // True black background
    foreground: '#FFFFFF',
    card: '#121212', // Very dark gray
    cardForeground: '#FFFFFF',
    popover: '#121212',
    popoverForeground: '#FFFFFF',
    primary: '#0095F6', // Same Instagram blue
    primaryForeground: '#FFFFFF',
    secondary: '#1C1C1E', // Dark gray
    secondaryForeground: '#FFFFFF',
    muted: '#1C1C1E',
    mutedForeground: '#8E8E8E', // Same secondary text
    accent: '#833AB4',
    accentForeground: '#FFFFFF',
    destructive: '#FF3040',
    destructiveForeground: '#FFFFFF',
    border: '#262626', // Dark border
    input: '#1C1C1E',
    ring: '#0095F6',
    success: '#00A652',
    warning: '#FFD600',
    info: '#0095F6',
    error: '#FF3040', // Instagram error color for dark mode
  },
  
  // Instagram gradient colors for special elements
  gradients: {
    story: ['#833AB4', '#FD1D1D', '#F77737', '#FCAF45'], // Instagram story gradient
    button: ['#405DE6', '#5851DB', '#833AB4', '#C13584', '#E1306C', '#FD1D1D'], // Instagram button gradient
    accent: ['#0095F6', '#00D9FF'], // Blue to cyan
    warm: ['#F77737', '#FCAF45'], // Orange to yellow
    cool: ['#405DE6', '#833AB4'], // Blue to purple
  },
  
  // Status and feedback colors (Instagram style)
  status: {
    online: '#00A652', // Green dot for online status
    away: '#FFD600', // Yellow for away
    busy: '#FF3040', // Red for busy
    offline: '#8E8E8E', // Gray for offline
  },
  
  // Interaction states
  interactive: {
    like: '#FF3040', // Instagram heart red
    likeActive: '#FF3040',
    save: '#262626',
    saveActive: '#262626',
    share: '#262626',
    comment: '#262626',
    follow: '#0095F6',
    following: '#EFEFEF',
  }
};

// Instagram-inspired spacing system
export const InstagramSpacing = {
  0: 0,
  1: 2,   // Very tight spacing
  2: 4,   // Tight spacing
  3: 8,   // Small spacing
  4: 12,  // Base spacing
  5: 16,  // Medium spacing - Instagram's standard
  6: 20,  // Large spacing
  7: 24,  // Extra large spacing
  8: 32,  // Section spacing
  9: 40,  // Large section spacing
  10: 48, // Extra large section spacing
  11: 56, // Touch target spacing
  12: 64, // Major section spacing
  16: 80,
  20: 100,
  24: 120,
  28: 140,
  32: 160,
};

// Instagram-style spacing patterns
export const InstagramLayout = {
  // Screen padding
  screenPadding: InstagramSpacing[5], // 16px - Instagram standard
  screenPaddingLarge: InstagramSpacing[6], // 20px
  
  // Card and component spacing
  cardPadding: InstagramSpacing[5], // 16px
  cardMargin: InstagramSpacing[4], // 12px
  cardGap: InstagramSpacing[3], // 8px
  
  // Content spacing
  contentGap: InstagramSpacing[4], // 12px
  sectionGap: InstagramSpacing[7], // 24px
  elementGap: InstagramSpacing[3], // 8px
  elementGapSmall: InstagramSpacing[2], // 4px
  
  // Touch targets (Instagram style)
  minTouchTarget: 44, // Instagram's minimum touch target
  iconSize: {
    xs: 16,
    sm: 20,
    md: 24, // Instagram standard icon size
    lg: 32,
    xl: 40,
  },
  
  // Avatar sizes (Instagram style)
  avatar: {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 56, // Instagram profile picture size
    xl: 80,
    story: 66, // Instagram story ring size
  }
};

// Instagram-inspired typography
export const InstagramTypography = {
  // Font families (we'll configure these for React Native)
  fontFamily: {
    primary: 'SF Pro Text', // iOS system font (Instagram uses this on iOS)
    secondary: 'Roboto', // Android system font
    display: 'SF Pro Display', // For larger text
    mono: 'SF Mono', // For code/technical text
  },
  
  // Font sizes (Instagram's scale)
  fontSize: {
    xs: 11,   // Very small text
    sm: 12,   // Small text, captions
    base: 14, // Instagram's base font size
    md: 16,   // Medium text
    lg: 18,   // Large text
    xl: 20,   // Extra large text
    '2xl': 24, // Headings
    '3xl': 28, // Large headings
    '4xl': 32, // Extra large headings
    '5xl': 40, // Display text
  },
  
  // Font weights (Instagram style)
  fontWeight: {
    thin: '100',
    extralight: '200', 
    light: '300',
    normal: '400',     // Instagram's default weight (mapped from regular)
    regular: '400',    // Instagram's default weight
    medium: '500',     // Instagram's medium weight
    semibold: '600',   // Instagram's semibold
    bold: '700',       // Instagram's bold
    extrabold: '800',  // For emphasis (mapped from heavy)
    heavy: '800',      // For emphasis
    black: '900',      // Heaviest weight
  } as const,
  
  // Line heights (Instagram's spacing)
  lineHeight: {
    tight: 1.2,
    snug: 1.3,
    normal: 1.4, // Instagram's standard line height
    relaxed: 1.5,
    loose: 1.6,
  },
  
  // Letter spacing (Instagram style)
  letterSpacing: {
    tight: -0.02,
    normal: 0,
    wide: 0.02,
    wider: 0.04,
  }
};

// Instagram-style component presets
export const InstagramComponents = {
  // Button styles (Instagram inspired)
  button: {
    primary: {
      backgroundColor: InstagramColors.light.primary,
      color: InstagramColors.light.primaryForeground,
      borderRadius: 8,
      paddingVertical: InstagramSpacing[4],
      paddingHorizontal: InstagramSpacing[6],
      fontSize: InstagramTypography.fontSize.base,
      fontWeight: InstagramTypography.fontWeight.semibold,
    },
    secondary: {
      backgroundColor: InstagramColors.light.secondary,
      color: InstagramColors.light.foreground,
      borderRadius: 8,
      paddingVertical: InstagramSpacing[4],
      paddingHorizontal: InstagramSpacing[6],
      fontSize: InstagramTypography.fontSize.base,
      fontWeight: InstagramTypography.fontWeight.semibold,
    },
    ghost: {
      backgroundColor: 'transparent',
      color: InstagramColors.light.primary,
      borderRadius: 8,
      paddingVertical: InstagramSpacing[4],
      paddingHorizontal: InstagramSpacing[6],
      fontSize: InstagramTypography.fontSize.base,
      fontWeight: InstagramTypography.fontWeight.semibold,
    }
  },
  
  // Card styles (Instagram feed style)
  card: {
    default: {
      backgroundColor: InstagramColors.light.card,
      borderRadius: 0, // Instagram uses sharp corners for feed posts
      borderWidth: 0,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    story: {
      backgroundColor: InstagramColors.light.card,
      borderRadius: 12,
      borderWidth: 0,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    }
  },
  
  // Input styles (Instagram inspired)
  input: {
    default: {
      backgroundColor: InstagramColors.light.input,
      borderColor: InstagramColors.light.border,
      borderWidth: 1,
      borderRadius: 6,
      paddingVertical: InstagramSpacing[4],
      paddingHorizontal: InstagramSpacing[4],
      fontSize: InstagramTypography.fontSize.base,
      color: InstagramColors.light.foreground,
    }
  }
};

// Instagram-style shadows and elevation
export const InstagramShadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  '2xl': {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  }
};