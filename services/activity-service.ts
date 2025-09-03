import { supabase } from '@/lib/supabase';
import { Activity, ServiceResponse, PaginatedResponse } from './types';

export interface CreateActivityData {
  moai_id?: string;
  activity_type: string;
  name: string;
  description?: string;
  duration_minutes?: number;
  calories_burned?: number;
  distance?: number;
  steps?: number;
  sets?: number;
  reps?: number;
  weight?: number;
  notes?: string;
  logged_at?: string; // ISO string, defaults to now
}

export interface ActivityFilters {
  moai_id?: string;
  activity_type?: string;
  date_from?: string;
  date_to?: string;
  user_id?: string;
}

export interface ActivityStats {
  total_activities: number;
  total_duration_minutes: number;
  total_calories_burned: number;
  total_distance: number;
  current_streak_days: number;
  activities_this_week: number;
  duration_this_week: number;
}

export class ActivityService {
  /**
   * Create a new activity log entry
   */
  static async createActivity(data: CreateActivityData): Promise<ServiceResponse<Activity>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const activityData = {
        profile_id: user.id,
        activity_type: data.activity_type,
        emoji: '💪', // Default emoji, should be passed from UI
        notes: data.notes || data.description || '',
        logged_at: data.logged_at || new Date().toISOString(),
        duration_minutes: data.duration_minutes,
        // activity_logs table structure doesn't include all fields from CreateActivityData
        // Only include fields that exist in the table
      };

      const { data: activity, error } = await supabase
        .from('activity_logs')
        .insert(activityData)
        .select()
        .single();

      if (error) {
        console.error('Error creating activity:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: activity };
    } catch (error) {
      console.error('Error creating activity:', error);
      return { success: false, error: 'Failed to create activity' };
    }
  }

  /**
   * Get user's activities with optional filters and pagination
   */
  static async getUserActivities(
    filters: ActivityFilters = {},
    page = 1,
    limit = 20
  ): Promise<ServiceResponse<PaginatedResponse<Activity>>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      let query = supabase
        .from('activity_logs')
        .select('*', { count: 'exact' })
        .eq('profile_id', user.id)
        .order('logged_at', { ascending: false });

      // Apply filters
      if (filters.moai_id) {
        query = query.eq('moai_id', filters.moai_id);
      }
      if (filters.activity_type) {
        query = query.eq('activity_type', filters.activity_type);
      }
      if (filters.date_from) {
        query = query.gte('logged_at', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('logged_at', filters.date_to);
      }

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data: activities, error, count } = await query;

      if (error) {
        console.error('Error fetching activities:', error);
        return { success: false, error: error.message };
      }

      const totalCount = count || 0;
      const hasMore = totalCount > page * limit;

      return {
        success: true,
        data: {
          data: activities || [],
          count: totalCount,
          hasMore,
          nextPage: hasMore ? page + 1 : undefined,
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
  static async getActivity(id: string): Promise<ServiceResponse<Activity>> {
    try {
      const { data: activity, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching activity:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: activity };
    } catch (error) {
      console.error('Error fetching activity:', error);
      return { success: false, error: 'Failed to fetch activity' };
    }
  }

  /**
   * Update an activity
   */
  static async updateActivity(id: string, data: Partial<CreateActivityData>): Promise<ServiceResponse<Activity>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const updateData = {
        ...data,
        updated_at: new Date().toISOString(),
      };

      const { data: activity, error } = await supabase
        .from('activity_logs')
        .update(updateData)
        .eq('id', id)
        .eq('profile_id', user.id) // Ensure user can only update their own activities
        .select()
        .single();

      if (error) {
        console.error('Error updating activity:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: activity };
    } catch (error) {
      console.error('Error updating activity:', error);
      return { success: false, error: 'Failed to update activity' };
    }
  }

  /**
   * Delete an activity
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
        .eq('profile_id', user.id); // Ensure user can only delete their own activities

      if (error) {
        console.error('Error deleting activity:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: undefined };
    } catch (error) {
      console.error('Error deleting activity:', error);
      return { success: false, error: 'Failed to delete activity' };
    }
  }

  /**
   * Get user's activity statistics
   */
  static async getUserActivityStats(
    moai_id?: string,
    date_from?: string,
    date_to?: string
  ): Promise<ServiceResponse<ActivityStats>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Build base query
      let query = supabase
        .from('activity_logs')
        .select('*')
        .eq('profile_id', user.id);

      if (moai_id) {
        query = query.eq('moai_id', moai_id);
      }
      if (date_from) {
        query = query.gte('logged_at', date_from);
      }
      if (date_to) {
        query = query.lte('logged_at', date_to);
      }

      const { data: activities, error } = await query;

      if (error) {
        console.error('Error fetching activity stats:', error);
        return { success: false, error: error.message };
      }

      // Calculate statistics
      const stats: ActivityStats = {
        total_activities: activities?.length || 0,
        total_duration_minutes: activities?.reduce((sum, a) => sum + (a.duration_minutes || 0), 0) || 0,
        total_calories_burned: activities?.reduce((sum, a) => sum + (a.calories_burned || 0), 0) || 0,
        total_distance: activities?.reduce((sum, a) => sum + (a.distance || 0), 0) || 0,
        current_streak_days: 0, // TODO: Calculate actual streak
        activities_this_week: 0,
        duration_this_week: 0,
      };

      // Calculate this week's stats
      const now = new Date();
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      startOfWeek.setHours(0, 0, 0, 0);

      const thisWeekActivities = activities?.filter(a => 
        new Date(a.logged_at) >= startOfWeek
      ) || [];

      stats.activities_this_week = thisWeekActivities.length;
      stats.duration_this_week = thisWeekActivities.reduce((sum, a) => sum + (a.duration_minutes || 0), 0);

      // Calculate streak (simplified - consecutive days with activities)
      if (activities && activities.length > 0) {
        const sortedActivities = activities.sort((a, b) => 
          new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime()
        );

        const uniqueDays = new Set(
          sortedActivities.map(a => new Date(a.logged_at).toDateString())
        );

        const dayArray = Array.from(uniqueDays).sort((a, b) => 
          new Date(b).getTime() - new Date(a).getTime()
        );

        let streak = 0;
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();

        // Check if there's activity today or yesterday to start counting
        if (dayArray.includes(today) || dayArray.includes(yesterday)) {
          let currentDate = new Date();
          for (const day of dayArray) {
            const activityDate = new Date(day);
            const daysDiff = Math.floor((currentDate.getTime() - activityDate.getTime()) / 86400000);
            
            if (daysDiff <= streak + 1) {
              streak++;
              currentDate = activityDate;
            } else {
              break;
            }
          }
        }

        stats.current_streak_days = streak;
      }

      return { success: true, data: stats };
    } catch (error) {
      console.error('Error calculating activity stats:', error);
      return { success: false, error: 'Failed to calculate activity stats' };
    }
  }

  /**
   * Get activity types for dropdown/picker
   */
  static getActivityTypes(): string[] {
    return [
      'Running',
      'Walking',
      'Cycling',
      'Swimming',
      'Strength Training',
      'Yoga',
      'Pilates',
      'CrossFit',
      'Basketball',
      'Football',
      'Soccer',
      'Tennis',
      'Golf',
      'Baseball',
      'Volleyball',
      'Hiking',
      'Rock Climbing',
      'Dancing',
      'Boxing',
      'Martial Arts',
      'Rowing',
      'Surfing',
      'Skateboarding',
      'Skiing',
      'Snowboarding',
      'Other'
    ];
  }

  /**
   * Get activity type emojis for UI
   */
  static getActivityEmoji(activityType: string): string {
    const emojiMap: Record<string, string> = {
      'Running': '🏃',
      'Walking': '🚶',
      'Cycling': '🚴',
      'Swimming': '🏊',
      'Strength Training': '💪',
      'Yoga': '🧘',
      'Pilates': '🤸',
      'CrossFit': '🏋️',
      'Basketball': '🏀',
      'Football': '🏈',
      'Soccer': '⚽',
      'Tennis': '🎾',
      'Golf': '⛳',
      'Baseball': '⚾',
      'Volleyball': '🏐',
      'Hiking': '🥾',
      'Rock Climbing': '🧗',
      'Dancing': '💃',
      'Boxing': '🥊',
      'Martial Arts': '🥋',
      'Rowing': '🚣',
      'Surfing': '🏄',
      'Skateboarding': '🛹',
      'Skiing': '⛷️',
      'Snowboarding': '🏂',
      'Other': '🏃'
    };

    return emojiMap[activityType] || '🏃';
  }
}