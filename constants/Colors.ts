/**
 * Colors for the Moai app that integrate with our custom design system.
 * These extend the main design tokens from @/constants/Tokens.ts
 */

import { Colors as DesignTokens } from './Tokens';

const tintColorLight = DesignTokens.moai.teal;
const tintColorDark = DesignTokens.moai.teal;

export const Colors = {
  light: {
    text: DesignTokens.light.foreground,
    background: DesignTokens.light.background,
    tint: tintColorLight,
    icon: DesignTokens.light.mutedForeground,
    tabIconDefault: DesignTokens.light.mutedForeground,
    tabIconSelected: tintColorLight,
    // Additional Moai-specific colors
    primary: DesignTokens.moai.teal,
    secondary: DesignTokens.moai.coral,
    accent: DesignTokens.moai.purple,
    card: DesignTokens.light.card,
    border: DesignTokens.light.border,
    muted: DesignTokens.light.muted,
  },
  dark: {
    text: DesignTokens.dark.foreground,
    background: DesignTokens.dark.background,
    tint: tintColorDark,
    icon: DesignTokens.dark.mutedForeground,
    tabIconDefault: DesignTokens.dark.mutedForeground,
    tabIconSelected: tintColorDark,
    // Additional Moai-specific colors
    primary: DesignTokens.moai.teal,
    secondary: DesignTokens.moai.coral,
    accent: DesignTokens.moai.purple,
    card: DesignTokens.dark.card,
    border: DesignTokens.dark.border,
    muted: DesignTokens.dark.muted,
  },
};
