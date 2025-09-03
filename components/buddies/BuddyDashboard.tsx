import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, Text, Alert } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { MobileLayout } from '@/components/layouts/MobileLayout';
import { tw, spacing, layout, text, border } from '@/utils/styles';
import { useTheme } from '@/providers/theme-provider';
import { useCurrentBuddy, useBuddyCheckIns, useSubmitBuddyCheckIn } from '@/hooks/use-buddies';
import { BuddyCheckInModal } from './BuddyCheckInModal';
import { BuddyPair } from '@/services/buddy-service';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface BuddyDashboardProps {
  onFindBuddy?: () => void;
}

export function BuddyDashboard({ onFindBuddy }: BuddyDashboardProps) {
  const { colors: themeColors } = useTheme();
  const router = useRouter();
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  
  const { data: currentBuddyResponse, isLoading: isLoadingBuddy } = useCurrentBuddy();
  const currentBuddy = currentBuddyResponse?.success ? currentBuddyResponse.data : null;
  
  const { data: checkInsResponse } = useBuddyCheckIns(currentBuddy?.id || null, 5);
  const checkIns = checkInsResponse?.success ? checkInsResponse.data : [];
  
  const submitCheckInMutation = useSubmitBuddyCheckIn();

  const handleCheckIn = async (checkInData: any) => {
    if (!currentBuddy) return;
    
    try {
      await submitCheckInMutation.mutateAsync({
        buddyPairId: currentBuddy.id,
        checkInData: {
          ...checkInData,
          buddy_pair_id: currentBuddy.id,
        }
      });
      setShowCheckInModal(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to submit check-in. Please try again.');
    }
  };

  const getWeekStartDate = () => {
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    return startOfWeek.toISOString().split('T')[0];
  };

  const hasCheckedInThisWeek = () => {
    const thisWeekStart = getWeekStartDate();
    return checkIns.some(checkIn => checkIn.week_start === thisWeekStart);
  };

  const calculateStreak = () => {
    // Simple streak calculation - consecutive weeks with check-ins
    let streak = 0;
    const sortedCheckIns = [...(checkIns || [])].sort((a: any, b: any) => 
      new Date(b.week_start).getTime() - new Date(a.week_start).getTime()
    );
    
    for (let i = 0; i < sortedCheckIns.length; i++) {
      if (sortedCheckIns[i].goals_met) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  if (isLoadingBuddy) {
    return (
      <MobileLayout safeArea padding>
        <View style={tw(layout.flex1, layout.itemsCenter, layout.justifyCenter)}>
          <Text style={tw(text.base, text.muted)}>Loading buddy dashboard...</Text>
        </View>
      </MobileLayout>
    );
  }

  // No buddy state
  if (!currentBuddy) {
    return (
      <MobileLayout safeArea padding>
        <View style={tw(layout.flex1, layout.itemsCenter, layout.justifyCenter)}>
          <Card elevation="md">
            <View style={tw(spacing.p(6), layout.itemsCenter, layout.justifyCenter)}>
              <Ionicons 
                name="people-outline" 
                size={64} 
                color={themeColors.border} 
              />
              <Text style={tw(text['2xl'], text.center, spacing.mt(4))}>
                No Workout Buddy Yet
              </Text>
              <Text style={tw(text.base, text.center, text.muted, spacing.mt(2))}>
                Find an accountability partner to stay motivated and achieve your fitness goals together.
              </Text>
              
              <Button
                onPress={onFindBuddy}
                variant="gradient"
                size="lg"
                style={tw(spacing.mt(6))}
              >
                Find a Workout Buddy
              </Button>
            </View>
          </Card>
        </View>
      </MobileLayout>
    );
  }

  const buddy = currentBuddy.buddy_profile;
  const streak = calculateStreak();
  const hasCheckedIn = hasCheckedInThisWeek();

  return (
    <MobileLayout safeArea padding>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Buddy Header */}
        <Card elevation="md" style={tw(spacing.mb(4))}>
          <View style={tw(spacing.p(4))}>
            <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(4))}>
              <Avatar
                source={buddy?.profile_image}
                size="lg"
              />
              
              <View style={tw(layout.flex1)}>
                <Text style={tw(text.xl, text.semibold)}>
                  {buddy?.first_name} {buddy?.last_name}
                </Text>
                <Text style={tw(text.sm, text.muted)}>
                  Your workout buddy
                </Text>
                <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2), spacing.mt(2))}>
                  <Ionicons name="calendar-outline" size={16} color={themeColors.muted} />
                  <Text style={tw(text.xs, text.muted)}>
                    Partners since {new Date(currentBuddy.started_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>
              
              <TouchableOpacity
                onPress={() => {
                  // For now, just show an alert since chat routing isn't implemented yet
                  Alert.alert('Chat', 'Chat functionality coming soon!');
                }}
                style={[
                  tw(spacing.p(3), border.rounded),
                  { backgroundColor: themeColors.primary }
                ]}
              >
                <Ionicons name="chatbubble-outline" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </Card>

        {/* Stats Row */}
        <View style={tw(layout.flexRow, spacing.gap(3), spacing.mb(4))}>
          <Card elevation="sm" style={tw(layout.flex1)}>
            <View style={tw(spacing.p(4), layout.itemsCenter)}>
              <Text style={tw(text['2xl'], text.semibold)}>
                {streak}
              </Text>
              <Text style={tw(text.sm, text.muted, text.center)}>
                Week Streak
              </Text>
            </View>
          </Card>
          
          <Card elevation="sm" style={tw(layout.flex1)}>
            <View style={tw(spacing.p(4), layout.itemsCenter)}>
              <Text style={tw(text['2xl'], text.semibold)}>
                {(checkIns || []).length}
              </Text>
              <Text style={tw(text.sm, text.muted, text.center)}>
                Total Check-ins
              </Text>
            </View>
          </Card>
          
          <Card elevation="sm" style={tw(layout.flex1)}>
            <View style={tw(spacing.p(4), layout.itemsCenter)}>
              <Text style={tw(text['2xl'], text.semibold)}>
                {Math.round(((checkIns || []).filter((c: any) => c.goals_met).length / Math.max((checkIns || []).length, 1)) * 100)}%
              </Text>
              <Text style={tw(text.sm, text.muted, text.center)}>
                Goals Met
              </Text>
            </View>
          </Card>
        </View>

        {/* Weekly Check-in */}
        <Card elevation="sm" style={tw(spacing.mb(4))}>
          <View style={tw(spacing.p(4))}>
            <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.mb(3))}>
              <Text style={tw(text.lg, text.semibold)}>
                This Week's Check-in
              </Text>
              <View
                style={[
                  tw(spacing.px(3), spacing.py(1), border.rounded),
                  { 
                    backgroundColor: hasCheckedIn 
                      ? `${themeColors.primary}20` 
                      : `${themeColors.secondary}20` 
                  }
                ]}
              >
                <Text 
                  style={[
                    tw(text.xs, text.semibold),
                    { 
                      color: hasCheckedIn 
                        ? themeColors.primary 
                        : themeColors.muted 
                    }
                  ]}
                >
                  {hasCheckedIn ? 'Complete' : 'Pending'}
                </Text>
              </View>
            </View>
            
            <Text style={tw(text.sm, text.muted, spacing.mb(4))}>
              Share your weekly progress and stay accountable to your goals.
            </Text>
            
            <Button
              onPress={() => setShowCheckInModal(true)}
              variant={hasCheckedIn ? "outline" : "gradient"}
              size="sm"
              disabled={submitCheckInMutation.isPending}
            >
              {hasCheckedIn ? 'Update Check-in' : 'Weekly Check-in'}
            </Button>
          </View>
        </Card>

        {/* Recent Check-ins */}
        <Card elevation="sm">
          <View style={tw(spacing.p(4))}>
            <Text style={tw(text.lg, text.semibold, spacing.mb(4))}>
              Recent Check-ins
            </Text>
            
            {(checkIns || []).length === 0 ? (
              <View style={tw(layout.itemsCenter, spacing.py(8))}>
                <Ionicons name="clipboard-outline" size={48} color={themeColors.border} />
                <Text style={tw(text.base, text.center, spacing.mt(4))}>
                  No check-ins yet
                </Text>
                <Text style={tw(text.sm, text.center, text.muted, spacing.mt(2))}>
                  Start tracking your progress with weekly check-ins
                </Text>
              </View>
            ) : (
              <View style={tw(spacing.gap(3))}>
                {(checkIns || []).slice(0, 3).map((checkIn: any, index: number) => (
                  <View
                    key={checkIn.id}
                    style={[
                      tw(spacing.p(3), border.rounded, border.border),
                      { backgroundColor: themeColors.secondary }
                    ]}
                  >
                    <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.mb(2))}>
                      <Text style={tw(text.sm, text.semibold)}>
                        Week of {new Date(checkIn.week_start).toLocaleDateString()}
                      </Text>
                      <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2))}>
                        <Ionicons 
                          name={checkIn.goals_met ? "checkmark-circle" : "close-circle"} 
                          size={16} 
                          color={checkIn.goals_met ? themeColors.primary : themeColors.destructive}
                        />
                        <Text style={tw(text.xs, text.muted)}>
                          {checkIn.activities_completed} activities
                        </Text>
                      </View>
                    </View>
                    
                    {checkIn.notes && (
                      <Text style={tw(text.sm, text.muted)} numberOfLines={2}>
                        {checkIn.notes}
                      </Text>
                    )}
                    
                    {checkIn.mood_rating && (
                      <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(1), spacing.mt(2))}>
                        <Text style={tw(text.xs, text.muted)}>Mood:</Text>
                        <View style={tw(layout.flexRow)}>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Ionicons
                              key={i}
                              name={i < checkIn.mood_rating! ? "star" : "star-outline"}
                              size={12}
                              color={i < checkIn.mood_rating! ? "#fbbf24" : themeColors.border}
                            />
                          ))}
                        </View>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        </Card>
      </ScrollView>

      {/* Check-in Modal */}
      <BuddyCheckInModal
        visible={showCheckInModal}
        onClose={() => setShowCheckInModal(false)}
        onSubmit={handleCheckIn}
        isLoading={submitCheckInMutation.isPending}
        weekStart={getWeekStartDate()}
        existingCheckIn={(checkIns || []).find((c: any) => c.week_start === getWeekStartDate())}
      />
    </MobileLayout>
  );
}