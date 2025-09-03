import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout, border } from '@/utils/styles';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { TierBadge } from './TierBadge';
import { UserTierStatus } from '@/services/tier-system-service';
import { useTierRequirements } from '@/hooks/use-tier-system';
import { Ionicons } from '@expo/vector-icons';

export interface LeaderboardEntry extends UserTierStatus {
  username?: string;
  avatarUrl?: string;
  rank: number;
}

export interface TierLeaderboardProps {
  leaderboardData: LeaderboardEntry[];
  currentUserId?: string;
  isLoading?: boolean;
  onUserPress?: (userId: string) => void;
  showRankings?: boolean;
  maxEntries?: number;
}

export const TierLeaderboard: React.FC<TierLeaderboardProps> = ({
  leaderboardData,
  currentUserId,
  isLoading = false,
  onUserPress,
  showRankings = true,
  maxEntries = 10,
}) => {
  const { colors } = useTheme();
  const { getTierColor } = useTierRequirements();

  if (isLoading) {
    return (
      <Card elevation="sm">
        <View style={tw(spacing.p(6), layout.itemsCenter)}>
          <Text style={[tw(text.base), { color: colors.mutedForeground }]}>
            Loading leaderboard...
          </Text>
        </View>
      </Card>
    );
  }

  if (leaderboardData.length === 0) {
    return (
      <Card elevation="sm">
        <View style={tw(spacing.p(6), layout.itemsCenter)}>
          <Ionicons name="trophy-outline" size={48} color={colors.border} />
          <Text style={[tw(text.base, text.center, spacing.mt(4)), { color: colors.foreground }]}>
            No leaderboard data available
          </Text>
          <Text style={[tw(text.sm, text.center, spacing.mt(2)), { color: colors.mutedForeground }]}>
            Members will appear here as they progress through tiers
          </Text>
        </View>
      </Card>
    );
  }

  const displayData = leaderboardData.slice(0, maxEntries);
  const currentUserEntry = leaderboardData.find(entry => entry.userId === currentUserId);
  const isCurrentUserInTop = currentUserEntry && currentUserEntry.rank <= maxEntries;

  const renderLeaderboardEntry = (entry: LeaderboardEntry, index: number) => {
    const isCurrentUser = entry.userId === currentUserId;
    const tierColor = getTierColor(entry.currentTier);
    
    return (
      <TouchableOpacity
        key={entry.userId}
        onPress={() => onUserPress?.(entry.userId)}
        disabled={!onUserPress}
        style={[
          tw(spacing.p(4), layout.flexRow, layout.itemsCenter, spacing.gap(4)),
          {
            backgroundColor: isCurrentUser ? colors.primary + '10' : 'transparent',
            borderLeftWidth: isCurrentUser ? 4 : 0,
            borderLeftColor: isCurrentUser ? colors.primary : 'transparent',
          }
        ]}
      >
        {/* Rank */}
        {showRankings && (
          <View style={tw(spacing.w(8), layout.itemsCenter)}>
            {entry.rank <= 3 ? (
              <Text style={tw(text.xl)}>
                {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
              </Text>
            ) : (
              <Text style={[tw(text.base, text.semibold), { color: colors.mutedForeground }]}>
                #{entry.rank}
              </Text>
            )}
          </View>
        )}

        {/* Avatar */}
        <Avatar
          source={entry.avatarUrl ? { uri: entry.avatarUrl } : undefined}
          fallback={entry.username?.[0]?.toUpperCase() || 'U'}
          size="default"
        />

        {/* User Info */}
        <View style={tw(layout.flex1)}>
          <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2))}>
            <Text style={[tw(text.base, text.semibold), { color: colors.foreground }]}>
              {entry.username || 'Unknown User'}
            </Text>
            {isCurrentUser && (
              <View 
                style={[
                  tw(spacing.px(2), spacing.py(1), border.rounded),
                  { backgroundColor: colors.primary + '20' }
                ]}
              >
                <Text style={[tw(text.xs, text.semibold), { color: colors.primary }]}>
                  YOU
                </Text>
              </View>
            )}
          </View>
          
          <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
            {entry.consecutiveWeeks} week{entry.consecutiveWeeks !== 1 ? 's' : ''} • {entry.currentWeekProgress}/{entry.currentWeekCommitment} this week
          </Text>
        </View>

        {/* Tier Badge */}
        <TierBadge 
          tier={entry.currentTier}
          size="sm"
          showLabel={false}
        />

        {/* Promotion Indicator */}
        {entry.canPromote && (
          <View style={tw(spacing.ml(2))}>
            <Ionicons name="arrow-up-circle" size={20} color={colors.primary} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Card elevation="sm">
      <View style={tw(spacing.p(4))}>
        {/* Header */}
        <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(3), spacing.mb(4))}>
          <Ionicons name="trophy" size={24} color={colors.primary} />
          <Text style={[tw(text.lg, text.semibold), { color: colors.foreground }]}>
            Tier Leaderboard
          </Text>
        </View>

        {/* Leaderboard Entries */}
        <ScrollView showsVerticalScrollIndicator={false}>
          {displayData.map((entry, index) => renderLeaderboardEntry(entry, index))}
          
          {/* Current User Entry (if not in top entries) */}
          {!isCurrentUserInTop && currentUserEntry && (
            <>
              <View 
                style={[
                  tw(spacing.my(3), layout.selfStretch),
                  { height: 1, backgroundColor: colors.border }
                ]}
              />
              <View style={tw(layout.itemsCenter, spacing.py(2))}>
                <Text style={[tw(text.xs), { color: colors.mutedForeground }]}>
                  YOUR RANKING
                </Text>
              </View>
              {renderLeaderboardEntry(currentUserEntry, -1)}
            </>
          )}
        </ScrollView>

        {/* Footer Stats */}
        <View 
          style={[
            tw(spacing.mt(4), spacing.pt(4), layout.flexRow, layout.justifyAround, border.borderT),
            { borderTopColor: colors.border }
          ]}
        >
          {['elite', 'gold', 'silver', 'bronze'].map(tier => {
            const count = leaderboardData.filter(entry => entry.currentTier === tier).length;
            return (
              <View key={tier} style={tw(layout.itemsCenter)}>
                <TierBadge tier={tier as any} size="sm" showLabel={false} />
                <Text style={[tw(text.xs, spacing.mt(1), text.semibold), { color: colors.foreground }]}>
                  {count}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </Card>
  );
};

export default TierLeaderboard;