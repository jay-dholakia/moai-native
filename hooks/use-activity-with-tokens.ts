import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { ActivityLogService } from '@/services/activity-log-service';
import { useAwardActivityTokens } from './use-token-system';
import { activityKeys } from './use-activity-logs';

export interface ActivityWithTokensParams {
  type: string;
  duration?: number;
  notes?: string;
  mood?: 'great' | 'good' | 'okay' | 'tired' | 'stressed';
  intensity?: 'low' | 'moderate' | 'high';
  location?: string;
  partner_id?: string;
}

export interface ActivityLogResult {
  activityId?: string;
  tokensAwarded: number;
  tokenError?: string;
  activityError?: string;
  success: boolean;
}

/**
 * Enhanced activity logging hook that automatically awards tokens
 * and provides comprehensive feedback about both logging and token rewards
 */
export function useLogActivityWithTokens() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const awardTokens = useAwardActivityTokens();

  return useMutation({
    mutationFn: async (params: ActivityWithTokensParams): Promise<ActivityLogResult> => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      let activityId: string | undefined;
      let tokensAwarded = 0;
      let tokenError: string | undefined;
      let activityError: string | undefined;

      try {
        // Step 1: Log the activity
        const activityResult = await ActivityLogService.logActivity({
          activity_type: params.type,
          emoji: '💪', // Default emoji, can be customized later
          duration_minutes: params.duration ? Math.round(params.duration / 60) : undefined,
          notes: params.notes,
          location: params.location,
          activity_partners: params.partner_id ? [{ partner_id: params.partner_id }] : undefined,
        });

        if (!activityResult.success) {
          activityError = activityResult.error;
          return {
            success: false,
            tokensAwarded: 0,
            activityError,
          };
        }

        activityId = activityResult.data.id;

        // Step 2: Award tokens for the activity
        try {
          const tokenResult = await awardTokens.mutateAsync({
            activityType: params.type,
            duration: params.duration,
            activityId,
          });

          if (tokenResult.success) {
            tokensAwarded = tokenResult.data.points;
          } else {
            tokenError = tokenResult.error;
            // Don't fail the entire operation if token award fails
            console.warn('Failed to award tokens:', tokenResult.error);
          }
        } catch (error) {
          tokenError = 'Failed to process token reward';
          console.warn('Token award error:', error);
          // Continue - activity was logged successfully
        }

        return {
          success: true,
          activityId,
          tokensAwarded,
          tokenError,
        };

      } catch (error) {
        console.error('Activity logging error:', error);
        return {
          success: false,
          activityError: 'Failed to log activity',
          tokensAwarded: 0,
        };
      }
    },
    onSuccess: (result) => {
      // Invalidate activity-related queries
      if (user) {
        queryClient.invalidateQueries({ 
          queryKey: activityKeys.userActivities(user.id) 
        });
        queryClient.invalidateQueries({ 
          queryKey: activityKeys.stats(user.id) 
        });
      }

      // Token queries are automatically invalidated by the token mutation
    },
  });
}

/**
 * Hook for quick activity logging with predefined common activities
 */
export function useQuickActivityLog() {
  const logActivity = useLogActivityWithTokens();

  const quickActivities = [
    { type: 'Gym Workout', duration: 3600, icon: 'fitness' },
    { type: 'Running', duration: 1800, icon: 'walk' },
    { type: 'Yoga', duration: 3600, icon: 'body' },
    { type: 'Swimming', duration: 2400, icon: 'water' },
    { type: 'Cycling', duration: 2700, icon: 'bicycle' },
    { type: 'Walking', duration: 1800, icon: 'walk' },
    { type: 'Strength Training', duration: 2700, icon: 'barbell' },
    { type: 'Cardio', duration: 1800, icon: 'heart' },
  ];

  const logQuickActivity = async (
    type: string, 
    intensity: 'low' | 'moderate' | 'high' = 'moderate',
    customDuration?: number
  ) => {
    const activity = quickActivities.find(a => a.type === type);
    const duration = customDuration || activity?.duration || 1800; // Default 30 minutes

    return logActivity.mutateAsync({
      type,
      duration,
      intensity,
      notes: `Quick log: ${type}`,
    });
  };

  return {
    quickActivities,
    logQuickActivity,
    isLogging: logActivity.isPending,
    error: logActivity.error,
  };
}

/**
 * Hook for batch activity logging (e.g., importing from fitness apps)
 */
export function useBatchActivityLog() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const awardTokens = useAwardActivityTokens();

  return useMutation({
    mutationFn: async (activities: ActivityWithTokensParams[]): Promise<{
      successful: number;
      failed: number;
      totalTokensAwarded: number;
      errors: string[];
    }> => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      let successful = 0;
      let failed = 0;
      let totalTokensAwarded = 0;
      const errors: string[] = [];

      for (const activity of activities) {
        try {
          // Log the activity
          const activityResult = await ActivityLogService.logActivity({
            activity_type: activity.type,
            emoji: '💪', // Default emoji, can be customized later
            duration_minutes: activity.duration ? Math.round(activity.duration / 60) : undefined,
            notes: activity.notes,
            location: activity.location,
            activity_partners: activity.partner_id ? [{ partner_id: activity.partner_id }] : undefined,
          });

          if (!activityResult.success) {
            failed++;
            errors.push(`Failed to log ${activity.type}: ${activityResult.error}`);
            continue;
          }

          // Award tokens
          try {
            const tokenResult = await awardTokens.mutateAsync({
              activityType: activity.type,
              duration: activity.duration,
              activityId: activityResult.data.id,
            });

            if (tokenResult.success) {
              totalTokensAwarded += tokenResult.data.points;
            }
          } catch (tokenError) {
            // Don't fail the activity log if tokens fail
            console.warn('Token award failed for activity:', activity.type, tokenError);
          }

          successful++;
        } catch (error) {
          failed++;
          errors.push(`Error processing ${activity.type}: ${error}`);
        }
      }

      return {
        successful,
        failed,
        totalTokensAwarded,
        errors,
      };
    },
    onSuccess: () => {
      // Invalidate all activity-related queries
      if (user) {
        queryClient.invalidateQueries({ 
          queryKey: activityKeys.userActivities(user.id) 
        });
        queryClient.invalidateQueries({ 
          queryKey: activityKeys.stats(user.id) 
        });
      }
    },
  });
}

/**
 * Hook to get activity earning potential
 */
export function useActivityEarningInfo() {
  const calculatePotentialEarnings = (
    activityType: string, 
    duration?: number
  ): { baseTokens: number; bonusTokens: number; total: number } => {
    // Base tokens for any activity
    let baseTokens = 10;
    
    // Duration-based bonus (1 token per 10 minutes)
    let bonusTokens = 0;
    if (duration) {
      const minutes = Math.floor(duration / 60);
      bonusTokens = Math.floor(minutes / 10);
    }

    // Activity type multipliers
    const highIntensityActivities = ['HIIT', 'CrossFit', 'Marathon', 'Triathlon'];
    const moderateIntensityActivities = ['Gym Workout', 'Swimming', 'Cycling', 'Running'];
    
    if (highIntensityActivities.some(activity => activityType.toLowerCase().includes(activity.toLowerCase()))) {
      baseTokens = 25;
    } else if (moderateIntensityActivities.some(activity => activityType.toLowerCase().includes(activity.toLowerCase()))) {
      baseTokens = 15;
    }

    return {
      baseTokens,
      bonusTokens,
      total: baseTokens + bonusTokens,
    };
  };

  return {
    calculatePotentialEarnings,
  };
}