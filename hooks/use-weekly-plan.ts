import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  WeeklyPlanService, 
  WeeklyPlan, 
  CreateWeeklyPlanData, 
  UpdateWeeklyPlanData 
} from '@/services/weekly-plan-service';
import { ServiceResponse } from '@/services/types';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format, startOfWeek } from 'date-fns';

// Query keys
export const weeklyPlanKeys = {
  all: ['weekly-plans'] as const,
  userPlans: (userId?: string) => [...weeklyPlanKeys.all, userId] as const,
  weekPlan: (userId?: string, weekStart?: string) => ['weekly-plan', userId, weekStart] as const,
  stats: (userId?: string) => ['weekly-plan-stats', userId] as const,
};

/**
 * Hook to get a weekly plan for a specific week
 */
export function useWeeklyPlan(weekStartDate: Date, userId?: string) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;
  const weekStart = format(startOfWeek(weekStartDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');

  const { data, isLoading, error, refetch } = useQuery<ServiceResponse<WeeklyPlan | null>, Error>({
    queryKey: weeklyPlanKeys.weekPlan(targetUserId, weekStart),
    queryFn: () => WeeklyPlanService.getWeeklyPlan(targetUserId!, weekStartDate),
    enabled: !!targetUserId,
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
  });

  return {
    plan: data?.success ? data.data : null,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to get user's weekly plan history
 */
export function useUserWeeklyPlans(userId?: string, limit = 10) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  const { data, isLoading, error, refetch } = useQuery<ServiceResponse<WeeklyPlan[]>, Error>({
    queryKey: weeklyPlanKeys.userPlans(targetUserId),
    queryFn: () => WeeklyPlanService.getUserWeeklyPlans(targetUserId!, limit),
    enabled: !!targetUserId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  return {
    plans: data?.success ? data.data : [],
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to save/create a weekly plan
 */
export function useSaveWeeklyPlan() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const mutation = useMutation<ServiceResponse<WeeklyPlan>, Error, CreateWeeklyPlanData>({
    mutationFn: (planData: CreateWeeklyPlanData) => 
      WeeklyPlanService.saveWeeklyPlan(user?.id!, planData),
    onSuccess: (response, variables) => {
      if (response.success) {
        const weekStart = format(startOfWeek(new Date(variables.week_start_date), { weekStartsOn: 1 }), 'yyyy-MM-dd');
        
        // Invalidate and update relevant queries
        queryClient.invalidateQueries({ queryKey: weeklyPlanKeys.weekPlan(user?.id, weekStart) });
        queryClient.invalidateQueries({ queryKey: weeklyPlanKeys.userPlans(user?.id) });
        queryClient.invalidateQueries({ queryKey: weeklyPlanKeys.stats(user?.id) });
        
        // Update cache optimistically
        queryClient.setQueryData(
          weeklyPlanKeys.weekPlan(user?.id, weekStart),
          { success: true, data: response.data }
        );

        toast({
          title: 'Plan saved!',
          description: 'Your weekly movement plan has been saved successfully.',
        });
      } else {
        toast({
          title: 'Save failed',
          description: response.error || 'Failed to save weekly plan',
          variant: 'destructive',
        });
      }
    },
    onError: (error) => {
      console.error('Save weekly plan error:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while saving your plan.',
        variant: 'destructive',
      });
    },
  });

  return {
    saveWeeklyPlan: mutation.mutate,
    isLoading: mutation.isPending,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
  };
}

/**
 * Hook to update an existing weekly plan
 */
export function useUpdateWeeklyPlan() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const mutation = useMutation<
    ServiceResponse<WeeklyPlan>, 
    Error, 
    { planId: string; updateData: UpdateWeeklyPlanData }
  >({
    mutationFn: ({ planId, updateData }) => 
      WeeklyPlanService.updateWeeklyPlan(planId, updateData),
    onSuccess: (response) => {
      if (response.success) {
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: weeklyPlanKeys.all });
        
        toast({
          title: 'Plan updated!',
          description: 'Your weekly movement plan has been updated successfully.',
        });
      } else {
        toast({
          title: 'Update failed',
          description: response.error || 'Failed to update weekly plan',
          variant: 'destructive',
        });
      }
    },
    onError: (error) => {
      console.error('Update weekly plan error:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while updating your plan.',
        variant: 'destructive',
      });
    },
  });

  return {
    updateWeeklyPlan: mutation.mutate,
    isLoading: mutation.isPending,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
  };
}

/**
 * Hook to commit a weekly plan
 */
export function useCommitWeeklyPlan() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const mutation = useMutation<
    ServiceResponse<WeeklyPlan>, 
    Error, 
    { planId: string; reason?: string }
  >({
    mutationFn: ({ planId, reason }) => 
      WeeklyPlanService.commitWeeklyPlan(planId, reason),
    onSuccess: (response) => {
      if (response.success) {
        // Invalidate all weekly plan queries
        queryClient.invalidateQueries({ queryKey: weeklyPlanKeys.all });
        
        toast({
          title: 'Plan committed!',
          description: 'Your weekly movement plan has been finalized.',
        });
      } else {
        toast({
          title: 'Commit failed',
          description: response.error || 'Failed to commit weekly plan',
          variant: 'destructive',
        });
      }
    },
    onError: (error) => {
      console.error('Commit weekly plan error:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while committing your plan.',
        variant: 'destructive',
      });
    },
  });

  return {
    commitWeeklyPlan: mutation.mutate,
    isLoading: mutation.isPending,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
  };
}

/**
 * Hook to delete a weekly plan
 */
export function useDeleteWeeklyPlan() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const mutation = useMutation<ServiceResponse<boolean>, Error, string>({
    mutationFn: (planId: string) => WeeklyPlanService.deleteWeeklyPlan(planId),
    onSuccess: (response) => {
      if (response.success) {
        // Invalidate all weekly plan queries
        queryClient.invalidateQueries({ queryKey: weeklyPlanKeys.all });
        
        toast({
          title: 'Plan deleted',
          description: 'Your weekly movement plan has been deleted.',
        });
      } else {
        toast({
          title: 'Delete failed',
          description: response.error || 'Failed to delete weekly plan',
          variant: 'destructive',
        });
      }
    },
    onError: (error) => {
      console.error('Delete weekly plan error:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while deleting your plan.',
        variant: 'destructive',
      });
    },
  });

  return {
    deleteWeeklyPlan: mutation.mutate,
    isLoading: mutation.isPending,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
  };
}

/**
 * Hook to get weekly plan statistics
 */
export function useWeeklyPlanStats(userId?: string) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: weeklyPlanKeys.stats(targetUserId),
    queryFn: () => WeeklyPlanService.getWeeklyPlanStats(targetUserId!),
    enabled: !!targetUserId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  return {
    stats: data?.success ? data.data : null,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to check if a plan exists for a given week
 */
export function useHasWeeklyPlan(weekStartDate: Date, userId?: string) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  const { data, isLoading, error } = useQuery<ServiceResponse<boolean>, Error>({
    queryKey: ['has-weekly-plan', targetUserId, format(weekStartDate, 'yyyy-MM-dd')],
    queryFn: () => WeeklyPlanService.hasWeeklyPlan(targetUserId!, weekStartDate),
    enabled: !!targetUserId,
    staleTime: 1 * 60 * 1000, // Cache for 1 minute
  });

  return {
    hasPlan: data?.success ? data.data : false,
    isLoading,
    error,
  };
}