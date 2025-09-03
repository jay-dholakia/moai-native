import { useSupabase } from '@/providers/supabase-provider';

export function useAuth() {
  const { user, session, isLoading, signIn, signUp, signOut, resetPassword, updatePassword, signInWithProvider } = useSupabase();

  return {
    user,
    session,
    isLoading,
    isAuthenticated: !!session,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    signInWithProvider,
  };
}