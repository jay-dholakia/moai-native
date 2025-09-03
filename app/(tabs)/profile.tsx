import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/use-profile';
import { useTheme } from '@/providers/theme-provider';
import { useHasBuddy, usePendingBuddyRequests } from '@/hooks/use-buddies';
import { useIsCoach } from '@/hooks/use-coach-platform';
import { useProfileStats } from '@/hooks/use-profile-stats';
import { useProfileBadges } from '@/hooks/use-profile-badges';
import { useProfileTokens, useProfileProgress } from '@/hooks/use-profile-tokens';
import { tw, spacing, text, bg, layout, border } from '@/utils/styles';
import { AppHeader } from '@/components/ui/AppHeader';
import { BuddyMatcher, BuddyDashboard } from '@/components/buddies';
import { CoachDashboard, CoachOnboarding } from '@/components/coach';
import { ProfileProgressAvatar } from '@/components/profile/ProfileProgressAvatar';
import { ProfileTokenBalance } from '@/components/profile/ProfileTokenBalance';
import { ProfileStatsTab } from '@/components/profile/ProfileStatsTab';
import { ProfileBadgesTab } from '@/components/profile/ProfileBadgesTab';
import { EditProfileModal } from '@/components/profile/EditProfileModal';
import { QRCodeIcon } from '@/components/profile/QRCodeIcon';
import { WeeklyActivityPlanner } from '@/components/profile/WeeklyActivityPlanner';
import { MonthlyActivityCalendar } from '@/components/profile/MonthlyActivityCalendar';
import { TokenHistoryCard } from '@/components/profile/TokenHistoryCard';
import { useRouter } from 'expo-router';

type TabType = 'stats' | 'badges';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { userProfile, updateProfile, isUpdatingProfile } = useProfile();
  const { theme, colors, toggleTheme } = useTheme();
  const { hasBuddy, buddy, isLoading: isBuddyLoading } = useHasBuddy();
  const { data: pendingRequestsResponse } = usePendingBuddyRequests();
  const { data: isCoach, isLoading: isCoachLoading } = useIsCoach();
  const router = useRouter();
  
  const [showBuddyMatcher, setShowBuddyMatcher] = useState(false);
  const [showBuddyDashboard, setShowBuddyDashboard] = useState(false);
  const [showCoachDashboard, setShowCoachDashboard] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('stats');
  const [statsView, setStatsView] = useState<'weekly' | 'monthly'>('weekly');
  const [weekOffset, setWeekOffset] = useState(0);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Profile data hooks
  const { data: profileStats, isLoading: statsLoading } = useProfileStats(statsView, weekOffset, currentMonth);
  const { data: profileBadges, isLoading: badgesLoading } = useProfileBadges();
  const { balance: tokenBalance, isLoading: tokensLoading } = useProfileTokens();
  const { data: weeklyProgress = 0 } = useProfileProgress();
  
  const pendingRequests = pendingRequestsResponse?.success ? pendingRequestsResponse.data : [];
  const hasPendingRequests = pendingRequests.length > 0;

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            await signOut();
          }
        },
      ]
    );
  };

  const profileData = userProfile.data;

  // Show buddy matcher if requested
  if (showBuddyMatcher) {
    return (
      <BuddyMatcher onMatchComplete={() => setShowBuddyMatcher(false)} />
    );
  }

  // Show buddy dashboard if requested  
  if (showBuddyDashboard) {
    return (
      <BuddyDashboard onFindBuddy={() => setShowBuddyMatcher(true)} />
    );
  }

  // Show coach dashboard if requested
  if (showCoachDashboard) {
    return (
      <CoachDashboard 
        onClientPress={(clientId) => {
          console.log('Navigate to client:', clientId);
          // TODO: Navigate to client detail page
        }}
        onViewAllClients={() => {
          console.log('Navigate to client management');
          // TODO: Navigate to client management page
        }}
        onManageProfile={() => {
          setShowCoachDashboard(false);
        }}
      />
    );
  }

  return (
    <View style={tw(layout.flex1, bg.background(theme))}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      
      {/* Enhanced Header with Settings */}
      <View 
        style={[
          tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.px(6), spacing.pt(12), spacing.pb(4)),
          { backgroundColor: colors.background }
        ]}
      >
        <View>
          <Text style={tw(text['2xl'], text.bold, text.foreground(theme))}>
            Profile
          </Text>
          <Text style={tw(text.sm, text.muted(theme))}>
            Track your fitness journey
          </Text>
        </View>
        <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(3))}>
          {/* Token Balance in Header */}
          <ProfileTokenBalance
            balance={tokenBalance}
            size="sm"
            showLabel={false}
            clickable={false}
          />
          
          {/* QR Code Icon */}
          <QRCodeIcon />
          
          {/* Settings Button */}
          <TouchableOpacity
            style={[
              tw(spacing.p(3), border.rounded),
              { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }
            ]}
            onPress={() => setShowEditProfile(true)}
          >
            <Ionicons name="settings" size={20} color={colors.foreground} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={tw(layout.flex1)}
        contentContainerStyle={tw(spacing.px(6), spacing.pb(20))}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header with Progress Avatar */}
        <View style={tw(layout.itemsCenter, spacing.mb(6))}>
          <ProfileProgressAvatar
            firstName={profileData?.first_name || undefined}
            lastName={profileData?.last_name || undefined}
            email={profileData?.email || undefined}
            progress={weeklyProgress}
            size="xl"
            showBadgeOverlay={true}
            currentBadge={profileBadges?.currentBadge || null}
            totalActivities={profileBadges?.totalActivities || 0}
          />
          
          <Text style={tw(text.xl, text.bold, text.foreground(theme), text.center, spacing.mt(4))}>
            {profileData?.first_name && profileData?.last_name 
              ? `${profileData.first_name} ${profileData.last_name}`
              : profileData?.full_name || 'User'
            }
          </Text>
          
          {profileData?.username && (
            <Text style={[tw(text.sm, text.center, spacing.mt(1)), { color: '#14B8A6' }]}>
              @{profileData.username}
            </Text>
          )}
          
          {profileData?.city && profileData?.state && (
            <Text style={tw(text.sm, text.muted(theme), text.center, spacing.mt(1))}>
              📍 {profileData.city}, {profileData.state}
            </Text>
          )}

          {user?.created_at && (
            <Text style={tw(text.sm, text.muted(theme), text.center, spacing.mt(1))}>
              Member since {new Date(user.created_at).toLocaleDateString('en-US', { 
                month: 'long', 
                year: 'numeric' 
              })}
            </Text>
          )}

          {/* Edit Profile Button */}
          <TouchableOpacity
            style={[
              tw(spacing.px(4), spacing.py(2), border.rounded, spacing.mt(3)),
              { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }
            ]}
            onPress={() => setShowEditProfile(true)}
          >
            <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(1))}>
              <Ionicons name="pencil" size={12} color={colors.foreground} />
              <Text style={tw(text.xs, text.foreground(theme))}>
                Edit Profile
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Token Balance */}
        <View style={tw(spacing.mb(6))}>
          <ProfileTokenBalance
            balance={tokenBalance}
            onPress={() => {
              Alert.alert('Token Management', 'Token management feature coming soon!');
            }}
            size="lg"
            clickable={true}
          />
        </View>

        {/* Tab Navigation */}
        <View style={tw(layout.flexRow, spacing.mb(6))}>
          <TouchableOpacity
            style={[
              tw(
                spacing.px(6),
                spacing.py(3),
                border.rounded,
                layout.flex1,
                layout.itemsCenter,
                spacing.mr(2)
              ),
              {
                backgroundColor: activeTab === 'stats' ? colors.primary : colors.card,
                borderWidth: 1,
                borderColor: activeTab === 'stats' ? colors.primary : colors.border,
              }
            ]}
            onPress={() => setActiveTab('stats')}
          >
            <Text
              style={[
                tw(text.base, text.semibold),
                { 
                  color: activeTab === 'stats' 
                    ? colors.primaryForeground 
                    : colors.foreground 
                }
              ]}
            >
              Stats
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              tw(
                spacing.px(6),
                spacing.py(3),
                border.rounded,
                layout.flex1,
                layout.itemsCenter,
                spacing.ml(2)
              ),
              {
                backgroundColor: activeTab === 'badges' ? colors.primary : colors.card,
                borderWidth: 1,
                borderColor: activeTab === 'badges' ? colors.primary : colors.border,
              }
            ]}
            onPress={() => setActiveTab('badges')}
          >
            <Text
              style={[
                tw(text.base, text.semibold),
                { 
                  color: activeTab === 'badges' 
                    ? colors.primaryForeground 
                    : colors.foreground 
                }
              ]}
            >
              Badges
            </Text>
          </TouchableOpacity>
        </View>

        {/* Weekly Activity Summary */}
        <WeeklyActivityPlanner
          weekOffset={weekOffset}
          onWeekChange={setWeekOffset}
          showPlanning={false}
          mode="summary"
          userId={user?.id}
        />

        {/* Monthly Activity Calendar */}
        <MonthlyActivityCalendar
          userId={user?.id}
          currentMonth={currentMonth}
          onMonthChange={setCurrentMonth}
        />

        {/* Token History */}
        {user?.id && (
          <TokenHistoryCard
            userId={user.id}
            initialCount={5}
            showHeader={true}
          />
        )}

        {/* Tab Content */}
        <View style={tw(layout.flex1, spacing.mb(6))}>
          {activeTab === 'stats' ? (
            statsLoading ? (
              <View style={tw(layout.itemsCenter, spacing.py(8))}>
                <Text style={tw(text.sm, text.muted(theme))}>Loading statistics...</Text>
              </View>
            ) : profileStats ? (
              <ProfileStatsTab
                view={statsView}
                totalActivities={profileStats.totalActivities}
                workoutsCompleted={profileStats.workoutsCompleted}
                milesMoved={profileStats.milesMoved}
                minutesMoved={profileStats.minutesMoved}
                currentStreak={profileStats.currentStreak}
                activityCategories={profileStats.activityCategories}
                onViewChange={setStatsView}
              />
            ) : (
              <View style={tw(layout.itemsCenter, spacing.py(8))}>
                <Text style={tw(text.sm, text.muted(theme))}>No statistics available</Text>
              </View>
            )
          ) : (
            badgesLoading ? (
              <View style={tw(layout.itemsCenter, spacing.py(8))}>
                <Text style={tw(text.sm, text.muted(theme))}>Loading badges...</Text>
              </View>
            ) : profileBadges ? (
              <ProfileBadgesTab
                currentBadge={profileBadges.currentBadge}
                nextBadge={profileBadges.nextBadge}
                progress={profileBadges.progress}
                totalActivities={profileBadges.totalActivities}
                moaiMoverWeeks={profileBadges.moaiMoverWeeks}
                milestoneBadges={profileBadges.milestoneBadges}
              />
            ) : (
              <View style={tw(layout.itemsCenter, spacing.py(8))}>
                <Text style={tw(text.sm, text.muted(theme))}>No badges available</Text>
              </View>
            )
          )}
        </View>

        {/* Buddy Section */}
        <View style={tw(spacing.mb(6))}>
          <Text style={tw(text.lg, text.semibold, text.foreground(theme), spacing.mb(4))}>
            Workout Buddy
          </Text>
          
          <TouchableOpacity
            style={[
              tw(spacing.p(4), border.rounded, layout.flexRow, layout.itemsCenter, layout.justifyBetween),
              { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }
            ]}
            onPress={() => hasBuddy ? setShowBuddyDashboard(true) : setShowBuddyMatcher(true)}
          >
            <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(3))}>
              <Ionicons 
                name={hasBuddy ? "people" : "person-add"} 
                size={20} 
                color={hasBuddy ? colors.primary : colors.muted} 
              />
              <View>
                <Text style={tw(text.base, text.foreground(theme))}>
                  {hasBuddy ? `${buddy?.buddy_profile?.first_name} ${buddy?.buddy_profile?.last_name}` : 'Find a Workout Buddy'}
                </Text>
                <Text style={tw(text.sm, text.muted(theme))}>
                  {hasBuddy ? 'Your accountability partner' : 'Stay motivated with a partner'}
                </Text>
              </View>
            </View>
            
            <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2))}>
              {hasPendingRequests && (
                <View
                  style={[
                    tw(spacing.w(2), spacing.h(2), border.rounded),
                    { backgroundColor: colors.destructive }
                  ]}
                />
              )}
              <Text style={tw(text.sm, text.muted(theme))}>
                →
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Coach Section */}
        <View style={tw(spacing.mb(6))}>
          <Text style={tw(text.lg, text.semibold, text.foreground(theme), spacing.mb(4))}>
            Coaching
          </Text>
          
          {isCoachLoading ? (
            <View style={[
              tw(spacing.p(4), border.rounded),
              { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }
            ]}>
              <Text style={tw(text.sm, text.muted(theme))}>Loading coach status...</Text>
            </View>
          ) : isCoach ? (
            <TouchableOpacity
              style={[
                tw(spacing.p(4), border.rounded, layout.flexRow, layout.itemsCenter, layout.justifyBetween),
                { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }
              ]}
              onPress={() => setShowCoachDashboard(true)}
            >
              <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(3))}>
                <Ionicons 
                  name="shield-checkmark" 
                  size={20} 
                  color={colors.primary} 
                />
                <View>
                  <Text style={tw(text.base, text.foreground(theme))}>
                    Coach Dashboard
                  </Text>
                  <Text style={tw(text.sm, text.muted(theme))}>
                    Manage your clients and coaching business
                  </Text>
                </View>
              </View>
              
              <Text style={tw(text.sm, text.muted(theme))}>
                →
              </Text>
            </TouchableOpacity>
          ) : (
            <CoachOnboarding
              onStartCoaching={() => setShowCoachDashboard(true)}
              onCompleteProfile={() => {
                console.log('Navigate to coach profile setup');
              }}
              onApplyToCoach={() => {
                console.log('Navigate to coach application');
              }}
            />
          )}
        </View>

        {/* Settings */}
        <View style={tw(spacing.mb(6))}>
          <Text style={tw(text.lg, text.semibold, text.foreground(theme), spacing.mb(4))}>
            Settings
          </Text>
          
          <View style={tw(spacing.gap(2))}>
            {/* Theme Toggle */}
            <TouchableOpacity
              style={[
                tw(spacing.p(4), border.rounded, layout.flexRow, layout.justifyBetween, layout.itemsCenter),
                { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }
              ]}
              onPress={toggleTheme}
            >
              <Text style={tw(text.base, text.foreground(theme))}>
                Theme
              </Text>
              <Text style={tw(text.sm, text.muted(theme))}>
                {theme === 'dark' ? 'Dark' : 'Light'}
              </Text>
            </TouchableOpacity>

            {/* Privacy Settings */}
            <TouchableOpacity
              style={[
                tw(spacing.p(4), border.rounded, layout.flexRow, layout.justifyBetween, layout.itemsCenter),
                { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }
              ]}
            >
              <Text style={tw(text.base, text.foreground(theme))}>
                Privacy Settings
              </Text>
              <Text style={tw(text.sm, text.muted(theme))}>
                →
              </Text>
            </TouchableOpacity>

            {/* Notifications */}
            <TouchableOpacity
              style={[
                tw(spacing.p(4), border.rounded, layout.flexRow, layout.justifyBetween, layout.itemsCenter),
                { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }
              ]}
            >
              <Text style={tw(text.base, text.foreground(theme))}>
                Notifications
              </Text>
              <Text style={tw(text.sm, text.muted(theme))}>
                →
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          style={[
            tw(spacing.p(4), border.rounded, layout.itemsCenter),
            { backgroundColor: colors.destructive }
          ]}
          onPress={handleSignOut}
        >
          <Text style={[tw(text.base, text.medium), { color: colors.destructiveForeground }]}>
            Sign Out
          </Text>
        </TouchableOpacity>

        {/* App Info */}
        <View style={tw(spacing.mt(8), layout.itemsCenter)}>
          <Text style={tw(text.xs, text.muted(theme))}>
            Moai Native v1.0.0
          </Text>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isVisible={showEditProfile}
        onClose={() => setShowEditProfile(false)}
      />
    </View>
  );
}