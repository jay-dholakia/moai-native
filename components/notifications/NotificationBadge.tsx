import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout, border } from '@/utils/styles';
import { useUnreadCount } from '@/hooks/use-notifications';

interface NotificationBadgeProps {
  showZero?: boolean;
  size?: 'small' | 'medium' | 'large';
  style?: any;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  showZero = false,
  size = 'medium',
  style,
}) => {
  const { colors } = useTheme();
  const { data: unreadCount = 0 } = useUnreadCount();
  
  if (!showZero && unreadCount === 0) {
    return null;
  }
  
  const sizeStyles = {
    small: {
      container: tw(spacing.w(4), spacing.h(4)),
      text: tw(text.xs),
      minWidth: 16,
    },
    medium: {
      container: tw(spacing.w(5), spacing.h(5)),
      text: tw(text.xs),
      minWidth: 20,
    },
    large: {
      container: tw(spacing.w(6), spacing.h(6)),
      text: tw(text.sm),
      minWidth: 24,
    },
  };
  
  const styles = sizeStyles[size];
  
  return (
    <View style={[
      styles.container,
      tw(layout.itemsCenter, layout.justifyCenter, border.rounded),
      {
        backgroundColor: colors.destructive,
        minWidth: styles.minWidth,
      },
      style,
    ]}>
      <Text style={[
        styles.text,
        tw(text.bold),
        { color: colors.destructiveForeground }
      ]}>
        {unreadCount > 99 ? '99+' : unreadCount.toString()}
      </Text>
    </View>
  );
};