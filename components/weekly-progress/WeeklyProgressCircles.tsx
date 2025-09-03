import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { format, addDays, startOfWeek, isToday } from 'date-fns';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout, border } from '@/utils/styles';

interface WeeklyProgressCirclesProps {
  userId: string;
  totalDays: number;
  completedDays: number;
  currentWeek: Date;
  size?: 'small' | 'medium' | 'large';
  showActivityCounts?: boolean;
  onDayPress?: (day: Date) => void;
}

interface DayCircleProps {
  day: Date;
  activityCount: number;
  size: 'small' | 'medium' | 'large';
  onPress?: () => void;
}

const DayCircle: React.FC<DayCircleProps> = ({ day, activityCount, size, onPress }) => {
  const { colors } = useTheme();
  const hasActivity = activityCount > 0;
  const isCurrentDay = isToday(day);
  
  const getCircleSize = () => {
    switch (size) {
      case 'small':
        return { width: 24, height: 24 };
      case 'medium':
        return { width: 32, height: 32 };
      default:
        return { width: 40, height: 40 };
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'small':
        return tw(text.xs);
      case 'medium':
        return tw(text.sm);
      default:
        return tw(text.base);
    }
  };

  const getDayLabelSize = () => {
    switch (size) {
      case 'small':
        return tw(text.xs);
      case 'medium':
        return tw(text.xs);
      default:
        return tw(text.sm);
    }
  };

  // Get single letter day abbreviation
  const getSingleLetterDay = (date: Date) => {
    const dayName = format(date, 'EEEE');
    switch (dayName) {
      case 'Monday': return 'M';
      case 'Tuesday': return 'T';
      case 'Wednesday': return 'W';
      case 'Thursday': return 'T';
      case 'Friday': return 'F';
      case 'Saturday': return 'S';
      case 'Sunday': return 'S';
      default: return format(date, 'E')[0];
    }
  };

  const circleSize = getCircleSize();

  return (
    <View style={tw(layout.itemsCenter, spacing.gap(1))}>
      {/* Day letter */}
      <Text style={[getDayLabelSize(), { color: colors.mutedForeground, fontWeight: '500' }]}>
        {getSingleLetterDay(day)}
      </Text>

      {/* Day circle */}
      <TouchableOpacity
        onPress={hasActivity && onPress ? onPress : undefined}
        activeOpacity={hasActivity ? 0.7 : 1}
        style={[
          {
            width: circleSize.width,
            height: circleSize.height,
            borderRadius: circleSize.width / 2,
            borderWidth: 2,
            borderColor: hasActivity ? colors.primary : '#D1D5DB', // gray-300
            backgroundColor: hasActivity ? colors.primary : '#F3F4F6', // gray-100
          },
          tw(layout.itemsCenter, layout.justifyCenter, layout.relative),
        ]}
      >
        <Text style={[
          getTextSize(),
          { 
            color: hasActivity ? '#FFFFFF' : colors.mutedForeground,
            fontWeight: '500' 
          }
        ]}>
          {format(day, 'd')}
        </Text>

        {/* Activity count indicator for multiple activities */}
        {activityCount > 1 && (
          <View
            style={[
              tw(layout.absolute, layout.itemsCenter, layout.justifyCenter),
              {
                top: -6,
                right: -6,
                width: 16,
                height: 16,
                borderRadius: 8,
                backgroundColor: '#F97316', // orange-500
              }
            ]}
          >
            <Text style={[tw(text.xs), { color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' }]}>
              {activityCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Current day indicator dot */}
      {isCurrentDay && (
        <View 
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: colors.primary,
            marginTop: 2
          }}
        />
      )}
    </View>
  );
};

export const WeeklyProgressCircles: React.FC<WeeklyProgressCirclesProps> = ({
  userId,
  totalDays,
  completedDays,
  currentWeek,
  size = 'medium',
  showActivityCounts = true,
  onDayPress,
}) => {
  const { colors } = useTheme();

  // Calculate the week start (Monday)
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Simple demo activity distribution - in real app this would come from actual activity data
  const getDemoActivityCount = (day: Date, totalCompleted: number) => {
    if (totalCompleted <= 0) return 0;
    
    // Distribute completed days across the week for demo purposes
    const dayIndex = days.findIndex(d => format(d, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'));
    const pastDayIndex = Math.min(dayIndex, 6); // Don't count future days
    
    // Simple distribution: show activity for the first N days based on completed count
    return dayIndex < completedDays && !isToday(addDays(day, 1)) ? 1 : 0; // Don't show for future days
  };

  const getGridGap = () => {
    switch (size) {
      case 'small':
        return spacing.gap(1);
      case 'medium':
        return spacing.gap(2);
      default:
        return spacing.gap(2);
    }
  };

  return (
    <View 
      style={[
        tw(border.rounded, spacing.p(3)),
        { backgroundColor: colors.muted }
      ]}
    >
      <View style={[tw(layout.flexRow, layout.justifyBetween), getGridGap()]}>
        {days.map((day, index) => {
          const activityCount = showActivityCounts ? getDemoActivityCount(day, completedDays) : 0;
          
          return (
            <DayCircle
              key={index}
              day={day}
              activityCount={activityCount}
              size={size}
              onPress={onDayPress ? () => onDayPress(day) : undefined}
            />
          );
        })}
      </View>
    </View>
  );
};

export default WeeklyProgressCircles;