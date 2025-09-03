import React from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout } from '@/utils/styles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { NotificationCard } from './NotificationCard';
import { useNotificationManager } from '@/hooks/use-notifications';

interface NotificationListProps {
  onNavigate?: (notification: any) => void;
  maxHeight?: number;
  showHeader?: boolean;
  allowDelete?: boolean;
}

export const NotificationList: React.FC<NotificationListProps> = ({
  onNavigate,
  maxHeight,
  showHeader = true,
  allowDelete = false,
}) => {
  const { colors } = useTheme();
  const {
    notifications,
    unreadCount,
    isLoading,
    markAllAsRead,
    deleteNotification,
    handleNotificationPress,
    refetch,
  } = useNotificationManager();
  
  const handleNotificationCardPress = (notification: any) => {
    handleNotificationPress(notification);
    onNavigate?.(notification);
  };
  
  return (
    <Card>
      {showHeader && (
        <CardHeader>
          <View style={tw(layout.flexRow, layout.itemsBetween)}>
            <CardTitle>
              Notifications
              {unreadCount > 0 && (
                <Text style={[tw(text.sm), { color: colors.primary }]}>
                  {' '}({unreadCount} new)
                </Text>
              )}
            </CardTitle>
            
            {unreadCount > 0 && (
              <TouchableOpacity onPress={() => markAllAsRead()}>
                <Text style={[tw(text.sm), { color: colors.primary }]}>
                  Mark all read
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </CardHeader>
      )}
      
      <CardContent style={tw(spacing.p(0))}>
        {notifications.length === 0 ? (
          <View style={tw(layout.itemsCenter, spacing.py(8), spacing.px(4))}>
            <Text style={[tw(text.lg, spacing.mb(2)), { color: colors.mutedForeground }]}>
              📱
            </Text>
            <Text style={[tw(text.base, text.center), { color: colors.foreground }]}>
              No notifications yet
            </Text>
            <Text style={[tw(text.sm, text.center, spacing.mt(1)), { color: colors.mutedForeground }]}>
              We'll notify you when something interesting happens
            </Text>
          </View>
        ) : (
          <ScrollView
            style={maxHeight ? { maxHeight } : undefined}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={refetch}
                tintColor={colors.primary}
              />
            }
            contentContainerStyle={tw(spacing.p(4))}
          >
            {notifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onPress={handleNotificationCardPress}
                onDelete={allowDelete ? deleteNotification : undefined}
              />
            ))}
            
            {notifications.length > 0 && (
              <View style={tw(layout.itemsCenter, spacing.py(4))}>
                <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                  {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
                </Text>
              </View>
            )}
          </ScrollView>
        )}
      </CardContent>
    </Card>
  );
};