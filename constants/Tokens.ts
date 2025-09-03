// Instagram-inspired design tokens for Moai Native
// Based on Instagram's clean, minimal aesthetic with vibrant accent colors

import { 
  InstagramColors, 
  InstagramSpacing, 
  InstagramTypography, 
  InstagramLayout, 
  InstagramShadows 
} from './InstagramTheme';

export const Colors = InstagramColors;

// Instagram-inspired spacing system
export const Spacing = InstagramSpacing;

// Instagram-style content spacing patterns
export const ContentSpacing = InstagramLayout;

export const BorderRadius = {
  none: 0,
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  '2xl': 16,
  '3xl': 24,
  full: 9999,
};

// Instagram-inspired typography
export const FontSize = InstagramTypography.fontSize;
export const FontWeight = InstagramTypography.fontWeight;
export const LineHeight = InstagramTypography.lineHeight;
export const FontFamily = InstagramTypography.fontFamily;

// Instagram-style shadows and elevation
export const Shadows = InstagramShadows;

export const Breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

// Animation durations
export const Duration = {
  75: 75,
  100: 100,
  150: 150,
  200: 200,
  300: 300,
  500: 500,
  700: 700,
  1000: 1000,
};

// Z-index values
export const ZIndex = {
  auto: 'auto',
  0: 0,
  10: 10,
  20: 20,
  30: 30,
  40: 40,
  50: 50,
  modal: 1000,
  overlay: 999,
  dropdown: 100,
  tooltip: 200,
};