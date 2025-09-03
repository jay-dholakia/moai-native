import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  CoachService, 
  Coach, 
  CoachClientRelationship, 
  CoachDashboardStats, 
  ClientProgress,
  ClientRelationshipStatus
} from '@/services/coach-service';
import { ServiceResponse } from '@/services/types';
import { useAuth } from './useAuth';

/**
 * Hook to check if current user is a coach
 */
export function useIsCoach() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['is-coach', user?.id],
    queryFn: () => user?.id ? CoachService.isUserCoach(user.id) : Promise.resolve({ success: false, error: 'No user' } as ServiceResponse<boolean>),
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000, // 10 minutes
    select: (data: ServiceResponse<boolean>) => data.success ? data.data : false,
  });
}

/**
 * Hook to get coach profile
 */
export function useCoachProfile(profileId?: string) {
  const { user } = useAuth();
  const targetProfileId = profileId || user?.id;

  return useQuery({
    queryKey: ['coach-profile', targetProfileId],
    queryFn: () => targetProfileId ? CoachService.getCoachProfile(targetProfileId) : Promise.resolve({ success: false, error: 'No profile ID' } as ServiceResponse<Coach>),
    enabled: !!targetProfileId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    select: (data: ServiceResponse<Coach>) => data.success ? data.data : null,
  });
}

/**
 * Hook to get coach's clients
 */
export function useCoachClients(coachId: string, status?: ClientRelationshipStatus) {
  return useQuery({
    queryKey: ['coach-clients', coachId, status],
    queryFn: () => CoachService.getCoachClients(coachId, status),
    enabled: !!coachId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
    select: (data: ServiceResponse<CoachClientRelationship[]>) => data.success ? data.data : [],
  });
}

/**
 * Hook to get coach dashboard statistics
 */
export function useCoachDashboardStats(coachId: string) {
  return useQuery({
    queryKey: ['coach-dashboard-stats', coachId],
    queryFn: () => CoachService.getCoachDashboardStats(coachId),
    enabled: !!coachId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // Refresh every 10 minutes
    select: (data: ServiceResponse<CoachDashboardStats>) => data.success ? data.data : null,
  });
}

/**
 * Hook to get client progress data
 */
export function useClientProgress(coachId: string, clientId: string) {
  return useQuery({
    queryKey: ['client-progress', coachId, clientId],
    queryFn: () => CoachService.getClientProgress(coachId, clientId),
    enabled: !!(coachId && clientId),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
    select: (data: ServiceResponse<ClientProgress>) => data.success ? data.data : null,
  });
}

/**
 * Hook to get available coaches (for client discovery)
 */
export function useAvailableCoaches(
  specialty?: string, 
  priceRange?: { min: number; max: number }
) {
  return useQuery({
    queryKey: ['available-coaches', specialty, priceRange],
    queryFn: () => CoachService.getAvailableCoaches(specialty, priceRange),
    staleTime: 10 * 60 * 1000, // 10 minutes
    select: (data: ServiceResponse<Coach[]>) => data.success ? data.data : [],
  });
}

/**
 * Mutation to update client relationship status
 */
export function useUpdateClientStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ relationshipId, status }: { relationshipId: string; status: ClientRelationshipStatus }) =>
      CoachService.updateClientStatus(relationshipId, status),
    onSuccess: (result, variables) => {
      if (result.success) {
        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: ['coach-clients'] });
        queryClient.invalidateQueries({ queryKey: ['coach-dashboard-stats'] });
        queryClient.invalidateQueries({ queryKey: ['client-progress'] });
      }
      return result;
    },
  });
}

/**
 * Mutation to add client note
 */
export function useAddClientNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      coachId, 
      clientId, 
      note, 
      tags 
    }: { 
      coachId: string; 
      clientId: string; 
      note: string; 
      tags?: string[] 
    }) => CoachService.addClientNote(coachId, clientId, note, tags),
    onSuccess: (result, variables) => {
      if (result.success) {
        // Invalidate client progress to refresh notes count
        queryClient.invalidateQueries({ 
          queryKey: ['client-progress', variables.coachId, variables.clientId] 
        });
      }
      return result;
    },
  });
}

/**
 * Combined hook for coach dashboard
 */
export function useCoachDashboard(coachId?: string) {
  const coachProfile = useCoachProfile();
  const actualCoachId = coachId || coachProfile.data?.id;
  
  const dashboardStats = useCoachDashboardStats(actualCoachId || '');
  const activeClients = useCoachClients(actualCoachId || '', 'active');
  const pendingClients = useCoachClients(actualCoachId || '', 'pending');

  return {
    coachProfile: coachProfile.data,
    stats: dashboardStats.data,
    activeClients: activeClients.data,
    pendingClients: pendingClients.data,
    isLoading: coachProfile.isLoading || dashboardStats.isLoading || activeClients.isLoading,
    error: coachProfile.error || dashboardStats.error || activeClients.error,
    refetch: () => {
      coachProfile.refetch();
      dashboardStats.refetch();
      activeClients.refetch();
      pendingClients.refetch();
    },
  };
}

/**
 * Hook for client management view
 */
export function useClientManagement(coachId: string, clientId?: string) {
  const allClients = useCoachClients(coachId);
  const clientProgress = useClientProgress(coachId, clientId || '');
  const updateStatus = useUpdateClientStatus();
  const addNote = useAddClientNote();

  const clients = allClients.data || [];
  const selectedClient = clientId ? clients.find((c: CoachClientRelationship) => c.client_id === clientId) : null;

  return {
    clients,
    selectedClient,
    clientProgress: clientProgress.data,
    isLoading: allClients.isLoading || (clientId ? clientProgress.isLoading : false),
    error: allClients.error || clientProgress.error,
    updateClientStatus: (relationshipId: string, status: ClientRelationshipStatus) =>
      updateStatus.mutate({ relationshipId, status }),
    addClientNote: (note: string, tags?: string[]) =>
      clientId ? addNote.mutate({ coachId, clientId, note, tags }) : null,
    isUpdating: updateStatus.isPending || addNote.isPending,
    refetch: () => {
      allClients.refetch();
      if (clientId) clientProgress.refetch();
    },
  };
}

/**
 * Hook for coach onboarding flow
 */
export function useCoachOnboarding() {
  const { user } = useAuth();
  const isCoach = useIsCoach();
  const coachProfile = useCoachProfile();

  const onboardingStatus = {
    isCoach: isCoach.data || false,
    hasProfile: !!coachProfile.data,
    profileComplete: coachProfile.data ? 
      !!(coachProfile.data.bio && coachProfile.data.specialties.length > 0) : false,
    isActive: coachProfile.data?.is_active || false,
  };

  const completionPercentage = Object.values(onboardingStatus).filter(Boolean).length / 4 * 100;

  return {
    ...onboardingStatus,
    completionPercentage,
    nextStep: getNextOnboardingStep(onboardingStatus),
    isLoading: isCoach.isLoading || coachProfile.isLoading,
    error: isCoach.error || coachProfile.error,
    refetch: () => {
      isCoach.refetch();
      coachProfile.refetch();
    },
  };
}

function getNextOnboardingStep(status: any): string {
  if (!status.isCoach) return 'Apply to become a coach';
  if (!status.hasProfile) return 'Complete coach profile setup';
  if (!status.profileComplete) return 'Add bio and specialties';
  if (!status.isActive) return 'Activate coaching profile';
  return 'Start accepting clients';
}

/**
 * Hook for coaching analytics
 */
export function useCoachingAnalytics(coachId: string, timeframe: 'week' | 'month' | 'year' = 'month') {
  const stats = useCoachDashboardStats(coachId);
  const clients = useCoachClients(coachId);

  const analytics = {
    clientGrowth: calculateClientGrowth(clients.data || [], timeframe),
    retentionRate: stats.data?.client_retention_rate || 0,
    averageSessionsPerClient: calculateAverageSessionsPerClient(clients.data || []),
    revenueGrowth: calculateRevenueGrowth(clients.data || [], timeframe),
    clientSatisfaction: stats.data?.average_rating || 0,
  };

  return {
    analytics,
    isLoading: stats.isLoading || clients.isLoading,
    error: stats.error || clients.error,
    refetch: () => {
      stats.refetch();
      clients.refetch();
    },
  };
}

// Helper functions for analytics
function calculateClientGrowth(clients: CoachClientRelationship[], timeframe: string): number {
  const now = new Date();
  const timeAgo = new Date();
  
  switch (timeframe) {
    case 'week':
      timeAgo.setDate(now.getDate() - 7);
      break;
    case 'month':
      timeAgo.setMonth(now.getMonth() - 1);
      break;
    case 'year':
      timeAgo.setFullYear(now.getFullYear() - 1);
      break;
  }

  const newClients = clients.filter(c => new Date(c.created_at) >= timeAgo).length;
  const existingClients = clients.filter(c => new Date(c.created_at) < timeAgo).length;
  
  return existingClients > 0 ? (newClients / existingClients) * 100 : 0;
}

function calculateAverageSessionsPerClient(clients: CoachClientRelationship[]): number {
  if (clients.length === 0) return 0;
  // This would require session data from coach_sessions table
  // For now, return a placeholder
  return 4.2;
}

function calculateRevenueGrowth(clients: CoachClientRelationship[], timeframe: string): number {
  // This would require historical revenue data
  // For now, return a placeholder based on client growth
  return calculateClientGrowth(clients, timeframe) * 0.8; // Rough estimate
}