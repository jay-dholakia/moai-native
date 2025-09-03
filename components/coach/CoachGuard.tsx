import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout } from '@/utils/styles';
import { useIsCoach } from '@/hooks/use-coach-platform';
import { Ionicons } from '@expo/vector-icons';

export interface CoachGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loading?: React.ReactNode;
}

export const CoachGuard: React.FC<CoachGuardProps> = ({
  children,
  fallback,
  loading,
}) => {
  const { colors } = useTheme();
  const { data: isCoach, isLoading, error } = useIsCoach();

  if (isLoading) {
    return loading || (
      <View style={tw(layout.flex1, layout.itemsCenter, layout.justifyCenter)}>
        <Text style={[tw(text.base), { color: colors.mutedForeground }]}>
          Checking coach status...
        </Text>
      </View>
    );
  }

  if (error || !isCoach) {
    return fallback || (
      <View style={tw(layout.flex1, layout.itemsCenter, layout.justifyCenter, spacing.p(6))}>
        <Ionicons name="shield-outline" size={48} color={colors.border} />
        <Text style={[tw(text.base, text.center, spacing.mt(4)), { color: colors.foreground }]}>
          Coach Access Required
        </Text>
        <Text style={[tw(text.sm, text.center, spacing.mt(2)), { color: colors.mutedForeground }]}>
          This feature is only available to certified coaches
        </Text>
      </View>
    );
  }

  return <>{children}</>;
};

export default CoachGuard;