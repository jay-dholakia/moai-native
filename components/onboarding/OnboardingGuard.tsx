import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useOnboarding } from '@/hooks/use-onboarding-progress';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout } from '@/utils/styles';

interface OnboardingGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * OnboardingGuard component that protects routes and ensures users complete onboarding
 * before accessing the main app. Redirects to onboarding if incomplete.
 */
export const OnboardingGuard = ({ 
  children, 
  redirectTo = '/onboarding' 
}: OnboardingGuardProps) => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { 
    isComplete, 
    shouldShowOnboarding, 
    isLoading: onboardingLoading 
  } = useOnboarding();
  const { colors } = useTheme();
  const router = useRouter();

  useEffect(() => {
    // Wait for auth and onboarding data to load
    if (authLoading || onboardingLoading) return;

    // If not authenticated, let the auth system handle it
    if (!isAuthenticated) return;

    // If onboarding is required, redirect to onboarding
    if (shouldShowOnboarding && !isComplete) {
      console.log('OnboardingGuard: Redirecting to onboarding - profile incomplete');
      router.replace(redirectTo as any);
      return;
    }
  }, [
    isAuthenticated, 
    isComplete, 
    shouldShowOnboarding, 
    authLoading, 
    onboardingLoading, 
    router, 
    redirectTo
  ]);

  // Show loading while we determine auth and onboarding status
  if (authLoading || onboardingLoading) {
    return (
      <View style={[
        tw(layout.flex1, layout.itemsCenter, layout.justifyCenter),
        { backgroundColor: colors.background }
      ]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[tw(text.base, spacing.mt(4)), { color: colors.mutedForeground }]}>
          Loading...
        </Text>
      </View>
    );
  }

  // If not authenticated, show nothing (auth system will handle)
  if (!isAuthenticated) {
    return null;
  }

  // If onboarding is incomplete, show nothing (will redirect)
  if (shouldShowOnboarding && !isComplete) {
    return null;
  }

  // Onboarding is complete, show the protected content
  return <>{children}</>;
};