import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Get environment variables from Expo constants
import Constants from 'expo-constants';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Warning for development - don't throw error to allow compilation
if (!supabaseUrl.includes('placeholder') && !supabaseAnonKey.includes('placeholder')) {
  console.log('✅ Supabase configuration loaded');
} else {
  console.warn('⚠️ Using placeholder Supabase configuration. Please update your environment variables.');
}

// Create Supabase client with React Native optimizations
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Use AsyncStorage for session persistence
    storage: AsyncStorage,
    // Enable automatic token refresh
    autoRefreshToken: true,
    // Persist session across app restarts
    persistSession: true,
    // Don't detect session in URL (not applicable for React Native)
    detectSessionInUrl: false,
    // Set flow type to PKCE for better security
    flowType: 'pkce',
  },
  // Configure for React Native
  global: {
    headers: {
      'X-Client-Info': 'moai-native',
    },
  },
  // Add retry logic for network issues
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Helper function to check Supabase connection
export const checkSupabaseConnection = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.from('profiles').select('count').limit(1).single();
    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Supabase connection error:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Failed to connect to Supabase:', error);
    return false;
  }
};

// Auth event listener setup
export const setupAuthListener = (callback: (event: string, session: any) => void) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
  return subscription;
};

// Helper to get current session
export const getCurrentSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Error getting session:', error);
      return null;
    }
    return session;
  } catch (error) {
    console.error('Failed to get current session:', error);
    return null;
  }
};

// Helper to get current user
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error('Error getting user:', error);
      return null;
    }
    return user;
  } catch (error) {
    console.error('Failed to get current user:', error);
    return null;
  }
};

// Sign out helper
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
      return { success: false, error };
    }
    return { success: true, error: null };
  } catch (error) {
    console.error('Failed to sign out:', error);
    return { success: false, error };
  }
};