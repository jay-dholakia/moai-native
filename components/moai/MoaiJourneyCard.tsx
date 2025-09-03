import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { MapPin, Calendar, Trophy, Star, TrendingUp, ChevronRight } from 'lucide-react-native';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout, border } from '@/utils/styles';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { TierBadge } from '@/components/tiers/TierBadge';
import { TierLevel } from '@/services/tier-system-service';

interface JourneyMilestone {
  id: string;
  week: number;
  date: string;
  type: 'join' | 'tier_promotion' | 'streak_milestone' | 'goal_completed' | 'badge_earned';
  title: string;
  description: string;
  tier?: TierLevel;
  streakWeeks?: number;
  isCompleted: boolean;
  isRecent?: boolean;
}

interface MoaiJourneyCardProps {
  moaiId: string;
  milestones?: JourneyMilestone[];
  currentTier?: TierLevel;
  currentStreak?: number;
  totalWeeks?: number;
  joinDate?: string;
  showFullTimeline?: boolean;
  compact?: boolean;
  onPress?: () => void;
}

export const MoaiJourneyCard: React.FC<MoaiJourneyCardProps> = ({
  moaiId,
  milestones = [],
  currentTier = 'bronze',
  currentStreak = 0,
  totalWeeks = 0,
  joinDate,
  showFullTimeline = false,
  compact = true,
  onPress,
}) => {
  const { colors } = useTheme();

  // Mock milestones if none provided (for demo purposes)
  const defaultMilestones: JourneyMilestone[] = [
    {
      id: '1',
      week: 1,
      date: joinDate || '2024-01-01',
      type: 'join',
      title: 'Joined Moai',
      description: 'Started your fitness journey',
      isCompleted: true,
    },
    {
      id: '2',
      week: 2,
      date: '2024-01-08',
      type: 'goal_completed',
      title: 'First Week Complete',
      description: 'Completed your first weekly goal',
      isCompleted: true,
    },
    {
      id: '3',
      week: 4,
      date: '2024-01-22',
      type: 'streak_milestone',
      title: '3 Week Streak',
      description: 'Maintained consistency for 3 weeks',
      streakWeeks: 3,
      isCompleted: true,
    },
    {
      id: '4',
      week: 8,
      date: '2024-02-19',
      type: 'tier_promotion',
      title: 'Silver Tier Promotion',
      description: 'Promoted to Silver tier',
      tier: 'silver',
      isCompleted: totalWeeks >= 8,
    },
    {
      id: '5',
      week: 12,
      date: '2024-03-18',
      type: 'badge_earned',
      title: 'Consistency Master',
      description: 'Earned consistency badge',
      isCompleted: totalWeeks >= 12,
      isRecent: totalWeeks >= 12 && totalWeeks <= 14,
    },
  ];

  const displayMilestones = milestones.length > 0 ? milestones : defaultMilestones;
  const visibleMilestones = showFullTimeline ? displayMilestones : displayMilestones.slice(0, 3);

  const getMilestoneIcon = (type: JourneyMilestone['type']) => {
    switch (type) {
      case 'join':
        return MapPin;
      case 'tier_promotion':
        return Trophy;
      case 'streak_milestone':
        return TrendingUp;
      case 'goal_completed':
        return Star;
      case 'badge_earned':
        return Trophy;
      default:
        return Calendar;
    }
  };

  const getMilestoneColor = (type: JourneyMilestone['type'], isCompleted: boolean) => {
    if (!isCompleted) return colors.mutedForeground;
    
    switch (type) {
      case 'join':
        return colors.primary;
      case 'tier_promotion':
        return '#F59E0B';
      case 'streak_milestone':
        return '#EF4444';
      case 'goal_completed':
        return colors.success || '#10B981';
      case 'badge_earned':
        return '#8B5CF6';
      default:
        return colors.primary;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (compact) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <Card elevation="sm" style={tw(spacing.mb(4))}>
          <CardContent style={tw(spacing.p(4))}>
            {/* Header */}
            <View style={tw(layout.flexRow, layout.justifyBetween, layout.itemsCenter, spacing.mb(4))}>
              <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2))}>
                <MapPin size={16} color={colors.primary} />
                <Text style={[tw(text.sm, text.semibold), { color: colors.foreground }]}>
                  Your Journey
                </Text>
              </View>
              
              <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2))}>
                <Text style={[tw(text.xs), { color: colors.mutedForeground }]}>
                  Week {totalWeeks}
                </Text>
                <ChevronRight size={14} color={colors.mutedForeground} />
              </View>
            </View>

            {/* Quick Stats */}
            <View style={tw(layout.flexRow, layout.justifyBetween, layout.itemsCenter, spacing.mb(4))}>
              <View style={tw(layout.itemsCenter)}>
                <Text style={[tw(text.lg, text.semibold), { color: colors.foreground }]}>
                  {totalWeeks}
                </Text>
                <Text style={[tw(text.xs), { color: colors.mutedForeground }]}>
                  Weeks
                </Text>
              </View>
              
              <View style={tw(layout.itemsCenter)}>
                <TierBadge tier={currentTier} size="sm" showLabel={false} />
                <Text style={[tw(text.xs), { color: colors.mutedForeground }]}>
                  {currentTier.toUpperCase()}
                </Text>
              </View>
              
              <View style={tw(layout.itemsCenter)}>
                <Text style={[tw(text.lg, text.semibold), { color: '#EF4444' }]}>
                  {currentStreak}
                </Text>
                <Text style={[tw(text.xs), { color: colors.mutedForeground }]}>
                  Streak
                </Text>
              </View>
            </View>

            {/* Recent Milestones */}
            <View style={tw(spacing.gap(2))}>
              {visibleMilestones.slice(0, 2).map((milestone) => {
                const IconComponent = getMilestoneIcon(milestone.type);
                const iconColor = getMilestoneColor(milestone.type, milestone.isCompleted);
                
                return (
                  <View 
                    key={milestone.id}
                    style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(3))}
                  >
                    <View 
                      style={[
                        tw(spacing.w(6), spacing.h(6), border.rounded, layout.itemsCenter, layout.justifyCenter),
                        { 
                          backgroundColor: milestone.isCompleted 
                            ? iconColor + '20' 
                            : colors.muted 
                        }
                      ]}
                    >
                      <IconComponent 
                        size={12} 
                        color={iconColor}
                      />
                    </View>
                    
                    <View style={tw(layout.flex1)}>
                      <Text style={[
                        tw(text.sm, milestone.isCompleted ? text.semibold : text.normal), 
                        { color: milestone.isCompleted ? colors.foreground : colors.mutedForeground }
                      ]}>
                        {milestone.title}
                      </Text>
                      <Text style={[tw(text.xs), { color: colors.mutedForeground }]}>
                        Week {milestone.week} • {formatDate(milestone.date)}
                      </Text>
                    </View>

                    {milestone.isRecent && (
                      <Badge variant="default" size="sm">
                        <Text style={tw(text.xs)}>New</Text>
                      </Badge>
                    )}
                  </View>
                );
              })}
            </View>
          </CardContent>
        </Card>
      </TouchableOpacity>
    );
  }

  // Full detailed timeline view
  return (
    <Card elevation="md" style={tw(spacing.mb(4))}>
      <CardContent style={tw(spacing.p(4))}>
        {/* Header */}
        <View style={tw(layout.flexRow, layout.justifyBetween, layout.itemsCenter, spacing.mb(6))}>
          <Text style={[tw(text.lg, text.semibold), { color: colors.foreground }]}>
            Your Journey Timeline
          </Text>
          <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2))}>
            <Calendar size={16} color={colors.primary} />
            <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
              {totalWeeks} weeks active
            </Text>
          </View>
        </View>

        {/* Timeline */}
        <ScrollView 
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={tw(spacing.pb(4))}
        >
          <View style={tw(layout.flexRow, spacing.gap(6))}>
            {displayMilestones.map((milestone, index) => {
              const IconComponent = getMilestoneIcon(milestone.type);
              const iconColor = getMilestoneColor(milestone.type, milestone.isCompleted);
              const isLast = index === displayMilestones.length - 1;
              
              return (
                <View key={milestone.id} style={tw(layout.flexRow, layout.itemsStart)}>
                  <View style={tw(layout.itemsCenter)}>
                    {/* Timeline Node */}
                    <View 
                      style={[
                        tw(spacing.w(10), spacing.h(10), border.rounded, layout.itemsCenter, layout.justifyCenter, spacing.mb(2)),
                        { 
                          backgroundColor: milestone.isCompleted 
                            ? iconColor 
                            : colors.muted,
                          borderWidth: 2,
                          borderColor: milestone.isCompleted ? iconColor : colors.border,
                        }
                      ]}
                    >
                      <IconComponent 
                        size={16} 
                        color={milestone.isCompleted ? '#FFFFFF' : colors.mutedForeground}
                      />
                    </View>

                    {/* Connecting Line */}
                    {!isLast && (
                      <View 
                        style={[
                          tw(spacing.h(16), spacing.mb(2)),
                          {
                            width: 2,
                            backgroundColor: milestone.isCompleted && displayMilestones[index + 1]?.isCompleted 
                              ? colors.primary 
                              : colors.border,
                          }
                        ]} 
                      />
                    )}
                  </View>

                  {/* Milestone Details */}
                  <View style={tw(spacing.ml(4), spacing.mb(6), layout.minW(48))}>
                    <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2), spacing.mb(1))}>
                      <Text style={[
                        tw(text.sm, text.semibold), 
                        { color: milestone.isCompleted ? colors.foreground : colors.mutedForeground }
                      ]}>
                        {milestone.title}
                      </Text>
                      {milestone.isRecent && (
                        <Badge variant="default" size="sm">
                          <Text style={tw(text.xs)}>New</Text>
                        </Badge>
                      )}
                    </View>
                    
                    <Text style={[tw(text.xs), { color: colors.mutedForeground }]}>
                      {milestone.description}
                    </Text>
                    
                    <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2), spacing.mt(1))}>
                      <Text style={[tw(text.xs), { color: colors.mutedForeground }]}>
                        Week {milestone.week}
                      </Text>
                      <Text style={[tw(text.xs), { color: colors.mutedForeground }]}>
                        •
                      </Text>
                      <Text style={[tw(text.xs), { color: colors.mutedForeground }]}>
                        {formatDate(milestone.date)}
                      </Text>
                    </View>

                    {/* Special milestone info */}
                    {milestone.tier && (
                      <View style={tw(spacing.mt(2))}>
                        <TierBadge tier={milestone.tier} size="sm" />
                      </View>
                    )}
                    
                    {milestone.streakWeeks && (
                      <View style={tw(spacing.mt(2))}>
                        <Badge variant="secondary" size="sm">
                          <Text style={tw(text.xs)}>
                            🔥 {milestone.streakWeeks} weeks
                          </Text>
                        </Badge>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>

        {/* Future Goals Preview */}
        <View style={[tw(spacing.mt(4), spacing.pt(4)), { borderTopWidth: 1, borderTopColor: colors.border }]}>
          <Text style={[tw(text.sm, text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
            Coming Up
          </Text>
          <Text style={[tw(text.xs), { color: colors.mutedForeground }]}>
            Keep up your consistency to unlock new tier promotions and earn special badges!
          </Text>
        </View>
      </CardContent>
    </Card>
  );
};

export default MoaiJourneyCard;