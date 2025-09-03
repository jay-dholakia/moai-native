import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TierSystemService, UserTierStatus, MoaiTierStats, StreakData, TierLevel, TIER_REQUIREMENTS } from '@/services/tier-system-service';
import { ServiceResponse } from '@/services/types';
import { useAuth } from './useAuth';

/**
 * Hook to get current user's tier status
 */
export function useUserTierStatus(userId?: string) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ['user-tier-status', targetUserId],
    queryFn: () => targetUserId ? TierSystemService.getUserTierStatus(targetUserId) : Promise.resolve({ success: false, error: 'No user ID' } as ServiceResponse<UserTierStatus>),
    enabled: !!targetUserId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // Refresh every 10 minutes
    select: (data: ServiceResponse<UserTierStatus>) => data.success ? data.data : null,
  });
}

/**
 * Hook to get MOAI tier statistics
 */
export function useMoaiTierStats(moaiId: string) {
  return useQuery({
    queryKey: ['moai-tier-stats', moaiId],
    queryFn: () => TierSystemService.getMoaiTierStats(moaiId),
    enabled: !!moaiId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
    select: (data: ServiceResponse<MoaiTierStats>) => data.success ? data.data : null,
  });
}

/**
 * Hook to get user's streak data
 */
export function useUserStreakData(userId?: string) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ['user-streak-data', targetUserId],
    queryFn: () => targetUserId ? TierSystemService.getUserStreakData(targetUserId) : Promise.resolve({ success: false, error: 'No user ID' } as ServiceResponse<StreakData>),
    enabled: !!targetUserId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 15 * 60 * 1000, // Refresh every 15 minutes
    select: (data: ServiceResponse<StreakData>) => data.success ? data.data : null,
  });
}

/**
 * Mutation to update elite week status for a MOAI
 */
export function useUpdateEliteWeekStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (moaiId: string) => TierSystemService.updateEliteWeekStatus(moaiId),
    onSuccess: (result, moaiId) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['moai-tier-stats', moaiId] });
      queryClient.invalidateQueries({ queryKey: ['user-tier-status'] });
      
      return result;
    },
  });
}

/**
 * Hook to get tier requirements and information
 */
export function useTierRequirements() {
  return {
    requirements: TIER_REQUIREMENTS,
    getTierColor: (tier: TierLevel) => TIER_REQUIREMENTS[tier]?.color || '#CD7F32',
    getTierIcon: (tier: TierLevel) => TIER_REQUIREMENTS[tier]?.icon || '🥉',
    getTierDescription: (tier: TierLevel) => TIER_REQUIREMENTS[tier]?.description || '',
  };
}

/**
 * Combined hook for user progress dashboard
 */
export function useUserProgressDashboard(userId?: string) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  const tierStatus = useUserTierStatus(targetUserId);
  const streakData = useUserStreakData(targetUserId);
  const tierRequirements = useTierRequirements();

  return {
    tierStatus: tierStatus.data,
    streakData: streakData.data,
    tierRequirements,
    isLoading: tierStatus.isLoading || streakData.isLoading,
    error: tierStatus.error || streakData.error,
    refetch: () => {
      tierStatus.refetch();
      streakData.refetch();
    },
  };
}

/**
 * Hook for MOAI group dashboard
 */
export function useMoaiProgressDashboard(moaiId: string) {
  const moaiTierStats = useMoaiTierStats(moaiId);
  const updateEliteWeek = useUpdateEliteWeekStatus();
  const tierRequirements = useTierRequirements();

  return {
    tierStats: moaiTierStats.data,
    tierRequirements,
    isLoading: moaiTierStats.isLoading,
    error: moaiTierStats.error,
    updateEliteWeekStatus: () => updateEliteWeek.mutate(moaiId),
    isUpdatingEliteWeek: updateEliteWeek.isPending,
    refetch: moaiTierStats.refetch,
  };
}

/**
 * Hook to check if user can be promoted to next tier
 */
export function useCanPromote(userId?: string) {
  const tierStatus = useUserTierStatus(userId);
  const data = tierStatus.data;
  
  return {
    canPromote: data?.canPromote || false,
    nextTier: data?.nextTierRequirements?.level,
    currentProgress: data?.consecutiveWeeks || 0,
    requiredWeeks: data?.nextTierRequirements?.consecutiveWeeksRequired || 0,
    progressPercentage: data?.nextTierRequirements 
      ? Math.min((data.consecutiveWeeks / data.nextTierRequirements.consecutiveWeeksRequired) * 100, 100)
      : 100,
  };
}

/**
 * Hook for leaderboard data (multiple users)
 */
export function useLeaderboardData(userIds: string[]) {
  const queries = userIds.map(userId => 
    useQuery({
      queryKey: ['user-tier-status', userId],
      queryFn: () => TierSystemService.getUserTierStatus(userId),
      enabled: !!userId,
      select: (data) => data.success ? { ...data.data, userId } : null,
    })
  );

  const isLoading = queries.some(q => q.isLoading);
  const hasError = queries.some(q => q.error);
  
  const leaderboardData = queries
    .map(q => q.data)
    .filter(Boolean)
    .sort((a, b) => {
      // Sort by tier level (elite > gold > silver > bronze), then by consecutive weeks
      const tierOrder = { elite: 4, gold: 3, silver: 2, bronze: 1 };
      const aTierValue = tierOrder[a!.currentTier as TierLevel];
      const bTierValue = tierOrder[b!.currentTier as TierLevel];
      
      if (aTierValue !== bTierValue) {
        return bTierValue - aTierValue;
      }
      
      return (b!.consecutiveWeeks || 0) - (a!.consecutiveWeeks || 0);
    });

  return {
    leaderboardData,
    isLoading,
    hasError,
    refetch: () => queries.forEach(q => q.refetch()),
  };
}