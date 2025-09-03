import React from 'react';
import { View } from 'react-native';
import { Calendar, Zap, Dumbbell, Heart, Timer, Coffee } from 'lucide-react-native';
import { tw } from '@/utils/styles';

interface ActivityIndicatorProps {
  activityType?: string | null;
  size?: number;
}

/**
 * ActivityIndicator shows what activity a user has planned for today
 * Displays as a small badge overlay on profile images
 */
export const ActivityIndicator: React.FC<ActivityIndicatorProps> = ({
  activityType,
  size = 16,
}) => {
  if (!activityType) return null;

  const getActivityIcon = () => {
    switch (activityType?.toLowerCase()) {
      case 'workout':
      case 'strength':
      case 'gym':
        return <Dumbbell size={size * 0.6} color="white" />;
      case 'cardio':
      case 'running':
      case 'cycling':
        return <Heart size={size * 0.6} color="white" />;
      case 'yoga':
      case 'stretching':
      case 'meditation':
        return <Calendar size={size * 0.6} color="white" />;
      case 'sports':
      case 'tennis':
      case 'basketball':
        return <Zap size={size * 0.6} color="white" />;
      case 'walk':
      case 'hiking':
        return <Timer size={size * 0.6} color="white" />;
      case 'rest':
        return <Coffee size={size * 0.6} color="white" />;
      default:
        return <Calendar size={size * 0.6} color="white" />;
    }
  };

  const getActivityColor = () => {
    switch (activityType?.toLowerCase()) {
      case 'workout':
      case 'strength':
      case 'gym':
        return '#DC2626'; // red-600
      case 'cardio':
      case 'running':
      case 'cycling':
        return '#EA580C'; // orange-600
      case 'yoga':
      case 'stretching':
      case 'meditation':
        return '#7C3AED'; // violet-600
      case 'sports':
      case 'tennis':
      case 'basketball':
        return '#059669'; // emerald-600
      case 'walk':
      case 'hiking':
        return '#0D9488'; // teal-600
      case 'rest':
        return '#6B7280'; // gray-500
      default:
        return '#3B82F6'; // blue-600
    }
  };

  return (
    <View
      style={[
        tw(`absolute top-0 right-0 rounded-full flex items-center justify-center border-2 border-white`),
        {
          width: size,
          height: size,
          backgroundColor: getActivityColor(),
          transform: [{ translateX: size * 0.25 }, { translateY: -size * 0.25 }],
        },
      ]}
    >
      {getActivityIcon()}
    </View>
  );
};

export default ActivityIndicator;