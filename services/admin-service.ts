import { supabase } from '@/lib/supabase';
import { ServiceResponse } from './types';

// Admin User Management Types
export interface AdminUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'user' | 'coach' | 'admin' | 'super_admin';
  status: 'active' | 'suspended' | 'banned' | 'pending';
  created_at: string;
  updated_at: string;
  last_seen?: string;
  profile_completed: boolean;
  verification_status: 'unverified' | 'pending' | 'verified' | 'rejected';
  activity_count: number;
  moai_count: number;
  coach_rating?: number;
  flags_count: number;
  warnings_count: number;
  avatar_url?: string;
}

export interface UserAction {
  id: string;
  user_id: string;
  admin_id: string;
  action_type: 'suspend' | 'ban' | 'warn' | 'flag' | 'verify' | 'promote' | 'demote' | 'note';
  reason: string;
  duration_days?: number;
  notes?: string;
  created_at: string;
  admin_profile?: {
    first_name: string;
    last_name: string;
  };
}

// Content Moderation Types
export interface ContentReport {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  content_type: 'profile' | 'message' | 'post' | 'workout' | 'comment' | 'image';
  content_id: string;
  report_type: 'spam' | 'harassment' | 'inappropriate' | 'fake' | 'violence' | 'other';
  description: string;
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  resolved_at?: string;
  resolved_by?: string;
  resolution_notes?: string;
  reporter_profile?: {
    first_name: string;
    last_name: string;
  };
  reported_user_profile?: {
    first_name: string;
    last_name: string;
  };
}

export interface ModerationAction {
  id: string;
  admin_id: string;
  report_id?: string;
  target_user_id: string;
  target_content_id?: string;
  action_type: 'remove_content' | 'hide_content' | 'warn_user' | 'suspend_user' | 'ban_user' | 'dismiss_report';
  reason: string;
  notes?: string;
  created_at: string;
  admin_profile?: {
    first_name: string;
    last_name: string;
  };
}

// Platform Analytics Types
export interface PlatformStats {
  total_users: number;
  active_users_daily: number;
  active_users_weekly: number;
  active_users_monthly: number;
  new_users_today: number;
  new_users_week: number;
  new_users_month: number;
  total_moais: number;
  active_moais: number;
  total_workouts: number;
  workouts_today: number;
  workouts_week: number;
  total_messages: number;
  messages_today: number;
  total_reports: number;
  pending_reports: number;
  resolved_reports: number;
  coach_count: number;
  admin_count: number;
}

export interface UserGrowthData {
  date: string;
  new_users: number;
  active_users: number;
  retention_rate: number;
}

export interface ActivityMetrics {
  date: string;
  workouts: number;
  messages: number;
  moai_activities: number;
  check_ins: number;
}

// System Health Types
export interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  uptime_percentage: number;
  response_time_avg: number;
  error_rate: number;
  database_status: 'connected' | 'slow' | 'disconnected';
  storage_usage: {
    used_gb: number;
    total_gb: number;
    percentage: number;
  };
  api_requests_today: number;
  active_connections: number;
  last_backup: string;
  last_updated: string;
}

export interface SystemAlert {
  id: string;
  alert_type: 'performance' | 'security' | 'error' | 'storage' | 'backup';
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  description: string;
  created_at: string;
  resolved_at?: string;
  resolved_by?: string;
  metadata?: Record<string, any>;
}


class AdminService {
  // User Management
  async getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
    sort_by?: 'created_at' | 'last_seen' | 'activity_count' | 'flags_count';
    sort_order?: 'asc' | 'desc';
  }): Promise<ServiceResponse<{ users: AdminUser[]; total: number; page: number }>> {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        role,
        status,
        sort_by = 'created_at',
        sort_order = 'desc'
      } = params || {};

      let query = supabase
        .from('profiles')
        .select(`
          *,
          activity_logs(count),
          moai_members(count),
          user_reports_received:content_reports!reported_user_id(count),
          user_warnings:user_actions!user_id(count)
        `, { count: 'exact' });

      // Apply filters
      if (search) {
        query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
      }

      if (role) {
        query = query.eq('role', role);
      }

      if (status) {
        query = query.eq('status', status);
      }

      // Apply sorting
      query = query.order(sort_by, { ascending: sort_order === 'asc' });

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        return { success: false, error: error.message };
      }

      const users: AdminUser[] = (data || []).map(user => ({
        id: user.id,
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        role: user.role || 'user',
        status: user.status || 'active',
        created_at: user.created_at,
        updated_at: user.updated_at,
        last_seen: user.last_seen,
        profile_completed: user.profile_completed || false,
        verification_status: user.verification_status || 'unverified',
        activity_count: user.activity_logs?.[0]?.count || 0,
        moai_count: user.moai_members?.[0]?.count || 0,
        coach_rating: user.coach_rating,
        flags_count: user.user_reports_received?.[0]?.count || 0,
        warnings_count: user.user_warnings?.[0]?.count || 0,
        avatar_url: user.avatar_url,
      }));

      return {
        success: true,
        data: {
          users,
          total: count || 0,
          page
        }
      };
    } catch (error) {
      return { success: false, error: 'Failed to fetch users' };
    }
  }

  async getUserDetails(userId: string): Promise<ServiceResponse<AdminUser & { actions: UserAction[] }>> {
    try {
      const { data: user, error: userError } = await supabase
        .from('profiles')
        .select(`
          *,
          activity_logs(count),
          moai_members(count),
          user_reports_received:content_reports!reported_user_id(count),
          user_warnings:user_actions!user_id(count)
        `)
        .eq('id', userId)
        .single();

      if (userError) {
        return { success: false, error: userError.message };
      }

      const { data: actions, error: actionsError } = await supabase
        .from('user_actions')
        .select(`
          *,
          admin_profile:profiles!admin_id(first_name, last_name)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (actionsError) {
        return { success: false, error: actionsError.message };
      }

      const adminUser: AdminUser & { actions: UserAction[] } = {
        id: user.id,
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        role: user.role || 'user',
        status: user.status || 'active',
        created_at: user.created_at,
        updated_at: user.updated_at,
        last_seen: user.last_seen,
        profile_completed: user.profile_completed || false,
        verification_status: user.verification_status || 'unverified',
        activity_count: user.activity_logs?.[0]?.count || 0,
        moai_count: user.moai_members?.[0]?.count || 0,
        coach_rating: user.coach_rating,
        flags_count: user.user_reports_received?.[0]?.count || 0,
        warnings_count: user.user_warnings?.[0]?.count || 0,
        avatar_url: user.avatar_url,
        actions: (actions || []).map(action => ({
          id: action.id,
          user_id: action.user_id,
          admin_id: action.admin_id,
          action_type: action.action_type,
          reason: action.reason,
          duration_days: action.duration_days,
          notes: action.notes,
          created_at: action.created_at,
          admin_profile: action.admin_profile,
        }))
      };

      return { success: true, data: adminUser };
    } catch (error) {
      return { success: false, error: 'Failed to fetch user details' };
    }
  }

  async updateUserStatus(
    userId: string,
    status: AdminUser['status'],
    reason: string,
    adminId: string,
    durationDays?: number
  ): Promise<ServiceResponse<void>> {
    try {
      // Update user status
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      // Log admin action
      const { error: actionError } = await supabase
        .from('user_actions')
        .insert({
          user_id: userId,
          admin_id: adminId,
          action_type: status === 'suspended' ? 'suspend' : status === 'banned' ? 'ban' : 'note',
          reason,
          duration_days: durationDays,
          created_at: new Date().toISOString()
        });

      if (actionError) {
        return { success: false, error: actionError.message };
      }

      return { success: true, data: undefined };
    } catch (error) {
      return { success: false, error: 'Failed to update user status' };
    }
  }

  async updateUserRole(
    userId: string,
    role: AdminUser['role'],
    reason: string,
    adminId: string
  ): Promise<ServiceResponse<void>> {
    try {
      // Update user role
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          role,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      // Log admin action
      const { error: actionError } = await supabase
        .from('user_actions')
        .insert({
          user_id: userId,
          admin_id: adminId,
          action_type: 'promote',
          reason,
          created_at: new Date().toISOString()
        });

      if (actionError) {
        return { success: false, error: actionError.message };
      }

      return { success: true, data: undefined };
    } catch (error) {
      return { success: false, error: 'Failed to update user role' };
    }
  }

  // Content Moderation
  async getContentReports(params?: {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
    content_type?: string;
    sort_by?: 'created_at' | 'priority';
    sort_order?: 'asc' | 'desc';
  }): Promise<ServiceResponse<{ reports: ContentReport[]; total: number; page: number }>> {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        priority,
        content_type,
        sort_by = 'created_at',
        sort_order = 'desc'
      } = params || {};

      let query = supabase
        .from('content_reports')
        .select(`
          *,
          reporter_profile:profiles!reporter_id(first_name, last_name),
          reported_user_profile:profiles!reported_user_id(first_name, last_name)
        `, { count: 'exact' });

      // Apply filters
      if (status) {
        query = query.eq('status', status);
      }

      if (priority) {
        query = query.eq('priority', priority);
      }

      if (content_type) {
        query = query.eq('content_type', content_type);
      }

      // Apply sorting
      query = query.order(sort_by, { ascending: sort_order === 'asc' });

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        return { success: false, error: error.message };
      }

      const reports: ContentReport[] = (data || []).map(report => ({
        id: report.id,
        reporter_id: report.reporter_id,
        reported_user_id: report.reported_user_id,
        content_type: report.content_type,
        content_id: report.content_id,
        report_type: report.report_type,
        description: report.description,
        status: report.status,
        priority: report.priority,
        created_at: report.created_at,
        resolved_at: report.resolved_at,
        resolved_by: report.resolved_by,
        resolution_notes: report.resolution_notes,
        reporter_profile: report.reporter_profile,
        reported_user_profile: report.reported_user_profile,
      }));

      return {
        success: true,
        data: {
          reports,
          total: count || 0,
          page
        }
      };
    } catch (error) {
      return { success: false, error: 'Failed to fetch content reports' };
    }
  }

  async resolveContentReport(
    reportId: string,
    adminId: string,
    action: 'dismiss' | 'remove_content' | 'warn_user' | 'suspend_user',
    notes?: string
  ): Promise<ServiceResponse<void>> {
    try {
      // Update report status
      const { error: updateError } = await supabase
        .from('content_reports')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          resolved_by: adminId,
          resolution_notes: notes
        })
        .eq('id', reportId);

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      // Log moderation action
      const { data: report } = await supabase
        .from('content_reports')
        .select('reported_user_id, content_id')
        .eq('id', reportId)
        .single();

      if (report) {
        const { error: actionError } = await supabase
          .from('moderation_actions')
          .insert({
            admin_id: adminId,
            report_id: reportId,
            target_user_id: report.reported_user_id,
            target_content_id: report.content_id,
            action_type: action === 'dismiss' ? 'dismiss_report' : action,
            reason: notes || 'Resolved report',
            created_at: new Date().toISOString()
          });

        if (actionError) {
          console.error('Failed to log moderation action:', actionError);
        }
      }

      return { success: true, data: undefined };
    } catch (error) {
      return { success: false, error: 'Failed to resolve content report' };
    }
  }

  // Platform Analytics
  async getPlatformStats(): Promise<ServiceResponse<PlatformStats>> {
    try {
      // Get basic user counts
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { count: activeUsersDaily } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('last_seen', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      const { count: activeUsersWeekly } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('last_seen', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      const { count: activeUsersMonthly } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('last_seen', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      // Get new user counts
      const { count: newUsersToday } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date().toISOString().split('T')[0]);

      const { count: newUsersWeek } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      const { count: newUsersMonth } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      // Get MOAI counts
      const { count: totalMoais } = await supabase
        .from('moais')
        .select('*', { count: 'exact', head: true });

      const { count: activeMoais } = await supabase
        .from('moais')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Get workout counts
      const { count: totalWorkouts } = await supabase
        .from('activity_logs')
        .select('*', { count: 'exact', head: true });

      const { count: workoutsToday } = await supabase
        .from('activity_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date().toISOString().split('T')[0]);

      const { count: workoutsWeek } = await supabase
        .from('activity_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      // Get message counts
      const { count: totalMessages } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true });

      const { count: messagesToday } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date().toISOString().split('T')[0]);

      // Get report counts
      const { count: totalReports } = await supabase
        .from('content_reports')
        .select('*', { count: 'exact', head: true });

      const { count: pendingReports } = await supabase
        .from('content_reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      const { count: resolvedReports } = await supabase
        .from('content_reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'resolved');

      // Get role counts
      const { count: coachCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'coach');

      const { count: adminCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .in('role', ['admin', 'super_admin']);

      const stats: PlatformStats = {
        total_users: totalUsers || 0,
        active_users_daily: activeUsersDaily || 0,
        active_users_weekly: activeUsersWeekly || 0,
        active_users_monthly: activeUsersMonthly || 0,
        new_users_today: newUsersToday || 0,
        new_users_week: newUsersWeek || 0,
        new_users_month: newUsersMonth || 0,
        total_moais: totalMoais || 0,
        active_moais: activeMoais || 0,
        total_workouts: totalWorkouts || 0,
        workouts_today: workoutsToday || 0,
        workouts_week: workoutsWeek || 0,
        total_messages: totalMessages || 0,
        messages_today: messagesToday || 0,
        total_reports: totalReports || 0,
        pending_reports: pendingReports || 0,
        resolved_reports: resolvedReports || 0,
        coach_count: coachCount || 0,
        admin_count: adminCount || 0,
      };

      return { success: true, data: stats };
    } catch (error) {
      return { success: false, error: 'Failed to fetch platform stats' };
    }
  }

  async getUserGrowthData(days: number = 30): Promise<ServiceResponse<UserGrowthData[]>> {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

      const { data, error } = await supabase.rpc('get_user_growth_data', {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      return { success: false, error: 'Failed to fetch user growth data' };
    }
  }

  async getActivityMetrics(days: number = 30): Promise<ServiceResponse<ActivityMetrics[]>> {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

      const { data, error } = await supabase.rpc('get_activity_metrics', {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      return { success: false, error: 'Failed to fetch activity metrics' };
    }
  }

  // System Health Monitoring
  async getSystemHealth(): Promise<ServiceResponse<SystemHealth>> {
    try {
      // This would typically connect to monitoring services
      // For now, we'll simulate basic health data
      const health: SystemHealth = {
        status: 'healthy',
        uptime_percentage: 99.9,
        response_time_avg: 150,
        error_rate: 0.01,
        database_status: 'connected',
        storage_usage: {
          used_gb: 45.2,
          total_gb: 100,
          percentage: 45.2
        },
        api_requests_today: 15420,
        active_connections: 342,
        last_backup: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        last_updated: new Date().toISOString()
      };

      return { success: true, data: health };
    } catch (error) {
      return { success: false, error: 'Failed to fetch system health' };
    }
  }

  async getSystemAlerts(params?: {
    limit?: number;
    severity?: string;
    resolved?: boolean;
  }): Promise<ServiceResponse<SystemAlert[]>> {
    try {
      const { limit = 50, severity, resolved } = params || {};

      let query = supabase
        .from('system_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (severity) {
        query = query.eq('severity', severity);
      }

      if (resolved !== undefined) {
        if (resolved) {
          query = query.not('resolved_at', 'is', null);
        } else {
          query = query.is('resolved_at', null);
        }
      }

      const { data, error } = await query;

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      return { success: false, error: 'Failed to fetch system alerts' };
    }
  }

  async createSystemAlert(alert: Omit<SystemAlert, 'id' | 'created_at'>): Promise<ServiceResponse<SystemAlert>> {
    try {
      const { data, error } = await supabase
        .from('system_alerts')
        .insert({
          ...alert,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: 'Failed to create system alert' };
    }
  }

  async resolveSystemAlert(alertId: string, adminId: string): Promise<ServiceResponse<void>> {
    try {
      const { error } = await supabase
        .from('system_alerts')
        .update({
          resolved_at: new Date().toISOString(),
          resolved_by: adminId
        })
        .eq('id', alertId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: undefined };
    } catch (error) {
      return { success: false, error: 'Failed to resolve system alert' };
    }
  }
}

export default new AdminService();