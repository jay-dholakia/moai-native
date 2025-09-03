import React from 'react';
import { View } from 'react-native';
import * as LucideIcons from 'lucide-react-native';

interface LucideIconProps {
  name: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: any;
}

/**
 * Wrapper component for Lucide React Native icons
 * Ensures compatibility with latest React Native version
 */
export function LucideIcon({ 
  name, 
  size = 24, 
  color = '#000000', 
  strokeWidth = 2,
  style 
}: LucideIconProps) {
  // Convert icon name to PascalCase for component lookup
  const iconName = name
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
  
  const IconComponent = (LucideIcons as any)[iconName];
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" (${iconName}) not found in lucide-react-native`);
    // Return a placeholder
    return (
      <View 
        style={[
          { width: size, height: size, backgroundColor: '#e0e0e0', borderRadius: size / 2 },
          style
        ]} 
      />
    );
  }
  
  return (
    <IconComponent 
      size={size} 
      color={color} 
      strokeWidth={strokeWidth}
      style={style}
    />
  );
}

// Export common icon names for TypeScript autocomplete
export type LucideIconName = keyof typeof LucideIcons;