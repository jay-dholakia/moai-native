import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout, border } from '@/utils/styles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useBadges } from '@/hooks/use-badges';

interface BadgeProgressProps {
  totalActivities: number;
  compact?: boolean;
}

export const BadgeProgress: React.FC<BadgeProgressProps> = ({
  totalActivities,
  compact = false,
}) => {
  const { colors } = useTheme();
  const { currentBadge, nextBadge, progress } = useBadges(totalActivities);
  
  if (compact) {
    return (
      <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(3))}>
        {/* Current Badge */}
        {currentBadge && (
          <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2))}>
            <View style={[
              tw(spacing.w(8), spacing.h(8), layout.itemsCenter, layout.justifyCenter, border.rounded),
              {
                backgroundColor: colors.primary + '20',
                borderWidth: 1,
                borderColor: colors.primary,
              }
            ]}>
              <Text style={tw(text.sm)}>{currentBadge.icon}</Text>
            </View>
            <Text style={[tw(text.sm, text.medium), { color: colors.foreground }]}>
              {currentBadge.name}
            </Text>
          </View>
        )}
        
        {/* Progress to Next */}
        {nextBadge && (
          <View style={tw(layout.flex1, spacing.ml(2))}>
            <View style={[
              tw(spacing.h(2), border.rounded),
              { backgroundColor: colors.muted }
            ]}>
              <View style={[
                tw(layout.hFull, border.rounded),
                {
                  backgroundColor: colors.primary,
                  width: `${Math.min(progress, 100)}%`,
                }
              ]} />
            </View>
            <Text style={[
              tw(text.xs, spacing.mt(1)),
              { color: colors.mutedForeground }
            ]}>
              {totalActivities}/{nextBadge.level} to {nextBadge.name}
            </Text>
          </View>
        )}
      </View>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Badge Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <View style={tw(spacing.gap(4))}>
          {/* Current Badge Display */}
          {currentBadge ? (
            <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(3))}>
              <View style={[
                tw(spacing.w(12), spacing.h(12), layout.itemsCenter, layout.justifyCenter, border.rounded),
                {
                  backgroundColor: colors.primary + '20',
                  borderWidth: 2,
                  borderColor: colors.primary,
                }
              ]}>
                <Text style={tw(text.lg)}>{currentBadge.icon}</Text>
              </View>
              <View style={tw(layout.flex1)}>
                <Text style={[tw(text.lg, text.semibold), { color: colors.foreground }]}>
                  {currentBadge.name}
                </Text>
                <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                  {currentBadge.description}
                </Text>
                <Text style={[tw(text.xs, spacing.mt(1)), { color: colors.mutedForeground }]}>
                  {totalActivities} activities completed
                </Text>
              </View>
            </View>
          ) : (
            <View style={tw(layout.itemsCenter, spacing.py(4))}>
              <Text style={[tw(text.base), { color: colors.mutedForeground }]}>
                Complete your first activity to earn your first badge!
              </Text>
            </View>
          )}
          
          {/* Progress to Next Badge */}
          {nextBadge && (
            <View style={tw(spacing.gap(3))}>
              <View style={tw(layout.flexRow, layout.itemsBetween)}>
                <Text style={[tw(text.sm, text.medium), { color: colors.foreground }]}>
                  Next: {nextBadge.name}
                </Text>
                <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                  {totalActivities}/{nextBadge.level}
                </Text>
              </View>
              
              {/* Progress Bar */}
              <View style={[
                tw(spacing.h(3), border.rounded),
                { backgroundColor: colors.muted }
              ]}>
                <View style={[
                  tw(layout.hFull, border.rounded),
                  {
                    backgroundColor: colors.primary,
                    width: `${Math.min(progress, 100)}%`,
                  }
                ]} />
              </View>
              
              <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2))}>
                <Text style={tw(text.lg)}>{nextBadge.icon}</Text>
                <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                  {nextBadge.description}
                </Text>
              </View>
              
              <Text style={[tw(text.xs, text.center), { color: colors.mutedForeground }]}>
                {nextBadge.level - totalActivities} more activities to unlock
              </Text>
            </View>
          )}
          
          {/* Max Level Reached */}
          {!nextBadge && currentBadge && (
            <View style={tw(layout.itemsCenter, spacing.py(4))}>
              <Text style={[tw(text.base, text.center), { color: colors.primary }]}>
                🎉 Congratulations! You've earned the highest badge!
              </Text>
            </View>
          )}
        </View>
      </CardContent>
    </Card>
  );
};