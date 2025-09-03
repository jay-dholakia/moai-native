import React from 'react';
import { View } from 'react-native';
import { Crown } from 'lucide-react-native';
import { tw } from '@/utils/styles';

interface CoachSubscriptionBadgeProps {
  hasCoachSubscription: boolean;
  size?: 'sm' | 'default' | 'lg';
}

/**
 * CoachSubscriptionBadge displays a crown icon for users with active coach subscriptions
 */
export const CoachSubscriptionBadge: React.FC<CoachSubscriptionBadgeProps> = ({
  hasCoachSubscription,
  size = 'default',
}) => {
  if (!hasCoachSubscription) return null;

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 12;
      case 'lg':
        return 20;
      default:
        return 16;
    }
  };

  return (
    <View style={tw('items-center justify-center')}>
      <Crown 
        size={getIconSize()} 
        color="#EAB308" 
        fill="#EAB308" 
      />
    </View>
  );
};

export default CoachSubscriptionBadge;