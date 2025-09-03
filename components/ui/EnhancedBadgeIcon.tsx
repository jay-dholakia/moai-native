import React from 'react';
import { View, Text } from 'react-native';
import { Star, Trophy, Award, Target } from 'lucide-react-native';
import { tw, text } from '@/utils/styles';

interface EnhancedBadgeIconProps {
  totalActivities: number;
  size?: 'sm' | 'default' | 'lg';
  showProgress?: boolean;
}

/**
 * EnhancedBadgeIcon displays activity badges with progression levels
 * Matches the web app's BadgeIcon component functionality
 */
export const EnhancedBadgeIcon: React.FC<EnhancedBadgeIconProps> = ({
  totalActivities,
  size = 'default',
  showProgress = false,
}) => {
  // Badge thresholds matching web app logic
  const getBadgeInfo = () => {
    if (totalActivities >= 100) {
      return {
        icon: <Trophy size={getIconSize()} color="#FFD700" />,
        level: 'elite',
        color: '#FFD700',
        bgColor: '#FEF3C7',
        text: '100+',
      };
    } else if (totalActivities >= 50) {
      return {
        icon: <Award size={getIconSize()} color="#10B981" />,
        level: 'gold',
        color: '#10B981',
        bgColor: '#D1FAE5',
        text: '50+',
      };
    } else if (totalActivities >= 25) {
      return {
        icon: <Star size={getIconSize()} color="#3B82F6" />,
        level: 'silver',
        color: '#3B82F6',
        bgColor: '#DBEAFE',
        text: '25+',
      };
    } else if (totalActivities >= 10) {
      return {
        icon: <Target size={getIconSize()} color="#8B5CF6" />,
        level: 'bronze',
        color: '#8B5CF6',
        bgColor: '#EDE9FE',
        text: '10+',
      };
    }
    
    return null;
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 8;
      case 'lg':
        return 16;
      default:
        return 12;
    }
  };

  const getContainerSize = () => {
    switch (size) {
      case 'sm':
        return 'w-4 h-4';
      case 'lg':
        return 'w-8 h-8';
      default:
        return 'w-6 h-6';
    }
  };

  const badgeInfo = getBadgeInfo();
  
  if (!badgeInfo) return null;

  return (
    <View
      style={[
        tw(`${getContainerSize()} rounded-full flex items-center justify-center border`),
        {
          backgroundColor: badgeInfo.bgColor,
          borderColor: badgeInfo.color,
        },
      ]}
    >
      {badgeInfo.icon}
      
      {showProgress && (
        <View
          style={[
            tw('absolute -top-1 -right-1 px-1 rounded-full'),
            { backgroundColor: badgeInfo.color },
          ]}
        >
          <Text style={[text.xs, tw('text-white font-bold')]}>
            {badgeInfo.text}
          </Text>
        </View>
      )}
    </View>
  );
};

export default EnhancedBadgeIcon;