import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ActivityService, CreateActivityData, ActivityFilters, ActivityStats } from '@/services/activity-service';
import { Activity, PaginatedResponse } from '@/services/types';

// Query keys
export const ACTIVITY_QUERY_KEYS = {
  all: ['activities'] as const,
  lists: () => [...ACTIVITY_QUERY_KEYS.all, 'list'] as const,
  list: (filters: ActivityFilters) => [...ACTIVITY_QUERY_KEYS.lists(), filters] as const,
  details: () => [...ACTIVITY_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...ACTIVITY_QUERY_KEYS.details(), id] as const,
  stats: () => [...ACTIVITY_QUERY_KEYS.all, 'stats'] as const,
  userStats: (moaiId?: string, dateFrom?: string, dateTo?: string) => 
    [...ACTIVITY_QUERY_KEYS.stats(), 'user', moaiId, dateFrom, dateTo] as const,
};

/**
 * Hook to fetch user's activities with optional filters and pagination
 */
export function useActivities(
  filters: ActivityFilters = {},
  page = 1,
  limit = 20,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: [...ACTIVITY_QUERY_KEYS.list(filters), page, limit],
    queryFn: () => ActivityService.getUserActivities(filters, page, limit),
    enabled: options?.enabled ?? true,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch a single activity by ID
 */
export function useActivity(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ACTIVITY_QUERY_KEYS.detail(id),
    queryFn: () => ActivityService.getActivity(id),
    enabled: (options?.enabled ?? true) && !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to fetch user's activity statistics
 */
export function useActivityStats(
  moaiId?: string,
  dateFrom?: string,
  dateTo?: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: ACTIVITY_QUERY_KEYS.userStats(moaiId, dateFrom, dateTo),
    queryFn: () => ActivityService.getUserActivityStats(moaiId, dateFrom, dateTo),
    enabled: options?.enabled ?? true,
    staleTime: 2 * 60 * 1000, // 2 minutes for stats
  });
}

/**
 * Hook to create a new activity
 */
export function useCreateActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateActivityData) => ActivityService.createActivity(data),
    onSuccess: (response) => {
      if (response.success) {
        // Invalidate and refetch activities list
        queryClient.invalidateQueries({ queryKey: ACTIVITY_QUERY_KEYS.lists() });
        // Invalidate stats as they may have changed
        queryClient.invalidateQueries({ queryKey: ACTIVITY_QUERY_KEYS.stats() });
      }
    },
  });
}

/**
 * Hook to update an activity
 */
export function useUpdateActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateActivityData> }) =>
      ActivityService.updateActivity(id, data),
    onSuccess: (response, variables) => {
      if (response.success) {
        // Invalidate the specific activity
        queryClient.invalidateQueries({ queryKey: ACTIVITY_QUERY_KEYS.detail(variables.id) });
        // Invalidate activities list
        queryClient.invalidateQueries({ queryKey: ACTIVITY_QUERY_KEYS.lists() });
        // Invalidate stats
        queryClient.invalidateQueries({ queryKey: ACTIVITY_QUERY_KEYS.stats() });
      }
    },
  });
}

/**
 * Hook to delete an activity
 */
export function useDeleteActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ActivityService.deleteActivity(id),
    onSuccess: (response, id) => {
      if (response.success) {
        // Remove the activity from cache
        queryClient.removeQueries({ queryKey: ACTIVITY_QUERY_KEYS.detail(id) });
        // Invalidate activities list
        queryClient.invalidateQueries({ queryKey: ACTIVITY_QUERY_KEYS.lists() });
        // Invalidate stats
        queryClient.invalidateQueries({ queryKey: ACTIVITY_QUERY_KEYS.stats() });
      }
    },
  });
}

/**
 * Helper hook to get activity types
 */
export function useActivityTypes() {
  return {
    types: ActivityService.getActivityTypes(),
    getEmoji: ActivityService.getActivityEmoji,
  };
}

/**
 * Hook to get this week's activities for quick stats
 */
export function useWeeklyActivities(moaiId?: string) {
  const now = new Date();
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
  startOfWeek.setHours(0, 0, 0, 0);
  
  const filters: ActivityFilters = {
    date_from: startOfWeek.toISOString(),
    ...(moaiId && { moai_id: moaiId }),
  };

  return useActivities(filters, 1, 100); // Get all activities for the week
}

/**
 * Hook to get today's activities
 */
export function useTodayActivities(moaiId?: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const filters: ActivityFilters = {
    date_from: today.toISOString(),
    ...(moaiId && { moai_id: moaiId }),
  };

  return useActivities(filters, 1, 50); // Get all activities for today
}