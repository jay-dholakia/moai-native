import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BadgeService, UserBadge, MilestoneBadge } from '@/services/badge-service';
import { useAuth } from './useAuth';

export function useUserBadges() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-badges', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const response = await BadgeService.fetchUserBadges(user.id);
      return response.success ? response.data : [];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useMilestoneBadges(totalActivities: number) {
  const { data: userBadges = [] } = useUserBadges();
  
  return {
    badges: BadgeService.getMilestoneBadges(totalActivities, userBadges),
    currentBadge: BadgeService.getCurrentMilestoneBadge(totalActivities),
    nextBadge: BadgeService.getNextMilestoneBadge(totalActivities),
    progress: BadgeService.getMilestoneProgress(totalActivities),
  };
}

export function useMoaiMoverWeeks() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['moai-mover-weeks', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const response = await BadgeService.getMoaiMoverWeeks(user.id);
      return response.success ? response.data : 0;
    },
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useAwardBadge() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: {
      badgeType: 'milestone' | 'moai_mover';
      badgeKey: string;
      badgeName: string;
      badgeIcon: string;
      badgeDescription: string;
      milestoneValue?: number;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const response = await BadgeService.awardBadge(
        user.id,
        params.badgeType,
        params.badgeKey,
        params.badgeName,
        params.badgeIcon,
        params.badgeDescription,
        params.milestoneValue
      );
      
      if (!response.success) {
        throw new Error(response.error);
      }
      
      return response.data;
    },
    onSuccess: () => {
      // Invalidate badge queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['user-badges', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['moai-mover-weeks', user?.id] });
    },
  });
}

export function useCheckMilestoneBadges() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (totalActivities: number) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const response = await BadgeService.checkAndAwardMilestoneBadges(user.id, totalActivities);
      
      if (!response.success) {
        throw new Error(response.error);
      }
      
      return response.data;
    },
    onSuccess: (newBadges) => {
      // Invalidate badge queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['user-badges', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['moai-mover-weeks', user?.id] });
      
      // Return new badges for celebration display
      return newBadges;
    },
  });
}

// Combined hook for badge management
export function useBadges(totalActivities: number = 0) {
  const userBadges = useUserBadges();
  const milestoneBadges = useMilestoneBadges(totalActivities);
  const moaiMoverWeeks = useMoaiMoverWeeks();
  const awardBadge = useAwardBadge();
  const checkMilestoneBadges = useCheckMilestoneBadges();

  return {
    // Data
    userBadges: userBadges.data ?? [],
    milestoneBadges: milestoneBadges.badges,
    currentBadge: milestoneBadges.currentBadge,
    nextBadge: milestoneBadges.nextBadge,
    progress: milestoneBadges.progress,
    moaiMoverWeeks: moaiMoverWeeks.data ?? 0,
    
    // Loading states
    isLoading: userBadges.isLoading || moaiMoverWeeks.isLoading,
    isAwarding: awardBadge.isPending,
    isChecking: checkMilestoneBadges.isPending,
    
    // Actions
    awardBadge: awardBadge.mutate,
    checkMilestoneBadges: checkMilestoneBadges.mutate,
    
    // Refetch
    refetch: () => {
      userBadges.refetch();
      moaiMoverWeeks.refetch();
    },
  };
}