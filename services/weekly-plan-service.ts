import { supabase } from '@/lib/supabase';
import { BaseService } from './base-service';
import { ServiceResponse } from './types';
import { format, startOfWeek } from 'date-fns';

// Types for weekly plans
export interface ActivityCard {
  id: string;
  type: 'move' | 'lift' | 'flow' | 'rest';
  name: string;
  isLocked?: boolean;
}

export interface DayPlan {
  day: string;
  date: string;
  activities: ActivityCard[];
  isPast: boolean;
}

export interface WeeklyPlan {
  id?: string;
  profile_id: string;
  week_start_date: string;
  weekly_plan: DayPlan[];
  is_committed: boolean;
  committed_at?: string | null;
  version_number: number;
  plan_update_reason?: string | null;
  updated_within_window?: boolean;
}

export interface CreateWeeklyPlanData {
  weekly_plan: DayPlan[];
  week_start_date: string;
  is_committed?: boolean;
  plan_update_reason?: string;
}

export interface UpdateWeeklyPlanData {
  weekly_plan?: DayPlan[];
  is_committed?: boolean;
  committed_at?: string;
  plan_update_reason?: string;
}

export class WeeklyPlanService extends BaseService {
  
  /**
   * Get weekly plan for a specific user and week
   */
  static async getWeeklyPlan(
    userId: string, 
    weekStartDate: Date
  ): Promise<ServiceResponse<WeeklyPlan | null>> {
    return this.withErrorHandling(async () => {
      const weekStart = format(startOfWeek(weekStartDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      
      const { data, error } = await this.supabase
        .from('weekly_movement_plans')
        .select('*')
        .eq('profile_id', userId)
        .eq('week_start_date', weekStart)
        .order('version_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      return { data, error };
    }, 'Get weekly plan');
  }

  /**
   * Save a new weekly plan or create a new version
   */
  static async saveWeeklyPlan(
    userId: string,
    planData: CreateWeeklyPlanData
  ): Promise<ServiceResponse<WeeklyPlan>> {
    return this.withErrorHandling(async () => {
      const weekStart = format(startOfWeek(new Date(planData.week_start_date), { weekStartsOn: 1 }), 'yyyy-MM-dd');
      
      // Get the current highest version number for this week
      const { data: existingPlan } = await this.supabase
        .from('weekly_movement_plans')
        .select('version_number')
        .eq('profile_id', userId)
        .eq('week_start_date', weekStart)
        .order('version_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextVersion = (existingPlan?.version_number || 0) + 1;

      const insertData = {
        profile_id: userId,
        week_start_date: weekStart,
        weekly_plan: planData.weekly_plan,
        is_committed: planData.is_committed || false,
        committed_at: planData.is_committed ? new Date().toISOString() : null,
        version_number: nextVersion,
        plan_update_reason: planData.plan_update_reason || null,
        updated_within_window: true, // Assume updates are within allowed window for now
      };

      const { data, error } = await this.supabase
        .from('weekly_movement_plans')
        .insert(insertData)
        .select()
        .single();

      return { data, error };
    }, 'Save weekly plan');
  }

  /**
   * Update an existing weekly plan
   */
  static async updateWeeklyPlan(
    planId: string,
    updateData: UpdateWeeklyPlanData
  ): Promise<ServiceResponse<WeeklyPlan>> {
    return this.withErrorHandling(async () => {
      const updates: any = {
        ...updateData,
        updated_at: new Date().toISOString(),
      };

      if (updateData.is_committed) {
        updates.committed_at = updateData.committed_at || new Date().toISOString();
      }

      const { data, error } = await this.supabase
        .from('weekly_movement_plans')
        .update(updates)
        .eq('id', planId)
        .select()
        .single();

      return { data, error };
    }, 'Update weekly plan');
  }

  /**
   * Get all weekly plans for a user (for history/tracking)
   */
  static async getUserWeeklyPlans(
    userId: string,
    limit: number = 10
  ): Promise<ServiceResponse<WeeklyPlan[]>> {
    return this.withErrorHandling(async () => {
      const { data, error } = await this.supabase
        .from('weekly_movement_plans')
        .select('*')
        .eq('profile_id', userId)
        .order('week_start_date', { ascending: false })
        .order('version_number', { ascending: false })
        .limit(limit);

      return { data: data || [], error };
    }, 'Get user weekly plans');
  }

  /**
   * Delete a weekly plan
   */
  static async deleteWeeklyPlan(planId: string): Promise<ServiceResponse<boolean>> {
    return this.withErrorHandling(async () => {
      const { error } = await this.supabase
        .from('weekly_movement_plans')
        .delete()
        .eq('id', planId);

      return { data: true, error };
    }, 'Delete weekly plan');
  }

  /**
   * Commit a weekly plan (mark as final)
   */
  static async commitWeeklyPlan(
    planId: string,
    reason?: string
  ): Promise<ServiceResponse<WeeklyPlan>> {
    return this.withErrorHandling(async () => {
      const { data, error } = await this.supabase
        .from('weekly_movement_plans')
        .update({
          is_committed: true,
          committed_at: new Date().toISOString(),
          plan_update_reason: reason || 'Plan committed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', planId)
        .select()
        .single();

      return { data, error };
    }, 'Commit weekly plan');
  }

  /**
   * Check if a plan exists for the current week
   */
  static async hasWeeklyPlan(
    userId: string,
    weekStartDate: Date
  ): Promise<ServiceResponse<boolean>> {
    return this.withErrorHandling(async () => {
      const weekStart = format(startOfWeek(weekStartDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      
      const { data, error } = await this.supabase
        .from('weekly_movement_plans')
        .select('id')
        .eq('profile_id', userId)
        .eq('week_start_date', weekStart)
        .limit(1)
        .maybeSingle();

      return { data: !!data, error };
    }, 'Check weekly plan exists');
  }

  /**
   * Get weekly plan statistics for a user
   */
  static async getWeeklyPlanStats(
    userId: string
  ): Promise<ServiceResponse<{
    totalPlans: number;
    committedPlans: number;
    completionRate: number;
  }>> {
    return this.withErrorHandling(async () => {
      // Get total plans count
      const { count: totalPlans, error: totalError } = await this.supabase
        .from('weekly_movement_plans')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', userId);

      if (totalError) throw totalError;

      // Get committed plans count
      const { count: committedPlans, error: committedError } = await this.supabase
        .from('weekly_movement_plans')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', userId)
        .eq('is_committed', true);

      if (committedError) throw committedError;

      const completionRate = totalPlans ? (committedPlans || 0) / totalPlans * 100 : 0;

      const stats = {
        totalPlans: totalPlans || 0,
        committedPlans: committedPlans || 0,
        completionRate: Math.round(completionRate * 100) / 100,
      };

      return { data: stats, error: null };
    }, 'Get weekly plan statistics');
  }
}