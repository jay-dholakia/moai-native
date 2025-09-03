import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ActivityLogService, ActivityLogInput } from '@/services/activity-log-service';
import { BadgeService } from '@/services/badge-service';
import { useAuth } from './useAuth';

/**
 * Enhanced activity logging hook that automatically checks for badge progression
 * when activities are logged.
 */
export function useLogActivityWithBadges() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (activityData: ActivityLogInput) => {
      // Log the activity first
      const activityResponse = await ActivityLogService.logActivity(activityData);
      
      if (!activityResponse.success) {
        throw new Error(activityResponse.error);
      }

      // Get updated activity count
      const statsResponse = await ActivityLogService.getUserStats(user?.id);
      
      if (statsResponse.success && user?.id) {
        const totalActivities = statsResponse.data.totalActivities;
        
        // Check for new milestone badges
        try {
          const badgeResponse = await BadgeService.checkAndAwardMilestoneBadges(
            user.id, 
            totalActivities
          );
          
          return {
            activity: activityResponse.data,
            newBadges: badgeResponse.success ? badgeResponse.data : [],
            totalActivities,
          };
        } catch (badgeError) {
          console.warn('Badge checking failed:', badgeError);
          // Don't fail the whole operation if badge checking fails
          return {
            activity: activityResponse.data,
            newBadges: [],
            totalActivities,
          };
        }
      }

      return {
        activity: activityResponse.data,
        newBadges: [],
        totalActivities: 0,
      };
    },
    onSuccess: (result) => {
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
      queryClient.invalidateQueries({ queryKey: ['activity-stats'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      
      // Invalidate badge queries if new badges were earned
      if (result.newBadges.length > 0) {
        queryClient.invalidateQueries({ queryKey: ['user-badges'] });
      }
      
      return result;
    },
  });
}

/**
 * Hook for quick activity logging that triggers badge checking
 */
export function useQuickLogActivity() {
  const logActivity = useLogActivityWithBadges();

  const quickLog = async (
    activityType: string, 
    emoji: string, 
    duration?: number,
    notes?: string
  ) => {
    return logActivity.mutateAsync({
      activity_type: activityType,
      emoji,
      duration_minutes: duration,
      notes,
    });
  };

  return {
    quickLog,
    isLogging: logActivity.isPending,
    error: logActivity.error,
    data: logActivity.data,
  };
}