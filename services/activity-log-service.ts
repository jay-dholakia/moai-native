import { supabase } from '@/lib/supabase';
import { ServiceResponse } from './types';

export interface ActivityLog {
  id: string;
  profile_id: string;
  activity_type: string;
  emoji: string;
  duration_minutes: number | null;
  notes: string | null;
  location: string | null;
  logged_at: string;
  muscle_groups: any[] | null; // jsonb field - can be string[] or any structure
  activity_partners: any[] | null; // jsonb field - can be any structure
  image_url: string | null;
  source_tag_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActivityLogInput {
  activity_type: string;
  emoji: string;
  duration_minutes?: number;
  notes?: string;
  location?: string;
  muscle_groups?: any[]; // jsonb field - can be string[] or any structure
  activity_partners?: any[]; // jsonb field - can be any structure
  image_url?: string;
  source_tag_id?: string;
  logged_at?: string;
}

export interface ActivityStats {
  totalActivities: number;
  totalDuration: number;
  currentStreak: number;
  weeklyActivities: number;
  favoriteActivity: string | null;
  recentActivities: ActivityLog[];
}

export class ActivityLogService {
  /**
   * Log a new activity
   */
  static async logActivity(data: ActivityLogInput): Promise<ServiceResponse<ActivityLog>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const activityData = {
        profile_id: user.id,
        logged_at: data.logged_at || new Date().toISOString(),
        ...data,
      };

      const { data: activity, error } = await supabase
        .from('activity_logs')
        .insert(activityData)
        .select()
        .single();

      if (error) {
        console.error('Error logging activity:', error);
        return { success: false, error: error.message };
      }

      // Update profile stats
      await this.updateProfileStats(user.id);

      return { success: true, data: activity };
    } catch (error) {
      console.error('Error logging activity:', error);
      return { success: false, error: 'Failed to log activity' };
    }
  }

  /**
   * Get user's activity logs with pagination
   */
  static async getUserActivities(
    userId?: string,
    page = 1,
    limit = 20
  ): Promise<ServiceResponse<{ activities: ActivityLog[]; hasMore: boolean; total: number }>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const targetUserId = userId || user.id;

      // Get total count
      const { count } = await supabase
        .from('activity_logs')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', targetUserId);

      // Get paginated activities
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data: activities, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('profile_id', targetUserId)
        .order('logged_at', { ascending: false })
        .range(from, to);

      if (error) {
        console.error('Error fetching activities:', error);
        return { success: false, error: error.message };
      }

      const total = count || 0;
      const hasMore = total > page * limit;

      return {
        success: true,
        data: {
          activities: activities || [],
          hasMore,
          total,
        },
      };
    } catch (error) {
      console.error('Error fetching activities:', error);
      return { success: false, error: 'Failed to fetch activities' };
    }
  }

  /**
   * Get activity by ID
   */
  static async getActivityById(id: string): Promise<ServiceResponse<ActivityLog>> {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching activity:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error fetching activity:', error);
      return { success: false, error: 'Failed to fetch activity' };
    }
  }

  /**
   * Update an activity log
   */
  static async updateActivity(
    id: string,
    updates: Partial<ActivityLogInput>
  ): Promise<ServiceResponse<ActivityLog>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data, error } = await supabase
        .from('activity_logs')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('profile_id', user.id) // Ensure user owns the activity
        .select()
        .single();

      if (error) {
        console.error('Error updating activity:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error updating activity:', error);
      return { success: false, error: 'Failed to update activity' };
    }
  }

  /**
   * Delete an activity log
   */
  static async deleteActivity(id: string): Promise<ServiceResponse<void>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { error } = await supabase
        .from('activity_logs')
        .delete()
        .eq('id', id)
        .eq('profile_id', user.id); // Ensure user owns the activity

      if (error) {
        console.error('Error deleting activity:', error);
        return { success: false, error: error.message };
      }

      // Update profile stats
      await this.updateProfileStats(user.id);

      return { success: true, data: undefined };
    } catch (error) {
      console.error('Error deleting activity:', error);
      return { success: false, error: 'Failed to delete activity' };
    }
  }

  /**
   * Get user's activity statistics
   */
  static async getUserStats(userId?: string): Promise<ServiceResponse<ActivityStats>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const targetUserId = userId || user.id;

      // Get all activities for stats calculation
      const { data: activities, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('profile_id', targetUserId)
        .order('logged_at', { ascending: false });

      if (error) {
        console.error('Error fetching activity stats:', error);
        return { success: false, error: error.message };
      }

      if (!activities || activities.length === 0) {
        return {
          success: true,
          data: {
            totalActivities: 0,
            totalDuration: 0,
            currentStreak: 0,
            weeklyActivities: 0,
            favoriteActivity: null,
            recentActivities: [],
          },
        };
      }

      // Calculate stats
      const totalActivities = activities.length;
      const totalDuration = activities.reduce((sum, a) => sum + (a.duration_minutes || 0), 0);
      
      // Calculate current streak
      const currentStreak = this.calculateStreak(activities);
      
      // Calculate weekly activities
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const weeklyActivities = activities.filter(a => 
        new Date(a.logged_at) >= oneWeekAgo
      ).length;
      
      // Find favorite activity type
      const activityTypeCounts = activities.reduce((acc, a) => {
        acc[a.activity_type] = (acc[a.activity_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const favoriteActivity = Object.entries(activityTypeCounts)
        .sort(([, a], [, b]) => (b as number) - (a as number))[0]?.[0] || null;
      
      // Get recent activities (last 5)
      const recentActivities = activities.slice(0, 5);

      return {
        success: true,
        data: {
          totalActivities,
          totalDuration,
          currentStreak,
          weeklyActivities,
          favoriteActivity,
          recentActivities,
        },
      };
    } catch (error) {
      console.error('Error calculating activity stats:', error);
      return { success: false, error: 'Failed to calculate stats' };
    }
  }

  /**
   * Get activities by date range
   */
  static async getActivitiesByDateRange(
    startDate: Date,
    endDate: Date,
    userId?: string
  ): Promise<ServiceResponse<ActivityLog[]>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const targetUserId = userId || user.id;

      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('profile_id', targetUserId)
        .gte('logged_at', startDate.toISOString())
        .lte('logged_at', endDate.toISOString())
        .order('logged_at', { ascending: true });

      if (error) {
        console.error('Error fetching activities by date:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching activities by date:', error);
      return { success: false, error: 'Failed to fetch activities' };
    }
  }

  /**
   * Get activities by type
   */
  static async getActivitiesByType(
    activityType: string,
    userId?: string,
    limit = 20
  ): Promise<ServiceResponse<ActivityLog[]>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const targetUserId = userId || user.id;

      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('profile_id', targetUserId)
        .eq('activity_type', activityType)
        .order('logged_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching activities by type:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching activities by type:', error);
      return { success: false, error: 'Failed to fetch activities' };
    }
  }

  /**
   * Log a quick activity (simplified logging)
   */
  static async logQuickActivity(
    activityType: string,
    emoji: string,
    duration?: number
  ): Promise<ServiceResponse<ActivityLog>> {
    return this.logActivity({
      activity_type: activityType,
      emoji,
      duration_minutes: duration,
      notes: `Quick ${activityType} session`,
    });
  }

  /**
   * Helper to calculate activity streak
   */
  private static calculateStreak(activities: ActivityLog[]): number {
    if (activities.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activityDates = activities.map(a => {
      const date = new Date(a.logged_at);
      date.setHours(0, 0, 0, 0);
      return date.getTime();
    });

    // Remove duplicates and sort
    const uniqueDates = [...new Set(activityDates)].sort((a, b) => b - a);

    // Check if there's an activity today or yesterday
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (uniqueDates[0] !== today.getTime() && uniqueDates[0] !== yesterday.getTime()) {
      return 0; // Streak is broken
    }

    // Count consecutive days
    for (let i = 0; i < uniqueDates.length - 1; i++) {
      const currentDate = new Date(uniqueDates[i]);
      const nextDate = new Date(uniqueDates[i + 1]);
      
      // Check if dates are consecutive
      currentDate.setDate(currentDate.getDate() - 1);
      if (currentDate.getTime() === nextDate.getTime()) {
        streak++;
      } else {
        break;
      }
    }

    return streak + 1; // +1 for the first day
  }

  /**
   * Update user profile stats
   */
  private static async updateProfileStats(userId: string): Promise<void> {
    try {
      const { data: stats } = await this.getUserStats(userId);
      if (!stats) return;

      // Update profile with latest stats
      await supabase
        .from('profiles')
        .update({
          total_activities_logged: stats.totalActivities,
          fire_streak_count: stats.currentStreak,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);
    } catch (error) {
      console.error('Error updating profile stats:', error);
    }
  }
}