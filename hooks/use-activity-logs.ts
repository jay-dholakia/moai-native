import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { ActivityLogService, ActivityLog, ActivityLogInput, ActivityStats } from '@/services/activity-log-service';
import { ServiceResponse } from '@/services/types';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

// Query keys
export const activityKeys = {
  all: ['activity-logs'] as const,
  userActivities: (userId?: string) => [...activityKeys.all, userId] as const,
  stats: (userId?: string) => ['activity-stats', userId] as const,
  range: (userId?: string, startDate?: string, endDate?: string) => ['activity-logs-range', userId, startDate, endDate] as const,
  type: (userId?: string, activityType?: string, limit?: number) => ['activity-logs-type', userId, activityType, limit] as const,
};

export function useActivityLogs(userId?: string, limit = 20) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['activity-logs', targetUserId],
    queryFn: ({ pageParam }) => 
      ActivityLogService.getUserActivities(targetUserId, pageParam, limit),
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.success && lastPage.data && lastPage.data.hasMore) {
        return pages.length + 1;
      }
      return undefined;
    },
    enabled: !!targetUserId,
  });

  const activities = data?.pages.flatMap(page => 
    page.success && page.data ? page.data.activities : []
  ) || [];

  const total = data?.pages[0]?.success && data.pages[0].data ? data.pages[0].data.total : 0;

  return {
    activities,
    total,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch,
  };
}

export function useActivityStats(userId?: string) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  const { data, isLoading, error } = useQuery<ServiceResponse<ActivityStats>, Error>({
    queryKey: ['activity-stats', targetUserId],
    queryFn: () => ActivityLogService.getUserStats(targetUserId),
    enabled: !!targetUserId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  return {
    stats: data?.success ? data.data : null,
    isLoading,
    error,
  };
}

export function useLogActivity() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const mutation = useMutation<ServiceResponse<ActivityLog>, Error, ActivityLogInput>({
    mutationFn: (data: ActivityLogInput) => ActivityLogService.logActivity(data),
    onSuccess: (response) => {
      if (response.success) {
        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
        queryClient.invalidateQueries({ queryKey: ['activity-stats'] });
        
        toast({
          title: 'Activity logged!',
          description: `Your ${response.data?.activity_type} has been recorded.`,
        });
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to log activity',
          variant: 'destructive',
        });
      }
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to log activity. Please try again.',
        variant: 'destructive',
      });
    },
  });

  return {
    logActivity: mutation.mutate,
    isLogging: mutation.isPending,
    error: mutation.error,
  };
}

export function useQuickLog() {
  const { logActivity, isLogging } = useLogActivity();

  const quickLog = (activityType: string, emoji: string, duration?: number) => {
    logActivity({
      activity_type: activityType,
      emoji,
      duration_minutes: duration,
      notes: duration ? `${duration} minute ${activityType} session` : `Quick ${activityType} session`,
    });
  };

  return {
    quickLog,
    isLogging,
  };
}

export function useUpdateActivity() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation<ServiceResponse<ActivityLog>, Error, { id: string; updates: Partial<ActivityLogInput> }>({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<ActivityLogInput> }) =>
      ActivityLogService.updateActivity(id, updates),
    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
        queryClient.invalidateQueries({ queryKey: ['activity-stats'] });
        
        toast({
          title: 'Activity updated',
          description: 'Your activity has been updated successfully.',
        });
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to update activity',
          variant: 'destructive',
        });
      }
    },
  });

  return {
    updateActivity: mutation.mutate,
    isUpdating: mutation.isPending,
  };
}

export function useDeleteActivity() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation<ServiceResponse<void>, Error, string>({
    mutationFn: (id: string) => ActivityLogService.deleteActivity(id),
    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
        queryClient.invalidateQueries({ queryKey: ['activity-stats'] });
        
        toast({
          title: 'Activity deleted',
          description: 'Your activity has been removed.',
        });
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to delete activity',
          variant: 'destructive',
        });
      }
    },
  });

  return {
    deleteActivity: mutation.mutate,
    isDeleting: mutation.isPending,
  };
}

export function useActivityDateRange(startDate: Date, endDate: Date, userId?: string) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  const { data, isLoading, error } = useQuery<ServiceResponse<ActivityLog[]>, Error>({
    queryKey: ['activity-logs-range', targetUserId, startDate.toISOString(), endDate.toISOString()],
    queryFn: () => ActivityLogService.getActivitiesByDateRange(startDate, endDate, targetUserId),
    enabled: !!targetUserId,
  });

  return {
    activities: data?.success ? data.data : [],
    isLoading,
    error,
  };
}

export function useActivityByType(activityType: string, userId?: string, limit = 20) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  const { data, isLoading, error } = useQuery<ServiceResponse<ActivityLog[]>, Error>({
    queryKey: ['activity-logs-type', targetUserId, activityType, limit],
    queryFn: () => ActivityLogService.getActivitiesByType(activityType, targetUserId, limit),
    enabled: !!targetUserId && !!activityType,
  });

  return {
    activities: data?.success ? data.data : [],
    isLoading,
    error,
  };
}

// Hook for activity streaks
export function useActivityStreak(userId?: string) {
  const { stats } = useActivityStats(userId);
  const [streakMessage, setStreakMessage] = useState('');

  useEffect(() => {
    if (!stats) return;

    const streak = stats.currentStreak;
    if (streak === 0) {
      setStreakMessage('Start your streak today! 🔥');
    } else if (streak === 1) {
      setStreakMessage('1 day streak! Keep it up! 🔥');
    } else if (streak < 7) {
      setStreakMessage(`${streak} day streak! Nice work! 🔥`);
    } else if (streak < 30) {
      setStreakMessage(`${streak} day streak! You're on fire! 🔥🔥`);
    } else {
      setStreakMessage(`${streak} day streak! Legendary! 🔥🔥🔥`);
    }
  }, [stats]);

  return {
    streak: stats?.currentStreak || 0,
    streakMessage,
    weeklyActivities: stats?.weeklyActivities || 0,
    totalActivities: stats?.totalActivities || 0,
  };
}