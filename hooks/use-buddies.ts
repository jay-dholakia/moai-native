import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BuddyService, BuddyPreferences, BuddyRequest, BuddyPair } from '@/services/buddy-service';

/**
 * Hook to find potential buddy matches
 */
export function usePotentialBuddies(preferences: BuddyPreferences | null) {
  return useQuery({
    queryKey: ['potential-buddies', preferences],
    queryFn: async () => {
      if (!preferences) {
        return { success: false as const, error: 'No preferences' };
      }
      return await BuddyService.findPotentialMatches(preferences);
    },
    enabled: !!preferences,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to get pending buddy requests
 */
export function usePendingBuddyRequests() {
  return useQuery({
    queryKey: ['buddy-requests', 'pending'],
    queryFn: BuddyService.getPendingRequests,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to get current buddy
 */
export function useCurrentBuddy() {
  return useQuery({
    queryKey: ['current-buddy'],
    queryFn: BuddyService.getCurrentBuddy,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to send buddy request
 */
export function useSendBuddyRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ requesteeId, message }: { requesteeId: string; message?: string }) =>
      BuddyService.sendBuddyRequest(requesteeId, message),
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['buddy-requests'] });
      queryClient.invalidateQueries({ queryKey: ['potential-buddies'] });
    },
  });
}

/**
 * Hook to respond to buddy request
 */
export function useRespondToBuddyRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ requestId, accept }: { requestId: string; accept: boolean }) =>
      BuddyService.respondToBuddyRequest(requestId, accept),
    onSuccess: (response) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['buddy-requests'] });
      queryClient.invalidateQueries({ queryKey: ['current-buddy'] });
      
      // If accepted, we now have a buddy
      if (response.success && response.data && 'user1_id' in response.data) {
        queryClient.setQueryData(['current-buddy'], response);
      }
    },
  });
}

/**
 * Hook to submit buddy check-in
 */
export function useSubmitBuddyCheckIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ buddyPairId, checkInData }: { 
      buddyPairId: string; 
      checkInData: {
        buddy_pair_id: string;
        week_start: string;
        activities_completed: number;
        goals_met: boolean;
        notes?: string;
        mood_rating?: number;
      }
    }) => BuddyService.submitCheckIn(buddyPairId, checkInData),
    onSuccess: () => {
      // Invalidate buddy data to refresh check-ins
      queryClient.invalidateQueries({ queryKey: ['buddy-checkins'] });
      queryClient.invalidateQueries({ queryKey: ['current-buddy'] });
    },
  });
}

/**
 * Hook to get buddy check-ins
 */
export function useBuddyCheckIns(buddyPairId: string | null, limit = 10) {
  return useQuery({
    queryKey: ['buddy-checkins', buddyPairId, limit],
    queryFn: async () => {
      if (!buddyPairId) {
        return { success: false as const, error: 'No buddy pair' };
      }
      return await BuddyService.getBuddyCheckIns(buddyPairId, limit);
    },
    enabled: !!buddyPairId,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook to check if user has a current buddy
 */
export function useHasBuddy() {
  const { data: currentBuddy, isLoading } = useCurrentBuddy();
  
  const hasBuddy = currentBuddy?.success && currentBuddy.data !== null;
  
  return {
    hasBuddy,
    buddy: hasBuddy ? currentBuddy.data : null,
    isLoading,
  };
}