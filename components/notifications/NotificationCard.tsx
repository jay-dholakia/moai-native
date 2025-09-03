import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout, border } from '@/utils/styles';
import { Card, CardContent } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { NotificationWithDetails } from '@/services/notification-service';

interface NotificationCardProps {
  notification: NotificationWithDetails;
  onPress: (notification: NotificationWithDetails) => void;
  onDelete?: (notificationId: string) => void;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onPress,
  onDelete,
}) => {
  const { colors } = useTheme();
  
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'activity_tag':
        return '🏃‍♀️';
      case 'moai_invitation':
        return '👥';
      case 'moai_join':
        return '🎉';
      case 'activity_like':
        return '❤️';
      case 'badge_earned':
        return '🏆';
      case 'friend_request':
        return '👋';
      case 'workout_completed':
        return '💪';
      case 'milestone_reached':
        return '🎯';
      default:
        return '📱';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const notificationDate = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - notificationDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getRelatedUserInfo = () => {
    if (notification.activity_log?.profiles) {
      return notification.activity_log.profiles;
    }
    if (notification.moai?.profiles) {
      return notification.moai.profiles;
    }
    return null;
  };

  const relatedUser = getRelatedUserInfo();

  return (
    <TouchableOpacity onPress={() => onPress(notification)}>
      <Card style={[
        tw(spacing.mb(2)),
        {
          backgroundColor: notification.is_read 
            ? colors.background 
            : colors.primary + '08',
          borderLeftWidth: notification.is_read ? 0 : 3,
          borderLeftColor: notification.is_read ? 'transparent' : colors.primary,
        }
      ]}>
        <CardContent style={tw(spacing.p(4))}>
          <View style={tw(layout.flexRow, spacing.gap(3))}>
            {/* Notification Icon or User Avatar */}
            <View style={tw(layout.itemsCenter, layout.justifyCenter)}>
              {relatedUser ? (
                <Avatar 
                  source={relatedUser.profile_image ? { uri: relatedUser.profile_image } : undefined}
                  fallback={relatedUser.first_name?.[0] || 'U'}
                  size={40}
                />
              ) : (
                <View style={[
                  tw(spacing.w(10), spacing.h(10), layout.itemsCenter, layout.justifyCenter, border.rounded),
                  { backgroundColor: colors.muted }
                ]}>
                  <Text style={tw(text.lg)}>
                    {getNotificationIcon(notification.type)}
                  </Text>
                </View>
              )}
            </View>
            
            {/* Notification Content */}
            <View style={tw(layout.flex1)}>
              <Text style={[
                tw(text.sm),
                { 
                  color: colors.foreground,
                  fontWeight: notification.is_read ? 'normal' : '600'
                }
              ]}>
                {notification.content}
              </Text>
              
              {/* Additional context for specific notification types */}
              {notification.activity_log && (
                <Text style={[tw(text.xs, spacing.mt(1)), { color: colors.mutedForeground }]}>
                  {notification.activity_log.emoji} {notification.activity_log.activity_type}
                  {notification.activity_log.notes && ` - ${notification.activity_log.notes}`}
                </Text>
              )}
              
              {notification.moai && (
                <Text style={[tw(text.xs, spacing.mt(1)), { color: colors.mutedForeground }]}>
                  Moai: {notification.moai.name}
                </Text>
              )}
              
              <Text style={[tw(text.xs, spacing.mt(2)), { color: colors.mutedForeground }]}>
                {formatTimeAgo(notification.created_at)}
              </Text>
            </View>
            
            {/* Unread indicator */}
            {!notification.is_read && (
              <View style={[
                tw(spacing.w(2), spacing.h(2), border.rounded),
                { backgroundColor: colors.primary }
              ]} />
            )}
            
            {/* Delete button (optional) */}
            {onDelete && (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  onDelete(notification.id);
                }}
                style={tw(spacing.p(1))}
              >
                <Text style={[tw(text.lg), { color: colors.mutedForeground }]}>
                  ×
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </CardContent>
      </Card>
    </TouchableOpacity>
  );
};