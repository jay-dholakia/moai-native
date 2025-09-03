import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

interface TokenBalance {
  current_balance: number;
  lifetime_earned: number;
  lifetime_spent: number;
}

interface TokenTransaction {
  id: string;
  amount: number;
  transaction_type: 'earned' | 'spent' | 'purchased';
  description: string;
  created_at: string;
}

export function useProfileTokens() {
  const { user } = useAuth();

  const tokenBalanceQuery = useQuery({
    queryKey: ['token-balance', user?.id],
    queryFn: async (): Promise<TokenBalance> => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('token_balance')
        .eq('id', user.id)
        .single();

      if (error) {
        throw error;
      }

      // For now, return basic balance info
      // In a full implementation, this would fetch from a tokens table
      const currentBalance = data?.token_balance || 0;

      return {
        current_balance: currentBalance,
        lifetime_earned: currentBalance, // Mock data
        lifetime_spent: 0 // Mock data
      };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const tokenTransactionsQuery = useQuery({
    queryKey: ['token-transactions', user?.id],
    queryFn: async (): Promise<TokenTransaction[]> => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Mock data for now - in a full implementation, this would fetch from a token_transactions table
      return [
        {
          id: '1',
          amount: 10,
          transaction_type: 'earned',
          description: 'Weekly activity completion',
          created_at: new Date(Date.now() - 86400000).toISOString() // 1 day ago
        },
        {
          id: '2',
          amount: 25,
          transaction_type: 'earned',
          description: 'Moai commitment achievement',
          created_at: new Date(Date.now() - 172800000).toISOString() // 2 days ago
        },
        {
          id: '3',
          amount: 5,
          transaction_type: 'spent',
          description: 'Profile customization',
          created_at: new Date(Date.now() - 259200000).toISOString() // 3 days ago
        }
      ];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    balance: tokenBalanceQuery.data?.current_balance || 0,
    lifetimeEarned: tokenBalanceQuery.data?.lifetime_earned || 0,
    lifetimeSpent: tokenBalanceQuery.data?.lifetime_spent || 0,
    transactions: tokenTransactionsQuery.data || [],
    isLoading: tokenBalanceQuery.isLoading || tokenTransactionsQuery.isLoading,
    error: tokenBalanceQuery.error || tokenTransactionsQuery.error,
    refetch: () => {
      tokenBalanceQuery.refetch();
      tokenTransactionsQuery.refetch();
    }
  };
}

export function useProfileProgress() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['profile-progress', user?.id],
    queryFn: async (): Promise<number> => {
      if (!user?.id) {
        return 0;
      }

      // Calculate weekly activity progress as a percentage
      // This is a simplified calculation - in a full implementation,
      // you would fetch the user's weekly commitment and current activities

      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1); // Monday
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday
      endOfWeek.setHours(23, 59, 59, 999);

      const { count: activitiesThisWeek, error } = await supabase
        .from('activity_logs')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', user.id)
        .gte('logged_at', startOfWeek.toISOString())
        .lte('logged_at', endOfWeek.toISOString());

      if (error) {
        console.error('Error fetching weekly activities:', error);
        return 0;
      }

      const weeklyActivities = activitiesThisWeek || 0;
      const weeklyGoal = 5; // Default weekly goal
      
      return Math.min((weeklyActivities / weeklyGoal) * 100, 100);
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}