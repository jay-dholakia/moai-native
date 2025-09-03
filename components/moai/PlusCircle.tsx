import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Plus, X } from 'lucide-react-native';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout } from '@/utils/styles';
import { LinearGradient } from 'expo-linear-gradient';

interface PlusCircleProps {
  onClick: () => void;
  isAtCapacity?: boolean;
  size?: 'sm' | 'default' | 'lg';
  disabled?: boolean;
}

export const PlusCircle: React.FC<PlusCircleProps> = ({
  onClick,
  isAtCapacity = false,
  size = 'default',
  disabled = false,
}) => {
  const { colors } = useTheme();

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { width: 40, height: 40, iconSize: 16 };
      case 'lg':
        return { width: 56, height: 56, iconSize: 24 };
      default:
        return { width: 48, height: 48, iconSize: 20 };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <View style={tw(layout.itemsCenter)}>
      <TouchableOpacity
        onPress={onClick}
        disabled={disabled || isAtCapacity}
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
        {isAtCapacity ? (
          // At capacity - red background with X
          <View
            style={[
              {
                width: sizeStyles.width,
                height: sizeStyles.height,
                borderRadius: sizeStyles.width / 2,
                backgroundColor: '#EF4444',
              },
              tw(layout.itemsCenter, layout.justifyCenter),
            ]}
          >
            <X size={sizeStyles.iconSize} color="#FFFFFF" />
          </View>
        ) : (
          // Available - gradient background with Plus
          <LinearGradient
            colors={['#06B6D4', '#3B82F6'] as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              {
                width: sizeStyles.width,
                height: sizeStyles.height,
                borderRadius: sizeStyles.width / 2,
              },
              tw(layout.itemsCenter, layout.justifyCenter),
            ]}
          >
            <Plus size={sizeStyles.iconSize} color="#FFFFFF" />
          </LinearGradient>
        )}
      </TouchableOpacity>

      <Text
        style={[
          tw(text.xs, text.center, spacing.mt(1)),
          { 
            color: isAtCapacity ? '#EF4444' : colors.mutedForeground, 
            maxWidth: 60 
          }
        ]}
        numberOfLines={1}
      >
        {isAtCapacity ? 'Full' : 'Create'}
      </Text>
    </View>
  );
};

export default PlusCircle;