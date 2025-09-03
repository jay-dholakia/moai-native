import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

import { useAuth } from '@/hooks/useAuth';
import { useOnboarding } from '@/hooks/use-onboarding-progress';
import { useTheme } from '@/providers/theme-provider';
import { createStyles } from '@/utils/theme-styles';

export default function IndexScreen() {
  const { isAuthenticated, isLoading: authLoading, signOut } = useAuth();
  const { isComplete, shouldShowOnboarding, isLoading: onboardingLoading } = useOnboarding();
  const { theme, colors } = useTheme();
  const router = useRouter();
  const styles = createStyles(theme);
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // Set a timeout for loading state to prevent infinite loading
  useEffect(() => {
    const timer = setTimeout(() => {
      if (authLoading || onboardingLoading) {
        console.warn('Loading timeout reached - potential infinite loading detected');
        setLoadingTimeout(true);
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timer);
  }, [authLoading, onboardingLoading]);

  useEffect(() => {
    // Wait for both auth and onboarding data to load
    if (!authLoading && !onboardingLoading) {
      setLoadingTimeout(false);
      
      if (!isAuthenticated) {
        console.log('IndexScreen: Not authenticated, redirecting to login');
        router.replace('/(auth)/login');
      } else if (shouldShowOnboarding && !isComplete) {
        console.log('IndexScreen: Redirecting to onboarding - profile incomplete');
        router.replace('/onboarding');
      } else {
        console.log('IndexScreen: Redirecting to main app - profile complete');
        router.replace('/(tabs)');
      }
    }
  }, [isAuthenticated, isComplete, shouldShowOnboarding, authLoading, onboardingLoading, router]);

  // Show loading screen while checking authentication and onboarding
  if (authLoading || onboardingLoading) {
    return (
      <View style={{
        flex: 1,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
      }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{
          fontSize: 16,
          color: colors.mutedForeground,
          marginTop: 16,
          textAlign: 'center',
        }}>
          {authLoading ? 'Checking authentication...' : 'Loading profile...'}
        </Text>
        
        {/* Emergency reset button if loading takes too long */}
        {loadingTimeout && (
          <TouchableOpacity
            onPress={async () => {
              console.log('Emergency sign out triggered');
              await signOut();
              setLoadingTimeout(false);
              router.replace('/(auth)/login');
            }}
            style={{
              marginTop: 24,
              paddingHorizontal: 16,
              paddingVertical: 8,
              backgroundColor: '#EF4444',
              borderRadius: 8,
              minHeight: 44,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text style={{
              color: '#FFFFFF',
              fontSize: 14,
              fontWeight: '500',
            }}>
              Loading stuck? Reset
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Return null while navigation is happening
  return null;
}
