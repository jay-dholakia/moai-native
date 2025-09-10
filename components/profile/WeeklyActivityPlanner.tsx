import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tw, spacing, layout, text, border } from '@/utils/styles';
import { useTheme } from '@/providers/theme-provider';
import { format, startOfWeek, endOfWeek, addDays, addWeeks, subWeeks, isSameDay, isToday, isBefore } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useWeeklyPlan, useSaveWeeklyPlan } from '@/hooks/use-weekly-plan';
import type { DayPlan } from '@/services/weekly-plan-service';

interface ActivityCard {
  id: string;
  type: 'move' | 'lift' | 'flow' | 'rest';
  name: string;
  isLocked?: boolean;
}

// DayPlan interface now imported from service
// interface DayPlan {
//   day: string;
//   date: string;
//   activities: ActivityCard[];
//   isPast: boolean;
// }

interface WeeklyActivityPlannerProps {
  weekOffset?: number;
  onWeekChange?: (offset: number) => void;
  showPlanning?: boolean;
  mode?: 'planner' | 'summary';
  userId?: string;
}

const ACTIVITY_TYPES: ActivityCard[] = [
  { id: 'move-1', type: 'move', name: 'Move' },
  { id: 'lift-1', type: 'lift', name: 'Lift' },
  { id: 'flow-1', type: 'flow', name: 'Flow' },
  { id: 'rest-1', type: 'rest', name: 'Rest' },
];

const getActivityStyle = (type: string) => {
  switch (type) {
    case 'move':
      return { 
        color: '#EC4899', // Pink
        backgroundColor: '#FDF2F8',
        borderColor: '#F9A8D4',
        icon: '💓'
      };
    case 'lift':
      return { 
        color: '#F59E0B', // Orange
        backgroundColor: '#FFFBEB',
        borderColor: '#FCD34D',
        icon: '🏋️‍♂️'
      };
    case 'flow':
      return { 
        color: '#3B82F6', // Blue
        backgroundColor: '#EFF6FF',
        borderColor: '#93C5FD',
        icon: '🌊'
      };
    case 'rest':
      return { 
        color: '#F59E0B', // Amber
        backgroundColor: '#FFFBEB',
        borderColor: '#FCD34D',
        icon: '☕'
      };
    default:
      return { 
        color: '#6B7280', // Gray
        backgroundColor: '#F9FAFB',
        borderColor: '#D1D5DB',
        icon: '🏃‍♂️'
      };
  }
};

export const WeeklyActivityPlanner: React.FC<WeeklyActivityPlannerProps> = ({
  weekOffset = 0,
  onWeekChange,
  showPlanning = true,
  mode = 'planner',
  userId
}) => {
  const { theme, colors } = useTheme();
  const { user } = useAuth();
  const [internalWeekOffset, setInternalWeekOffset] = useState(0);
  const [weeklyPlan, setWeeklyPlan] = useState<DayPlan[]>([]);
  const [isPlanningOpen, setIsPlanningOpen] = useState(false);
  const [draggedActivity, setDraggedActivity] = useState<ActivityCard | null>(null);

  const currentWeekOffset = onWeekChange ? weekOffset : internalWeekOffset;
  
  // Create stable references for dates
  const today = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Normalize to start of day to prevent constant changes
    return now;
  }, []); // Only create once
  
  const currentWeek = useMemo(() => addWeeks(today, currentWeekOffset), [today, currentWeekOffset]);

  const { weekStart, weekEnd, isCurrentWeek } = useMemo(() => {
    const start = startOfWeek(currentWeek, { weekStartsOn: 1 });
    const end = endOfWeek(currentWeek, { weekStartsOn: 1 });
    const isCurrent = format(today, 'yyyy-ww') === format(currentWeek, 'yyyy-ww');
    
    return { weekStart: start, weekEnd: end, isCurrentWeek: isCurrent };
  }, [currentWeek, today]);

  // Determine which user ID to use for queries
  const targetUserId = userId || user?.id;

  // Use hooks for loading and saving weekly plans
  const { plan: savedPlan, isLoading: planLoading } = useWeeklyPlan(currentWeek, targetUserId);
  const { saveWeeklyPlan, isLoading: savingPlan } = useSaveWeeklyPlan();

  // Fetch weekly activities
  const { data: weeklyActivities = [] } = useQuery({
    queryKey: ['weeklyActivities', targetUserId, currentWeekOffset], // Use offset instead of Date object
    queryFn: async () => {
      if (!targetUserId) return [];

      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('profile_id', targetUserId)
        .gte('logged_at', weekStart.toISOString())
        .lte('logged_at', weekEnd.toISOString())
        .order('logged_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!targetUserId,
  });

  // Calculate summary statistics for summary mode
  const summaryStats = useMemo(() => {
    const totalActivities = weeklyActivities.length;
    const activeDays = new Set(weeklyActivities.map(activity => 
      format(new Date(activity.logged_at), 'yyyy-MM-dd')
    )).size;
    
    // Group activities by day for display
    const dailyActivities = weeklyActivities.reduce((acc, activity) => {
      const dateKey = format(new Date(activity.logged_at), 'yyyy-MM-dd');
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(activity);
      return acc;
    }, {} as Record<string, any[]>);

    return { totalActivities, activeDays, dailyActivities };
  }, [weeklyActivities]);

  // Initialize weekly plan with saved data or empty plan
  useEffect(() => {
    let initialPlan: DayPlan[];
    
    if (savedPlan?.weekly_plan && Array.isArray(savedPlan.weekly_plan)) {
      // Use saved plan and update isPast status
      initialPlan = savedPlan.weekly_plan.map(day => ({
        ...day,
        isPast: !isToday(new Date(day.date)) && isBefore(new Date(day.date), today)
      }));
    } else {
      // Create empty plan
      initialPlan = Array.from({ length: 7 }, (_, index) => {
        const date = addDays(weekStart, index);
        const dayName = format(date, 'EEE');
        const isPast = !isToday(date) && isBefore(date, today);
        
        return {
          day: dayName,
          date: format(date, 'yyyy-MM-dd'),
          activities: [],
          isPast
        };
      });
    }
    
    setWeeklyPlan(initialPlan);
  }, [weekStart, today, savedPlan]); // Include savedPlan in dependencies

  const handlePreviousWeek = () => {
    if (onWeekChange) {
      onWeekChange(weekOffset - 1);
    } else {
      setInternalWeekOffset(prev => prev - 1);
    }
  };

  const handleNextWeek = () => {
    if (onWeekChange) {
      onWeekChange(weekOffset + 1);
    } else {
      setInternalWeekOffset(prev => prev + 1);
    }
  };

  const handleActivityPress = (activity: ActivityCard) => {
    setDraggedActivity(activity);
  };

  const handleDayPress = (dayIndex: number) => {
    if (!draggedActivity || weeklyPlan[dayIndex].isPast) {
      setDraggedActivity(null);
      return;
    }

    const updatedPlan = weeklyPlan.map((day, index) => {
      if (index === dayIndex) {
        // If dropping a rest activity, clear all other activities for that day
        if (draggedActivity.type === 'rest') {
          return {
            ...day,
            activities: [{ ...draggedActivity, id: `${draggedActivity.type}-${Date.now()}` }]
          };
        }
        // If the day already has a rest activity, don't add any other activities
        else if (day.activities.some(act => act.type === 'rest')) {
          return day;
        }
        // For non-rest activities, add to existing activities
        else {
          return {
            ...day,
            activities: [...day.activities, { ...draggedActivity, id: `${draggedActivity.type}-${Date.now()}` }]
          };
        }
      }
      return day;
    });

    setWeeklyPlan(updatedPlan);
    setDraggedActivity(null);
  };

  const handleRemoveActivity = (dayIndex: number, activityId: string) => {
    const updatedPlan = weeklyPlan.map((day, index) => {
      if (index === dayIndex) {
        return {
          ...day,
          activities: day.activities.filter(activity => activity.id !== activityId)
        };
      }
      return day;
    });

    setWeeklyPlan(updatedPlan);
  };

  const handleSavePlan = () => {
    if (!targetUserId) {
      Alert.alert('Error', 'You must be logged in to save your plan.');
      return;
    }

    const weekStartString = format(weekStart, 'yyyy-MM-dd');
    
    saveWeeklyPlan({
      weekly_plan: weeklyPlan,
      week_start_date: weekStartString,
      is_committed: false,
      plan_update_reason: 'User updated plan'
    });
  };

  // Get today's planned activity
  const todayPlan = useMemo(() => {
    const todayString = format(new Date(), 'yyyy-MM-dd');
    return weeklyPlan.find(day => day.date === todayString);
  }, [weeklyPlan]);

  const todayActivity = todayPlan?.activities[0];

  // Check if today's planned activity has been completed
  const isActivityCompleted = todayActivity && weeklyActivities.some(activity => {
    if (!isSameDay(new Date(activity.logged_at), new Date())) return false;
    
    let activityType = activity.activity_type?.toLowerCase() || 'move';
    
    // Map specific activity types to our four main categories
    if (activityType.includes('cardio') || activityType.includes('run') || 
        activityType.includes('walk') || activityType.includes('bike') ||
        activityType.includes('swim') || activityType.includes('move')) {
      activityType = 'move';
    } else if (activityType.includes('weight') || activityType.includes('strength') || 
               activityType.includes('lift') || activityType.includes('gym')) {
      activityType = 'lift';
    } else if (activityType.includes('yoga') || activityType.includes('stretch') || 
               activityType.includes('flow') || activityType.includes('pilates')) {
      activityType = 'flow';
    } else if (activityType.includes('rest') || activityType.includes('recovery')) {
      activityType = 'rest';
    }
    
    return activityType === todayActivity.type;
  });

  if (!targetUserId) return null;

  // Summary mode rendering
  if (mode === 'summary') {
    return (
      <View
        style={[
          tw(border.rounded, spacing.mb(6)),
          { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }
        ]}
      >
        {/* Header */}
        <View style={tw(spacing.p(4))}>
          <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.mb(4))}>
            <Text style={tw(text.sm, text.semibold, text.foreground(theme))}>
              Weekly Movement Summary
            </Text>
            <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2))}>
              <TouchableOpacity
                style={tw(spacing.p(1))}
                onPress={handlePreviousWeek}
              >
                <Ionicons name="chevron-back" size={16} color={colors.foreground} />
              </TouchableOpacity>
              <Text style={tw(text.xs, text.muted(theme))}>
                {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d')}
              </Text>
              <TouchableOpacity
                style={tw(spacing.p(1))}
                onPress={handleNextWeek}
                disabled={isCurrentWeek}
              >
                <Ionicons 
                  name="chevron-forward" 
                  size={16} 
                  color={isCurrentWeek ? colors.muted : colors.foreground} 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Week Progress Circles */}
          <View style={tw(layout.flexRow, layout.justifyBetween, spacing.mb(4))}>
            {weeklyPlan.map((day, index) => {
              const dayActivities = weeklyActivities.filter(activity => 
                isSameDay(new Date(activity.logged_at), new Date(day.date))
              );
              const hasActivity = dayActivities.length > 0;
              const dayDate = new Date(day.date);

              return (
                <View key={day.day} style={tw(layout.itemsCenter)}>
                  <View
                    style={[
                      tw(layout.itemsCenter, layout.justifyCenter, border.rounded, spacing.mb(1)),
                      {
                        width: 32,
                        height: 32,
                        backgroundColor: hasActivity ? colors.primary : colors.muted,
                        opacity: day.isPast ? 0.6 : 1,
                        borderWidth: isToday(dayDate) ? 2 : 0,
                        borderColor: isToday(dayDate) ? colors.accent : 'transparent',
                      }
                    ]}
                  >
                    <Text 
                      style={[
                        tw(text.xs, text.bold),
                        { color: hasActivity ? colors.primaryForeground : colors.foreground }
                      ]}
                    >
                      {format(dayDate, 'd')}
                    </Text>
                  </View>
                  <Text style={tw(text.xs, text.muted(theme))}>
                    {day.day}
                  </Text>
                </View>
              );
            })}
          </View>

          <Text style={tw(text.xs, text.muted(theme), text.center)}>
            {isCurrentWeek ? 'Current week activity consistency' : 'Week activity consistency'}
          </Text>
        </View>

        {/* Summary Statistics */}
        <View
          style={[
            tw(spacing.p(4)),
            { borderTopWidth: 1, borderTopColor: colors.border }
          ]}
        >
          <View style={tw(layout.flexRow, layout.justifyBetween, layout.itemsCenter)}>
            <View style={tw(layout.itemsCenter)}>
              <Text style={tw(text.lg, text.bold, text.primary(theme))}>
                {summaryStats.totalActivities}
              </Text>
              <Text style={tw(text.xs, text.muted(theme))}>
                Activities
              </Text>
            </View>
            <View style={tw(layout.itemsCenter)}>
              <Text style={tw(text.lg, text.bold, text.primary(theme))}>
                {summaryStats.activeDays}
              </Text>
              <Text style={tw(text.xs, text.muted(theme))}>
                Active Days
              </Text>
            </View>
            <View style={tw(layout.itemsCenter)}>
              <Text style={tw(text.lg, text.bold, text.primary(theme))}>
                {Math.round((summaryStats.activeDays / 7) * 100)}%
              </Text>
              <Text style={tw(text.xs, text.muted(theme))}>
                Consistency
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        tw(border.rounded, spacing.mb(6)),
        { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }
      ]}
    >
      {/* Header */}
      <View style={tw(spacing.p(4))}>
        <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.mb(4))}>
          <Text style={tw(text.sm, text.semibold, text.foreground(theme))}>
            Weekly Movement
          </Text>
          <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2))}>
            <TouchableOpacity
              style={tw(spacing.p(1))}
              onPress={handlePreviousWeek}
            >
              <Ionicons name="chevron-back" size={16} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={tw(text.xs, text.muted(theme))}>
              {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d')}
            </Text>
            <TouchableOpacity
              style={tw(spacing.p(1))}
              onPress={handleNextWeek}
              disabled={isCurrentWeek}
            >
              <Ionicons 
                name="chevron-forward" 
                size={16} 
                color={isCurrentWeek ? colors.muted : colors.foreground} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Week Progress Circles */}
        <View style={tw(layout.flexRow, layout.justifyBetween, spacing.mb(4))}>
          {weeklyPlan.map((day, index) => {
            const dayActivities = weeklyActivities.filter(activity => 
              isSameDay(new Date(activity.logged_at), new Date(day.date))
            );
            const hasActivity = dayActivities.length > 0 || day.activities.length > 0;
            const dayDate = new Date(day.date);

            return (
              <View key={day.day} style={tw(layout.itemsCenter)}>
                <TouchableOpacity
                  style={[
                    tw(layout.itemsCenter, layout.justifyCenter, border.rounded, spacing.mb(1)),
                    {
                      width: 32,
                      height: 32,
                      backgroundColor: hasActivity ? colors.primary : colors.muted,
                      opacity: day.isPast ? 0.6 : 1,
                      borderWidth: isToday(dayDate) ? 2 : 0,
                      borderColor: isToday(dayDate) ? colors.accent : 'transparent',
                    }
                  ]}
                  onPress={() => handleDayPress(index)}
                  disabled={day.isPast}
                >
                  <Text 
                    style={[
                      tw(text.xs, text.bold),
                      { color: hasActivity ? colors.primaryForeground : colors.foreground }
                    ]}
                  >
                    {format(dayDate, 'd')}
                  </Text>
                </TouchableOpacity>
                <Text style={tw(text.xs, text.muted(theme))}>
                  {day.day}
                </Text>
              </View>
            );
          })}
        </View>

        <Text style={tw(text.xs, text.muted(theme), text.center)}>
          {isCurrentWeek ? 'Current week activity consistency' : 'Week activity consistency'}
        </Text>
      </View>

      {/* Today's Planned Movement */}
      {showPlanning && isCurrentWeek && todayActivity && (
        <View
          style={[
            tw(spacing.p(4)),
            { borderTopWidth: 1, borderTopColor: colors.border }
          ]}
        >
          <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween)}>
            <Text style={tw(text.sm, text.medium, text.foreground(theme))}>
              Today's Planned Movement
            </Text>
            <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2))}>
              <View
                style={[
                  tw(layout.flexRow, layout.itemsCenter, spacing.gap(2), spacing.px(3), spacing.py(2), border.rounded),
                  { 
                    backgroundColor: getActivityStyle(todayActivity.type).backgroundColor,
                    borderWidth: 1,
                    borderColor: getActivityStyle(todayActivity.type).borderColor,
                  }
                ]}
              >
                <Text style={tw(text.sm)}>
                  {getActivityStyle(todayActivity.type).icon}
                </Text>
                <Text 
                  style={[
                    tw(text.sm, text.medium),
                    { color: getActivityStyle(todayActivity.type).color }
                  ]}
                >
                  {todayActivity.name}
                </Text>
                {isActivityCompleted && (
                  <View
                    style={[
                      tw(layout.itemsCenter, layout.justifyCenter, border.rounded),
                      {
                        width: 16,
                        height: 16,
                        backgroundColor: '#10B981',
                      }
                    ]}
                  >
                    <Ionicons name="checkmark" size={10} color="white" />
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Planning Section */}
      {showPlanning && isCurrentWeek && (
        <View
          style={[
            tw(spacing.p(4)),
            { borderTopWidth: 1, borderTopColor: colors.border }
          ]}
        >
          <TouchableOpacity
            style={tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.mb(4))}
            onPress={() => setIsPlanningOpen(!isPlanningOpen)}
          >
            <Text style={tw(text.sm, text.medium, text.foreground(theme))}>
              Plan Your Week
            </Text>
            <Ionicons 
              name={isPlanningOpen ? "chevron-up" : "chevron-down"} 
              size={16} 
              color={colors.foreground} 
            />
          </TouchableOpacity>

          {isPlanningOpen && (
            <View>
              {/* Activity Types */}
              <View style={tw(spacing.mb(6))}>
                <Text style={tw(text.sm, text.medium, text.foreground(theme), spacing.mb(3))}>
                  Tap an activity, then tap a day to plan:
                </Text>
                <View style={tw(layout.flexRow, layout.flexWrap, spacing.gap(2))}>
                  {ACTIVITY_TYPES.map((activity) => {
                    const style = getActivityStyle(activity.type);
                    const isSelected = draggedActivity?.id === activity.id;
                    
                    return (
                      <TouchableOpacity
                        key={activity.id}
                        style={[
                          tw(layout.flexRow, layout.itemsCenter, spacing.gap(2), spacing.px(3), spacing.py(2), border.rounded),
                          {
                            backgroundColor: isSelected ? style.color : style.backgroundColor,
                            borderWidth: 2,
                            borderColor: isSelected ? style.color : style.borderColor,
                          }
                        ]}
                        onPress={() => handleActivityPress(activity)}
                      >
                        <Text style={tw(text.sm)}>{style.icon}</Text>
                        <Text 
                          style={[
                            tw(text.sm, text.medium),
                            { color: isSelected ? 'white' : style.color }
                          ]}
                        >
                          {activity.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {draggedActivity && (
                  <Text style={tw(text.xs, text.muted(theme), spacing.mt(2))}>
                    Selected: {draggedActivity.name}. Now tap a day to add it.
                  </Text>
                )}
              </View>

              {/* Weekly Plan Grid */}
              <View style={tw(spacing.mb(6))}>
                <Text style={tw(text.sm, text.medium, text.foreground(theme), spacing.mb(3))}>
                  Weekly Plan:
                </Text>
                <View style={tw(spacing.gap(3))}>
                  {weeklyPlan.map((day, index) => (
                    <TouchableOpacity
                      key={day.day}
                      style={[
                        tw(spacing.p(3), border.rounded),
                        {
                          backgroundColor: day.isPast ? colors.muted : colors.background,
                          borderWidth: 2,
                          borderColor: draggedActivity ? colors.primary : colors.border,
                          borderStyle: draggedActivity ? 'dashed' : 'solid',
                          opacity: day.isPast ? 0.6 : 1,
                        }
                      ]}
                      onPress={() => handleDayPress(index)}
                      disabled={day.isPast}
                    >
                      <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.mb(2))}>
                        <Text style={tw(text.sm, text.bold, text.foreground(theme))}>
                          {day.day}
                        </Text>
                        <Text style={tw(text.xs, text.muted(theme))}>
                          {format(new Date(day.date), 'MMM d')}
                        </Text>
                      </View>
                      
                      <View style={tw(layout.flexRow, layout.flexWrap, spacing.gap(1))}>
                        {day.activities.map((activity, actIndex) => {
                          const style = getActivityStyle(activity.type);
                          return (
                            <View
                              key={activity.id}
                              style={[
                                tw(layout.flexRow, layout.itemsCenter, spacing.gap(1), spacing.px(2), spacing.py(1), border.rounded),
                                { backgroundColor: style.backgroundColor, borderWidth: 1, borderColor: style.borderColor }
                              ]}
                            >
                              <Text style={tw(text.xs)}>{style.icon}</Text>
                              <Text 
                                style={[
                                  tw(text.xs),
                                  { color: style.color }
                                ]}
                              >
                                {activity.name}
                              </Text>
                              {!activity.isLocked && (
                                <TouchableOpacity
                                  onPress={() => handleRemoveActivity(index, activity.id)}
                                >
                                  <Ionicons name="close" size={10} color={style.color} />
                                </TouchableOpacity>
                              )}
                            </View>
                          );
                        })}
                        {day.activities.length === 0 && (
                          <Text style={tw(text.xs, text.muted(theme))}>
                            {day.isPast ? 'No activities' : 'Tap to add activity'}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Save Button */}
              <TouchableOpacity
                style={[
                  tw(spacing.p(3), border.rounded, layout.itemsCenter),
                  { 
                    backgroundColor: savingPlan ? colors.muted : colors.primary,
                    opacity: savingPlan ? 0.6 : 1
                  }
                ]}
                onPress={handleSavePlan}
                disabled={savingPlan}
              >
                <Text style={[tw(text.sm, text.medium), { color: colors.primaryForeground }]}>
                  {savingPlan ? 'Saving...' : 'Save Plan'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
};