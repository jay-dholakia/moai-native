import { StyleSheet, ViewStyle, TextStyle, ImageStyle, Dimensions } from 'react-native';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, LineHeight, Shadows } from '@/constants/Tokens';

// Fix type definitions for better compatibility
type StyleProp = ViewStyle | TextStyle | ImageStyle;
type StyleArray = (StyleProp | undefined | null | false)[];

// Get device dimensions
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Theme context type
export type Theme = 'light' | 'dark';

// Helper to get themed colors
export const getThemeColors = (theme: Theme) => {
  return theme === 'light' ? Colors.light : Colors.dark;
};

// Utility functions that replicate Tailwind classes

// SPACING UTILITIES
export const spacing = {
  // Padding utilities
  p: (value: keyof typeof Spacing): ViewStyle => ({ padding: Spacing[value] }),
  px: (value: keyof typeof Spacing): ViewStyle => ({ paddingHorizontal: Spacing[value] }),
  py: (value: keyof typeof Spacing): ViewStyle => ({ paddingVertical: Spacing[value] }),
  pt: (value: keyof typeof Spacing): ViewStyle => ({ paddingTop: Spacing[value] }),
  pr: (value: keyof typeof Spacing): ViewStyle => ({ paddingRight: Spacing[value] }),
  pb: (value: keyof typeof Spacing): ViewStyle => ({ paddingBottom: Spacing[value] }),
  pl: (value: keyof typeof Spacing): ViewStyle => ({ paddingLeft: Spacing[value] }),
  
  // Margin utilities
  m: (value: keyof typeof Spacing): ViewStyle => ({ margin: Spacing[value] }),
  mx: (value: keyof typeof Spacing): ViewStyle => ({ marginHorizontal: Spacing[value] }),
  my: (value: keyof typeof Spacing): ViewStyle => ({ marginVertical: Spacing[value] }),
  mt: (value: keyof typeof Spacing): ViewStyle => ({ marginTop: Spacing[value] }),
  mr: (value: keyof typeof Spacing): ViewStyle => ({ marginRight: Spacing[value] }),
  mb: (value: keyof typeof Spacing): ViewStyle => ({ marginBottom: Spacing[value] }),
  ml: (value: keyof typeof Spacing): ViewStyle => ({ marginLeft: Spacing[value] }),
  
  // Gap utilities (for flexbox)
  gap: (value: keyof typeof Spacing): ViewStyle => ({ gap: Spacing[value] }),
  
  // Height utilities (for spacing elements)
  h: (value: keyof typeof Spacing): ViewStyle => ({ height: Spacing[value] }),
  
  // Width utilities
  w: (value: keyof typeof Spacing): ViewStyle => ({ width: Spacing[value] }),
  
  // Full width/height
  full: { width: '100%', height: '100%' } as ViewStyle,
  
  // Position utilities
  absolute: { position: 'absolute' } as ViewStyle,
};

// LAYOUT UTILITIES
export const layout = {
  // Flexbox
  flex1: { flex: 1 } as ViewStyle,
  flex2: { flex: 2 } as ViewStyle,
  flexRow: { flexDirection: 'row' } as ViewStyle,
  flexCol: { flexDirection: 'column' } as ViewStyle,
  itemsCenter: { alignItems: 'center' } as ViewStyle,
  itemsStart: { alignItems: 'flex-start' } as ViewStyle,
  itemsEnd: { alignItems: 'flex-end' } as ViewStyle,
  itemsStretch: { alignItems: 'stretch' } as ViewStyle,
  justifyCenter: { justifyContent: 'center' } as ViewStyle,
  justifyStart: { justifyContent: 'flex-start' } as ViewStyle,
  justifyEnd: { justifyContent: 'flex-end' } as ViewStyle,
  justifyBetween: { justifyContent: 'space-between' } as ViewStyle,
  justifyAround: { justifyContent: 'space-around' } as ViewStyle,
  justifyEvenly: { justifyContent: 'space-evenly' } as ViewStyle,
  itemsBetween: { justifyContent: 'space-between', alignItems: 'center' } as ViewStyle,
  selfCenter: { alignSelf: 'center' } as ViewStyle,
  selfStart: { alignSelf: 'flex-start' } as ViewStyle,
  selfEnd: { alignSelf: 'flex-end' } as ViewStyle,
  selfStretch: { alignSelf: 'stretch' } as ViewStyle,
  
  // Wrap
  flexWrap: { flexWrap: 'wrap' } as ViewStyle,
  flexNoWrap: { flexWrap: 'nowrap' } as ViewStyle,
  
  // Position
  absolute: { position: 'absolute' } as ViewStyle,
  relative: { position: 'relative' } as ViewStyle,
  absoluteFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  } as ViewStyle,
  
  // Position values
  top3: { top: Spacing[3] } as ViewStyle,
  right3: { right: Spacing[3] } as ViewStyle,
  bottom3: { bottom: Spacing[3] } as ViewStyle,
  left3: { left: Spacing[3] } as ViewStyle,
  top: (value: number | string): ViewStyle => ({ top: value as any }),
  right: (value: number | string): ViewStyle => ({ right: value as any }),
  bottom: (value: number | string): ViewStyle => ({ bottom: value as any }),
  left: (value: number | string): ViewStyle => ({ left: value as any }),
  zIndex: (value: number): ViewStyle => ({ zIndex: value }),
  inset: (value: number): ViewStyle => ({ top: value, right: value, bottom: value, left: value }),
  
  // Transform utilities
  transform: { transform: [] } as ViewStyle,
  
  // Dimensions
  wFull: { width: '100%' } as ViewStyle,
  hFull: { height: '100%' } as ViewStyle,
  wScreen: { width: screenWidth } as ViewStyle,
  hScreen: { height: screenHeight } as ViewStyle,
  
  // Custom width/height functions
  w: (value: number | string): ViewStyle => ({ width: value as any }),
  h: (value: number | string): ViewStyle => ({ height: value as any }),
  minW: (value: number | string): ViewStyle => ({ minWidth: value as any }),
  minH: (value: number | string): ViewStyle => ({ minHeight: value as any }),
  maxW: (value: number | string): ViewStyle => ({ maxWidth: value as any }),
  maxH: (value: number | string): ViewStyle => ({ maxHeight: value as any }),
  
  // Line height utilities
  leading6: { lineHeight: 24 } as ViewStyle,
};

// BORDER UTILITIES
export const border = {
  // Border radius
  rounded: { borderRadius: BorderRadius.md } as ViewStyle,
  roundedSm: { borderRadius: BorderRadius.sm } as ViewStyle,
  roundedLg: { borderRadius: BorderRadius.lg } as ViewStyle,
  roundedXl: { borderRadius: BorderRadius.xl } as ViewStyle,
  rounded2Xl: { borderRadius: BorderRadius['2xl'] } as ViewStyle,
  rounded3Xl: { borderRadius: BorderRadius['3xl'] } as ViewStyle,
  roundedFull: { borderRadius: BorderRadius.full } as ViewStyle,
  roundedTop: { borderTopLeftRadius: BorderRadius.md, borderTopRightRadius: BorderRadius.md } as ViewStyle,
  roundedT: { borderTopLeftRadius: BorderRadius.md, borderTopRightRadius: BorderRadius.md } as ViewStyle,
  roundedBottom: { borderBottomLeftRadius: BorderRadius.md, borderBottomRightRadius: BorderRadius.md } as ViewStyle,
  
  // Border width
  border: { borderWidth: 1 } as ViewStyle,
  border2: { borderWidth: 2 } as ViewStyle,
  border4: { borderWidth: 4 } as ViewStyle,
  borderT: { borderTopWidth: 1 } as ViewStyle,
  borderR: { borderRightWidth: 1 } as ViewStyle,
  borderB: { borderBottomWidth: 1 } as ViewStyle,
  borderL: { borderLeftWidth: 1 } as ViewStyle,
  
  // Border color functions
  borderColor: (color: string): ViewStyle => ({ borderColor: color }),
};

// BACKGROUND UTILITIES
export const bg = {
  transparent: { backgroundColor: 'transparent' } as ViewStyle,
  white: { backgroundColor: Colors.light.card } as ViewStyle,
  black: { backgroundColor: Colors.dark.card } as ViewStyle,
  
  // Themed background functions
  primary: (theme: Theme): ViewStyle => ({ backgroundColor: getThemeColors(theme).primary }),
  secondary: (theme: Theme): ViewStyle => ({ backgroundColor: getThemeColors(theme).secondary }),
  muted: (theme: Theme): ViewStyle => ({ backgroundColor: getThemeColors(theme).muted }),
  accent: (theme: Theme): ViewStyle => ({ backgroundColor: getThemeColors(theme).accent }),
  background: (theme: Theme): ViewStyle => ({ backgroundColor: getThemeColors(theme).background }),
  card: (theme: Theme): ViewStyle => ({ backgroundColor: getThemeColors(theme).card }),
  
  // Brand colors
  moaiTeal: { backgroundColor: Colors.moai.teal } as ViewStyle,
  moaiCoral: { backgroundColor: Colors.moai.coral } as ViewStyle,
  moaiPurple: { backgroundColor: Colors.moai.purple } as ViewStyle,
  
  // Status colors
  success: { backgroundColor: Colors.light.success } as ViewStyle,
  warning: { backgroundColor: Colors.light.warning } as ViewStyle,
  error: { backgroundColor: Colors.light.error } as ViewStyle,
  info: { backgroundColor: Colors.light.info } as ViewStyle,
  
  // Custom color function
  color: (color: string): ViewStyle => ({ backgroundColor: color }),
};

// TEXT UTILITIES
export const text = {
  // Font sizes
  xs: { fontSize: FontSize.xs } as TextStyle,
  sm: { fontSize: FontSize.sm } as TextStyle,
  base: { fontSize: FontSize.base } as TextStyle,
  lg: { fontSize: FontSize.lg } as TextStyle,
  xl: { fontSize: FontSize.xl } as TextStyle,
  '2xl': { fontSize: FontSize['2xl'] } as TextStyle,
  '3xl': { fontSize: FontSize['3xl'] } as TextStyle,
  '4xl': { fontSize: FontSize['4xl'] } as TextStyle,
  '5xl': { fontSize: FontSize['5xl'] } as TextStyle,
  '6xl': { fontSize: 48 } as TextStyle,
  
  // Font weights
  thin: { fontWeight: FontWeight.thin } as TextStyle,
  light: { fontWeight: FontWeight.light } as TextStyle,
  normal: { fontWeight: FontWeight.normal } as TextStyle,
  medium: { fontWeight: FontWeight.medium } as TextStyle,
  semibold: { fontWeight: FontWeight.semibold } as TextStyle,
  bold: { fontWeight: FontWeight.bold } as TextStyle,
  extrabold: { fontWeight: FontWeight.extrabold } as TextStyle,
  
  // Text alignment
  left: { textAlign: 'left' } as TextStyle,
  center: { textAlign: 'center' } as TextStyle,
  right: { textAlign: 'right' } as TextStyle,
  justify: { textAlign: 'justify' } as TextStyle,
  
  // Line height
  tight: { lineHeight: FontSize.base * LineHeight.tight } as TextStyle,
  leading: { lineHeight: FontSize.base * LineHeight.normal } as TextStyle,
  relaxed: { lineHeight: FontSize.base * LineHeight.relaxed } as TextStyle,
  
  // Text transformation
  uppercase: { textTransform: 'uppercase' } as TextStyle,
  lowercase: { textTransform: 'lowercase' } as TextStyle,
  capitalize: { textTransform: 'capitalize' } as TextStyle,
  
  // Text colors (themed)
  primary: (theme: Theme): TextStyle => ({ color: getThemeColors(theme).primary }),
  secondary: (theme: Theme): TextStyle => ({ color: getThemeColors(theme).secondary }),
  muted: (theme: Theme): TextStyle => ({ color: getThemeColors(theme).mutedForeground }),
  foreground: (theme: Theme): TextStyle => ({ color: getThemeColors(theme).foreground }),
  accent: (theme: Theme): TextStyle => ({ color: getThemeColors(theme).accent }),
  destructive: (theme: Theme): TextStyle => ({ color: getThemeColors(theme).destructive }),
  
  // Brand text colors
  moaiTeal: { color: Colors.moai.teal } as TextStyle,
  moaiCoral: { color: Colors.moai.coral } as TextStyle,
  moaiPurple: { color: Colors.moai.purple } as TextStyle,
  
  // Custom color function
  color: (color: string): TextStyle => ({ color }),
};

// SHADOW UTILITIES
export const shadow = {
  sm: Shadows.sm,
  md: Shadows.md,
  lg: Shadows.lg,
  xl: Shadows.xl,
  '2xl': Shadows['2xl'],
  none: { elevation: 0, shadowOpacity: 0 } as ViewStyle,
};

// COMMON COMPONENT STYLES
export const components = {
  // Card styles (replicating .moai-card from web)
  card: (theme: Theme): ViewStyle => ({
    ...bg.card(theme),
    ...border.roundedXl,
    ...shadow.md,
    ...spacing.p(4),
  }),
  
  // Button base styles
  button: {
    base: {
      ...layout.itemsCenter,
      ...layout.justifyCenter,
      ...spacing.px(4),
      ...spacing.py(3),
      ...border.rounded,
      minHeight: 44, // Accessibility guideline for touch targets
    } as ViewStyle,
    
    sm: {
      ...spacing.px(3),
      ...spacing.py(2),
      minHeight: 36,
    } as ViewStyle,
    
    lg: {
      ...spacing.px(6),
      ...spacing.py(4),
      minHeight: 52,
    } as ViewStyle,
  },
  
  // Input styles
  input: (theme: Theme): ViewStyle => ({
    ...border.border,
    ...border.rounded,
    ...spacing.px(3),
    ...spacing.py(3),
    ...bg.background(theme),
    borderColor: getThemeColors(theme).border,
    minHeight: 44,
  }),
  
  // Container styles
  container: {
    base: {
      ...layout.flex1,
      ...spacing.px(4),
      maxWidth: 1280, // 2xl breakpoint
    } as ViewStyle,
    
    centered: {
      ...layout.flex1,
      ...layout.itemsCenter,
      ...layout.justifyCenter,
      ...spacing.px(4),
    } as ViewStyle,
  },
};

// RESPONSIVE UTILITIES
export const responsive = {
  // Check if screen is small
  isSmall: screenWidth < 640,
  isMedium: screenWidth >= 640 && screenWidth < 1024,
  isLarge: screenWidth >= 1024,
  
  // Responsive padding
  px: {
    sm: screenWidth < 640 ? spacing.px(2) : spacing.px(4),
    base: screenWidth < 640 ? spacing.px(4) : spacing.px(6),
  },
};

// UTILITY FUNCTION TO COMBINE STYLES
export const tw = (...styles: (any | false | undefined | null)[]): any => {
  return styles.filter(Boolean).reduce((acc, style) => ({ ...acc, ...style }), {});
};

// Common style combinations
export const commonStyles = StyleSheet.create({
  row: {
    ...layout.flexRow,
    ...layout.itemsCenter,
  },
  
  rowBetween: {
    ...layout.flexRow,
    ...layout.itemsCenter,
    ...layout.justifyBetween,
  },
  
  center: {
    ...layout.itemsCenter,
    ...layout.justifyCenter,
  },
  
  absoluteFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  
  safeArea: {
    ...layout.flex1,
  },
});