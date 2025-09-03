import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { Alert } from 'react-native';
import { supabase, setupAuthListener } from '@/lib/supabase';
import { clearQueryCache, removeQueriesForUser } from './query-provider';
import { InvitationService } from '@/services/invitation-service';
import AsyncStorage from '@react-native-async-storage/async-storage';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  // Auth methods
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string, userData?: SignUpData) => Promise<AuthResult>;
  signOut: () => Promise<AuthResult>;
  signInWithProvider: (provider: 'google' | 'apple') => Promise<AuthResult>;
  resetPassword: (email: string) => Promise<AuthResult>;
  updatePassword: (password: string) => Promise<AuthResult>;
  // Utility methods
  refreshSession: () => Promise<void>;
  clearUserData: () => void;
};

type AuthResult = {
  success: boolean;
  error?: string;
  data?: any;
};

type SignUpData = {
  firstName?: string;
  lastName?: string;
  username?: string;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Handle pending invite redemption after successful authentication
  const handlePendingInviteRedemption = useCallback(async () => {
    try {
      const pendingInviteCode = await AsyncStorage.getItem('pendingInviteCode');
      
      if (pendingInviteCode) {
        console.log(`🎫 [AUTH] Processing pending invite: ${pendingInviteCode}`);
        
        const result = await InvitationService.validateAndJoinViaInvite(pendingInviteCode);
        
        if (result.success && result.data?.success) {
          console.log(`✅ [AUTH] Successfully joined moai: ${result.data.moai_name}`);
          
          // Clear the pending invite code
          await AsyncStorage.removeItem('pendingInviteCode');
          
          // Show success message
          Alert.alert(
            'Welcome to the Moai!',
            `You've successfully joined "${result.data.moai_name}". Let's complete your profile!`,
            [{ text: 'Continue', style: 'default' }]
          );
        } else {
          console.error(`❌ [AUTH] Failed to redeem invite:`, result.error || result.data?.error);
          
          // Don't clear the invite code if it failed - user might try again
          Alert.alert(
            'Invite Redemption Failed',
            result.error || result.data?.error || 'Failed to join the moai. Please try again later.',
            [{ text: 'OK', style: 'default' }]
          );
        }
      }
    } catch (error) {
      console.error('❌ [AUTH] Error processing pending invite:', error);
    }
  }, []);

  // Handle auth state changes
  const handleAuthStateChange = useCallback((event: string, session: Session | null) => {
    console.log('Auth state changed:', event, !!session);
    
    setSession(session);
    setUser(session?.user ?? null);
    
    // Handle different auth events
    switch (event) {
      case 'SIGNED_IN':
        console.log('User signed in:', session?.user?.email);
        // Handle invite redemption after successful authentication
        if (session?.user) {
          setTimeout(() => handlePendingInviteRedemption(), 1000); // Delay to ensure UI is ready
        }
        break;
      case 'SIGNED_OUT':
        console.log('User signed out');
        // Clear query cache directly without dependency on clearUserData
        clearQueryCache();
        break;
      case 'TOKEN_REFRESHED':
        console.log('Token refreshed');
        break;
      case 'PASSWORD_RECOVERY':
        console.log('Password recovery initiated');
        break;
      default:
        break;
    }
    
    setIsLoading(false);
  }, []); // Remove all dependencies to prevent infinite loops

  // Set up auth listener on mount
  useEffect(() => {
    let mounted = true;

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting initial session:', error);
          // Clear invalid session
          if (error.message?.includes('JWT') || error.message?.includes('expired')) {
            console.log('Clearing invalid session');
            await supabase.auth.signOut();
          }
        }
        
        if (mounted) {
          // Validate session before setting
          if (session && session.expires_at && new Date(session.expires_at * 1000) > new Date()) {
            console.log('Valid session found for user:', session.user?.email);
            setSession(session);
            setUser(session?.user ?? null);
          } else {
            console.log('No valid session found');
            setSession(null);
            setUser(null);
          }
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Failed to get initial session:', error);
        if (mounted) {
          setSession(null);
          setUser(null);
          setIsLoading(false);
        }
      }
    };

    getInitialSession();

    // Set up auth state listener
    const authSubscription = setupAuthListener(handleAuthStateChange);

    return () => {
      mounted = false;
      authSubscription?.unsubscribe();
    };
  }, []); // Remove handleAuthStateChange dependency

  // Handle user data cleanup when user changes
  // Commented out to prevent infinite loops - cleanup happens in auth state change handler
  // useEffect(() => {
  //   if (!user && session === null) {
  //     clearQueryCache();
  //   }
  // }, [user, session]);

  // Sign in with email and password
  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        const errorMessage = getAuthErrorMessage(error);
        Alert.alert('Sign In Error', errorMessage);
        return { success: false, error: errorMessage };
      }

      return { success: true, data };
    } catch (error: any) {
      const errorMessage = error?.message || 'An unexpected error occurred';
      Alert.alert('Sign In Error', errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  // Sign up with email and password
  const signUp = useCallback(async (
    email: string, 
    password: string, 
    userData?: SignUpData
  ): Promise<AuthResult> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            first_name: userData?.firstName,
            last_name: userData?.lastName,
            username: userData?.username,
            full_name: userData?.firstName && userData?.lastName 
              ? `${userData.firstName} ${userData.lastName}` 
              : undefined,
          }
        }
      });

      if (error) {
        const errorMessage = getAuthErrorMessage(error);
        Alert.alert('Sign Up Error', errorMessage);
        return { success: false, error: errorMessage };
      }

      // Show success message for email confirmation
      if (data.user && !data.session) {
        Alert.alert(
          'Check Your Email',
          'We sent you a confirmation link. Please check your email and click the link to verify your account.',
          [{ text: 'OK' }]
        );
      }

      return { success: true, data };
    } catch (error: any) {
      const errorMessage = error?.message || 'An unexpected error occurred';
      Alert.alert('Sign Up Error', errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  // Sign out
  const signOut = useCallback(async (): Promise<AuthResult> => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('Error signing out:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      const errorMessage = error?.message || 'An unexpected error occurred';
      console.error('Failed to sign out:', error);
      return { success: false, error: errorMessage };
    }
  }, []);

  // Sign in with OAuth provider
  const signInWithProvider = useCallback(async (provider: 'google' | 'apple'): Promise<AuthResult> => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: 'moai://auth/callback',
        }
      });

      if (error) {
        const errorMessage = getAuthErrorMessage(error);
        Alert.alert('Sign In Error', errorMessage);
        return { success: false, error: errorMessage };
      }

      return { success: true, data };
    } catch (error: any) {
      const errorMessage = error?.message || 'An unexpected error occurred';
      Alert.alert('Sign In Error', errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  // Reset password
  const resetPassword = useCallback(async (email: string): Promise<AuthResult> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: 'moai://auth/reset-password',
      });

      if (error) {
        const errorMessage = getAuthErrorMessage(error);
        Alert.alert('Reset Password Error', errorMessage);
        return { success: false, error: errorMessage };
      }

      Alert.alert(
        'Check Your Email',
        'We sent you a password reset link. Please check your email and follow the instructions.',
        [{ text: 'OK' }]
      );

      return { success: true };
    } catch (error: any) {
      const errorMessage = error?.message || 'An unexpected error occurred';
      Alert.alert('Reset Password Error', errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  // Update password
  const updatePassword = useCallback(async (password: string): Promise<AuthResult> => {
    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        const errorMessage = getAuthErrorMessage(error);
        Alert.alert('Update Password Error', errorMessage);
        return { success: false, error: errorMessage };
      }

      Alert.alert('Success', 'Your password has been updated successfully.');
      return { success: true };
    } catch (error: any) {
      const errorMessage = error?.message || 'An unexpected error occurred';
      Alert.alert('Update Password Error', errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  // Refresh session
  const refreshSession = useCallback(async (): Promise<void> => {
    try {
      const { error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('Error refreshing session:', error);
      }
    } catch (error) {
      console.error('Failed to refresh session:', error);
    }
  }, []);

  // Clear user data from cache - stable reference
  const clearUserData = useCallback(() => {
    clearQueryCache();
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const value: AuthContextType = useMemo(() => ({
    user,
    session,
    isLoading,
    isAuthenticated: !!session && !!user,
    signIn,
    signUp,
    signOut,
    signInWithProvider,
    resetPassword,
    updatePassword,
    refreshSession,
    clearUserData,
  }), [user, session, isLoading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useSupabase() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
}

// Helper function to get user-friendly error messages
function getAuthErrorMessage(error: AuthError): string {
  switch (error.message) {
    case 'Invalid login credentials':
      return 'Invalid email or password. Please check your credentials and try again.';
    case 'Email not confirmed':
      return 'Please check your email and click the confirmation link before signing in.';
    case 'User already registered':
      return 'An account with this email already exists. Please sign in instead.';
    case 'Password should be at least 6 characters':
      return 'Password must be at least 6 characters long.';
    case 'Invalid email':
      return 'Please enter a valid email address.';
    case 'Signup disabled':
      return 'New user registration is currently disabled.';
    default:
      return error.message || 'An unexpected error occurred. Please try again.';
  }
}