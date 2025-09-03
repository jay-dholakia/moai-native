import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Moai } from '@/services/types';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout, border } from '@/utils/styles';
import { LinearGradient } from 'expo-linear-gradient';

interface MoaiProfileCircleProps {
  moai: Moai;
  isSelected?: boolean;
  onClick: (e?: any) => void;
  showBadge?: boolean;
  size?: 'sm' | 'default' | 'lg';
}

export const MoaiProfileCircle: React.FC<MoaiProfileCircleProps> = ({
  moai,
  isSelected = false,
  onClick,
  showBadge = true,
  size = 'default',
}) => {
  const { colors } = useTheme();

  const getMoaiAbbreviation = (moai: Moai) => {
    const words = moai.name.split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    } else {
      return moai.name.substring(0, 2).toUpperCase();
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { width: 40, height: 40, fontSize: 12 };
      case 'lg':
        return { width: 56, height: 56, fontSize: 18 };
      default:
        return { width: 48, height: 48, fontSize: 14 };
    }
  };

  const sizeStyles = getSizeStyles();

  const renderContent = () => {
    if (moai.image_url) {
      return (
        <Image
          source={{ uri: moai.image_url }}
          style={[
            {
              width: sizeStyles.width - 4,
              height: sizeStyles.height - 4,
              borderRadius: (sizeStyles.width - 4) / 2,
            }
          ]}
          resizeMode="cover"
        />
      );
    }

    return (
      <Text 
        style={[
          tw(text.semibold),
          { 
            color: '#FFFFFF', 
            fontSize: sizeStyles.fontSize 
          }
        ]}
      >
        {getMoaiAbbreviation(moai)}
      </Text>
    );
  };

  const getUrgencyColor = () => {
    const consecutiveMissed = moai.consecutive_missed_weeks || 0;
    const currentStreak = moai.current_streak_weeks || 0;
    
    if (consecutiveMissed >= 1) return ['#EF4444', '#DC2626']; // Critical - Red
    if (currentStreak === 0) return ['#F59E0B', '#D97706']; // At Risk - Yellow  
    return ['#06B6D4', '#0891B2']; // On Track - Teal/Blue
  };

  const gradientColors = getUrgencyColor();

  return (
    <View style={tw(layout.itemsCenter)}>
      <TouchableOpacity
        onPress={onClick}
        activeOpacity={0.8}
        style={[
          {
            width: sizeStyles.width + (isSelected ? 8 : 0),
            height: sizeStyles.height + (isSelected ? 8 : 0),
            borderRadius: (sizeStyles.width + (isSelected ? 8 : 0)) / 2,
            minWidth: 44, // Ensure minimum touch target
            minHeight: 44,
          },
          tw(layout.itemsCenter, layout.justifyCenter),
          isSelected && {
            borderWidth: 3,
            borderColor: colors.primary,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 8,
          }
        ]}
      >
        <LinearGradient
          colors={gradientColors as [string, string, ...string[]]}
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
          {renderContent()}
        </LinearGradient>
      </TouchableOpacity>

      {/* Badge indicator */}
      {showBadge && (moai.consecutive_missed_weeks || 0) > 0 && (
        <View
          style={[
            tw(spacing.absolute, spacing.mt(1)),
            {
              top: -4,
              right: -4,
              width: 16,
              height: 16,
              borderRadius: 8,
              backgroundColor: '#EF4444',
              borderWidth: 2,
              borderColor: colors.background,
            },
            tw(layout.itemsCenter, layout.justifyCenter),
          ]}
        >
          <Text style={[tw(text.xs), { color: '#FFFFFF', fontSize: 10 }]}>
            {moai.consecutive_missed_weeks}
          </Text>
        </View>
      )}

      {/* Moai name label */}
      <Text
        style={[
          tw(text.xs, text.center, spacing.mt(1)),
          { color: colors.mutedForeground, maxWidth: 60 }
        ]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {moai.name}
      </Text>
    </View>
  );
};

export default MoaiProfileCircle;