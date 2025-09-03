import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { tw, spacing, layout, text, border } from '@/utils/styles';
import { useTheme } from '@/providers/theme-provider';
import { ActivityLog } from '@/services/activity-log-service';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Tokens';

interface ActivityLogCardProps {
  activity: ActivityLog;
  onPress?: () => void;
  showActions?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ActivityLogCard({ 
  activity, 
  onPress, 
  showActions = false,
  onEdit,
  onDelete 
}: ActivityLogCardProps) {
  const { colors: themeColors } = useTheme();

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return null;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getActivityIcon = (activityType: string) => {
    const iconMap: Record<string, string> = {
      workout: 'fitness',
      running: 'walk',
      cycling: 'bicycle',
      swimming: 'water',
      yoga: 'leaf',
      stretching: 'body',
      cardio: 'heart',
      strength: 'barbell',
    };
    
    return iconMap[activityType.toLowerCase()] || 'fitness';
  };

  const getMuscleGroupColor = (muscleGroup: string) => {
    const colorMap: Record<string, string> = {
      chest: Colors.moai.coral,
      back: Colors.light.primary,
      shoulders: Colors.moai.yellow,
      arms: Colors.light.success,
      legs: Colors.moai.purple,
      core: Colors.moai.orange,
    };
    
    return colorMap[muscleGroup.toLowerCase()] || Colors.light.mutedForeground;
  };

  const formatDistanceToNow = (date: Date) => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <TouchableOpacity onPress={onPress} disabled={!onPress}>
      <Card elevation="sm">
        <View style={tw(spacing.p(4))}>
          {/* Header */}
          <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.mb(3))}>
            <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(3))}>
              <View
                style={[
                  tw(spacing.w(10), spacing.h(10), border.roundedFull, layout.itemsCenter, layout.justifyCenter),
                  { backgroundColor: themeColors.secondary }
                ]}
              >
                <Text style={tw(text.lg)}>{activity.emoji}</Text>
              </View>
              
              <View style={tw(layout.flex1)}>
                <Text style={tw(text.base, text.semibold)}>
                  {activity.activity_type.charAt(0).toUpperCase() + activity.activity_type.slice(1)}
                </Text>
                <Text style={tw(text.sm, text.muted)}>
                  {formatDistanceToNow(new Date(activity.logged_at))}
                </Text>
              </View>
            </View>

            {showActions && (
              <View style={tw(layout.flexRow, spacing.gap(2))}>
                {onEdit && (
                  <TouchableOpacity
                    onPress={onEdit}
                    style={tw(spacing.p(2))}
                  >
                    <Ionicons name="pencil" size={16} color={themeColors.foreground} />
                  </TouchableOpacity>
                )}
                {onDelete && (
                  <TouchableOpacity
                    onPress={onDelete}
                    style={tw(spacing.p(2))}
                  >
                    <Ionicons name="trash" size={16} color={Colors.light.destructive} />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* Duration and Stats */}
          {activity.duration_minutes && (
            <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2), spacing.mb(2))}>
              <Ionicons name="time" size={16} color={themeColors.muted} />
              <Text style={tw(text.sm, text.muted)}>
                {formatDuration(activity.duration_minutes)}
              </Text>
            </View>
          )}

          {/* Muscle Groups */}
          {activity.muscle_groups && activity.muscle_groups.length > 0 && (
            <View style={tw(layout.flexRow, layout.flexWrap, spacing.gap(1), spacing.mb(2))}>
              {activity.muscle_groups.map((group, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  size="sm"
                  style={[
                    tw(border.border),
                    { borderColor: getMuscleGroupColor(group) }
                  ]}
                >
                  {group}
                </Badge>
              ))}
            </View>
          )}

          {/* Workout Details */}
          {activity.activity_partners && Array.isArray(activity.activity_partners) && activity.activity_partners.length > 0 && activity.activity_partners[0].exercises_completed && (
            <View style={tw(spacing.mb(2))}>
              <Text style={tw(text.sm, text.muted)}>
                {activity.activity_partners[0].exercises_completed} / {activity.activity_partners[0].total_exercises} exercises completed
              </Text>
            </View>
          )}

          {/* Notes */}
          {activity.notes && (
            <View 
              style={[
                tw(spacing.p(3), spacing.mt(2), border.rounded, border.borderL),
                { 
                  backgroundColor: themeColors.muted,
                  borderLeftColor: themeColors.primary,
                  borderLeftWidth: 3
                }
              ]}
            >
              <Text style={tw(text.sm)}>
                {activity.notes}
              </Text>
            </View>
          )}

          {/* Location */}
          {activity.location && (
            <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2), spacing.mt(2))}>
              <Ionicons name="location" size={16} color={themeColors.muted} />
              <Text style={tw(text.sm, text.muted)}>
                {activity.location}
              </Text>
            </View>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );
}