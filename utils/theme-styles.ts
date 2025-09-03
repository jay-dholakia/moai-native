import { StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Colors } from '@/constants/Tokens';

// Theme type
export type Theme = 'light' | 'dark';

// Helper to get themed colors
export const getThemeColors = (theme: Theme) => {
  return theme === 'light' ? Colors.light : Colors.dark;
};

// Create a simple, type-safe styling system
export const createStyles = (theme: Theme) => {
  const colors = getThemeColors(theme);
  
  return StyleSheet.create({
    // Layout styles
    flex1: { flex: 1 } as ViewStyle,
    flexRow: { flexDirection: 'row' } as ViewStyle,
    flexCol: { flexDirection: 'column' } as ViewStyle,
    itemsCenter: { alignItems: 'center' } as ViewStyle,
    itemsStart: { alignItems: 'flex-start' } as ViewStyle,
    itemsEnd: { alignItems: 'flex-end' } as ViewStyle,
    justifyCenter: { justifyContent: 'center' } as ViewStyle,
    justifyStart: { justifyContent: 'flex-start' } as ViewStyle,
    justifyEnd: { justifyContent: 'flex-end' } as ViewStyle,
    justifyBetween: { justifyContent: 'space-between' } as ViewStyle,
    
    // Backgrounds
    bgBackground: { backgroundColor: colors.background } as ViewStyle,
    bgCard: { backgroundColor: colors.card } as ViewStyle,
    bgPrimary: { backgroundColor: colors.primary } as ViewStyle,
    bgSecondary: { backgroundColor: colors.secondary } as ViewStyle,
    bgMuted: { backgroundColor: colors.muted } as ViewStyle,
    bgDestructive: { backgroundColor: colors.destructive } as ViewStyle,
    
    // Text colors
    textForeground: { color: colors.foreground } as TextStyle,
    textMuted: { color: colors.mutedForeground } as TextStyle,
    textPrimary: { color: colors.primary } as TextStyle,
    textSecondary: { color: colors.secondary } as TextStyle,
    textDestructive: { color: colors.destructive } as TextStyle,
    textPrimaryForeground: { color: colors.primaryForeground } as TextStyle,
    textSecondaryForeground: { color: colors.secondaryForeground } as TextStyle,
    textDestructiveForeground: { color: colors.destructiveForeground } as TextStyle,
    
    // Typography
    textXs: { fontSize: 12 } as TextStyle,
    textSm: { fontSize: 14 } as TextStyle,
    textBase: { fontSize: 16 } as TextStyle,
    textLg: { fontSize: 18 } as TextStyle,
    textXl: { fontSize: 20 } as TextStyle,
    text2Xl: { fontSize: 24 } as TextStyle,
    text3Xl: { fontSize: 30 } as TextStyle,
    
    // Font weights
    fontLight: { fontWeight: '300' } as TextStyle,
    fontNormal: { fontWeight: '400' } as TextStyle,
    fontMedium: { fontWeight: '500' } as TextStyle,
    fontSemibold: { fontWeight: '600' } as TextStyle,
    fontBold: { fontWeight: '700' } as TextStyle,
    
    // Text alignment
    textCenter: { textAlign: 'center' } as TextStyle,
    textLeft: { textAlign: 'left' } as TextStyle,
    textRight: { textAlign: 'right' } as TextStyle,
    
    // Spacing
    p0: { padding: 0 } as ViewStyle,
    p1: { padding: 4 } as ViewStyle,
    p2: { padding: 8 } as ViewStyle,
    p3: { padding: 12 } as ViewStyle,
    p4: { padding: 16 } as ViewStyle,
    p5: { padding: 20 } as ViewStyle,
    p6: { padding: 24 } as ViewStyle,
    p8: { padding: 32 } as ViewStyle,
    
    px2: { paddingHorizontal: 8 } as ViewStyle,
    px3: { paddingHorizontal: 12 } as ViewStyle,
    px4: { paddingHorizontal: 16 } as ViewStyle,
    px6: { paddingHorizontal: 24 } as ViewStyle,
    
    py2: { paddingVertical: 8 } as ViewStyle,
    py3: { paddingVertical: 12 } as ViewStyle,
    py4: { paddingVertical: 16 } as ViewStyle,
    py6: { paddingVertical: 24 } as ViewStyle,
    py8: { paddingVertical: 32 } as ViewStyle,
    py12: { paddingVertical: 48 } as ViewStyle,
    
    m0: { margin: 0 } as ViewStyle,
    m1: { margin: 4 } as ViewStyle,
    m2: { margin: 8 } as ViewStyle,
    m3: { margin: 12 } as ViewStyle,
    m4: { margin: 16 } as ViewStyle,
    m6: { margin: 24 } as ViewStyle,
    m8: { margin: 32 } as ViewStyle,
    
    mt1: { marginTop: 4 } as ViewStyle,
    mt2: { marginTop: 8 },
    mt4: { marginTop: 16 },
    mt6: { marginTop: 24 } as ViewStyle,
    mt8: { marginTop: 32 } as ViewStyle,
    
    mb1: { marginBottom: 4 } as ViewStyle,
    mb2: { marginBottom: 8 },
    mb3: { marginBottom: 12 } as ViewStyle,
    mb4: { marginBottom: 16 },
    mb6: { marginBottom: 24 } as ViewStyle,
    mb8: { marginBottom: 32 } as ViewStyle,
    
    // Borders
    rounded: { borderRadius: 6 } as ViewStyle,
    roundedMd: { borderRadius: 8 } as ViewStyle,
    roundedLg: { borderRadius: 12 } as ViewStyle,
    roundedXl: { borderRadius: 16 } as ViewStyle,
    roundedFull: { borderRadius: 9999 } as ViewStyle,
    
    border: { 
      borderWidth: 1, 
      borderColor: colors.border 
    } as ViewStyle,
    
    // Shadows
    shadowSm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    } as ViewStyle,
    
    shadowMd: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 3,
    } as ViewStyle,
    
    // Dimensions
    wFull: { width: '100%' } as ViewStyle,
    hFull: { height: '100%' } as ViewStyle,
    
    // Common component styles
    button: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 6,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 44,
    } as ViewStyle,
    
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 6,
      paddingHorizontal: 12,
      paddingVertical: 12,
      backgroundColor: colors.background,
      color: colors.foreground,
      fontSize: 16,
      minHeight: 44,
    },
    
    card: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
      borderWidth: 1,
      borderColor: colors.border,
    } as ViewStyle,
  });
};

// Export commonly used spacing values
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 48,
} as const;