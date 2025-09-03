import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, Text } from 'react-native';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout, border } from '@/utils/styles';
import { Card } from '@/components/ui/Card';
import { MobileLayout } from '@/components/layouts/MobileLayout';  
import { useBadges } from '@/hooks/use-badges';
import { useProfile } from '@/hooks/use-profile';
import { BadgeCard } from './BadgeCard';
import { BadgeDetailModal } from './BadgeDetailModal';
import { BadgeGrid } from './BadgeGrid';
import { BadgeProgress } from './BadgeProgress';
import { UserBadge, MilestoneBadge } from '@/services/badge-service';
import { Ionicons } from '@expo/vector-icons';

interface BadgeDashboardProps {
  onBack?: () => void;
}

export function BadgeDashboard({ onBack }: BadgeDashboardProps) {
  const { colors } = useTheme();
  const { userProfile } = useProfile();
  const totalActivities = userProfile.data?.total_activities_logged || 0;
  
  const {
    userBadges,
    milestoneBadges,
    currentBadge,
    nextBadge,
    progress,
    isLoading,
  } = useBadges(totalActivities);

  const [selectedBadge, setSelectedBadge] = useState<UserBadge | null>(null);
  const [activeTab, setActiveTab] = useState<'earned' | 'milestones' | 'all'>('earned');

  const earnedBadges = userBadges;
  const unlockedMilestones = milestoneBadges.filter(badge => badge.unlocked);
  const lockedMilestones = milestoneBadges.filter(badge => !badge.unlocked);

  const getTabData = () => {
    switch (activeTab) {
      case 'earned':
        return earnedBadges;
      case 'milestones':
        return milestoneBadges;
      case 'all':
        return [...earnedBadges, ...milestoneBadges];
      default:
        return earnedBadges;
    }
  };

  const renderTabButton = (tab: 'earned' | 'milestones' | 'all', label: string, count: number) => (
    <TouchableOpacity
      onPress={() => setActiveTab(tab)}
      style={[
        tw(layout.flex1, spacing.py(3), spacing.px(4), border.rounded, layout.itemsCenter),
        {
          backgroundColor: activeTab === tab ? colors.primary : colors.secondary,
        }
      ]}
    >
      <Text style={[
        tw(text.sm, text.semibold),
        { color: activeTab === tab ? colors.primaryForeground : colors.foreground }
      ]}>
        {label}
      </Text>
      <Text style={[
        tw(text.xs),
        { color: activeTab === tab ? colors.primaryForeground : colors.mutedForeground }
      ]}>
        {count}
      </Text>
    </TouchableOpacity>
  );

  const renderBadgeItem = (item: UserBadge | MilestoneBadge, index: number) => {
    const isUserBadge = 'earned_at' in item;
    const badge = isUserBadge ? item as UserBadge : null;
    const milestone = !isUserBadge ? item as MilestoneBadge : null;

    return (
      <BadgeCard
        key={isUserBadge ? item.id : `milestone-${index}`}
        badge={item}
        size="medium"
        onPress={() => {
          if (badge) {
            setSelectedBadge(badge);
          }
        }}
        showProgress={!!(milestone && !milestone.unlocked && milestone === nextBadge)}
        progress={milestone && !milestone.unlocked && milestone === nextBadge ? progress : undefined}
      />
    );
  };

  if (isLoading) {
    return (
      <MobileLayout safeArea padding>
        <View style={tw(layout.flex1, layout.itemsCenter, layout.justifyCenter)}>
          <Text style={[tw(text.base), { color: colors.mutedForeground }]}>
            Loading badges...
          </Text>
        </View>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout safeArea padding={false}>
      {/* Header */}
      <View 
        style={[
          tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.p(4), border.borderB, border.border),
          { backgroundColor: colors.card, borderBottomColor: colors.border }
        ]}
      >
        {onBack ? (
          <TouchableOpacity onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}
        
        <Text style={[tw(text.lg, text.semibold), { color: colors.foreground }]}>
          My Badges
        </Text>
        
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={tw(layout.flex1)} contentContainerStyle={tw(spacing.p(4))}>
        {/* Progress Overview */}
        <Card elevation="sm" style={tw(spacing.mb(6))}>
          <View style={tw(spacing.p(4))}>
            <Text style={[tw(text.lg, text.semibold, spacing.mb(4), text.center), { color: colors.foreground }]}>
              Badge Progress
            </Text>
            
            <BadgeProgress
              totalActivities={totalActivities}
            />
          </View>
        </Card>

        {/* Statistics */}
        <View style={tw(layout.flexRow, spacing.gap(3), spacing.mb(6))}>
          <Card elevation="sm" style={tw(layout.flex1)}>
            <View style={tw(spacing.p(4), layout.itemsCenter)}>
              <Text style={[tw(text['2xl'], text.semibold), { color: colors.primary }]}>
                {earnedBadges.length}
              </Text>
              <Text style={[tw(text.sm, text.center), { color: colors.mutedForeground }]}>
                Badges Earned
              </Text>
            </View>
          </Card>
          
          <Card elevation="sm" style={tw(layout.flex1)}>
            <View style={tw(spacing.p(4), layout.itemsCenter)}>
              <Text style={[tw(text['2xl'], text.semibold), { color: colors.primary }]}>
                {unlockedMilestones.length}
              </Text>
              <Text style={[tw(text.sm, text.center), { color: colors.mutedForeground }]}>
                Milestones
              </Text>
            </View>
          </Card>
          
          <Card elevation="sm" style={tw(layout.flex1)}>
            <View style={tw(spacing.p(4), layout.itemsCenter)}>
              <Text style={[tw(text['2xl'], text.semibold), { color: colors.primary }]}>
                {totalActivities}
              </Text>
              <Text style={[tw(text.sm, text.center), { color: colors.mutedForeground }]}>
                Activities
              </Text>
            </View>
          </Card>
        </View>

        {/* Tab Navigation */}
        <View style={tw(layout.flexRow, spacing.gap(2), spacing.mb(6))}>
          {renderTabButton('earned', 'Earned', earnedBadges.length)}
          {renderTabButton('milestones', 'Milestones', milestoneBadges.length)}
          {renderTabButton('all', 'All', earnedBadges.length + milestoneBadges.length)}
        </View>

        {/* Badge Grid */}
        <View style={tw(spacing.mb(4))}>
          <Text style={[tw(text.lg, text.semibold, spacing.mb(4), text.center), { color: colors.foreground }]}>
            {activeTab === 'earned' && 'Your Earned Badges'}
            {activeTab === 'milestones' && 'Milestone Badges'}
            {activeTab === 'all' && 'All Badges'}
          </Text>
          
          {getTabData().length > 0 ? (
            <BadgeGrid
              totalActivities={totalActivities}
              onBadgePress={(badge) => {
                if ('earned_at' in badge) {
                  setSelectedBadge(badge as UserBadge);
                }
              }}
            />
          ) : (
            <Card elevation="sm">
              <View style={tw(spacing.p(8), layout.itemsCenter, layout.justifyCenter)}>
                <Ionicons 
                  name="trophy-outline" 
                  size={48} 
                  color={colors.border} 
                />
                <Text style={[tw(text.base, text.center, spacing.mt(4)), { color: colors.foreground }]}>
                  No badges yet
                </Text>
                <Text style={[tw(text.sm, text.center, spacing.mt(2), text.center), { color: colors.mutedForeground }]}>
                  {activeTab === 'earned' 
                    ? 'Complete activities to earn your first badge!'
                    : 'Keep working towards your milestone badges!'
                  }
                </Text>
              </View>
            </Card>
          )}
        </View>

        {/* Next Badge Preview */}
        {nextBadge && (
          <Card elevation="sm" style={tw(spacing.mb(6))}>
            <View style={tw(spacing.p(4))}>
              <Text style={[tw(text.base, text.semibold, spacing.mb(3), text.center), { color: colors.foreground }]}>
                Next Milestone
              </Text>
              
              <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(4))}>
                <View style={[
                  tw(spacing.w(16), spacing.h(16), layout.itemsCenter, layout.justifyCenter, border.rounded),
                  {
                    backgroundColor: colors.muted,
                    borderWidth: 2,
                    borderColor: colors.border,
                  }
                ]}>
                  <Text style={tw(text.xl)}>{nextBadge.icon}</Text>
                </View>
                
                <View style={tw(layout.flex1)}>
                  <Text style={[tw(text.base, text.semibold), { color: colors.foreground }]}>
                    {nextBadge.name}
                  </Text>
                  <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                    {nextBadge.level} activities • {nextBadge.level - totalActivities} to go
                  </Text>
                  
                  <View 
                    style={[
                      tw(spacing.mt(2), border.rounded),
                      { height: 6, backgroundColor: colors.muted }
                    ]}
                  >
                    <View 
                      style={[
                        tw(border.rounded),
                        { 
                          height: '100%', 
                          backgroundColor: colors.primary,
                          width: `${progress}%`
                        }
                      ]} 
                    />
                  </View>
                </View>
              </View>
            </View>
          </Card>
        )}
      </ScrollView>

      {/* Badge Detail Modal */}
      <BadgeDetailModal
        visible={selectedBadge !== null}
        badge={selectedBadge}
        onClose={() => setSelectedBadge(null)}
      />
    </MobileLayout>
  );
}