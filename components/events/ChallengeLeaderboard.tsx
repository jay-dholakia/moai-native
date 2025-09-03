import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout, border } from '@/utils/styles';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { MobileLayout } from '@/components/layouts/MobileLayout';
import { Ionicons } from '@expo/vector-icons';
import { 
  useChallengeLeaderboard, 
  useUpdateChallengeProgress,
  useParticipationStatus 
} from '@/hooks/use-events-challenges';
import { Challenge, ChallengeParticipant } from '@/services/event-service';

interface ChallengeLeaderboardProps {
  challenge: Challenge;
  onBack?: () => void;
  onJoin?: () => void;
}

export const ChallengeLeaderboard: React.FC<ChallengeLeaderboardProps> = ({
  challenge,
  onBack,
  onJoin,
}) => {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'details'>('leaderboard');
  const [progressValue, setProgressValue] = useState('');

  const { 
    data: leaderboardResponse, 
    isLoading, 
    error, 
    refetch 
  } = useChallengeLeaderboard(challenge.id);

  const updateProgress = useUpdateChallengeProgress();
  const { isJoinedChallenge, canJoin } = useParticipationStatus(undefined, challenge.id);

  const participants = leaderboardResponse?.success ? leaderboardResponse.data : [];
  const userParticipant = participants.find(p => p.user_id === 'current-user-id'); // TODO: Get current user ID

  const handleUpdateProgress = async () => {
    if (!progressValue.trim()) return;

    try {
      await updateProgress.mutateAsync({
        challengeId: challenge.id,
        progressValue: parseFloat(progressValue),
        activityType: challenge.category,
      });
      setProgressValue('');
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return '#FFD700'; // Gold
      case 2:
        return '#C0C0C0'; // Silver
      case 3:
        return '#CD7F32'; // Bronze
      default:
        return colors.mutedForeground;
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return 'trophy';
      case 2:
        return 'medal';
      case 3:
        return 'medal';
      default:
        return 'person';
    }
  };

  const formatProgress = (progress: number) => {
    if (challenge.goal_unit) {
      return `${progress} ${challenge.goal_unit}`;
    }
    return progress.toString();
  };

  const getProgressPercentage = (progress: number) => {
    if (challenge.goal_type === 'target' && challenge.goal_value) {
      return Math.min((progress / challenge.goal_value) * 100, 100);
    }
    return 0;
  };

  const formatDateRemaining = () => {
    const now = new Date();
    const endDate = new Date(challenge.end_date);
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Challenge ended';
    if (diffDays === 0) return 'Last day!';
    if (diffDays === 1) return '1 day left';
    return `${diffDays} days left`;
  };

  const ParticipantCard: React.FC<{ participant: ChallengeParticipant; index: number }> = ({ 
    participant, 
    index 
  }) => (
    <View style={[
      tw(layout.flexRow, layout.itemsCenter, spacing.p(4), border.rounded, spacing.mb(3)),
      { 
        backgroundColor: participant.rank && participant.rank <= 3 
          ? getRankColor(participant.rank) + '10' 
          : colors.muted 
      }
    ]}>
      {/* Rank */}
      <View style={tw(layout.itemsCenter, spacing.w(12))}>
        <View style={[
          tw(spacing.w(8), spacing.h(8), layout.itemsCenter, layout.justifyCenter, border.rounded),
          { backgroundColor: getRankColor(participant.rank || index + 1) }
        ]}>
          {participant.rank && participant.rank <= 3 ? (
            <Ionicons 
              name={getRankIcon(participant.rank)} 
              size={16} 
              color="white" 
            />
          ) : (
            <Text style={[tw(text.sm, text.semibold), { color: 'white' }]}>
              {participant.rank || index + 1}
            </Text>
          )}
        </View>
      </View>

      {/* User Info */}
      <View style={tw(layout.flexRow, layout.itemsCenter, layout.flex1, spacing.ml(3))}>
        <Avatar
          size="sm"
          source={(participant.user_profile as any)?.avatar_url ? { uri: (participant.user_profile as any).avatar_url } : undefined}
          fallback={`${participant.user_profile?.first_name?.[0]}${participant.user_profile?.last_name?.[0]}`}
        />
        <View style={tw(layout.flex1, spacing.ml(3))}>
          <Text style={[tw(text.base, text.semibold), { color: colors.foreground }]}>
            {participant.user_profile?.first_name} {participant.user_profile?.last_name}
          </Text>
          {participant.team_name && (
            <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
              Team: {participant.team_name}
            </Text>
          )}
        </View>
      </View>

      {/* Progress */}
      <View style={tw(layout.itemsEnd)}>
        <Text style={[tw(text.lg, text.semibold), { color: colors.foreground }]}>
          {formatProgress(participant.current_progress)}
        </Text>
        {challenge.goal_type === 'target' && challenge.goal_value && (
          <View style={tw(layout.itemsCenter)}>
            <Text style={[tw(text.xs), { color: colors.mutedForeground }]}>
              {getProgressPercentage(participant.current_progress).toFixed(0)}%
            </Text>
            <View style={[
              tw(spacing.w(16), spacing.h(1), border.rounded, spacing.mt(1)),
              { backgroundColor: colors.border }
            ]}>
              <View style={[
                tw(spacing.h(1), border.rounded),
                {
                  backgroundColor: colors.primary,
                  width: `${getProgressPercentage(participant.current_progress)}%`,
                }
              ]} />
            </View>
          </View>
        )}
      </View>
    </View>
  );

  const LeaderboardTab: React.FC = () => (
    <ScrollView 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={refetch} />
      }
    >
      <View style={tw(spacing.gap(4))}>
        {/* Challenge Status */}
        <Card style={tw(spacing.p(4))}>
          <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.mb(3))}>
            <View>
              <Text style={[tw(text.lg, text.semibold), { color: colors.foreground }]}>
                {challenge.title}
              </Text>
              <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                {formatDateRemaining()}
              </Text>
            </View>
            <View
              style={[
                tw(spacing.px(3), spacing.py(1), border.rounded),
                { backgroundColor: colors.primary + '20' }
              ]}
            >
              <Text style={[tw(text.xs, text.semibold), { color: colors.primary }]}>
                {challenge.status.toUpperCase()}
              </Text>
            </View>
          </View>

          {challenge.goal_type === 'target' && challenge.goal_value && (
            <View>
              <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                Goal: {formatProgress(challenge.goal_value)}
              </Text>
            </View>
          )}
        </Card>

        {/* User Progress (if participating) */}
        {isJoinedChallenge && userParticipant && (
          <Card style={tw(spacing.p(4))}>
            <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.mb(3))}>
              <Text style={[tw(text.lg, text.semibold), { color: colors.foreground }]}>
                Your Progress
              </Text>
              <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                Rank #{userParticipant.rank}
              </Text>
            </View>

            <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.mb(3))}>
              <Text style={[tw(text.xl, text.semibold), { color: colors.primary }]}>
                {formatProgress(userParticipant.current_progress)}
              </Text>
              {challenge.goal_type === 'target' && challenge.goal_value && (
                <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                  of {formatProgress(challenge.goal_value)}
                </Text>
              )}
            </View>

            {challenge.goal_type === 'target' && challenge.goal_value && (
              <View style={[
                tw(spacing.h(2), border.rounded, spacing.mb(3)),
                { backgroundColor: colors.border }
              ]}>
                <View style={[
                  tw(spacing.h(2), border.rounded),
                  {
                    backgroundColor: colors.primary,
                    width: `${getProgressPercentage(userParticipant.current_progress)}%`,
                  }
                ]} />
              </View>
            )}

            {/* Progress Update */}
            <View style={tw(layout.flexRow, spacing.gap(2))}>
              <Input
                value={progressValue}
                onChangeText={setProgressValue}
                placeholder={`Add ${challenge.goal_unit || 'progress'}`}
                keyboardType="numeric"
                style={tw(layout.flex1, spacing.mb(0))}
              />
              <Button
                variant="default"
                onPress={handleUpdateProgress}
                loading={updateProgress.isPending}
                disabled={!progressValue.trim()}
              >
                Update
              </Button>
            </View>
          </Card>
        )}

        {/* Leaderboard */}
        <Card style={tw(spacing.p(4))}>
          <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.mb(4))}>
            <Text style={[tw(text.lg, text.semibold), { color: colors.foreground }]}>
              Leaderboard
            </Text>
            <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
              {participants.length} participants
            </Text>
          </View>

          {isLoading && participants.length === 0 ? (
            <View style={tw(layout.itemsCenter, spacing.py(8))}>
              <Text style={[tw(text.base), { color: colors.mutedForeground }]}>
                Loading leaderboard...
              </Text>
            </View>
          ) : error ? (
            <View style={tw(layout.itemsCenter, spacing.py(8))}>
              <Text style={[tw(text.base), { color: colors.destructive }]}>
                Failed to load leaderboard
              </Text>
              <Button variant="outline" onPress={() => refetch()} style={tw(spacing.mt(3))}>
                Try Again
              </Button>
            </View>
          ) : participants.length === 0 ? (
            <View style={tw(layout.itemsCenter, spacing.py(8))}>
              <Ionicons name="trophy-outline" size={48} color={colors.mutedForeground} />
              <Text style={[tw(text.lg, text.semibold, spacing.mt(3)), { color: colors.foreground }]}>
                No Participants Yet
              </Text>
              <Text style={[tw(text.base, text.center, spacing.mt(2)), { color: colors.mutedForeground }]}>
                Be the first to join this challenge!
              </Text>
            </View>
          ) : (
            <View>
              {participants.map((participant, index) => (
                <ParticipantCard 
                  key={participant.id} 
                  participant={participant} 
                  index={index}
                />
              ))}
            </View>
          )}
        </Card>

        {/* Prizes */}
        {(challenge.prizes?.first || challenge.prizes?.second || challenge.prizes?.third || challenge.prizes?.participation) && (
          <Card style={tw(spacing.p(4))}>
            <Text style={[tw(text.lg, text.semibold, spacing.mb(3)), { color: colors.foreground }]}>
              Prizes & Rewards
            </Text>
            <View style={tw(spacing.gap(2))}>
              {challenge.prizes?.first && (
                <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(3))}>
                  <Ionicons name="trophy" size={20} color="#FFD700" />
                  <Text style={[tw(text.sm), { color: colors.foreground }]}>
                    1st Place: {challenge.prizes.first}
                  </Text>
                </View>
              )}
              {challenge.prizes?.second && (
                <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(3))}>
                  <Ionicons name="medal" size={20} color="#C0C0C0" />
                  <Text style={[tw(text.sm), { color: colors.foreground }]}>
                    2nd Place: {challenge.prizes.second}
                  </Text>
                </View>
              )}
              {challenge.prizes?.third && (
                <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(3))}>
                  <Ionicons name="medal" size={20} color="#CD7F32" />
                  <Text style={[tw(text.sm), { color: colors.foreground }]}>
                    3rd Place: {challenge.prizes.third}
                  </Text>
                </View>
              )}
              {challenge.prizes?.participation && (
                <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(3))}>
                  <Ionicons name="ribbon" size={20} color={colors.primary} />
                  <Text style={[tw(text.sm), { color: colors.foreground }]}>
                    Participation: {challenge.prizes.participation}
                  </Text>
                </View>
              )}
            </View>
          </Card>
        )}
      </View>
    </ScrollView>
  );

  const DetailsTab: React.FC = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={tw(spacing.gap(4))}>
        {/* Challenge Info */}
        <Card style={tw(spacing.p(4))}>
          <Text style={[tw(text.lg, text.semibold, spacing.mb(3)), { color: colors.foreground }]}>
            About This Challenge
          </Text>
          <Text style={[tw(text.base, layout.leading6), { color: colors.foreground }]}>
            {challenge.description}
          </Text>
        </Card>

        {/* Challenge Details */}
        <Card style={tw(spacing.p(4))}>
          <Text style={[tw(text.lg, text.semibold, spacing.mb(3)), { color: colors.foreground }]}>
            Challenge Details
          </Text>

          <View style={tw(spacing.gap(3))}>
            <View style={tw(layout.flexRow, layout.itemsStart, spacing.gap(3))}>
              <Ionicons name="calendar" size={20} color={colors.primary} />
              <View>
                <Text style={[tw(text.base, text.semibold), { color: colors.foreground }]}>
                  Duration
                </Text>
                <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                  {new Date(challenge.start_date).toLocaleDateString()} - {new Date(challenge.end_date).toLocaleDateString()}
                </Text>
              </View>
            </View>

            <View style={tw(layout.flexRow, layout.itemsStart, spacing.gap(3))}>
              <Ionicons name="flag" size={20} color={colors.primary} />
              <View>
                <Text style={[tw(text.base, text.semibold), { color: colors.foreground }]}>
                  Goal
                </Text>
                <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                  {challenge.goal_type === 'target' && challenge.goal_value
                    ? `Reach ${formatProgress(challenge.goal_value)}`
                    : challenge.goal_type === 'leaderboard'
                    ? 'Compete for top positions'
                    : 'Complete the challenge'}
                </Text>
              </View>
            </View>

            <View style={tw(layout.flexRow, layout.itemsStart, spacing.gap(3))}>
              <Ionicons name="people" size={20} color={colors.primary} />
              <View>
                <Text style={[tw(text.base, text.semibold), { color: colors.foreground }]}>
                  Participants
                </Text>
                <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                  {challenge.current_participants} joined
                  {challenge.max_participants && ` (${challenge.max_participants} max)`}
                </Text>
              </View>
            </View>

            {challenge.entry_fee && challenge.entry_fee > 0 && (
              <View style={tw(layout.flexRow, layout.itemsStart, spacing.gap(3))}>
                <Ionicons name="pricetag" size={20} color={colors.primary} />
                <View>
                  <Text style={[tw(text.base, text.semibold), { color: colors.foreground }]}>
                    Entry Fee
                  </Text>
                  <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                    ${challenge.entry_fee}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </Card>

        {/* Rules */}
        {challenge.rules.length > 0 && (
          <Card style={tw(spacing.p(4))}>
            <Text style={[tw(text.lg, text.semibold, spacing.mb(3)), { color: colors.foreground }]}>
              Challenge Rules
            </Text>
            <View style={tw(spacing.gap(2))}>
              {challenge.rules.map((rule, index) => (
                <View key={index} style={tw(layout.flexRow, layout.itemsStart, spacing.gap(2))}>
                  <Text style={[tw(text.sm), { color: colors.primary }]}>
                    {index + 1}.
                  </Text>
                  <Text style={[tw(text.sm, layout.flex1), { color: colors.foreground }]}>
                    {rule}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Creator Info */}
        <Card style={tw(spacing.p(4))}>
          <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(3))}>
            <Avatar
              size="md"
              source={(challenge.creator_profile as any)?.avatar_url ? { uri: (challenge.creator_profile as any).avatar_url } : undefined}
              fallback={`${challenge.creator_profile?.first_name?.[0]}${challenge.creator_profile?.last_name?.[0]}`}
            />
            <View style={tw(layout.flex1)}>
              <Text style={[tw(text.base, text.semibold), { color: colors.foreground }]}>
                {challenge.creator_profile?.first_name} {challenge.creator_profile?.last_name}
              </Text>
              <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                Challenge Creator
              </Text>
            </View>
          </View>
        </Card>
      </View>
    </ScrollView>
  );

  return (
    <MobileLayout safeArea padding={false}>
      {/* Header */}
      <View style={[
        tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.p(4), border.borderB),
        { borderBottomColor: colors.border }
      ]}>
        <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(3))}>
          {onBack && (
            <TouchableOpacity onPress={onBack}>
              <Ionicons name="arrow-back" size={24} color={colors.foreground} />
            </TouchableOpacity>
          )}
          <View>
            <Text style={[tw(text.lg, text.semibold), { color: colors.foreground }]}>
              {challenge.title}
            </Text>
            <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
              {challenge.category} • {challenge.challenge_type}
            </Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={tw(layout.flexRow, spacing.mx(4), spacing.mt(4))}>
        <TouchableOpacity
          onPress={() => setActiveTab('leaderboard')}
          style={[
            tw(layout.flex1, spacing.py(3), border.borderB, border.border2),
            { borderBottomColor: activeTab === 'leaderboard' ? colors.primary : colors.border }
          ]}
        >
          <Text style={[
            tw(text.base, text.center, text.semibold),
            { color: activeTab === 'leaderboard' ? colors.primary : colors.mutedForeground }
          ]}>
            Leaderboard
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => setActiveTab('details')}
          style={[
            tw(layout.flex1, spacing.py(3), border.borderB, border.border2),
            { borderBottomColor: activeTab === 'details' ? colors.primary : colors.border }
          ]}
        >
          <Text style={[
            tw(text.base, text.center, text.semibold),
            { color: activeTab === 'details' ? colors.primary : colors.mutedForeground }
          ]}>
            Details
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <View style={tw(layout.flex1, spacing.p(4))}>
        {activeTab === 'leaderboard' ? <LeaderboardTab /> : <DetailsTab />}
      </View>

      {/* Action Button */}
      {!isJoinedChallenge && canJoin && (
        <View style={[
          tw(spacing.p(4), border.borderT),
          { borderTopColor: colors.border }
        ]}>
          <Button
            variant="gradient"
            onPress={onJoin}
            style={tw(layout.wFull)}
          >
            Join Challenge
          </Button>
        </View>
      )}
    </MobileLayout>
  );
};