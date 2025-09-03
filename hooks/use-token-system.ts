import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import TokenService, { 
  TokenBalance, 
  TokenTransaction, 
  MarketplaceItem, 
  TokenPurchase,
  UserTokenPurchase,
  TokenEarningRule
} from '@/services/token-service';
import { ServiceResponse } from '@/services/types';

// Query keys
export const tokenKeys = {
  all: ['tokens'] as const,
  balance: (userId?: string) => [...tokenKeys.all, 'balance', userId] as const,
  transactions: (userId?: string) => [...tokenKeys.all, 'transactions', userId] as const,
  marketplace: () => [...tokenKeys.all, 'marketplace'] as const,
  purchases: (userId?: string) => [...tokenKeys.all, 'purchases', userId] as const,
  rules: () => [...tokenKeys.all, 'rules'] as const,
  leaderboard: () => [...tokenKeys.all, 'leaderboard'] as const,
};

/**
 * Hook to get user's token balance
 */
export function useTokenBalance() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: tokenKeys.balance(user?.id),
    queryFn: () => user ? TokenService.getUserBalance(user.id) : Promise.resolve({ success: false, error: 'No user' } as ServiceResponse<TokenBalance>),
    enabled: !!user,
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
  });
}

/**
 * Hook to get user's transaction history
 */
export function useTransactionHistory(limit: number = 50, offset: number = 0) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: [...tokenKeys.transactions(user?.id), limit, offset],
    queryFn: () => user ? TokenService.getTransactionHistory(user.id, limit, offset) : Promise.resolve({ success: false, error: 'No user' } as ServiceResponse<TokenTransaction[]>),
    enabled: !!user,
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes
  });
}

/**
 * Hook to get marketplace items
 */
export function useMarketplace() {
  return useQuery({
    queryKey: tokenKeys.marketplace(),
    queryFn: TokenService.getMarketplaceItems,
    staleTime: 300000, // 5 minutes
    gcTime: 600000, // 10 minutes
  });
}

/**
 * Hook to get user's purchase history
 */
export function useUserPurchases() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: tokenKeys.purchases(user?.id),
    queryFn: () => user ? TokenService.getUserPurchases(user.id) : Promise.resolve({ success: false, error: 'No user' } as ServiceResponse<UserTokenPurchase[]>),
    enabled: !!user,
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes
  });
}

/**
 * Hook to get token earning rules
 */
export function useEarningRules() {
  return useQuery({
    queryKey: tokenKeys.rules(),
    queryFn: TokenService.getEarningRules,
    staleTime: 600000, // 10 minutes
    gcTime: 1800000, // 30 minutes
  });
}

/**
 * Hook to get token leaderboard
 */
export function useTokenLeaderboard(limit: number = 10) {
  return useQuery({
    queryKey: [...tokenKeys.leaderboard(), limit],
    queryFn: () => TokenService.getTokenLeaderboard(limit),
    staleTime: 300000, // 5 minutes
    gcTime: 600000, // 10 minutes
  });
}

/**
 * Hook to award tokens (for internal use)
 */
export function useAwardTokens() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: {
      amount: number;
      description: string;
      source: TokenTransaction['source'];
      referenceId?: string;
      referenceType?: TokenTransaction['reference_type'];
    }) => {
      if (!user) throw new Error('No user authenticated');
      // Map legacy parameters to new TokenService signature
      const sourceType = params.source === 'activity' ? 'activity' : 
                        params.source === 'achievement' ? 'tier' : 
                        params.source === 'streak' ? 'commitment_individual' :
                        'activity';
                        
      return TokenService.awardTokens(
        user.id,
        params.amount,
        sourceType,
        params.referenceId, // Use as moaiId if available
        undefined // weekStartDate will be calculated automatically
      );
    },
    onSuccess: () => {
      // Invalidate and refetch related queries
      if (user) {
        queryClient.invalidateQueries({ queryKey: tokenKeys.balance(user.id) });
        queryClient.invalidateQueries({ queryKey: tokenKeys.transactions(user.id) });
      }
    },
  });
}

/**
 * Hook to spend tokens
 */
export function useSpendTokens() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: {
      amount: number;
      description: string;
      source: TokenTransaction['source'];
      referenceId?: string;
      referenceType?: TokenTransaction['reference_type'];
    }) => {
      if (!user) throw new Error('No user authenticated');
      return TokenService.spendTokens(
        user.id,
        params.amount,
        params.description,
        params.referenceType && params.referenceId 
          ? { type: params.referenceType, id: params.referenceId }
          : undefined
      );
    },
    onSuccess: () => {
      // Invalidate and refetch related queries
      if (user) {
        queryClient.invalidateQueries({ queryKey: tokenKeys.balance(user.id) });
        queryClient.invalidateQueries({ queryKey: tokenKeys.transactions(user.id) });
      }
    },
  });
}

/**
 * Hook to purchase marketplace item
 */
export function useMarketplacePurchase() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (itemId: string) => {
      if (!user) throw new Error('No user authenticated');
      return TokenService.purchaseMarketplaceItem(user.id, itemId);
    },
    onSuccess: () => {
      // Invalidate and refetch related queries
      if (user) {
        queryClient.invalidateQueries({ queryKey: tokenKeys.balance(user.id) });
        queryClient.invalidateQueries({ queryKey: tokenKeys.transactions(user.id) });
        queryClient.invalidateQueries({ queryKey: tokenKeys.purchases(user.id) });
      }
    },
  });
}

/**
 * Hook to award activity tokens
 */
export function useAwardActivityTokens() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: {
      activityType: string;
      duration?: number;
      activityId?: string;
    }) => {
      if (!user) throw new Error('No user authenticated');
      return TokenService.awardActivityTokens(
        user.id,
        params.activityType,
        params.duration,
        params.activityId
      );
    },
    onSuccess: () => {
      // Invalidate and refetch related queries
      if (user) {
        queryClient.invalidateQueries({ queryKey: tokenKeys.balance(user.id) });
        queryClient.invalidateQueries({ queryKey: tokenKeys.transactions(user.id) });
      }
    },
  });
}

/**
 * Hook to award achievement tokens
 */
export function useAwardAchievementTokens() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: {
      achievementType: 'badge' | 'tier';
      achievementName: string;
      referenceId?: string;
    }) => {
      if (!user) throw new Error('No user authenticated');
      return TokenService.awardAchievementTokens(
        user.id,
        params.achievementName,
        params.referenceId
      );
    },
    onSuccess: () => {
      // Invalidate and refetch related queries
      if (user) {
        queryClient.invalidateQueries({ queryKey: tokenKeys.balance(user.id) });
        queryClient.invalidateQueries({ queryKey: tokenKeys.transactions(user.id) });
      }
    },
  });
}

/**
 * Hook to award streak tokens
 */
export function useAwardStreakTokens() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (streakLength: number) => {
      if (!user) throw new Error('No user authenticated');
      return TokenService.awardStreakTokens(user.id, streakLength);
    },
    onSuccess: () => {
      // Invalidate and refetch related queries
      if (user) {
        queryClient.invalidateQueries({ queryKey: tokenKeys.balance(user.id) });
        queryClient.invalidateQueries({ queryKey: tokenKeys.transactions(user.id) });
      }
    },
  });
}

/**
 * Hook for combined activity logging with token rewards
 */
export function useLogActivityWithTokens() {
  const awardActivityTokens = useAwardActivityTokens();
  
  return {
    logActivity: async (params: {
      activityType: string;
      duration?: number;
      activityId?: string;
    }) => {
      // Award tokens for the activity
      const tokenResult = await awardActivityTokens.mutateAsync(params);
      
      return {
        tokensAwarded: tokenResult.success ? tokenResult.data.points : 0,
        tokenError: tokenResult.success ? null : tokenResult.error,
      };
    },
    isLoading: awardActivityTokens.isPending,
  };
}

/**
 * Hook to check if user can afford an item
 */
export function useCanAfford(cost: number) {
  const { data: balanceResponse } = useTokenBalance();
  
  const balance = balanceResponse?.success ? balanceResponse.data.balance : 0;
  const canAfford = balance >= cost;
  
  return {
    canAfford,
    balance,
    shortfall: canAfford ? 0 : cost - balance,
  };
}

/**
 * Hook to get user's token statistics
 */
export function useTokenStats() {
  const { data: balanceResponse } = useTokenBalance();
  const { data: transactionsResponse } = useTransactionHistory(100); // Get recent transactions for stats
  
  const balance = balanceResponse?.success ? balanceResponse.data : null;
  const transactions = transactionsResponse?.success ? transactionsResponse.data : [];
  
  // Calculate statistics
  const stats = {
    currentBalance: balance?.balance || 0,
    lifetimeEarned: balance?.lifetime_earned || 0,
    lifetimeSpent: balance?.lifetime_spent || 0,
    recentEarnings: transactions.filter((t: TokenTransaction) => t.type === 'earn' && new Date(t.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).reduce((sum: number, t: TokenTransaction) => sum + t.amount, 0),
    recentSpending: transactions.filter((t: TokenTransaction) => t.type === 'spend' && new Date(t.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).reduce((sum: number, t: TokenTransaction) => sum + Math.abs(t.amount), 0),
    totalTransactions: transactions.length,
  };
  
  return {
    stats,
    isLoading: !balanceResponse || !transactionsResponse,
  };
}