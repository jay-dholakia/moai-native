import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, BackHandler, Alert, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { InstagramColors } from '@/constants/InstagramTheme';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAuth } from '@/hooks/useAuth';
import { useOnboarding, useProfileCompletion } from '@/hooks/use-onboarding-progress';
import { useOnboardingCheckpoints } from '@/hooks/use-onboarding-checkpoints';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout, border } from '@/utils/styles';
import { OnboardingNavigator } from '@/components/onboarding/OnboardingNavigator';
import { Card } from '@/components/ui';
import { GlobalSignOut } from '@/components/ui/GlobalSignOut';

export default function OnboardingScreen() {
  const { isAuthenticated, isLoading: authLoading, signOut } = useAuth();
  const { isComplete, isLoading } = useProfileCompletion();
  const { currentCheckpoint, isOnboardingComplete, canProceedToStep } = useOnboardingCheckpoints();
  const { theme, colors } = useTheme();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [inviteSuccess, setInviteSuccess] = useState<{
    moaiName: string;
    moaiId: string;
  } | null>(null);

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out? Your onboarding progress will be saved and you can continue later.',
      [
        { text: 'Continue Setup', style: 'cancel' },
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

  // Prevent hardware back button on Android during onboarding
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      Alert.alert(
        'Exit Onboarding',
        'Are you sure you want to exit? Your progress will be saved and you can continue later.',
        [
          { text: 'Continue Setup', style: 'cancel' },
          { 
            text: 'Exit', 
            onPress: () => {
              // Go back to auth if not completed
              router.replace('/(auth)/login');
            }
          }
        ]
      );
      return true; // Prevent default behavior
    });

    return () => backHandler.remove();
  }, [router]);



  // If not authenticated, redirect will happen via useEffect
  if (!isAuthenticated) {
    return null;
  }

  // If profile is already complete, redirect will happen via useEffect  
  if (isComplete) {
    return null;
  }

  // Show the onboarding navigator with checkpoint support
  return (
    <GlobalSignOut>
      <View style={tw(layout.flex1, { backgroundColor: colors.background })}>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      
      {/* Header with Sign Out Button */}
      <View style={tw(
        layout.flexRow, 
        layout.justifyBetween, 
        layout.itemsCenter, 
        spacing.px(6), 
        spacing.py(4),
        border.borderB,
        {
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
        }
      )}>
        <Text style={tw(text.lg, text.semibold, { color: colors.foreground })}>
          Setup Profile
        </Text>
        
        <TouchableOpacity
          onPress={handleSignOut}
          style={tw(spacing.p(2), {
            backgroundColor: InstagramColors.light.destructive + '10',
            borderRadius: 8, // Instagram-style border radius
            borderWidth: 1,
            borderColor: InstagramColors.light.destructive + '20',
          })}
          accessibilityLabel="Sign out"
          activeOpacity={0.7}
        >
          <Ionicons name="log-out" size={20} color={InstagramColors.light.destructive} />
        </TouchableOpacity>
      </View>
      
      {inviteSuccess && (
        <Card style={tw(spacing.m(4), spacing.p(4), {
          backgroundColor: colors.primary + '10',
          borderWidth: 1,
          borderColor: colors.primary + '30',
        })}>
          <Text style={tw(text.lg, text.semibold, spacing.mb(2), { color: colors.primary })}>
            Welcome to {inviteSuccess.moaiName}! 🎉
          </Text>
          <Text style={tw(text.sm, { color: colors.mutedForeground, lineHeight: 18 })}>
            You've successfully joined the moai! Complete your profile below to get started.
          </Text>
        </Card>
      )}
      
        <OnboardingNavigator 
          initialStep={currentStep}
        />
      </View>
    </GlobalSignOut>
  );
}