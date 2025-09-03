// React Native font configuration for Instagram-inspired fonts
import { Platform } from 'react-native';

// Platform-specific font families (Instagram uses these)
export const PlatformFonts = {
  ios: {
    primary: 'SF Pro Text',      // Instagram's primary font on iOS
    display: 'SF Pro Display',   // For larger text and headings
    mono: 'SF Mono',            // For technical text
  },
  android: {
    primary: 'Roboto',          // Instagram's primary font on Android
    display: 'Roboto',          // For larger text and headings
    mono: 'RobotoMono-Regular', // For technical text
  },
  fallback: {
    primary: 'System',          // System fallback
    display: 'System',          // System fallback
    mono: 'monospace',          // Monospace fallback
  }
};

// Get the appropriate font family for the current platform
export const getCurrentPlatformFont = (type: 'primary' | 'display' | 'mono' = 'primary') => {
  if (Platform.OS === 'ios') {
    return PlatformFonts.ios[type];
  } else if (Platform.OS === 'android') {
    return PlatformFonts.android[type];
  } else {
    return PlatformFonts.fallback[type];
  }
};

// Instagram-style font configurations for React Native
export const InstagramFontFamily = {
  primary: getCurrentPlatformFont('primary'),
  display: getCurrentPlatformFont('display'),
  mono: getCurrentPlatformFont('mono'),
};

// Text style presets with Instagram-inspired styling
export const InstagramTextStyles = {
  // Display styles (Instagram profile names, app headers)
  displayLarge: {
    fontFamily: InstagramFontFamily.display,
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
    letterSpacing: -0.02,
  },
  displayMedium: {
    fontFamily: InstagramFontFamily.display,
    fontSize: 28,
    fontWeight: '600' as const,
    lineHeight: 36,
    letterSpacing: -0.01,
  },
  displaySmall: {
    fontFamily: InstagramFontFamily.display,
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
    letterSpacing: 0,
  },

  // Headline styles (Instagram section headers)
  headlineLarge: {
    fontFamily: InstagramFontFamily.primary,
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
    letterSpacing: 0,
  },
  headlineMedium: {
    fontFamily: InstagramFontFamily.primary,
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
    letterSpacing: 0,
  },
  headlineSmall: {
    fontFamily: InstagramFontFamily.primary,
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 22,
    letterSpacing: 0,
  },

  // Body styles (Instagram post text, descriptions)
  bodyLarge: {
    fontFamily: InstagramFontFamily.primary,
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
    letterSpacing: 0,
  },
  bodyMedium: {
    fontFamily: InstagramFontFamily.primary,
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
    letterSpacing: 0,
  },
  bodySmall: {
    fontFamily: InstagramFontFamily.primary,
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
    letterSpacing: 0,
  },

  // Label styles (Instagram buttons, navigation)
  labelLarge: {
    fontFamily: InstagramFontFamily.primary,
    fontSize: 14,
    fontWeight: '600' as const,
    lineHeight: 20,
    letterSpacing: 0,
  },
  labelMedium: {
    fontFamily: InstagramFontFamily.primary,
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 16,
    letterSpacing: 0,
  },
  labelSmall: {
    fontFamily: InstagramFontFamily.primary,
    fontSize: 11,
    fontWeight: '500' as const,
    lineHeight: 16,
    letterSpacing: 0,
  },

  // Caption styles (Instagram timestamps, secondary info)
  caption: {
    fontFamily: InstagramFontFamily.primary,
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
    letterSpacing: 0,
  },
  overline: {
    fontFamily: InstagramFontFamily.primary,
    fontSize: 10,
    fontWeight: '500' as const,
    lineHeight: 16,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
};

// Instagram-style button text configurations
export const InstagramButtonStyles = {
  primary: {
    fontFamily: InstagramFontFamily.primary,
    fontSize: 14,
    fontWeight: '600' as const,
    lineHeight: 20,
    letterSpacing: 0,
  },
  secondary: {
    fontFamily: InstagramFontFamily.primary,
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 20,
    letterSpacing: 0,
  },
  small: {
    fontFamily: InstagramFontFamily.primary,
    fontSize: 12,
    fontWeight: '600' as const,
    lineHeight: 16,
    letterSpacing: 0,
  },
};

// Instagram-style input text configurations
export const InstagramInputStyles = {
  default: {
    fontFamily: InstagramFontFamily.primary,
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
    letterSpacing: 0,
  },
  placeholder: {
    fontFamily: InstagramFontFamily.primary,
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
    letterSpacing: 0,
  },
};

// Export common configurations for easy access
export const InstagramFonts = {
  family: InstagramFontFamily,
  text: InstagramTextStyles,
  button: InstagramButtonStyles,
  input: InstagramInputStyles,
};