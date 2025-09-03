import React from 'react';
import { View, Text } from 'react-native';
import { Flame } from 'lucide-react-native';
import { tw, text } from '@/utils/styles';

interface CommitmentStreakBadgeProps {
  streakCount: number;
  size?: 'sm' | 'default' | 'lg';
}

/**
 * CommitmentStreakBadge displays a user's commitment streak with fire icon
 * Shows how many consecutive weeks they've met their commitment
 */
export const CommitmentStreakBadge: React.FC<CommitmentStreakBadgeProps> = ({
  streakCount,
  size = 'default',
}) => {
  if (streakCount <= 0) return null;

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          iconSize: 12,
          textSize: text.xs,
          container: tw('px-1 py-0.5'),
        };
      case 'lg':
        return {
          iconSize: 18,
          textSize: text.sm,
          container: tw('px-2 py-1'),
        };
      default:
        return {
          iconSize: 14,
          textSize: text.xs,
          container: tw('px-1.5 py-0.5'),
        };
    }
  };

  const { iconSize, textSize, container } = getSizeClasses();

  return (
    <View 
      style={[
        tw('flex-row items-center rounded-full bg-orange-100'),
        container
      ]}
    >
      <Flame size={iconSize} color="#EA580C" />
      <Text style={[textSize, tw('ml-1 font-medium text-orange-700')]}>
        {streakCount}
      </Text>
    </View>
  );
};

export default CommitmentStreakBadge;