import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { tw, spacing, layout, text, border } from '@/utils/styles';
import { useTheme } from '@/providers/theme-provider';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { ActivityLogService } from '@/services/activity-log-service';

interface MonthlyActivityCalendarProps {
  userId?: string;
  currentMonth?: Date;
  onMonthChange?: (date: Date) => void;
}

interface DayData {
  date: Date;
  dayNumber: string;
  activityCount: number;
  primaryEmoji: string;
  hasActivity: boolean;
  isCurrentMonth: boolean;
  isToday: boolean;
}

export const MonthlyActivityCalendar: React.FC<MonthlyActivityCalendarProps> = ({
  userId,
  currentMonth: propCurrentMonth,
  onMonthChange
}) => {
  const { user } = useAuth();
  const { theme, colors } = useTheme();
  const [internalCurrentMonth, setInternalCurrentMonth] = useState(new Date());

  const currentMonth = propCurrentMonth || internalCurrentMonth;
  const targetUserId = userId || user?.id;

  // Fetch user's activity logs
  const { data: activities = [] } = useQuery({
    queryKey: ['userActivities', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return { success: false, error: 'No user', data: { activities: [], hasMore: false, total: 0 } };
      return await ActivityLogService.getUserActivities(targetUserId, 1, 100);
    },
    enabled: !!targetUserId,
    select: (response: any) => response?.success ? response.data.activities : [],
  });

  // Generate the month data
  const monthData = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);

    // Get all days in the month
    const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Add padding days to fill the calendar grid (start on Monday)
    const firstDayOfWeek = monthStart.getDay();
    const paddingStart = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Monday = 0

    const paddingDays = [];
    for (let i = paddingStart; i > 0; i--) {
      const paddingDay = new Date(monthStart);
      paddingDay.setDate(paddingDay.getDate() - i);
      paddingDays.push(paddingDay);
    }

    // Add padding days at the end to complete the last week
    const lastDayOfWeek = monthEnd.getDay();
    const paddingEnd = lastDayOfWeek === 0 ? 0 : 7 - lastDayOfWeek;

    const endPaddingDays = [];
    for (let i = 1; i <= paddingEnd; i++) {
      const paddingDay = new Date(monthEnd);
      paddingDay.setDate(paddingDay.getDate() + i);
      endPaddingDays.push(paddingDay);
    }

    const allDays = [...paddingDays, ...monthDays, ...endPaddingDays];

    return allDays.map(day => {
      const dayString = format(day, 'yyyy-MM-dd');

      // Filter activities for this day
      const dayActivities = activities.filter((activity: any) => {
        const activityDate = format(new Date(activity.logged_at), 'yyyy-MM-dd');
        return activityDate === dayString;
      });

      // Get the primary emoji (first activity or most frequent)
      let primaryEmoji = '';
      if (dayActivities.length > 0) {
        primaryEmoji = dayActivities[0].emoji || '';
      }

      return {
        date: day,
        dayNumber: format(day, 'd'),
        activityCount: dayActivities.length,
        primaryEmoji,
        hasActivity: dayActivities.length > 0,
        isCurrentMonth: isSameMonth(day, currentMonth),
        isToday: isToday(day)
      };
    });
  }, [activities, currentMonth]);

  const handlePreviousMonth = () => {
    const newMonth = subMonths(currentMonth, 1);
    if (onMonthChange) {
      onMonthChange(newMonth);
    } else {
      setInternalCurrentMonth(newMonth);
    }
  };

  const handleNextMonth = () => {
    const newMonth = addMonths(currentMonth, 1);
    if (onMonthChange) {
      onMonthChange(newMonth);
    } else {
      setInternalCurrentMonth(newMonth);
    }
  };

  const isCurrentMonth = format(new Date(), 'yyyy-MM') === format(currentMonth, 'yyyy-MM');
  const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <Card elevation="md" style={tw(spacing.mb(6))}>
      <View style={tw(spacing.p(4))}>
        {/* Header */}
        <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.mb(4))}>
          <Text style={tw(text.base, text.bold, text.foreground(theme))}>
            Monthly Movement
          </Text>
          <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2))}>
            <TouchableOpacity
              onPress={handlePreviousMonth}
              style={[
                tw(spacing.p(2), border.rounded),
                { backgroundColor: colors.card }
              ]}
            >
              <Ionicons name="chevron-back" size={16} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={tw(text.sm, text.medium, text.foreground(theme))}>
              {format(currentMonth, 'MMMM yyyy')}
            </Text>
            <TouchableOpacity
              onPress={handleNextMonth}
              disabled={isCurrentMonth}
              style={[
                tw(spacing.p(2), border.rounded),
                { 
                  backgroundColor: colors.card,
                  opacity: isCurrentMonth ? 0.5 : 1
                }
              ]}
            >
              <Ionicons name="chevron-forward" size={16} color={colors.foreground} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Week day headers */}
        <View style={tw(layout.flexRow, layout.justifyBetween, spacing.mb(2))}>
          {weekDays.map((day, index) => (
            <View key={index} style={[tw(layout.itemsCenter, layout.justifyCenter), { width: '14.28%' }]}>
              <Text style={tw(text.xs, text.medium, text.muted(theme))}>
                {day}
              </Text>
            </View>
          ))}
        </View>

        {/* Calendar grid */}
        <View>
          {Array.from({ length: Math.ceil(monthData.length / 7) }, (_, weekIndex) => (
            <View key={weekIndex} style={tw(layout.flexRow, layout.justifyBetween, spacing.mb(1))}>
              {monthData.slice(weekIndex * 7, (weekIndex + 1) * 7).map((dayData, dayIndex) => (
                <View
                  key={dayIndex}
                  style={[
                    tw(layout.itemsCenter, layout.justifyCenter),
                    { width: '14.28%', aspectRatio: 1 }
                  ]}
                >
                  <View
                    style={[
                      tw(
                        layout.itemsCenter,
                        layout.justifyCenter,
                        border.roundedFull
                      ),
                      {
                        width: 32,
                        height: 32,
                        backgroundColor: dayData.hasActivity
                          ? colors.primary
                          : colors.muted,
                        borderWidth: dayData.isToday ? 2 : 1,
                        borderColor: dayData.isToday
                          ? colors.primary
                          : colors.border,
                        opacity: dayData.isCurrentMonth ? 1 : 0.3,
                        position: 'relative',
                      }
                    ]}
                  >
                    {dayData.hasActivity && dayData.primaryEmoji ? (
                      <View style={tw(layout.itemsCenter, layout.justifyCenter)}>
                        <Text style={tw(text.xs, text.bold)}>
                          {dayData.dayNumber}
                        </Text>
                        <Text style={{ fontSize: 8, lineHeight: 8 }}>
                          {dayData.primaryEmoji}
                        </Text>
                      </View>
                    ) : dayData.hasActivity ? (
                      <Text
                        style={[
                          tw(text.xs, text.bold),
                          { color: colors.primaryForeground }
                        ]}
                      >
                        {dayData.dayNumber}
                      </Text>
                    ) : (
                      <Text
                        style={[
                          tw(text.xs, text.medium),
                          { 
                            color: dayData.isCurrentMonth 
                              ? colors.foreground 
                              : colors.muted 
                          }
                        ]}
                      >
                        {dayData.dayNumber}
                      </Text>
                    )}

                    {/* Activity count badge */}
                    {dayData.activityCount > 1 && (
                      <View
                        style={[
                          tw(border.roundedFull, layout.itemsCenter, layout.justifyCenter),
                          {
                            position: 'absolute',
                            top: -4,
                            right: -4,
                            width: 16,
                            height: 16,
                            backgroundColor: '#F97316', // orange-500
                          }
                        ]}
                      >
                        <Text style={[tw(text.xs, text.bold), { color: 'white', fontSize: 8 }]}>
                          {dayData.activityCount}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={tw(layout.itemsCenter, spacing.mt(4))}>
          <Text style={tw(text.sm, text.muted(theme), text.center)}>
            {isCurrentMonth ? 'Current month activity overview' : 'Monthly activity overview'}
          </Text>
        </View>
      </View>
    </Card>
  );
};