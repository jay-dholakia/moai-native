import React from 'react';
import { View, Text } from 'react-native';
import { Svg, Circle } from 'react-native-svg';
import { tw, spacing, layout, text, border } from '@/utils/styles';
import { useTheme } from '@/providers/theme-provider';

interface ProfileProgressAvatarProps {
  imageUrl?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  progress?: number; // 0-100 percentage
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showBadgeOverlay?: boolean;
  currentBadge?: {
    icon: string;
    name: string;
  } | null;
  totalActivities?: number;
}

const getSizeConfig = (size: 'sm' | 'md' | 'lg' | 'xl') => {
  switch (size) {
    case 'sm':
      return { diameter: 60, strokeWidth: 3, textSize: text.lg, radius: 27 };
    case 'md':
      return { diameter: 80, strokeWidth: 4, textSize: text.xl, radius: 36 };
    case 'lg':
      return { diameter: 100, strokeWidth: 5, textSize: text['2xl'], radius: 45 };
    case 'xl':
      return { diameter: 120, strokeWidth: 6, textSize: text['3xl'], radius: 54 };
    default:
      return { diameter: 80, strokeWidth: 4, textSize: text.xl, radius: 36 };
  }
};

export const ProfileProgressAvatar: React.FC<ProfileProgressAvatarProps> = ({
  imageUrl,
  firstName,
  lastName,
  email,
  progress = 0,
  size = 'lg',
  showBadgeOverlay = false,
  currentBadge = null,
  totalActivities = 0
}) => {
  const { theme, colors } = useTheme();
  const { diameter, strokeWidth, textSize, radius } = getSizeConfig(size);
  
  // Calculate circle properties for progress ring
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  
  // Get initials
  const getInitials = () => {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    if (firstName) {
      return firstName.charAt(0).toUpperCase();
    }
    if (email) {
      return email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  return (
    <View style={tw(layout.itemsCenter, layout.justifyCenter)}>
      <View style={{ position: 'relative' }}>
        {/* Background circle for progress ring */}
        <Svg
          width={diameter}
          height={diameter}
          style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}
        >
          {/* Background circle */}
          <Circle
            cx={diameter / 2}
            cy={diameter / 2}
            r={radius}
            stroke={colors.muted}
            strokeWidth={strokeWidth}
            fill="transparent"
            opacity={0.2}
          />
          {/* Progress circle */}
          <Circle
            cx={diameter / 2}
            cy={diameter / 2}
            r={radius}
            stroke={colors.primary}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </Svg>

        {/* Avatar */}
        <View
          style={[
            tw(
              layout.itemsCenter,
              layout.justifyCenter,
              border.roundedFull
            ),
            {
              width: diameter - strokeWidth * 2 - 4,
              height: diameter - strokeWidth * 2 - 4,
              backgroundColor: colors.primary,
              alignSelf: 'center',
            }
          ]}
        >
          {imageUrl ? (
            // TODO: Add Image component when implemented
            <View
              style={[
                tw(border.roundedFull),
                {
                  width: diameter - strokeWidth * 2 - 4,
                  height: diameter - strokeWidth * 2 - 4,
                  backgroundColor: colors.muted,
                }
              ]}
            />
          ) : (
            <Text 
              style={[
                tw(textSize, text.bold), 
                { color: colors.primaryForeground }
              ]}
            >
              {getInitials()}
            </Text>
          )}
        </View>

        {/* Badge overlay - only show if user has earned at least one badge and has 10+ activities */}
        {showBadgeOverlay && currentBadge && totalActivities >= 10 && (
          <View 
            style={[
              tw(border.roundedFull, spacing.p(1)),
              {
                position: 'absolute',
                bottom: -8,
                right: -8,
                backgroundColor: colors.background,
                borderWidth: 2,
                borderColor: colors.border,
              }
            ]}
          >
            <Text style={tw(text.lg)}>{currentBadge.icon}</Text>
          </View>
        )}
      </View>
      
      {/* Progress text */}
      {progress > 0 && (
        <Text 
          style={tw(text.xs, text.muted(theme), text.center, spacing.mt(2))}
        >
          {Math.round(progress)}% weekly goal
        </Text>
      )}
    </View>
  );
};