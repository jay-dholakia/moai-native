import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList, RefreshControl } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Plus, Calendar, Clock, MapPin, Zap } from 'lucide-react-native';

import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/use-profile';
import { useActivityLogs, useActivityStats } from '@/hooks/use-activity-logs';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout, border } from '@/utils/styles';
import { MobileLayout } from '@/components/layouts/MobileLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { AppHeader } from '@/components/ui/AppHeader';
import { ActivityStats } from '@/components/activities/ActivityStats';
import { ActivityLogCard } from '@/components/activities/ActivityLogCard';
import { WeeklyActivityPlanner } from '@/components/profile/WeeklyActivityPlanner';
import { ActivityLogCards } from '@/components/activities/ActivityLogCards';
import { AccountabilityBuddyCard } from '@/components/activities/AccountabilityBuddyCard';
import { WeeklyWorkoutPlan } from '@/components/activities/WeeklyWorkoutPlan';
import { BadgeProgressionManager } from '@/components/badges/BadgeProgressionManager';
import { BadgeDashboard } from '@/components/badges/BadgeDashboard';
import { TierProgress, TierProgressionManager } from '@/components/tiers';
import { TokenBalance, TokenDashboard } from '@/components/tokens';
import { MoaiWeeklyProgress } from '@/components/moai/MoaiWeeklyProgress';
import { useUserTierStatus } from '@/hooks/use-tier-system';
import { useTokenStats } from '@/hooks/use-token-system';
import { useUserMoais } from '@/hooks/use-moai';

export default function ActivitiesScreen() {
  const { user } = useAuth();
  const { theme, colors } = useTheme();
  
  const [refreshing, setRefreshing] = useState(false);
  const [showBadgeDashboard, setShowBadgeDashboard] = useState(false);
  const [showTokenDashboard, setShowTokenDashboard] = useState(false);

  // Get activities data using new hooks
  const { activities, isLoading: activitiesLoading, refetch: refetchActivities } = useActivityLogs();
  const { stats, isLoading: statsLoading } = useActivityStats();
  const { data: tierStatus, isLoading: tierLoading } = useUserTierStatus();
  const { userMoais } = useUserMoais();

  // Get primary moai for commitment card
  const primaryMoai = userMoais?.pages?.[0]?.data?.[0];

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await refetchActivities();
    } finally {
      setRefreshing(false);
    }
  }, [refetchActivities]);


  const handleActivityLogged = () => {
    refetchActivities();
  };

  const handleBadgeEarned = (badge: any) => {
    console.log('Badge earned:', badge);
    // Additional celebration logic can be added here
  };

  // Show badge dashboard if requested
  if (showBadgeDashboard) {
    return (
      <BadgeDashboard 
        onBack={() => setShowBadgeDashboard(false)} 
      />
    );
  }

  // Show token dashboard if requested
  if (showTokenDashboard) {
    return (
      <TokenDashboard 
        onClose={() => setShowTokenDashboard(false)} 
      />
    );
  }

  return (
    <MobileLayout scrollable={false}>
      <AppHeader 
        title="Activities" 
        showProfile={true}
      />
      <ScrollView 
        style={tw(layout.flex1)}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        bounces={true}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled={true}
      >
        <View style={tw(spacing.p(4))}>
          {/* Header with Token Balance */}
          <View style={tw(layout.flexRow, layout.justifyBetween, layout.itemsCenter, spacing.mb(6))}>
            <View>
              <Text style={[tw(text.xl, text.semibold), { color: colors.foreground }]}>
                Movement
              </Text>
            </View>
            <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(3))}>
              <TokenBalance size="sm" showLabel={false} />
              <TouchableOpacity>
                <Text style={[tw(text.sm), { color: colors.primary }]}>🔔</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Weekly Activity Planner */}
          <View style={tw(spacing.mb(6))}>
            <WeeklyActivityPlanner 
              showPlanning={true}
            />
          </View>

          {/* Movement Commitment Card */}
          {primaryMoai && (
            <View style={tw(spacing.mb(6))}>
              <MoaiWeeklyProgress
                moaiId={primaryMoai.id}
                onPress={() => {
                  // Navigate to detailed progress view
                  console.log('Navigate to progress details');
                }}
                onInfoPress={() => {
                  // Show commitment info
                  console.log('Show commitment info');
                }}
              />
            </View>
          )}

          {/* Activity Log Cards */}
          <View style={tw(spacing.mb(6))}>
            <ActivityLogCards onActivityLogged={handleActivityLogged} />
          </View>

          {/* Accountability Buddy Card */}
          <View style={tw(spacing.mb(6))}>
            <AccountabilityBuddyCard />
          </View>

          {/* Weekly Workout Plan */}
          <View style={tw(spacing.mb(6))}>
            <WeeklyWorkoutPlan />
          </View>

          {/* Legacy Activity Stats (keep for reference) */}
          <View style={tw(spacing.mb(6))}>
            <View style={tw(layout.flexRow, layout.justifyBetween, layout.itemsCenter, spacing.mb(4))}>
              <Text style={[tw(text.lg, text.semibold), { color: colors.foreground }]}>
                Activity Overview
              </Text>
            </View>
            <ActivityStats stats={stats} isLoading={statsLoading} />
          </View>

          {/* Tier Progress Section */}
          {tierStatus && (
            <View style={tw(spacing.mb(6))}>
              <View style={tw(layout.flexRow, layout.justifyBetween, layout.itemsCenter, spacing.mb(4))}>
                <Text style={[tw(text.lg, text.semibold), { color: colors.foreground }]}>
                  Your Tier Progress
                </Text>
              </View>
              <TierProgress tierStatus={tierStatus} compact={true} />
            </View>
          )}

          {/* Badges Section */}
          <View style={tw(spacing.mb(6))}>
            <View style={tw(layout.flexRow, layout.justifyBetween, layout.itemsCenter, spacing.mb(4))}>
              <Text style={[tw(text.lg, text.semibold), { color: colors.foreground }]}>
                Your Badges
              </Text>
              <TouchableOpacity onPress={() => setShowBadgeDashboard(true)}>
                <Text style={[tw(text.sm), { color: colors.primary }]}>
                  View All
                </Text>
              </TouchableOpacity>
            </View>
            
            <Card elevation="sm">
              <View style={tw(spacing.p(4))}>
                <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyCenter, spacing.gap(3))}>
                  <Text style={tw(text.xl)}>🏆</Text>
                  <Text style={[tw(text.base), { color: colors.foreground }]}>
                    {stats?.totalActivities || 0} activities logged
                  </Text>
                </View>
                <Text style={[tw(text.sm, text.center, spacing.mt(2), text.muted), { color: colors.mutedForeground }]}>
                  Keep going to unlock milestone badges!
                </Text>
                <TouchableOpacity 
                  onPress={() => setShowBadgeDashboard(true)}
                  style={[
                    tw(spacing.mt(3), spacing.py(2), spacing.px(4), border.rounded, layout.itemsCenter),
                    { backgroundColor: colors.primary }
                  ]}
                >
                  <Text style={[tw(text.sm, text.semibold), { color: colors.primaryForeground }]}>
                    View Badge Progress
                  </Text>
                </TouchableOpacity>
              </View>
            </Card>
          </View>

          {/* Recent Activities */}
          <View style={tw(spacing.mb(6))}>
            <View style={tw(layout.flexRow, layout.justifyBetween, layout.itemsCenter, spacing.mb(4))}>
              <Text style={[tw(text.lg, text.semibold), { color: colors.foreground }]}>
                Recent Activities
              </Text>
              <TouchableOpacity>
                <Text style={[tw(text.sm), { color: colors.primary }]}>
                  View All
                </Text>
              </TouchableOpacity>
            </View>
            
            {activitiesLoading ? (
              <Card>
                <View style={tw(spacing.p(6), layout.itemsCenter)}>
                  <Text style={[tw(text.base, text.muted), { color: colors.mutedForeground }]}>
                    Loading activities...
                  </Text>
                </View>
              </Card>
            ) : activities.length > 0 ? (
              <View style={tw(spacing.gap(3))}>
                {activities.slice(0, 3).map((activity) => (
                  <ActivityLogCard
                    key={activity.id}
                    activity={activity}
                    onPress={undefined}
                  />
                ))}
              </View>
            ) : (
              <Card>
                <View style={tw(spacing.p(6), layout.itemsCenter)}>
                  <Text style={[tw(text.base), { color: colors.mutedForeground }]}>
                    No activities logged yet
                  </Text>
                  <Text style={[tw(text.sm, spacing.mt(1)), { color: colors.mutedForeground }]}>
                    Use the activity cards above to log your first activity!
                  </Text>
                </View>
              </Card>
            )}
          </View>

          {/* Bottom spacing for navigation */}
          <View style={tw(spacing.h(8))} />
        </View>
      </ScrollView>
      
      {/* Badge Progression Manager - handles badge celebrations */}
      <BadgeProgressionManager
        totalActivities={stats?.totalActivities || 0}
        onBadgeEarned={handleBadgeEarned}
      />
      
      {/* Tier Progression Manager - handles tier promotions */}
      <TierProgressionManager
        currentWeekActivities={tierStatus?.currentWeekProgress || 0}
        onTierPromoted={(newTier) => {
          console.log('Tier promoted to:', newTier);
          // Additional tier promotion logic can be added here
        }}
      />
    </MobileLayout>
  );
}