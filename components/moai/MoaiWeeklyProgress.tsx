import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { Calendar, Target, Check, Clock, Info, Star, Users, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout, border } from '@/utils/styles';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LinearGradient } from 'expo-linear-gradient';
import { useMoaiWeeklyProgress, MemberWeeklyProgressData } from '@/hooks/use-moai-progress';
import { CommitmentTimer } from './CommitmentTimer';
import { MemberProgressRow } from '@/components/weekly-progress/MemberProgressRow';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns';

interface MoaiWeeklyProgressProps {
  moaiId: string;
  onPress?: () => void;
  onInfoPress?: () => void;
  showAllMembers?: boolean;
  onWeekChange?: (week: Date) => void;
  currentWeek?: Date;
  onMemberDayPress?: (memberId: string, day: Date) => void;
  allMembersProgress?: MemberWeeklyProgressData[];
  membersProgressLoading?: boolean;
}

/**
 * Enhanced MoaiWeeklyProgress component matching web app's MovementCommitmentCard
 * Provides stateful commitment tracking with planning, commitment, and completion states
 */
export const MoaiWeeklyProgress: React.FC<MoaiWeeklyProgressProps> = ({
  moaiId,
  onPress,
  onInfoPress,
  showAllMembers = false,
  onWeekChange,
  currentWeek: propCurrentWeek,
  onMemberDayPress,
  allMembersProgress: propAllMembersProgress,
  membersProgressLoading = false,
}) => {
  const { colors } = useTheme();
  const [internalCurrentWeek, setInternalCurrentWeek] = useState(new Date());
  const currentWeek = propCurrentWeek || internalCurrentWeek;
  
  const { data: progressData, isLoading, error } = useMoaiWeeklyProgress(moaiId);
  
  // Use passed props or empty array as fallback
  const allMembersProgress = propAllMembersProgress || [];
  const membersLoading = membersProgressLoading;
  
  if (isLoading) {
    return (
      <Card style={tw(spacing.mb(4))}>
        <CardContent style={tw(spacing.p(4), layout.justifyCenter, layout.itemsCenter)}>
          <ActivityIndicator size="small" color={colors.primary} />
        </CardContent>
      </Card>
    );
  }

  if (error || !progressData) {
    return (
      <Card style={tw(spacing.mb(4))}>
        <CardContent style={tw(spacing.p(4))}>
          <Text style={[tw(text.sm, text.center), { color: colors.mutedForeground }]}>
            Unable to load progress data
          </Text>
        </CardContent>
      </Card>
    );
  }

  const {
    commitmentWindow,
    weeklyPlan,
    userCommitment,
    completedActivities,
    isCommitmentMet,
    shouldShowCommitmentDisplay,
    isPlannedOnly,
    displayGoal
  } = progressData;

  /**
   * Render progress circles (matching web app design)
   */
  const renderProgressCircles = () => {
    if (!userCommitment?.movementDaysGoal) return null;

    const totalCircles = userCommitment.movementDaysGoal;
    const completed = Math.min(completedActivities, totalCircles);
    const isCommitmentMet = completed >= totalCircles;

    return (
      <View style={tw(layout.flexRow, spacing.gap(2), spacing.mt(3), layout.justifyCenter)}>
        {Array.from({ length: totalCircles }, (_, index) => (
          <View
            key={index}
            style={[
              tw(spacing.w(6), spacing.h(6), border.rounded, layout.itemsCenter, layout.justifyCenter),
              {
                borderWidth: 2,
                borderColor: index < completed
                  ? (isCommitmentMet ? '#EAB308' : '#10B981') // gold or green
                  : (isCommitmentMet ? '#FDE047' : '#86EFAC'), // light gold or light green
                backgroundColor: index < completed
                  ? (isCommitmentMet ? '#EAB308' : '#10B981')
                  : (isCommitmentMet ? '#FFFBEB' : 'transparent'),
              }
            ]}
          >
            {index < completed && (
              isCommitmentMet ? 
                <Star size={12} color="#FFFFFF" /> : 
                <Check size={12} color="#FFFFFF" />
            )}
          </View>
        ))}
      </View>
    );
  };

  /**
   * Render planned circles (for planning state)
   */
  const renderPlannedCircles = () => {
    if (!weeklyPlan.plannedMovementDays) return null;

    return (
      <View style={tw(layout.flexRow, spacing.gap(2), spacing.mt(3), layout.justifyCenter)}>
        {Array.from({ length: weeklyPlan.plannedMovementDays }, (_, index) => (
          <View
            key={index}
            style={[
              tw(spacing.w(6), spacing.h(6), border.rounded, layout.itemsCenter, layout.justifyCenter),
              {
                borderWidth: 2,
                borderColor: '#6366F1', // indigo-300
                backgroundColor: '#EEF2FF', // indigo-50
              }
            ]}
          >
            <Calendar size={12} color="#6366F1" />
          </View>
        ))}
      </View>
    );
  };

  /**
   * Get prompt message based on window state
   */
  const getPromptMessage = () => {
    if (commitmentWindow.windowState === 'next_week') {
      return "Plan your activities for next week to set your commitment";
    } else if (commitmentWindow.windowState === 'current_week') {
      return "Plan your weekly activities to set your commitment";
    } else {
      return "Commitment window opens Sunday 12PM";
    }
  };

  const isWindowOpen = commitmentWindow.windowState !== 'closed';

  /**
   * Week navigation helpers
   */
  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = direction === 'prev' ? subWeeks(currentWeek, 1) : addWeeks(currentWeek, 1);
    if (onWeekChange) {
      onWeekChange(newWeek);
    } else {
      setInternalCurrentWeek(newWeek);
    }
  };

  const isCurrentWeek = format(currentWeek, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  /**
   * Handle member day press
   */
  const handleMemberDayPress = (memberId: string, day: Date) => {
    onMemberDayPress?.(memberId, day);
  };

  /**
   * Get gold card styles for completed commitment
   */
  const getGoldCardStyles = () => ({
    card: 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-300',
    content: 'text-yellow-800',
    circle: 'bg-yellow-400 border-yellow-400',
    icon: 'text-yellow-600'
  });

  // Main render logic based on state
  if (shouldShowCommitmentDisplay) {
    if (userCommitment) {
      // Show formal commitment with progress circles
      const goldStyles = getGoldCardStyles();
      
      return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={tw(spacing.mb(4))}>
          <LinearGradient
            colors={isCommitmentMet 
              ? ['#FFFBEB', '#FEF3C7'] as [string, string, ...string[]]  // gold gradient
              : ['#F0FDF4', '#DCFCE7'] as [string, string, ...string[]]  // green gradient
            }
            style={tw(border.rounded, spacing.p(4))}
          >
            <Card 
              elevation="sm"
              style={[
                tw(spacing.mb(0)),
                { backgroundColor: 'transparent', borderWidth: 0, elevation: 0 }
              ]}
            >
              <CardContent style={tw(spacing.p(0))}>
                {isCommitmentMet ? (
                  <View style={tw(text.center, spacing.gap(3))}>
                    <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyCenter, spacing.gap(2))}>
                      <Star size={16} color="#EAB308" />
                      <Text style={[tw(text.sm, text.semibold), { color: '#92400E' }]}>
                        Week completed! Great work!
                      </Text>
                      <Star size={16} color="#EAB308" />
                    </View>
                    {renderProgressCircles()}
                  </View>
                ) : (
                  <View style={tw(text.center, spacing.gap(3))}>
                    <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyCenter, spacing.gap(2))}>
                      <Target size={16} color="#166534" />
                      <Text style={[tw(text.sm, text.medium), { color: '#166534' }]}>
                        I commit to moving {userCommitment.movementDaysGoal} {userCommitment.movementDaysGoal === 1 ? 'day' : 'days'} this week
                      </Text>
                    </View>
                    {renderProgressCircles()}
                  </View>
                )}
                
                {/* Commitment timer */}
                {isWindowOpen && !isCommitmentMet && (
                  <View style={tw(spacing.mt(4))}>
                    <CommitmentTimer windowCloseTime={commitmentWindow.windowCloseTime} />
                  </View>
                )}
              </CardContent>
            </Card>

            {/* Info button */}
            <TouchableOpacity
              onPress={onInfoPress}
              style={[
                tw(layout.absolute, spacing.w(6), spacing.h(6), layout.itemsCenter, layout.justifyCenter),
                { opacity: 0.7, bottom: 8, right: 8 }
              ]}
            >
              <Info size={12} color={isCommitmentMet ? '#92400E' : '#166534'} />
            </TouchableOpacity>
          </LinearGradient>
        </TouchableOpacity>
      );
    } else {
      // Show planned commitment (no formal commitment yet)
      return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={tw(spacing.mb(4))}>
          <LinearGradient
            colors={['#EEF2FF', '#E0E7FF'] as [string, string, ...string[]]} // indigo gradient
            style={tw(border.rounded, spacing.p(4))}
          >
            <Card 
              elevation="sm"
              style={[
                tw(spacing.mb(0)),
                { backgroundColor: 'transparent', borderWidth: 0, elevation: 0 }
              ]}
            >
              <CardContent style={tw(spacing.p(0))}>
                <View style={tw(text.center, spacing.gap(3))}>
                  <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyCenter, spacing.gap(2))}>
                    <Calendar size={16} color="#4338CA" />
                    <Text style={[tw(text.sm, text.medium), { color: '#4338CA' }]}>
                      {weeklyPlan.plannedMovementDays} movement {weeklyPlan.plannedMovementDays === 1 ? 'day' : 'days'} planned this week
                    </Text>
                  </View>
                  {renderPlannedCircles()}
                  <Text style={[tw(text.xs), { color: '#6366F1' }]}>
                    Confirm your commitment to make it official
                  </Text>
                </View>
              </CardContent>
            </Card>

            {/* Info button */}
            <TouchableOpacity
              onPress={onInfoPress}
              style={[
                tw(layout.absolute, spacing.w(6), spacing.h(6), layout.itemsCenter, layout.justifyCenter),
                { opacity: 0.7, bottom: 8, right: 8 }
              ]}
            >
              <Info size={12} color="#6366F1" />
            </TouchableOpacity>
          </LinearGradient>
        </TouchableOpacity>
      );
    }
  }

  // No commitment or plan - show prompt
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={tw(spacing.mb(4))}>
      <LinearGradient
        colors={['#EFF6FF', '#DBEAFE'] as [string, string, ...string[]]} // blue gradient
        style={tw(border.rounded, spacing.p(4))}
      >
        <Card 
          elevation="sm"
          style={[
            tw(spacing.mb(0)),
            { backgroundColor: 'transparent', borderWidth: 0, elevation: 0 }
          ]}
        >
          <CardContent style={tw(spacing.p(0), spacing.gap(3))}>
            {isWindowOpen && (
              <View style={tw(text.center)}>
                {weeklyPlan.hasWeeklyPlan ? (
                  <View>
                    <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyCenter, spacing.gap(2), spacing.mb(2))}>
                      <Calendar size={16} color="#6366F1" />
                      <Text style={[tw(text.xs, text.medium), { color: '#6366F1' }]}>
                        Weekly plan saved
                      </Text>
                    </View>
                    <View style={[
                      tw(text.lg, text.bold, spacing.px(3), spacing.py(1), border.rounded),
                      { backgroundColor: '#EEF2FF', borderWidth: 1, borderColor: '#C7D2FE', color: '#4338CA' }
                    ]}>
                      <Text style={[tw(text.lg, text.bold), { color: '#4338CA' }]}>
                        {weeklyPlan.plannedMovementDays} {weeklyPlan.plannedMovementDays === 1 ? 'day' : 'days'} planned
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View>
                    <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyCenter, spacing.gap(2), spacing.mb(2))}>
                      <Clock size={16} color="#EA580C" />
                      <Text style={[tw(text.xs, text.medium), { color: '#EA580C' }]}>
                        Time left to plan and commit
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}
            
            <View style={tw(text.center)}>
              <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                {getPromptMessage()}
              </Text>
            </View>
            
            {/* Commitment timer for planning window */}
            {isWindowOpen && (
              <View style={tw(spacing.mt(2))}>
                <CommitmentTimer windowCloseTime={commitmentWindow.windowCloseTime} />
              </View>
            )}
          </CardContent>
        </Card>

        {/* Info button */}
        <TouchableOpacity
          onPress={onInfoPress}
          style={[
            tw(layout.absolute, spacing.w(6), spacing.h(6), layout.itemsCenter, layout.justifyCenter),
            { opacity: 0.7, bottom: 8, right: 8 }
          ]}
        >
          <Info size={12} color="#2563EB" />
        </TouchableOpacity>
      </LinearGradient>
      
      {/* All Members Progress Section - Always show when showAllMembers is true */}
      {showAllMembers && (
        <View style={tw(spacing.mt(4))}>
          <Card style={tw(spacing.mb(0))}>
            <CardContent style={tw(spacing.p(4))}>
              {/* Week Navigation Header */}
              <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.mb(3))}>
                <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2))}>
                  <Users size={16} color={colors.foreground} />
                  <Text style={[tw(text.sm, text.semibold), { color: colors.foreground }]}>
                    Weekly Progress
                  </Text>
                </View>
                <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2))}>
                  <TouchableOpacity onPress={() => navigateWeek('prev')}>
                    <ChevronLeft size={16} color={colors.mutedForeground} />
                  </TouchableOpacity>
                  <Text style={[tw(text.xs), { color: colors.mutedForeground, minWidth: 100, textAlign: 'center' }]}>
                    {format(startOfWeek(currentWeek, { weekStartsOn: 1 }), 'MMM d')} - {format(endOfWeek(currentWeek, { weekStartsOn: 1 }), 'MMM d')}
                  </Text>
                  <TouchableOpacity 
                    onPress={() => !isCurrentWeek && navigateWeek('next')}
                    disabled={isCurrentWeek}
                  >
                    <ChevronRight 
                      size={16} 
                      color={isCurrentWeek ? '#D1D5DB' : colors.mutedForeground} 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Members Progress List */}
              {(() => {
                console.log('Debug - Members loading:', membersLoading);
                console.log('Debug - All members progress:', allMembersProgress?.length || 0, 'members');
                console.log('Debug - Show all members:', showAllMembers);
                
                if (membersLoading) {
                  return (
                    <View style={tw(spacing.py(8), layout.itemsCenter)}>
                      <ActivityIndicator size="small" color={colors.primary} />
                    </View>
                  );
                }
                
                if (!allMembersProgress || allMembersProgress.length === 0) {
                  return (
                    <View style={tw(spacing.py(8), layout.itemsCenter)}>
                      <Users size={48} color={colors.mutedForeground} style={{ opacity: 0.5 }} />
                      <Text style={[tw(text.sm, spacing.mt(2)), { color: colors.mutedForeground }]}>
                        No members found for this Moai
                      </Text>
                    </View>
                  );
                }
                
                return (
                <FlatList
                  data={allMembersProgress}
                  renderItem={({ item, index }) => (
                    <MemberProgressRow
                      member={item}
                      currentWeek={currentWeek}
                      onDayPress={handleMemberDayPress}
                      isAccountabilityBuddy={false} // TODO: implement buddy detection
                      hasCoachSubscription={false} // TODO: implement coach subscription detection
                      currentStreak={0} // TODO: implement streak detection
                      plannedActivityToday={undefined} // TODO: implement planned activity detection
                      onChatPress={(memberId, memberName) => {
                        // TODO: implement chat functionality
                        console.log('Chat with:', memberName, memberId);
                      }}
                      onInvitePress={() => {
                        // TODO: implement invite functionality
                        console.log('Invite members');
                      }}
                      showInvitePrompt={allMembersProgress.length === 1 && index === 0}
                    />
                  )}
                  keyExtractor={(item) => item.id}
                  ItemSeparatorComponent={() => <View style={tw(spacing.h(3))} />}
                  scrollEnabled={false}
                  showsVerticalScrollIndicator={false}
                />
                );
              })()}
            </CardContent>
          </Card>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default MoaiWeeklyProgress;