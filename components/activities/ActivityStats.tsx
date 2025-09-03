import React from 'react';
import { View, Text } from 'react-native';
import { Card } from '@/components/ui/Card';
import { tw, spacing, layout, text, border } from '@/utils/styles';
import { Colors } from '@/constants/Tokens';
import { useTheme } from '@/providers/theme-provider';
import { ActivityStats as ActivityStatsType } from '@/services/activity-log-service';
import { Ionicons } from '@expo/vector-icons';

interface ActivityStatsProps {
  stats: ActivityStatsType | null;
  isLoading?: boolean;
}

export function ActivityStats({ stats, isLoading }: ActivityStatsProps) {
  const { colors: themeColors } = useTheme();

  if (isLoading) {
    return (
      <Card elevation="sm">
        <View style={tw(spacing.p(4))}>
          <Text style={tw(text.base, text.muted)}>Loading stats...</Text>
        </View>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card elevation="sm">
        <View style={tw(spacing.p(4), layout.itemsCenter, layout.justifyCenter)}>
          <Ionicons name="bar-chart" size={48} color={themeColors.muted} />
          <Text style={tw(text.base, text.center, text.muted, spacing.mt(2))}>
            No activity data yet
          </Text>
          <Text style={tw(text.sm, text.center, text.muted)}>
            Start logging workouts to see your stats!
          </Text>
        </View>
      </Card>
    );
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getStreakEmoji = (streak: number) => {
    if (streak === 0) return '🎯';
    if (streak < 7) return '🔥';
    if (streak < 30) return '🔥🔥';
    return '🔥🔥🔥';
  };

  const getStreakMessage = (streak: number) => {
    if (streak === 0) return 'Start your streak!';
    if (streak === 1) return 'Great start!';
    if (streak < 7) return 'Keep it up!';
    if (streak < 30) return 'You\'re on fire!';
    return 'Legendary streak!';
  };

  return (
    <View style={tw(spacing.gap(4))}>
      {/* Streak Card */}
      <Card elevation="md">
        <View style={tw(spacing.p(4), layout.itemsCenter, layout.justifyCenter)}>
          <Text style={tw(text['5xl'], text.center)}>
            {getStreakEmoji(stats.currentStreak)}
          </Text>
          <Text style={tw(text['3xl'], text.center, text.semibold, spacing.mt(2))}>
            {stats.currentStreak} Day Streak
          </Text>
          <Text style={tw(text.sm, text.center, text.muted)}>
            {getStreakMessage(stats.currentStreak)}
          </Text>
        </View>
      </Card>

      {/* Stats Grid */}
      <View style={tw(layout.flexRow, spacing.gap(4))}>
        {/* Total Activities */}
        <Card elevation="sm" style={tw(layout.flex1)}>
          <View style={tw(spacing.p(4), layout.itemsCenter, layout.justifyCenter)}>
            <Ionicons 
              name="fitness" 
              size={24} 
              color={themeColors.primary} 
              style={tw(spacing.mb(2))}
            />
            <Text style={tw(text['2xl'], text.semibold, text.center)}>
              {stats.totalActivities}
            </Text>
            <Text style={tw(text.sm, text.center, text.muted)}>
              Total Activities
            </Text>
          </View>
        </Card>

        {/* Weekly Activities */}
        <Card elevation="sm" style={tw(layout.flex1)}>
          <View style={tw(spacing.p(4), layout.itemsCenter, layout.justifyCenter)}>
            <Ionicons 
              name="calendar" 
              size={24} 
              color={Colors.light.success} 
              style={tw(spacing.mb(2))}
            />
            <Text style={tw(text['2xl'], text.semibold, text.center)}>
              {stats.weeklyActivities}
            </Text>
            <Text style={tw(text.sm, text.center, text.muted)}>
              This Week
            </Text>
          </View>
        </Card>
      </View>

      <View style={tw(layout.flexRow, spacing.gap(4))}>
        {/* Total Duration */}
        <Card elevation="sm" style={tw(layout.flex1)}>
          <View style={tw(spacing.p(4), layout.itemsCenter, layout.justifyCenter)}>
            <Ionicons 
              name="time" 
              size={24} 
              color={Colors.light.primary} 
              style={tw(spacing.mb(2))}
            />
            <Text style={tw(text.base, text.semibold, text.center)}>
              {formatDuration(stats.totalDuration)}
            </Text>
            <Text style={tw(text.sm, text.center, text.muted)}>
              Total Time
            </Text>
          </View>
        </Card>

        {/* Favorite Activity */}
        <Card elevation="sm" style={tw(layout.flex1)}>
          <View style={tw(spacing.p(4), layout.itemsCenter, layout.justifyCenter)}>
            <Ionicons 
              name="heart" 
              size={24} 
              color={Colors.light.destructive} 
              style={tw(spacing.mb(2))}
            />
            <Text style={tw(text.base, text.semibold, text.center)}>
              {stats.favoriteActivity ? 
                stats.favoriteActivity.charAt(0).toUpperCase() + stats.favoriteActivity.slice(1) :
                'None yet'
              }
            </Text>
            <Text style={tw(text.sm, text.center, text.muted)}>
              Favorite
            </Text>
          </View>
        </Card>
      </View>

      {/* Recent Activities */}
      {stats.recentActivities && stats.recentActivities.length > 0 && (
        <Card elevation="sm">
          <View style={tw(spacing.p(4))}>
            <Text style={tw(text.base, text.semibold, spacing.mb(3))}>
              Recent Activities
            </Text>
            <View style={tw(spacing.gap(2))}>
              {stats.recentActivities.slice(0, 3).map((activity, index) => (
                <View 
                  key={activity.id}
                  style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(3))}
                >
                  <Text style={tw(text.base)}>{activity.emoji}</Text>
                  <View style={tw(layout.flex1)}>
                    <Text style={tw(text.sm)}>
                      {activity.activity_type.charAt(0).toUpperCase() + activity.activity_type.slice(1)}
                    </Text>
                    {activity.duration_minutes && (
                      <Text style={tw(text.xs, text.muted)}>
                        {formatDuration(activity.duration_minutes)}
                      </Text>
                    )}
                  </View>
                  <Text style={tw(text.xs, text.muted)}>
                    {new Date(activity.logged_at).toLocaleDateString()}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </Card>
      )}
    </View>
  );
}