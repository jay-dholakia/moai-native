import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import AdminService, { 
  AdminUser, 
  ContentReport, 
  PlatformStats, 
  UserGrowthData,
  ActivityMetrics,
  SystemHealth,
  SystemAlert,
  UserAction
} from '@/services/admin-service';

// User Management Hooks
export function useAdminUsers(params?: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
  sort_by?: 'created_at' | 'last_seen' | 'activity_count' | 'flags_count';
  sort_order?: 'asc' | 'desc';
}) {
  return useQuery({
    queryKey: ['admin-users', params],
    queryFn: () => AdminService.getUsers(params),
    gcTime: 5 * 60 * 1000, // 5 minutes
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useInfiniteAdminUsers(params?: {
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
  sort_by?: 'created_at' | 'last_seen' | 'activity_count' | 'flags_count';
  sort_order?: 'asc' | 'desc';
}) {
  return useInfiniteQuery({
    queryKey: ['admin-users-infinite', params],
    queryFn: ({ pageParam = 1 }) => 
      AdminService.getUsers({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.success) return undefined;
      const { users, total } = lastPage.data;
      const currentCount = allPages.reduce((sum, page) => 
        sum + (page.success ? page.data.users.length : 0), 0
      );
      return currentCount < total ? allPages.length + 1 : undefined;
    },
    gcTime: 5 * 60 * 1000,
    staleTime: 2 * 60 * 1000,
  });
}

export function useAdminUserDetails(userId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['admin-user-details', userId],
    queryFn: () => AdminService.getUserDetails(userId),
    enabled: enabled && !!userId,
    gcTime: 5 * 60 * 1000,
    staleTime: 2 * 60 * 1000,
  });
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      userId: string;
      status: AdminUser['status'];
      reason: string;
      adminId: string;
      durationDays?: number;
    }) => AdminService.updateUserStatus(
      params.userId,
      params.status,
      params.reason,
      params.adminId,
      params.durationDays
    ),
    onSuccess: (_, variables) => {
      // Invalidate user queries
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user-details', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['platform-stats'] });
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      userId: string;
      role: AdminUser['role'];
      reason: string;
      adminId: string;
    }) => AdminService.updateUserRole(
      params.userId,
      params.role,
      params.reason,
      params.adminId
    ),
    onSuccess: (_, variables) => {
      // Invalidate user queries
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user-details', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['platform-stats'] });
    },
  });
}

// Content Moderation Hooks
export function useContentReports(params?: {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  content_type?: string;
  sort_by?: 'created_at' | 'priority';
  sort_order?: 'asc' | 'desc';
}) {
  return useQuery({
    queryKey: ['content-reports', params],
    queryFn: () => AdminService.getContentReports(params),
    gcTime: 5 * 60 * 1000,
    staleTime: 30 * 1000, // 30 seconds for more real-time moderation
  });
}

export function useInfiniteContentReports(params?: {
  limit?: number;
  status?: string;
  priority?: string;
  content_type?: string;
  sort_by?: 'created_at' | 'priority';
  sort_order?: 'asc' | 'desc';
}) {
  return useInfiniteQuery({
    queryKey: ['content-reports-infinite', params],
    queryFn: ({ pageParam = 1 }) => 
      AdminService.getContentReports({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.success) return undefined;
      const { reports, total } = lastPage.data;
      const currentCount = allPages.reduce((sum, page) => 
        sum + (page.success ? page.data.reports.length : 0), 0
      );
      return currentCount < total ? allPages.length + 1 : undefined;
    },
    gcTime: 5 * 60 * 1000,
    staleTime: 30 * 1000,
  });
}

export function useResolveContentReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      reportId: string;
      adminId: string;
      action: 'dismiss' | 'remove_content' | 'warn_user' | 'suspend_user';
      notes?: string;
    }) => AdminService.resolveContentReport(
      params.reportId,
      params.adminId,
      params.action,
      params.notes
    ),
    onSuccess: () => {
      // Invalidate report queries
      queryClient.invalidateQueries({ queryKey: ['content-reports'] });
      queryClient.invalidateQueries({ queryKey: ['platform-stats'] });
    },
  });
}

// Platform Analytics Hooks
export function usePlatformStats() {
  return useQuery({
    queryKey: ['platform-stats'],
    queryFn: () => AdminService.getPlatformStats(),
    gcTime: 10 * 60 * 1000, // 10 minutes
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refetch every 5 minutes
  });
}

export function useUserGrowthData(days: number = 30) {
  return useQuery({
    queryKey: ['user-growth-data', days],
    queryFn: () => AdminService.getUserGrowthData(days),
    gcTime: 30 * 60 * 1000, // 30 minutes
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}

export function useActivityMetrics(days: number = 30) {
  return useQuery({
    queryKey: ['activity-metrics', days],
    queryFn: () => AdminService.getActivityMetrics(days),
    gcTime: 30 * 60 * 1000,
    staleTime: 15 * 60 * 1000,
  });
}

// System Health Monitoring Hooks
export function useSystemHealth() {
  return useQuery({
    queryKey: ['system-health'],
    queryFn: () => AdminService.getSystemHealth(),
    gcTime: 5 * 60 * 1000,
    staleTime: 1 * 60 * 1000, // 1 minute for health data
    refetchInterval: 2 * 60 * 1000, // Auto-refetch every 2 minutes
  });
}

export function useSystemAlerts(params?: {
  limit?: number;
  severity?: string;
  resolved?: boolean;
}) {
  return useQuery({
    queryKey: ['system-alerts', params],
    queryFn: () => AdminService.getSystemAlerts(params),
    gcTime: 10 * 60 * 1000,
    staleTime: 1 * 60 * 1000,
    refetchInterval: 2 * 60 * 1000, // Auto-refetch for real-time alerts
  });
}

export function useCreateSystemAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (alert: Omit<SystemAlert, 'id' | 'created_at'>) => 
      AdminService.createSystemAlert(alert),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['system-health'] });
    },
  });
}

export function useResolveSystemAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { alertId: string; adminId: string }) => 
      AdminService.resolveSystemAlert(params.alertId, params.adminId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['system-health'] });
    },
  });
}

// Combined Dashboard Hooks
export function useAdminDashboard() {
  const platformStats = usePlatformStats();
  const systemHealth = useSystemHealth();
  const pendingReports = useContentReports({
    status: 'pending',
    limit: 10,
    sort_by: 'created_at',
    sort_order: 'desc'
  });
  const activeAlerts = useSystemAlerts({
    resolved: false,
    limit: 10
  });

  return {
    platformStats,
    systemHealth,
    pendingReports,
    activeAlerts,
    isLoading: platformStats.isLoading || systemHealth.isLoading,
    error: platformStats.error || systemHealth.error,
    refetch: () => {
      platformStats.refetch();
      systemHealth.refetch();
      pendingReports.refetch();
      activeAlerts.refetch();
    }
  };
}

// User Search and Filtering Hooks
export function useUserSearch(searchTerm: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['user-search', searchTerm],
    queryFn: () => AdminService.getUsers({
      search: searchTerm,
      limit: 20
    }),
    enabled: enabled && searchTerm.length >= 2,
    gcTime: 5 * 60 * 1000,
    staleTime: 30 * 1000,
  });
}

// Real-time Data Hooks with Short Intervals
export function useRealTimeReports() {
  return useQuery({
    queryKey: ['real-time-reports'],
    queryFn: () => AdminService.getContentReports({
      status: 'pending',
      limit: 5,
      sort_by: 'created_at',
      sort_order: 'desc'
    }),
    refetchInterval: 30 * 1000, // Every 30 seconds
    gcTime: 2 * 60 * 1000,
    staleTime: 0, // Always consider stale for real-time updates
  });
}

export function useRealTimeSystemStatus() {
  return useQuery({
    queryKey: ['real-time-system-status'],
    queryFn: () => AdminService.getSystemHealth(),
    refetchInterval: 60 * 1000, // Every minute
    gcTime: 2 * 60 * 1000,
    staleTime: 0,
  });
}

// Batch Operations Hooks
export function useBatchUserActions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      userIds: string[];
      action: 'suspend' | 'ban' | 'activate';
      reason: string;
      adminId: string;
      durationDays?: number;
    }) => {
      const results = await Promise.all(
        params.userIds.map(userId => 
          AdminService.updateUserStatus(
            userId,
            params.action === 'activate' ? 'active' : params.action === 'suspend' ? 'suspended' : 'banned',
            params.reason,
            params.adminId,
            params.durationDays
          )
        )
      );
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['platform-stats'] });
    },
  });
}

// Analytics Export Hooks
export function useExportAnalytics() {
  return useMutation({
    mutationFn: async (params: {
      type: 'users' | 'activities' | 'reports' | 'system';
      dateRange: { start: string; end: string };
      format: 'csv' | 'json';
    }) => {
      // This would typically call an export service
      // For now, we'll simulate the export functionality
      return { success: true, downloadUrl: 'https://example.com/export.csv' };
    },
  });
}