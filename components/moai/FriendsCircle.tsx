import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Users } from 'lucide-react-native';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout, border } from '@/utils/styles';

interface FriendsCircleProps {
  onClick: () => void;
  isSelected?: boolean;
  size?: 'sm' | 'default' | 'lg';
  disabled?: boolean;
}

export const FriendsCircle: React.FC<FriendsCircleProps> = ({
  onClick,
  isSelected = false,
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
        disabled={disabled}
        activeOpacity={0.8}
        style={[
          {
            width: sizeStyles.width + (isSelected ? 8 : 0),
            height: sizeStyles.height + (isSelected ? 8 : 0),
            borderRadius: (sizeStyles.width + (isSelected ? 8 : 0)) / 2,
            minWidth: 44,
            minHeight: 44,
            backgroundColor: isSelected ? colors.primary : colors.muted,
            borderWidth: isSelected ? 3 : 2,
            borderColor: isSelected ? colors.primary : colors.border,
          },
          tw(layout.itemsCenter, layout.justifyCenter),
          isSelected && {
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 8,
          }
        ]}
      >
        <Users 
          size={sizeStyles.iconSize} 
          color={isSelected ? colors.primaryForeground : colors.mutedForeground} 
        />
      </TouchableOpacity>

      <Text
        style={[
          tw(text.xs, text.center, spacing.mt(1)),
          { 
            color: isSelected ? colors.primary : colors.mutedForeground, 
            maxWidth: 60,
            fontWeight: isSelected ? '600' : '400'
          }
        ]}
        numberOfLines={1}
      >
        Friends
      </Text>
    </View>
  );
};

export default FriendsCircle;