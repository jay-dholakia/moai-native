// Reliable icon component using Expo Vector Icons
import React from 'react';
import { Platform } from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5, Feather } from '@expo/vector-icons';
import { SymbolView, SymbolWeight, SymbolViewProps } from 'expo-symbols';

// Type definitions for better TypeScript support
type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];
type MaterialIconsName = React.ComponentProps<typeof MaterialIcons>['name'];
type FontAwesome5Name = React.ComponentProps<typeof FontAwesome5>['name'];
type FeatherName = React.ComponentProps<typeof Feather>['name'];

// Map SF Symbol names to Expo Vector Icons with multiple font families for best coverage
const ICON_MAPPING = {
  // Navigation icons (Instagram-style)
  'house.fill': { family: 'Ionicons' as const, name: 'home' as IoniconsName },
  'person.3.fill': { family: 'Ionicons' as const, name: 'people' as IoniconsName },
  'chart.bar.fill': { family: 'Ionicons' as const, name: 'bar-chart' as IoniconsName },
  'message.fill': { family: 'Ionicons' as const, name: 'chatbubble' as IoniconsName },
  'bell.fill': { family: 'Ionicons' as const, name: 'notifications' as IoniconsName },
  'person.fill': { family: 'Ionicons' as const, name: 'person' as IoniconsName },
  
  // Common action icons
  'paperplane.fill': { family: 'Ionicons' as const, name: 'send' as IoniconsName },
  'plus': { family: 'Ionicons' as const, name: 'add' as IoniconsName },
  'chevron.right': { family: 'Ionicons' as const, name: 'chevron-forward' as IoniconsName },
  'chevron.left': { family: 'Ionicons' as const, name: 'chevron-back' as IoniconsName },
  'chevron.up': { family: 'Ionicons' as const, name: 'chevron-up' as IoniconsName },
  'chevron.down': { family: 'Ionicons' as const, name: 'chevron-down' as IoniconsName },
  
  // Activity and fitness icons
  'figure.run': { family: 'MaterialIcons' as const, name: 'directions-run' as MaterialIconsName },
  'dumbbell': { family: 'FontAwesome5' as const, name: 'dumbbell' as FontAwesome5Name },
  'heart.fill': { family: 'Ionicons' as const, name: 'heart' as IoniconsName },
  'trophy.fill': { family: 'Ionicons' as const, name: 'trophy' as IoniconsName },
  'target': { family: 'Feather' as const, name: 'target' as FeatherName },
  'calendar': { family: 'Ionicons' as const, name: 'calendar' as IoniconsName },
  'flame': { family: 'Ionicons' as const, name: 'flame' as IoniconsName },
  'activity': { family: 'Feather' as const, name: 'activity' as FeatherName },
  
  // Social and interaction icons
  'hand.thumbsup.fill': { family: 'Ionicons' as const, name: 'thumbs-up' as IoniconsName },
  'star.fill': { family: 'Ionicons' as const, name: 'star' as IoniconsName },
  'bookmark.fill': { family: 'Ionicons' as const, name: 'bookmark' as IoniconsName },
  'share': { family: 'Ionicons' as const, name: 'share-social' as IoniconsName },
  'camera.fill': { family: 'Ionicons' as const, name: 'camera' as IoniconsName },
  
  // Settings and profile icons
  'gear': { family: 'Ionicons' as const, name: 'settings' as IoniconsName },
  'lock.fill': { family: 'Ionicons' as const, name: 'lock-closed' as IoniconsName },
  'eye.fill': { family: 'Ionicons' as const, name: 'eye' as IoniconsName },
  'eye.slash.fill': { family: 'Ionicons' as const, name: 'eye-off' as IoniconsName },
  'log-out': { family: 'Feather' as const, name: 'log-out' as FeatherName },
  
  // Development and misc icons
  'chevron.left.forwardslash.chevron.right': { family: 'Ionicons' as const, name: 'code' as IoniconsName },
  'checkmark': { family: 'Ionicons' as const, name: 'checkmark' as IoniconsName },
  'close': { family: 'Ionicons' as const, name: 'close' as IoniconsName },
  'search': { family: 'Ionicons' as const, name: 'search' as IoniconsName },
  'menu': { family: 'Ionicons' as const, name: 'menu' as IoniconsName },
  'ellipsis': { family: 'Ionicons' as const, name: 'ellipsis-horizontal' as IoniconsName },
  
  // Additional Lucide icon mappings
  'users': { family: 'Ionicons' as const, name: 'people' as IoniconsName },
  'filter': { family: 'Ionicons' as const, name: 'filter' as IoniconsName },
  'map-pin': { family: 'Ionicons' as const, name: 'location' as IoniconsName },
  'star': { family: 'Ionicons' as const, name: 'star' as IoniconsName },
  'message-circle': { family: 'Ionicons' as const, name: 'chatbubble' as IoniconsName },
  'hash': { family: 'Ionicons' as const, name: 'hash' as IoniconsName },
  'send': { family: 'Ionicons' as const, name: 'send' as IoniconsName },
  'camera': { family: 'Ionicons' as const, name: 'camera' as IoniconsName },
  'phone': { family: 'Ionicons' as const, name: 'call' as IoniconsName },
  'video': { family: 'Ionicons' as const, name: 'videocam' as IoniconsName },
  'settings': { family: 'Ionicons' as const, name: 'settings' as IoniconsName },
  'zap': { family: 'Ionicons' as const, name: 'flash' as IoniconsName },
  'clock': { family: 'Ionicons' as const, name: 'time' as IoniconsName },
  'user': { family: 'Ionicons' as const, name: 'person' as IoniconsName },
  'sparkles': { family: 'Ionicons' as const, name: 'sparkles' as IoniconsName },
  'arrow-right': { family: 'Ionicons' as const, name: 'arrow-forward' as IoniconsName },
  'arrow-left': { family: 'Ionicons' as const, name: 'arrow-back' as IoniconsName },
  'check': { family: 'Ionicons' as const, name: 'checkmark' as IoniconsName },
  'minus': { family: 'Ionicons' as const, name: 'remove' as IoniconsName },
  'upload': { family: 'Ionicons' as const, name: 'cloud-upload' as IoniconsName },
  'heart': { family: 'Ionicons' as const, name: 'heart' as IoniconsName },
  'skip-forward': { family: 'Ionicons' as const, name: 'play-skip-forward' as IoniconsName },
  'trending-up': { family: 'Ionicons' as const, name: 'trending-up' as IoniconsName },
  'user-plus': { family: 'Ionicons' as const, name: 'person-add' as IoniconsName },
} as const;

export type IconSymbolName = keyof typeof ICON_MAPPING;

interface IconSymbolProps {
  name: IconSymbolName;
  size?: number;
  color?: string;
  style?: any;
  weight?: SymbolWeight;
}

/**
 * Cross-platform icon component using Expo Vector Icons
 * Falls back to SF Symbols on iOS, uses Expo Vector Icons elsewhere
 * Provides consistent Instagram-style icons across all platforms
 */
export function IconSymbol({
  name,
  size = 24,
  color = '#000000',
  style,
  weight = 'regular'
}: IconSymbolProps) {
  // Use Expo Vector Icons for all platforms for consistency
  // This ensures reliable icon display without SF Symbol compatibility issues

  // Use Expo Vector Icons for Android, web, and iOS fallback
  const iconConfig = ICON_MAPPING[name];
  
  if (!iconConfig) {
    console.warn(`Icon '${name}' not found in mapping`);
    return <Ionicons name="help-circle" size={size} color={color} style={style} />;
  }

  const { family, name: iconName } = iconConfig;

  try {
    switch (family) {
      case 'Ionicons':
        return <Ionicons name={iconName as IoniconsName} size={size} color={color} style={style} />;
      case 'MaterialIcons':
        return <MaterialIcons name={iconName as MaterialIconsName} size={size} color={color} style={style} />;
      case 'FontAwesome5':
        return <FontAwesome5 name={iconName as FontAwesome5Name} size={size} color={color} style={style} />;
      case 'Feather':
        return <Feather name={iconName as FeatherName} size={size} color={color} style={style} />;
      default:
        return <Ionicons name="help-circle" size={size} color={color} style={style} />;
    }
  } catch (error) {
    console.warn(`Error rendering icon '${name}':`, error);
    return <Ionicons name="help-circle" size={size} color={color} style={style} />;
  }
}