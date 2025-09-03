import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useTheme } from '@/providers/theme-provider';
import { tw, layout, spacing } from '@/utils/styles';
import { LinearGradient } from 'expo-linear-gradient';

interface MoaiStoryRingProps {
  hasStories: boolean;
  hasViewedStories?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  size?: 'sm' | 'default' | 'lg';
}

export const MoaiStoryRing: React.FC<MoaiStoryRingProps> = ({
  hasStories,
  hasViewedStories = false,
  children,
  onClick,
  disabled = false,
  size = 'default',
}) => {
  const { colors } = useTheme();

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { width: 46, height: 46, padding: 2 };
      case 'lg':
        return { width: 62, height: 62, padding: 3 };
      default:
        return { width: 54, height: 54, padding: 3 };
    }
  };

  const sizeStyles = getSizeStyles();

  const handlePress = () => {
    if (!disabled && onClick) {
      onClick();
    }
  };

  // No ring if no stories
  if (!hasStories) {
    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={0.8}
        style={[
          {
            minWidth: 44,
            minHeight: 44,
          },
          tw(layout.itemsCenter, layout.justifyCenter),
        ]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[
        {
          width: sizeStyles.width,
          height: sizeStyles.height,
          borderRadius: sizeStyles.width / 2,
          minWidth: 44,
          minHeight: 44,
        },
        tw(layout.itemsCenter, layout.justifyCenter),
      ]}
    >
      {/* Story ring - gradient for unviewed, gray for viewed */}
      {hasStories && !hasViewedStories ? (
        // Unviewed stories - colorful gradient ring
        <LinearGradient
          colors={['#F59E0B', '#EF4444', '#8B5CF6', '#3B82F6'] as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            {
              width: sizeStyles.width,
              height: sizeStyles.height,
              borderRadius: sizeStyles.width / 2,
              padding: sizeStyles.padding,
            },
            tw(layout.itemsCenter, layout.justifyCenter),
          ]}
        >
          {/* White inner ring */}
          <View
            style={[
              {
                width: sizeStyles.width - (sizeStyles.padding * 2),
                height: sizeStyles.height - (sizeStyles.padding * 2),
                borderRadius: (sizeStyles.width - (sizeStyles.padding * 2)) / 2,
                backgroundColor: colors.background,
              },
              tw(layout.itemsCenter, layout.justifyCenter),
            ]}
          >
            {children}
          </View>
        </LinearGradient>
      ) : (
        // Viewed stories - gray ring
        <View
          style={[
            {
              width: sizeStyles.width,
              height: sizeStyles.height,
              borderRadius: sizeStyles.width / 2,
              backgroundColor: colors.border,
              padding: sizeStyles.padding,
            },
            tw(layout.itemsCenter, layout.justifyCenter),
          ]}
        >
          {/* White inner ring */}
          <View
            style={[
              {
                width: sizeStyles.width - (sizeStyles.padding * 2),
                height: sizeStyles.height - (sizeStyles.padding * 2),
                borderRadius: (sizeStyles.width - (sizeStyles.padding * 2)) / 2,
                backgroundColor: colors.background,
              },
              tw(layout.itemsCenter, layout.justifyCenter),
            ]}
          >
            {children}
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default MoaiStoryRing;