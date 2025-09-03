import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';

import { useAuth } from '@/hooks/useAuth';
import { useOnboarding } from '@/hooks/use-onboarding-progress';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout } from '@/utils/styles';

interface ProfileGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
  requireComplete?: boolean;
}

/**
 * ProfileGuard component that ensures users have completed their profile
 * before accessing protected content
 */
export const ProfileGuard = ({ 
  children, 
  redirectTo = '/onboarding',
  requireComplete = true 
}: ProfileGuardProps) => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { 
    isComplete, 
    shouldShowOnboarding, 
    isLoading: onboardingLoading 
  } = useOnboarding();
  const { theme, colors } = useTheme();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !onboardingLoading) {
      // If not authenticated, redirect to auth
      if (!isAuthenticated) {
        console.log('ProfileGuard: User not authenticated, redirecting to auth');
        router.replace('/(auth)/login');
        return;
      }
      
      // If profile completion is required and profile is not complete
      if (requireComplete && (!isComplete || shouldShowOnboarding)) {
        console.log('ProfileGuard: Profile incomplete, redirecting to onboarding');
        router.replace(redirectTo as any);
        return;
      }
    }
  }, [
    isAuthenticated, 
    isComplete, 
    shouldShowOnboarding, 
    authLoading, 
    onboardingLoading, 
    requireComplete
    // Removed redirectTo and router from dependencies to prevent loops
  ]);

  // Show loading while checking authentication and profile status
  if (authLoading || onboardingLoading) {
    return (
      <View style={[
        tw(layout.flex1, layout.itemsCenter, layout.justifyCenter),
        { backgroundColor: colors.background }
      ]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[tw(text.base, spacing.mt(4)), { color: colors.mutedForeground }]}>
          Checking profile...
        </Text>
      </View>
    );
  }

  // If not authenticated, return null (redirect will happen via useEffect)
  if (!isAuthenticated) {
    return null;
  }

  // If profile completion is required and profile is not complete, return null
  if (requireComplete && (!isComplete || shouldShowOnboarding)) {
    return null;
  }

  // Profile is complete or completion not required, render children
  return <>{children}</>;
};

/**
 * Hook to check if user profile is complete
 */
export const useProfileComplete = () => {
  const { isAuthenticated } = useAuth();
  const { isComplete, shouldShowOnboarding, isLoading } = useOnboarding();
  
  return {
    isProfileComplete: isAuthenticated && isComplete && !shouldShowOnboarding,
    isAuthenticated,
    isComplete,
    shouldShowOnboarding,
    isLoading,
    requiresOnboarding: isAuthenticated && (!isComplete || shouldShowOnboarding),
  };
};

/**
 * Higher-order component to wrap screens that require completed profiles
 */
export const withProfileGuard = <P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    redirectTo?: string;
    requireComplete?: boolean;
  }
) => {
  const WrappedComponent = (props: P) => {
    return (
      <ProfileGuard 
        redirectTo={options?.redirectTo}
        requireComplete={options?.requireComplete}
      >
        <Component {...props} />
      </ProfileGuard>
    );
  };

  WrappedComponent.displayName = `withProfileGuard(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};