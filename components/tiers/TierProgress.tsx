import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout, border } from '@/utils/styles';
import { Card } from '@/components/ui/Card';
import { TierBadge } from './TierBadge';
import { UserTierStatus } from '@/services/tier-system-service';
import { useTierRequirements } from '@/hooks/use-tier-system';

export interface TierProgressProps {
  tierStatus: UserTierStatus;
  compact?: boolean;
  showNextTier?: boolean;
}

export const TierProgress: React.FC<TierProgressProps> = ({
  tierStatus,
  compact = false,
  showNextTier = true,
}) => {
  const { colors } = useTheme();
  const { getTierColor } = useTierRequirements();

  const {
    currentTier,
    consecutiveWeeks,
    currentWeekProgress,
    currentWeekCommitment,
    nextTierRequirements,
    canPromote,
  } = tierStatus;

  const progressPercentage = nextTierRequirements
    ? Math.min((consecutiveWeeks / nextTierRequirements.consecutiveWeeksRequired) * 100, 100)
    : 100;

  const weekProgressPercentage = Math.min((currentWeekProgress / currentWeekCommitment) * 100, 100);

  if (compact) {
    return (
      <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(4))}>
        <TierBadge 
          tier={currentTier} 
          size="sm" 
          showLabel={false}
          consecutiveWeeks={consecutiveWeeks}
        />
        
        <View style={tw(layout.flex1)}>
          <View style={tw(layout.flexRow, layout.justifyBetween, layout.itemsCenter, spacing.mb(1))}>
            <Text style={[tw(text.sm, text.semibold), { color: colors.foreground }]}>
              {currentTier.toUpperCase()} Tier
            </Text>
            {nextTierRequirements && (
              <Text style={[tw(text.xs), { color: colors.mutedForeground }]}>
                {consecutiveWeeks}/{nextTierRequirements.consecutiveWeeksRequired} weeks
              </Text>
            )}
          </View>
          
          {/* Progress Bar */}
          <View 
            style={[
              tw(spacing.h(2), border.rounded),
              { backgroundColor: colors.muted }
            ]}
          >
            <View 
              style={[
                tw(layout.hFull, border.rounded),
                {
                  backgroundColor: getTierColor(currentTier),
                  width: `${progressPercentage}%`,
                }
              ]} 
            />
          </View>
          
          {/* Current Week Progress */}
          <Text style={[tw(text.xs, spacing.mt(1)), { color: colors.mutedForeground }]}>
            This week: {currentWeekProgress}/{currentWeekCommitment} activities
          </Text>
        </View>
      </View>
    );
  }

  return (
    <Card elevation="sm">
      <View style={tw(spacing.p(4))}>
        {/* Header */}
        <View style={tw(layout.flexRow, layout.justifyBetween, layout.itemsCenter, spacing.mb(4))}>
          <Text style={[tw(text.lg, text.semibold), { color: colors.foreground }]}>
            Tier Progress
          </Text>
          {canPromote && (
            <View 
              style={[
                tw(spacing.px(2), spacing.py(1), border.rounded),
                { backgroundColor: colors.primary + '20' }
              ]}
            >
              <Text style={[tw(text.xs, text.semibold), { color: colors.primary }]}>
                PROMOTION READY!
              </Text>
            </View>
          )}
        </View>

        {/* Current Tier Display */}
        <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(4), spacing.mb(6))}>
          <TierBadge 
            tier={currentTier} 
            size="lg" 
            consecutiveWeeks={consecutiveWeeks}
          />
          
          <View style={tw(layout.flex1)}>
            <Text style={[tw(text.base), { color: colors.mutedForeground }]}>
              You've maintained {currentTier.toUpperCase()} tier for
            </Text>
            <Text style={[tw(text.xl, text.semibold), { color: colors.foreground }]}>
              {consecutiveWeeks} consecutive week{consecutiveWeeks !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        {/* Current Week Progress */}
        <View style={tw(spacing.mb(6))}>
          <View style={tw(layout.flexRow, layout.justifyBetween, layout.itemsCenter, spacing.mb(2))}>
            <Text style={[tw(text.sm, text.semibold), { color: colors.foreground }]}>
              This Week's Progress
            </Text>
            <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
              {currentWeekProgress}/{currentWeekCommitment} activities
            </Text>
          </View>
          
          <View 
            style={[
              tw(spacing.h(3), border.rounded),
              { backgroundColor: colors.muted }
            ]}
          >
            <View 
              style={[
                tw(layout.hFull, border.rounded),
                {
                  backgroundColor: weekProgressPercentage >= 100 ? colors.primary : getTierColor(currentTier),
                  width: `${weekProgressPercentage}%`,
                }
              ]} 
            />
          </View>
          
          <Text style={[tw(text.xs, spacing.mt(1), text.center), { color: colors.mutedForeground }]}>
            {currentWeekCommitment - currentWeekProgress > 0 
              ? `${currentWeekCommitment - currentWeekProgress} more activities needed this week`
              : 'Week commitment completed! 🎉'
            }
          </Text>
        </View>

        {/* Next Tier Preview */}
        {showNextTier && nextTierRequirements && (
          <View>
            <Text style={[tw(text.sm, text.semibold, spacing.mb(3)), { color: colors.foreground }]}>
              Next Tier: {nextTierRequirements.level.toUpperCase()}
            </Text>
            
            <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(4))}>
              <TierBadge 
                tier={nextTierRequirements.level} 
                size="md" 
                showLabel={false}
              />
              
              <View style={tw(layout.flex1)}>
                <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                  {nextTierRequirements.description}
                </Text>
                
                <View style={tw(spacing.mt(2))}>
                  <View style={tw(layout.flexRow, layout.justifyBetween, layout.itemsCenter, spacing.mb(1))}>
                    <Text style={[tw(text.xs), { color: colors.mutedForeground }]}>
                      Progress to next tier
                    </Text>
                    <Text style={[tw(text.xs), { color: colors.mutedForeground }]}>
                      {consecutiveWeeks}/{nextTierRequirements.consecutiveWeeksRequired} weeks
                    </Text>
                  </View>
                  
                  <View 
                    style={[
                      tw(spacing.h(2), border.rounded),
                      { backgroundColor: colors.muted }
                    ]}
                  >
                    <View 
                      style={[
                        tw(layout.hFull, border.rounded),
                        {
                          backgroundColor: getTierColor(nextTierRequirements.level),
                          width: `${progressPercentage}%`,
                        }
                      ]} 
                    />
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Max Tier Reached */}
        {!nextTierRequirements && (
          <View style={tw(layout.itemsCenter, spacing.py(4))}>
            <Text style={[tw(text.base, text.center), { color: colors.primary }]}>
              🏆 Congratulations! You've reached the highest tier!
            </Text>
            <Text style={[tw(text.sm, text.center, spacing.mt(1)), { color: colors.mutedForeground }]}>
              Keep up the excellent work to maintain your ELITE status
            </Text>
          </View>
        )}
      </View>
    </Card>
  );
};

export default TierProgress;