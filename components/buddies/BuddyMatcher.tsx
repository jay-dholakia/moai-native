import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, Text } from 'react-native';
import { useMachine } from '@xstate/react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { MobileLayout } from '@/components/layouts/MobileLayout';
import { tw, spacing, layout, text, border } from '@/utils/styles';
import { useTheme } from '@/providers/theme-provider';
import { buddyMatchingMachine, BuddyPreferences } from '@/lib/machines/buddy-matching-machine';
import { BuddyPreferencesForm } from './BuddyPreferencesForm';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface BuddyMatcherProps {
  onMatchComplete?: () => void;
}

export function BuddyMatcher({ onMatchComplete }: BuddyMatcherProps) {
  const { theme, colors: themeColors } = useTheme();
  const router = useRouter();
  const [state, send] = useMachine(buddyMatchingMachine);

  const handleSetPreferences = (preferences: BuddyPreferences) => {
    send({ type: 'SET_PREFERENCES', preferences });
  };

  const handleSearchBuddies = () => {
    send({ type: 'SEARCH_BUDDIES' });
  };

  const handleSelectBuddy = (buddy: any) => {
    send({ type: 'SELECT_BUDDY', buddy });
  };

  const handleSendRequest = () => {
    send({ type: 'SEND_REQUEST' });
  };

  const renderCompatibilityBadge = (score: number) => {
    const percentage = Math.round(score * 100);
    const color = score >= 0.8 ? themeColors.primary : score >= 0.6 ? '#fbbf24' : '#64748b';
    
    return (
      <View
        style={[
          tw(spacing.px(2), spacing.py(1), border.rounded),
          { backgroundColor: `${color}20` }
        ]}
      >
        <Text style={[tw(text.xs, text.semibold), { color }]}>
          {percentage}% match
        </Text>
      </View>
    );
  };

  const renderBuddyCard = (buddy: any) => (
    <TouchableOpacity
      key={buddy.id}
      onPress={() => handleSelectBuddy(buddy)}
      style={tw(spacing.mb(3))}
    >
      <Card 
        elevation={state.context.selectedBuddy?.id === buddy.id ? 'md' : 'sm'}
        style={[
          state.context.selectedBuddy?.id === buddy.id && {
            borderColor: themeColors.primary,
            borderWidth: 2,
          }
        ]}
      >
        <View style={tw(spacing.p(4))}>
          <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(3))}>
            <Avatar
              source={buddy.profile.profile_image}
              size="md"
            />
            
            <View style={tw(layout.flex1)}>
              <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween)}>
                <Text style={tw(text.lg, text.semibold)}>
                  {buddy.profile.first_name} {buddy.profile.last_name}
                </Text>
                {renderCompatibilityBadge(buddy.compatibility_score)}
              </View>
              
              {buddy.profile.bio && (
                <Text style={tw(text.sm, text.muted, spacing.mt(1))} numberOfLines={2}>
                  {buddy.profile.bio}
                </Text>
              )}
              
              <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(4), spacing.mt(2))}>
                {buddy.timezone_match && (
                  <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(1))}>
                    <Ionicons name="time-outline" size={16} color={themeColors.primary} />
                    <Text style={[tw(text.xs), { color: themeColors.primary }]}>
                      Same timezone
                    </Text>
                  </View>
                )}
                
                {buddy.activity_level_match && (
                  <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(1))}>
                    <Ionicons name="fitness-outline" size={16} color={themeColors.primary} />
                    <Text style={[tw(text.xs), { color: themeColors.primary }]}>
                      Similar activity
                    </Text>
                  </View>
                )}
              </View>
              
              {buddy.shared_interests.length > 0 && (
                <View style={tw(spacing.mt(2))}>
                  <Text style={tw(text.xs, text.muted, spacing.mb(1))}>
                    Shared interests:
                  </Text>
                  <View style={tw(layout.flexRow, layout.flexWrap, spacing.gap(1))}>
                    {buddy.shared_interests.slice(0, 3).map((interest: string, index: number) => (
                      <View
                        key={index}
                        style={[
                          tw(spacing.px(2), spacing.py(1), border.rounded),
                          { backgroundColor: themeColors.secondary }
                        ]}
                      >
                        <Text style={tw(text.xs)}>
                          {interest}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  // Idle state - show preferences form
  if (state.matches('idle') || state.matches('settingPreferences')) {
    return (
      <MobileLayout safeArea padding>
        <View style={tw(spacing.mb(6))}>
          <Text style={tw(text['2xl'], text.semibold, spacing.mb(2))}>
            Find Your Workout Buddy 🤝
          </Text>
          <Text style={tw(text.base, text.muted)}>
            Set your preferences to find the perfect accountability partner
          </Text>
        </View>

        <BuddyPreferencesForm
          initialPreferences={state.context.preferences}
          onSubmit={handleSetPreferences}
          onNext={handleSearchBuddies}
          isLoading={state.context.isLoading}
        />
      </MobileLayout>
    );
  }

  // Searching state
  if (state.matches('searching')) {
    return (
      <MobileLayout safeArea padding>
        <View style={tw(layout.flex1, layout.itemsCenter, layout.justifyCenter)}>
          <Text style={tw(text.xl, text.center, spacing.mb(4))}>
            Finding your perfect workout buddy...
          </Text>
          <Text style={tw(text.base, text.center, text.muted)}>
            We're analyzing compatibility based on your preferences
          </Text>
        </View>
      </MobileLayout>
    );
  }

  // Browsing state - show potential matches
  if (state.matches('browsing')) {
    return (
      <MobileLayout safeArea padding>
        <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.mb(6))}>
          <View>
            <Text style={tw(text['2xl'], text.semibold)}>
              Potential Buddies
            </Text>
            <Text style={tw(text.sm, text.muted)}>
              {state.context.potentialMatches.length} matches found
            </Text>
          </View>
          
          <TouchableOpacity
            onPress={() => send({ type: 'SET_PREFERENCES', preferences: state.context.preferences! })}
          >
            <Ionicons name="settings-outline" size={24} color={themeColors.foreground} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {state.context.potentialMatches.map(renderBuddyCard)}
          
          {state.context.potentialMatches.length === 0 && (
            <Card elevation="sm">
              <View style={tw(spacing.p(6), layout.itemsCenter, layout.justifyCenter)}>
                <Ionicons name="people-outline" size={48} color={themeColors.border} />
                <Text style={tw(text.lg, text.center, spacing.mt(4))}>
                  No matches found
                </Text>
                <Text style={tw(text.sm, text.center, text.muted, spacing.mt(2))}>
                  Try adjusting your preferences to find more potential buddies
                </Text>
                <Button
                  onPress={() => send({ type: 'SET_PREFERENCES', preferences: state.context.preferences! })}
                  variant="outline"
                  size="sm"
                  style={tw(spacing.mt(4))}
                >
                  Update Preferences
                </Button>
              </View>
            </Card>
          )}
        </ScrollView>

        {state.context.selectedBuddy && (
          <View 
            style={[
              tw(spacing.p(4), border.borderT, border.border),
              { backgroundColor: themeColors.card, borderTopColor: themeColors.border }
            ]}
          >
            <Button
              onPress={() => send({ type: 'SEND_REQUEST' })}
              variant="gradient"
              size="lg"
            >
              Send Buddy Request
            </Button>
          </View>
        )}
      </MobileLayout>
    );
  }

  // Confirming state
  if (state.matches('confirming')) {
    const buddy = state.context.selectedBuddy!;
    
    return (
      <MobileLayout safeArea padding>
        <View style={tw(spacing.mb(6))}>
          <Text style={tw(text['2xl'], text.semibold, spacing.mb(2))}>
            Send Buddy Request
          </Text>
          <Text style={tw(text.base, text.muted)}>
            Ready to connect with your potential workout buddy?
          </Text>
        </View>

        <Card elevation="md">
          <View style={tw(spacing.p(6), layout.itemsCenter, layout.justifyCenter)}>
            <Avatar
              source={buddy.profile.profile_image}
              size="xl"
            />
            
            <Text style={tw(text.xl, text.semibold, spacing.mt(4))}>
              {buddy.profile.first_name} {buddy.profile.last_name}
            </Text>
            
            {renderCompatibilityBadge(buddy.compatibility_score)}
            
            {buddy.profile.bio && (
              <Text style={tw(text.sm, text.center, text.muted, spacing.mt(3))}>
                {buddy.profile.bio}
              </Text>
            )}
            
            <View style={tw(layout.flexRow, spacing.gap(4), spacing.mt(6))}>
              <Button
                onPress={() => send({ type: 'CANCEL_REQUEST' })}
                variant="outline"
                size="lg"
              >
                Back
              </Button>
              <Button
                onPress={handleSendRequest}
                variant="gradient"
                size="lg"
                loading={state.context.isLoading}
              >
                Send Request
              </Button>
            </View>
          </View>
        </Card>
      </MobileLayout>
    );
  }

  // Request sent state
  if (state.matches('requestSent')) {
    return (
      <MobileLayout safeArea padding>
        <View style={tw(layout.flex1, layout.itemsCenter, layout.justifyCenter)}>
          <Card elevation="md">
            <View style={tw(spacing.p(6), layout.itemsCenter, layout.justifyCenter)}>
              <Ionicons 
                name="checkmark-circle" 
                size={64} 
                color={themeColors.primary} 
              />
              <Text style={tw(text['2xl'], text.center, spacing.mt(4))}>
                Request Sent! 🎉
              </Text>
              <Text style={tw(text.base, text.center, text.muted, spacing.mt(2))}>
                Your buddy request has been sent to {state.context.selectedBuddy?.profile.first_name}.
                They'll receive a notification and can accept or decline.
              </Text>
              
              <View style={tw(layout.flexRow, spacing.gap(4), spacing.mt(6))}>
                <Button
                  onPress={() => {
                    send({ type: 'RESET' });
                    onMatchComplete?.();
                  }}
                  variant="outline"
                  size="lg"
                >
                  Find More Buddies
                </Button>
                <Button
                  onPress={() => router.push('/(tabs)/profile')}
                  variant="gradient"
                  size="lg"
                >
                  View Profile
                </Button>
              </View>
            </View>
          </Card>
        </View>
      </MobileLayout>
    );
  }

  // Error state
  if (state.matches('error')) {
    return (
      <MobileLayout safeArea padding>
        <View style={tw(layout.flex1, layout.itemsCenter, layout.justifyCenter)}>
          <Card elevation="md">
            <View style={tw(spacing.p(6), layout.itemsCenter, layout.justifyCenter)}>
              <Ionicons 
                name="alert-circle" 
                size={64} 
                color={themeColors.destructive} 
              />
              <Text style={tw(text['2xl'], text.center, spacing.mt(4))}>
                Something went wrong
              </Text>
              <Text style={tw(text.base, text.center, text.muted, spacing.mt(2))}>
                {state.context.error}
              </Text>
              
              <View style={tw(layout.flexRow, spacing.gap(4), spacing.mt(6))}>
                <Button
                  onPress={() => send({ type: 'RESET' })}
                  variant="outline"
                  size="lg"
                >
                  Start Over
                </Button>
                <Button
                  onPress={() => send({ type: 'RETRY' })}
                  variant="gradient"
                  size="lg"
                >
                  Try Again
                </Button>
              </View>
            </View>
          </Card>
        </View>
      </MobileLayout>
    );
  }

  return null;
}