import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { ChevronLeft, ChevronRight, Heart, Dumbbell, Waves, Coffee, Check } from 'lucide-react-native';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout, border } from '@/utils/styles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';
import { useActivityLogs } from '@/hooks/use-activity-logs';

interface WeeklyActivityProgressProps {
  userId?: string;
  onWeekChange?: (offset: number) => void;
  weekOffset?: number;
  showPlanning?: boolean;
}

interface ActivityCard {
  id: string;
  type: 'move' | 'lift' | 'flow' | 'rest';
  name: string;
  isLocked?: boolean;
}

interface DayData {
  date: Date;
  dayName: string;
  dayNumber: number;
  isToday: boolean;
  isPast: boolean;
  activities: ActivityCard[];
  plannedActivities: ActivityCard[];
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'move': return Heart;
    case 'lift': return Dumbbell;
    case 'flow': return Waves;
    case 'rest': return Coffee;
    default: return Heart;
  }
};

const getActivityColor = (type: string) => {
  switch (type) {
    case 'move': return '#EC4899'; // pink-500
    case 'lift': return '#F97316'; // orange-500
    case 'flow': return '#3B82F6'; // blue-500
    case 'rest': return '#F59E0B'; // amber-500
    default: return '#6B7280'; // gray-500
  }
};

export const WeeklyActivityProgress: React.FC<WeeklyActivityProgressProps> = ({
  userId,
  onWeekChange,
  weekOffset = 0,
  showPlanning = false
}) => {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [currentWeekOffset, setCurrentWeekOffset] = useState(weekOffset);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [plannedActivities, setPlannedActivities] = useState<Record<number, ActivityCard[]>>({});

  // Mock activities data - replace with actual hook data
  const { activities = [], isLoading } = useActivityLogs();

  // Generate week data
  const weekData = useMemo(() => {
    const today = new Date();
    const currentDate = new Date(today);
    currentDate.setDate(today.getDate() + (currentWeekOffset * 7));
    
    const startOfWeek = new Date(currentDate);
    const dayOfWeek = startOfWeek.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startOfWeek.setDate(startOfWeek.getDate() + mondayOffset);

    const days: DayData[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const isToday = date.toDateString() === today.toDateString();
      const isPast = date < today && !isToday;
      
      days.push({
        date,
        dayName: dayNames[date.getDay()],
        dayNumber: date.getDate(),
        isToday,
        isPast,
        activities: [], // Mock logged activities
        plannedActivities: plannedActivities[i] || []
      });
    }
    
    return days;
  }, [currentWeekOffset, plannedActivities]);

  const handleWeekNavigation = (direction: 'prev' | 'next') => {
    const newOffset = direction === 'prev' ? currentWeekOffset - 1 : currentWeekOffset + 1;
    setCurrentWeekOffset(newOffset);
    onWeekChange?.(newOffset);
  };

  const handleDayToggle = (dayIndex: number) => {
    setExpandedDay(expandedDay === dayIndex ? null : dayIndex);
  };

  const getWeekDisplayText = () => {
    if (currentWeekOffset === 0) return 'This Week';
    if (currentWeekOffset === 1) return 'Next Week';
    if (currentWeekOffset === -1) return 'Last Week';
    return `Week ${currentWeekOffset > 0 ? '+' : ''}${currentWeekOffset}`;
  };

  const weekProgress = weekData.reduce((acc, day) => {
    return acc + (day.activities.length > 0 ? 1 : 0);
  }, 0);

  if (isLoading) {
    return (
      <Card style={tw(spacing.mb(4))}>
        <CardContent style={tw(spacing.p(4))}>
          <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
            Loading weekly progress...
          </Text>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card style={tw(spacing.mb(4))}>
      <CardHeader>
        <View style={tw(layout.flexRow, layout.justifyBetween, layout.itemsCenter)}>
          <View>
            <CardTitle style={tw(text.base)}>Weekly Progress</CardTitle>
            <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
              {weekProgress}/7 days active
            </Text>
          </View>
          
          <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2))}>
            <TouchableOpacity onPress={() => handleWeekNavigation('prev')}>
              <ChevronLeft size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
            <Text style={[tw(text.sm), { color: colors.foreground }]}>
              {getWeekDisplayText()}
            </Text>
            <TouchableOpacity onPress={() => handleWeekNavigation('next')}>
              <ChevronRight size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </View>
      </CardHeader>
      
      <CardContent>
        {/* Week Overview */}
        <View style={tw(layout.flexRow, spacing.gap(1), spacing.mb(4))}>
          {weekData.map((day, index) => {
            const hasActivity = day.activities.length > 0;
            const hasPlanned = day.plannedActivities.length > 0;
            
            return (
              <TouchableOpacity
                key={index}
                onPress={() => handleDayToggle(index)}
                style={tw(layout.flex1)}
                activeOpacity={0.7}
              >
                <View style={tw(layout.itemsCenter, spacing.gap(1))}>
                  <Text style={[
                    tw(text.xs),
                    { 
                      color: day.isToday 
                        ? colors.primary 
                        : colors.mutedForeground 
                    }
                  ]}>
                    {day.dayName}
                  </Text>
                  <Text style={[
                    tw(text.xs),
                    { 
                      color: day.isToday 
                        ? colors.primary 
                        : colors.foreground 
                    }
                  ]}>
                    {day.dayNumber}
                  </Text>
                  
                  <View 
                    style={[
                      tw(spacing.w(8), spacing.h(8), border.rounded, layout.itemsCenter, layout.justifyCenter),
                      {
                        backgroundColor: hasActivity 
                          ? colors.primary 
                          : hasPlanned 
                            ? colors.muted 
                            : colors.muted,
                        borderWidth: day.isToday ? 2 : 0,
                        borderColor: colors.primary
                      }
                    ]}
                  >
                    {hasActivity ? (
                      <Check size={12} color={colors.primaryForeground} />
                    ) : hasPlanned ? (
                      <Text style={[tw(text.xs), { color: colors.mutedForeground }]}>
                        {day.plannedActivities.length}
                      </Text>
                    ) : null}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Expanded Day Details */}
        {expandedDay !== null && (
          <View style={tw(spacing.mt(4), spacing.pt(4), { borderTopWidth: 1, borderTopColor: colors.border })}>
            <Text style={[tw(text.sm, text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
              {weekData[expandedDay].dayName}, {weekData[expandedDay].date.toLocaleDateString()}
            </Text>
            
            {weekData[expandedDay].activities.length > 0 ? (
              <View style={tw(spacing.gap(2))}>
                {weekData[expandedDay].activities.map((activity, actIndex) => {
                  const IconComponent = getActivityIcon(activity.type);
                  return (
                    <View 
                      key={actIndex}
                      style={[
                        tw(layout.flexRow, layout.itemsCenter, spacing.gap(2), spacing.p(2), border.rounded),
                        { backgroundColor: colors.muted }
                      ]}
                    >
                      <IconComponent size={16} color={getActivityColor(activity.type)} />
                      <Text style={[tw(text.sm), { color: colors.foreground }]}>
                        {activity.name}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ) : showPlanning && weekData[expandedDay].plannedActivities.length > 0 ? (
              <View style={tw(spacing.gap(2))}>
                <Text style={[tw(text.xs, spacing.mb(1)), { color: colors.mutedForeground }]}>
                  Planned Activities:
                </Text>
                {weekData[expandedDay].plannedActivities.map((activity, actIndex) => {
                  const IconComponent = getActivityIcon(activity.type);
                  return (
                    <View 
                      key={actIndex}
                      style={[
                        tw(layout.flexRow, layout.itemsCenter, spacing.gap(2), spacing.p(2), border.rounded),
                        { backgroundColor: colors.muted, opacity: 0.7 }
                      ]}
                    >
                      <IconComponent size={16} color={getActivityColor(activity.type)} />
                      <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                        {activity.name}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ) : (
              <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                No activities logged for this day
              </Text>
            )}
          </View>
        )}

        {showPlanning && (
          <View style={tw(spacing.mt(4))}>
            <Text style={[tw(text.sm, spacing.mb(2)), { color: colors.mutedForeground }]}>
              Drag and drop planning coming soon!
            </Text>
          </View>
        )}
      </CardContent>
    </Card>
  );
};

export default WeeklyActivityProgress;