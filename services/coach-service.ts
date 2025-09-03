import { supabase } from '@/lib/supabase';
import { ServiceResponse } from './types';

export type CoachStatus = 'active' | 'inactive' | 'pending' | 'suspended';
export type ClientRelationshipStatus = 'pending' | 'active' | 'paused' | 'cancelled' | 'completed';
export type SubscriptionType = 'monthly' | 'quarterly' | 'annual';

export interface Coach {
  id: string;
  profile_id: string;
  bio?: string;
  specialties: string[];
  availability_json: Record<string, any>;
  pricing_json: Record<string, any>;
  is_active: boolean;
  rating: number;
  total_sessions: number;
  certifications: string[];
  languages_spoken: string[];
  coach_status: CoachStatus;
  internal_notes?: string;
  monthly_price: number;
  created_at: string;
  updated_at: string;
  // Joined profile data
  profile?: {
    username: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
    email?: string;
  };
}

export interface CoachClientRelationship {
  id: string;
  coach_id: string;
  client_id: string;
  subscription_type: SubscriptionType;
  status: ClientRelationshipStatus;
  start_date: string;
  end_date?: string;
  monthly_price: number;
  auto_renew: boolean;
  stripe_subscription_id?: string;
  private_chat_id?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  client_profile?: {
    username: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
    email?: string;
  };
  coach_profile?: {
    username: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  };
}

export interface CoachDashboardStats {
  coach_id: string;
  total_clients: number;
  active_clients: number;
  pending_clients: number;
  monthly_revenue: number;
  total_sessions_completed: number;
  average_rating: number;
  client_retention_rate: number;
  recent_activity: {
    new_clients_this_month: number;
    sessions_this_week: number;
    messages_unread: number;
  };
}

export interface ClientProgress {
  client_id: string;
  coach_id: string;
  relationship_id: string;
  progress_data: {
    activities_this_week: number;
    activities_this_month: number;
    current_tier: string;
    current_streak: number;
    badges_earned: number;
    last_activity_date?: string;
  };
  goals: {
    weekly_target: number;
    monthly_target: number;
    custom_goals?: string[];
  };
  notes_count: number;
  last_checkin_date?: string;
  next_session_date?: string;
}

export class CoachService {
  /**
   * Get coach profile by profile ID
   */
  static async getCoachProfile(profileId: string): Promise<ServiceResponse<Coach>> {
    try {
      const { data: coach, error } = await supabase
        .from('coaches')
        .select(`
          *,
          profile:profiles(username, first_name, last_name, avatar_url, email)
        `)
        .eq('profile_id', profileId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { success: false, error: 'Coach profile not found' };
        }
        return { success: false, error: 'Failed to fetch coach profile' };
      }

      return { success: true, data: coach };
    } catch (error) {
      console.error('Error getting coach profile:', error);
      return { success: false, error: 'Failed to get coach profile' };
    }
  }

  /**
   * Check if user is a coach
   */
  static async isUserCoach(profileId: string): Promise<ServiceResponse<boolean>> {
    try {
      const { data, error } = await supabase
        .from('coaches')
        .select('id')
        .eq('profile_id', profileId)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { success: true, data: false };
        }
        return { success: false, error: 'Failed to check coach status' };
      }

      return { success: true, data: !!data };
    } catch (error) {
      console.error('Error checking coach status:', error);
      return { success: false, error: 'Failed to check coach status' };
    }
  }

  /**
   * Get coach's clients
   */
  static async getCoachClients(coachId: string, status?: ClientRelationshipStatus): Promise<ServiceResponse<CoachClientRelationship[]>> {
    try {
      let query = supabase
        .from('coach_client_relationships')
        .select(`
          *,
          client_profile:profiles!coach_client_relationships_client_id_fkey(username, first_name, last_name, avatar_url, email)
        `)
        .eq('coach_id', coachId)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data: relationships, error } = await query;

      if (error) {
        return { success: false, error: 'Failed to fetch coach clients' };
      }

      return { success: true, data: relationships || [] };
    } catch (error) {
      console.error('Error getting coach clients:', error);
      return { success: false, error: 'Failed to get coach clients' };
    }
  }

  /**
   * Get coach dashboard statistics
   */
  static async getCoachDashboardStats(coachId: string): Promise<ServiceResponse<CoachDashboardStats>> {
    try {
      // Get client relationships
      const { data: relationships, error: relationshipsError } = await supabase
        .from('coach_client_relationships')
        .select('*')
        .eq('coach_id', coachId);

      if (relationshipsError) {
        return { success: false, error: 'Failed to fetch coach relationships' };
      }

      const total_clients = relationships?.length || 0;
      const active_clients = relationships?.filter(r => r.status === 'active').length || 0;
      const pending_clients = relationships?.filter(r => r.status === 'pending').length || 0;

      // Calculate monthly revenue from active clients
      const monthly_revenue = relationships
        ?.filter(r => r.status === 'active')
        .reduce((sum, r) => sum + parseFloat(r.monthly_price.toString()), 0) || 0;

      // Get coach profile for additional stats
      const { data: coach, error: coachError } = await supabase
        .from('coaches')
        .select('total_sessions, rating')
        .eq('id', coachId)
        .single();

      if (coachError) {
        return { success: false, error: 'Failed to fetch coach profile' };
      }

      // Get recent activity stats
      const currentDate = new Date();
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const firstDayOfWeek = new Date(currentDate);
      firstDayOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

      const new_clients_this_month = relationships
        ?.filter(r => new Date(r.created_at) >= firstDayOfMonth).length || 0;

      // Get sessions this week (would need coach_sessions table)
      const { data: sessionsThisWeek } = await supabase
        .from('coach_sessions')
        .select('id')
        .eq('coach_id', coachId)
        .gte('session_date', firstDayOfWeek.toISOString())
        .lte('session_date', currentDate.toISOString());

      // Get unread messages count
      const { data: unreadMessages } = await supabase
        .from('coach_private_chat_messages')
        .select('id')
        .eq('coach_id', coachId)
        .eq('is_read', false);

      const stats: CoachDashboardStats = {
        coach_id: coachId,
        total_clients,
        active_clients,
        pending_clients,
        monthly_revenue,
        total_sessions_completed: coach?.total_sessions || 0,
        average_rating: parseFloat(coach?.rating?.toString() || '0'),
        client_retention_rate: total_clients > 0 ? (active_clients / total_clients) * 100 : 0,
        recent_activity: {
          new_clients_this_month,
          sessions_this_week: sessionsThisWeek?.length || 0,
          messages_unread: unreadMessages?.length || 0,
        },
      };

      return { success: true, data: stats };
    } catch (error) {
      console.error('Error getting coach dashboard stats:', error);
      return { success: false, error: 'Failed to get coach dashboard stats' };
    }
  }

  /**
   * Get client progress data for coach dashboard
   */
  static async getClientProgress(coachId: string, clientId: string): Promise<ServiceResponse<ClientProgress>> {
    try {
      // Get relationship
      const { data: relationship, error: relationshipError } = await supabase
        .from('coach_client_relationships')
        .select('*')
        .eq('coach_id', coachId)
        .eq('client_id', clientId)
        .single();

      if (relationshipError) {
        return { success: false, error: 'Client relationship not found' };
      }

      // Get client's activity stats
      const { data: activities, error: activitiesError } = await supabase
        .from('activity_logs')
        .select('created_at, duration_minutes')
        .eq('profile_id', clientId)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
        .order('created_at', { ascending: false });

      if (activitiesError) {
        console.warn('Error fetching client activities:', activitiesError);
      }

      // Calculate activity stats
      const currentWeekStart = new Date();
      currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());
      
      const activitiesThisWeek = activities?.filter(a => 
        new Date(a.created_at) >= currentWeekStart
      ).length || 0;

      const activitiesThisMonth = activities?.length || 0;

      // Get client's tier status (would integrate with tier system)
      // For now, we'll use a placeholder
      const currentTier = 'bronze'; // This would come from tier system

      // Get client notes count
      const { data: notes } = await supabase
        .from('coach_member_notes')
        .select('id')
        .eq('coach_id', coachId)
        .eq('member_id', clientId);

      // Get last check-in date
      const { data: lastCheckin } = await supabase
        .from('coach_member_checkins')
        .select('created_at')
        .eq('coach_id', coachId)
        .eq('member_id', clientId)
        .order('created_at', { ascending: false })
        .limit(1);

      const progress: ClientProgress = {
        client_id: clientId,
        coach_id: coachId,
        relationship_id: relationship.id,
        progress_data: {
          activities_this_week: activitiesThisWeek,
          activities_this_month: activitiesThisMonth,
          current_tier: currentTier,
          current_streak: 0, // This would come from tier system
          badges_earned: 0, // This would come from badge system
          last_activity_date: activities?.[0]?.created_at,
        },
        goals: {
          weekly_target: 4, // Default goal
          monthly_target: 16,
          custom_goals: [],
        },
        notes_count: notes?.length || 0,
        last_checkin_date: lastCheckin?.[0]?.created_at,
        next_session_date: undefined, // Would come from coach_sessions table
      };

      return { success: true, data: progress };
    } catch (error) {
      console.error('Error getting client progress:', error);
      return { success: false, error: 'Failed to get client progress' };
    }
  }

  /**
   * Update client relationship status
   */
  static async updateClientStatus(
    relationshipId: string, 
    status: ClientRelationshipStatus
  ): Promise<ServiceResponse<CoachClientRelationship>> {
    try {
      const { data: relationship, error } = await supabase
        .from('coach_client_relationships')
        .update({ 
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', relationshipId)
        .select(`
          *,
          client_profile:profiles!coach_client_relationships_client_id_fkey(username, first_name, last_name, avatar_url)
        `)
        .single();

      if (error) {
        return { success: false, error: 'Failed to update client status' };
      }

      return { success: true, data: relationship };
    } catch (error) {
      console.error('Error updating client status:', error);
      return { success: false, error: 'Failed to update client status' };
    }
  }

  /**
   * Add note to client
   */
  static async addClientNote(
    coachId: string, 
    clientId: string, 
    note: string, 
    tags?: string[]
  ): Promise<ServiceResponse<any>> {
    try {
      const { data, error } = await supabase
        .from('coach_member_notes')
        .insert({
          coach_id: coachId,
          member_id: clientId,
          content: note,
          tags: tags || [],
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: 'Failed to add client note' };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error adding client note:', error);
      return { success: false, error: 'Failed to add client note' };
    }
  }

  /**
   * Get available coaches (for client-side discovery)
   */
  static async getAvailableCoaches(
    specialty?: string, 
    priceRange?: { min: number; max: number }
  ): Promise<ServiceResponse<Coach[]>> {
    try {
      let query = supabase
        .from('coaches')
        .select(`
          *,
          profile:profiles(username, first_name, last_name, avatar_url)
        `)
        .eq('is_active', true)
        .eq('coach_status', 'active')
        .order('rating', { ascending: false });

      if (specialty) {
        query = query.contains('specialties', [specialty]);
      }

      if (priceRange) {
        query = query
          .gte('monthly_price', priceRange.min)
          .lte('monthly_price', priceRange.max);
      }

      const { data: coaches, error } = await query;

      if (error) {
        return { success: false, error: 'Failed to fetch available coaches' };
      }

      return { success: true, data: coaches || [] };
    } catch (error) {
      console.error('Error getting available coaches:', error);
      return { success: false, error: 'Failed to get available coaches' };
    }
  }
}