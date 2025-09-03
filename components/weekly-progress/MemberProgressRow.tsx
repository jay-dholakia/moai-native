import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Check, Star, Crown, Flame, Plus } from 'lucide-react-native';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout, border } from '@/utils/styles';
import { MemberWeeklyProgressData } from '@/hooks/use-moai-progress';
import { WeeklyProgressCircles } from './WeeklyProgressCircles';
import { 
  ActivityIndicator, 
  CommitmentStreakBadge, 
  CoachSubscriptionBadge, 
  AccountabilityBuddyIndicator, 
  EnhancedBadgeIcon 
} from '@/components/ui';

interface MemberProgressRowProps {
  member: MemberWeeklyProgressData;
  currentWeek: Date;
  onDayPress?: (memberId: string, day: Date) => void;
  isAccountabilityBuddy?: boolean;
  hasCoachSubscription?: boolean;
  currentStreak?: number;
  plannedActivityToday?: string;
  onChatPress?: (memberId: string, memberName: string) => void;
  onInvitePress?: () => void;
  showInvitePrompt?: boolean;
}

export const MemberProgressRow: React.FC<MemberProgressRowProps> = ({
  member,
  currentWeek,
  onDayPress,
  isAccountabilityBuddy = false,
  hasCoachSubscription = false,
  currentStreak = 0,
  plannedActivityToday,
  onChatPress,
  onInvitePress,
  showInvitePrompt = false,
}) => {
  const { colors } = useTheme();

  /**
   * Render commitment progress circles (matching web app design)
   */
  const renderCommitmentCircles = () => {
    if (!member.movementDaysGoal) return null;

    const totalCircles = member.movementDaysGoal;
    const completed = Math.min(member.daysCompleted, totalCircles);
    const metCommitment = completed >= totalCircles;

    return (
      <View style={tw(layout.flexRow, spacing.gap(1), spacing.ml(2))}>
        {Array.from({ length: totalCircles }, (_, index) => (
          <View
            key={index}
            style={[
              tw(spacing.w(4), spacing.h(4), border.rounded, layout.itemsCenter, layout.justifyCenter),
              {
                borderWidth: 2,
                borderColor: index < completed
                  ? (metCommitment ? '#EAB308' : '#10B981') // gold or green
                  : '#D1D5DB', // gray-300
                backgroundColor: index < completed
                  ? (metCommitment ? '#EAB308' : '#10B981')
                  : 'transparent',
              }
            ]}
          >
            {index < completed && (
              metCommitment ? 
                <Star size={8} color="#FFFFFF" /> : 
                <Check size={8} color="#FFFFFF" />
            )}
          </View>
        ))}
      </View>
    );
  };

  const displayName = `${member.first_name} ${member.last_name ? member.last_name.charAt(0) + '.' : ''}`;

  return (
    <>
      <View 
        style={[
          tw(spacing.gap(2)),
          isAccountabilityBuddy && {
            backgroundColor: colors.primary + '10', // primary with 10% opacity
            borderWidth: 1,
            borderColor: colors.primary + '30', // primary with 30% opacity
            borderRadius: 8,
            padding: 12,
          }
        ]}
      >
        {/* Member info row */}
        <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween)}>
          <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(3))}>
            {/* Avatar with badges */}
            <View style={tw(layout.relative)}>
              <Image
                source={{ uri: member.profile_image || 'https://via.placeholder.com/40' }}
                style={[
                  tw(spacing.w(10), spacing.h(10), border.rounded),
                  { 
                    borderWidth: isAccountabilityBuddy ? 2 : 0,
                    borderColor: isAccountabilityBuddy ? colors.primary + '60' : 'transparent'
                  }
                ]}
                defaultSource={{ uri: 'https://via.placeholder.com/40' }}
              />
              
              {/* Today's planned activity indicator */}
              <ActivityIndicator 
                activityType={plannedActivityToday} 
                size={16}
              />
              
              {/* Enhanced Activity Badge */}
              <View style={tw(layout.absolute, layout.bottom(-1), layout.right(-1))}>
                <EnhancedBadgeIcon 
                  totalActivities={member.total_activities_logged || 0}
                  size="sm"
                  showProgress={false}
                />
              </View>
            </View>

            {/* Name and commitment info */}
            <View style={tw(layout.flex1)}>
              <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2))}>
                <Text style={[tw(text.sm, text.medium), { color: colors.foreground }]}>
                  {displayName}
                </Text>
                
                {/* Coach subscription badge */}
                <CoachSubscriptionBadge 
                  hasCoachSubscription={hasCoachSubscription} 
                  size="sm"
                />
                
                {/* Commitment streak badge */}
                <CommitmentStreakBadge 
                  streakCount={currentStreak} 
                  size="sm"
                />
              </View>
              
              {/* Commitment goal display */}
              <View style={tw(layout.flexRow, layout.itemsCenter)}>
                <Text style={[tw(text.xs), { color: colors.mutedForeground }]}>
                  {member.movementDaysGoal 
                    ? `${member.movementDaysGoal} ${member.movementDaysGoal === 1 ? 'day' : 'days'}`
                    : 'No commitment set'
                  }
                </Text>
                {renderCommitmentCircles()}
              </View>
            </View>
          </View>
          
          {/* Accountability buddy and actions section */}
          <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2), spacing.ml(4))}>
            <AccountabilityBuddyIndicator
              isAccountabilityBuddy={isAccountabilityBuddy}
              memberName={displayName}
              memberId={member.id}
              onChatPress={onChatPress}
            />
          </View>
        </View>

        {/* Weekly progress circles */}
        <View style={tw(layout.justifyCenter)}>
          <WeeklyProgressCircles
            userId={member.id}
            totalDays={member.movementDaysGoal}
            completedDays={member.daysCompleted}
            currentWeek={currentWeek}
            onDayPress={(day) => onDayPress?.(member.id, day)}
          />
        </View>
      </View>

      {/* Show invite prompt when only one member (matching web app logic) */}
      {showInvitePrompt && onInvitePress && (
        <View style={[
          tw(layout.flexCol, layout.itemsCenter, spacing.gap(2), spacing.mt(4), spacing.pt(4)),
          { borderTopWidth: 1, borderTopColor: colors.border }
        ]}>
          <TouchableOpacity
            onPress={onInvitePress}
            style={tw(layout.flexCol, layout.itemsCenter, spacing.gap(1), spacing.py(2), spacing.px(3))}
          >
            <View style={[
              tw(spacing.w(8), spacing.h(8), border.rounded, layout.itemsCenter, layout.justifyCenter),
              { 
                borderWidth: 2, 
                borderStyle: 'dashed', 
                borderColor: colors.mutedForeground + '50' 
              }
            ]}>
              <Plus size={16} color={colors.mutedForeground} />
            </View>
            <Text style={[tw(text.xs, text.center), { color: colors.mutedForeground }]}>
              Activate your Moai by inviting a friend
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );
};

export default MemberProgressRow;