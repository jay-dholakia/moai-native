import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { tw, spacing, layout, text, border } from '@/utils/styles';
import { useTheme } from '@/providers/theme-provider';

interface Badge {
  key: string;
  name: string;
  description: string;
  icon: string;
  level: number;
  unlocked: boolean;
}

interface ProfileBadgesTabProps {
  currentBadge?: Badge | null;
  nextBadge?: Badge | null;
  progress: number; // 0-100
  totalActivities: number;
  moaiMoverWeeks: number;
  milestoneBadges: Badge[];
}

interface BadgeCardProps {
  badge: Badge;
  isCurrentBadge?: boolean;
}

interface ProgressBarProps {
  progress: number;
  color?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, color }) => {
  const { colors } = useTheme();
  const progressColor = color || colors.primary;
  
  return (
    <View
      style={[
        tw(spacing.h(2), border.rounded),
        { backgroundColor: colors.muted, opacity: 0.2 }
      ]}
    >
      <View
        style={[
          tw(spacing.h(2), border.rounded),
          {
            width: `${Math.min(Math.max(progress, 0), 100)}%`,
            backgroundColor: progressColor,
          }
        ]}
      />
    </View>
  );
};

const BadgeCard: React.FC<BadgeCardProps> = ({ badge, isCurrentBadge }) => {
  const { theme, colors } = useTheme();
  
  return (
    <View
      style={[
        tw(layout.flexRow, layout.itemsCenter, spacing.gap(3), spacing.p(3), border.rounded, spacing.mb(2)),
        {
          backgroundColor: badge.unlocked 
            ? (isCurrentBadge ? colors.primary : colors.card)
            : colors.muted,
          borderWidth: 1,
          borderColor: badge.unlocked 
            ? (isCurrentBadge ? colors.primary : colors.border)
            : colors.border,
          opacity: badge.unlocked ? 1 : 0.5,
        }
      ]}
    >
      <Text style={tw(text.lg)}>
        {badge.unlocked ? badge.icon : '🔒'}
      </Text>
      <View style={tw(layout.flex1)}>
        <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2))}>
          <Text
            style={[
              tw(text.sm, text.bold),
              { 
                color: isCurrentBadge && badge.unlocked
                  ? colors.primaryForeground 
                  : badge.unlocked 
                    ? colors.foreground 
                    : colors.muted 
              }
            ]}
          >
            {badge.name}
          </Text>
          <View
            style={[
              tw(spacing.px(2), spacing.py(1), border.rounded),
              { backgroundColor: colors.secondary }
            ]}
          >
            <Text style={tw(text.xs, text.bold)}>
              {badge.level}
            </Text>
          </View>
        </View>
        <Text
          style={[
            tw(text.xs, spacing.mt(1)),
            { 
              color: isCurrentBadge && badge.unlocked
                ? colors.primaryForeground
                : badge.unlocked 
                  ? colors.muted 
                  : colors.muted 
            }
          ]}
        >
          {badge.description}
        </Text>
      </View>
    </View>
  );
};

export const ProfileBadgesTab: React.FC<ProfileBadgesTabProps> = ({
  currentBadge,
  nextBadge,
  progress,
  totalActivities,
  moaiMoverWeeks,
  milestoneBadges,
}) => {
  const { theme, colors } = useTheme();

  return (
    <ScrollView
      style={tw(layout.flex1)}
      contentContainerStyle={tw(spacing.p(4))}
      showsVerticalScrollIndicator={false}
    >
      {/* Current Badge Display */}
      {currentBadge && (
        <View style={tw(layout.itemsCenter, spacing.mb(6))}>
          <Text style={tw(text['4xl'], spacing.mb(2))}>
            {currentBadge.icon}
          </Text>
          <Text style={tw(text.xl, text.bold, text.foreground(theme), text.center)}>
            {currentBadge.name}
          </Text>
          <Text style={tw(text.sm, text.muted(theme), text.center, spacing.mt(1))}>
            {currentBadge.description}
          </Text>
          <Text style={tw(text.xs, text.muted(theme), text.center, spacing.mt(2))}>
            {totalActivities} activities logged
          </Text>
        </View>
      )}

      {/* Progress to Next Badge */}
      {nextBadge && (
        <View
          style={[
            tw(spacing.p(4), border.rounded, spacing.mb(6)),
            { 
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
            }
          ]}
        >
          <View style={tw(layout.flexRow, layout.justifyBetween, spacing.mb(2))}>
            <Text style={tw(text.sm, text.foreground(theme))}>
              Progress to {nextBadge.name}
            </Text>
            <Text style={tw(text.sm, text.foreground(theme))}>
              {totalActivities} / {nextBadge.level}
            </Text>
          </View>
          <ProgressBar progress={progress} />
          <Text style={tw(text.xs, text.muted(theme), text.center, spacing.mt(2))}>
            {nextBadge.level - totalActivities} more activities to unlock {nextBadge.icon} {nextBadge.name}
          </Text>
        </View>
      )}

      {/* Moai Mover Badge */}
      {moaiMoverWeeks > 0 && (
        <View
          style={[
            tw(spacing.p(4), border.rounded, spacing.mb(6)),
            { 
              backgroundColor: colors.secondary,
              borderWidth: 1,
              borderColor: colors.border,
            }
          ]}
        >
          <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(3))}>
            <Text style={tw(text.xl)}>🌀</Text>
            <View>
              <Text style={tw(text.sm, text.bold, text.foreground(theme))}>
                Moai Mover
              </Text>
              <Text style={tw(text.xs, text.muted(theme))}>
                {moaiMoverWeeks} week{moaiMoverWeeks !== 1 ? 's' : ''} of consistent activity
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* How it works */}
      <View
        style={[
          tw(spacing.p(4), border.rounded, spacing.mb(6)),
          { 
            backgroundColor: colors.muted,
            borderWidth: 1,
            borderColor: colors.border,
            opacity: 0.1,
          }
        ]}
      >
        <Text style={tw(text.xs, text.foreground(theme))}>
          <Text style={tw(text.bold)}>How it works:</Text> Earn milestone icons based on your total logged activities. 
          Your badge updates automatically as you level up. Stay active 5+ days per week to earn the Moai Mover badge!
        </Text>
      </View>

      {/* Badge Ladder */}
      <View>
        <Text style={tw(text.lg, text.semibold, text.foreground(theme), spacing.mb(4))}>
          Badge Ladder
        </Text>
        {milestoneBadges.map((badge) => (
          <BadgeCard 
            key={badge.key} 
            badge={badge} 
            isCurrentBadge={currentBadge?.key === badge.key}
          />
        ))}
      </View>

      {/* Bottom Spacing */}
      <View style={tw(spacing.h(8))} />
    </ScrollView>
  );
};