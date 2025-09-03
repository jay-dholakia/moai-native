import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';

import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout } from '@/utils/styles';

interface AuthGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
  requireAuth?: boolean;
}

/**
 * AuthGuard component that ensures users are authenticated
 * before accessing protected content
 */
export const AuthGuard = ({ 
  children, 
  redirectTo = '/(auth)/login',
  requireAuth = true 
}: AuthGuardProps) => {
  const { isAuthenticated, isLoading } = useAuth();
  const { theme, colors } = useTheme();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      // If authentication is required and user is not authenticated
      if (requireAuth && !isAuthenticated) {
        console.log('AuthGuard: User not authenticated, redirecting to auth');
        router.replace(redirectTo as any);
        return;
      }
      
      // If authentication is not required but user is authenticated (e.g., auth screens)
      if (!requireAuth && isAuthenticated) {
        console.log('AuthGuard: User authenticated, redirecting to main app');
        router.replace('/');
        return;
      }
    }
  }, [isAuthenticated, isLoading, requireAuth, redirectTo, router]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <View style={[
        tw(layout.flex1, layout.itemsCenter, layout.justifyCenter),
        { backgroundColor: colors.background }
      ]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[tw(text.base, spacing.mt(4)), { color: colors.mutedForeground }]}>
          Checking authentication...
        </Text>
      </View>
    );
  }

  // If auth is required and user is not authenticated, return null (redirect will happen)
  if (requireAuth && !isAuthenticated) {
    return null;
  }

  // If auth is not required but user is authenticated, return null (redirect will happen)
  if (!requireAuth && isAuthenticated) {
    return null;
  }

  // Auth requirements met, render children
  return <>{children}</>;
};

/**
 * Higher-order component to wrap screens that require authentication
 */
export const withAuthGuard = <P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    redirectTo?: string;
    requireAuth?: boolean;
  }
) => {
  const WrappedComponent = (props: P) => {
    return (
      <AuthGuard 
        redirectTo={options?.redirectTo}
        requireAuth={options?.requireAuth}
      >
        <Component {...props} />
      </AuthGuard>
    );
  };

  WrappedComponent.displayName = `withAuthGuard(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};