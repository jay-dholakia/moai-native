import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import ProgramService, { 
  ProgramTemplate, 
  ProgramAssignment, 
  ProgramProgress,
  ProgramReview,
  ProgramStats
} from '@/services/program-service';
import { ServiceResponse } from '@/services/types';

// Query keys
export const programKeys = {
  all: ['programs'] as const,
  coachPrograms: (coachId?: string) => [...programKeys.all, 'coach', coachId] as const,
  publicPrograms: (filters?: any) => [...programKeys.all, 'public', filters] as const,
  programStructure: (programId: string) => [...programKeys.all, 'structure', programId] as const,
  clientAssignments: (clientId?: string) => [...programKeys.all, 'assignments', 'client', clientId] as const,
  coachAssignments: (coachId?: string) => [...programKeys.all, 'assignments', 'coach', coachId] as const,
  programStats: (coachId?: string) => [...programKeys.all, 'stats', coachId] as const,
  programReviews: (programId: string) => [...programKeys.all, 'reviews', programId] as const,
};

/**
 * Hook to get coach's programs
 */
export function useCoachPrograms(coachId?: string) {
  return useQuery({
    queryKey: programKeys.coachPrograms(coachId),
    queryFn: () => coachId ? ProgramService.getCoachPrograms(coachId) : Promise.resolve({ success: false, error: 'No coach ID' } as ServiceResponse<ProgramTemplate[]>),
    enabled: !!coachId,
    staleTime: 300000, // 5 minutes
    gcTime: 600000, // 10 minutes
  });
}

/**
 * Hook to get public programs for marketplace
 */
export function usePublicPrograms(filters?: {
  difficulty?: string;
  type?: string;
  minPrice?: number;
  maxPrice?: number;
  searchQuery?: string;
}) {
  return useQuery({
    queryKey: programKeys.publicPrograms(filters),
    queryFn: () => ProgramService.getPublicPrograms(filters),
    staleTime: 300000, // 5 minutes
    gcTime: 600000, // 10 minutes
  });
}

/**
 * Hook to get program structure (weeks and workouts)
 */
export function useProgramStructure(programId: string) {
  return useQuery({
    queryKey: programKeys.programStructure(programId),
    queryFn: () => ProgramService.getProgramStructure(programId),
    enabled: !!programId,
    staleTime: 600000, // 10 minutes
    gcTime: 1800000, // 30 minutes
  });
}

/**
 * Hook to get client's program assignments
 */
export function useClientAssignments() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: programKeys.clientAssignments(user?.id),
    queryFn: () => user ? ProgramService.getClientAssignments(user.id) : Promise.resolve({ success: false, error: 'No user' } as ServiceResponse<ProgramAssignment[]>),
    enabled: !!user,
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes
  });
}

/**
 * Hook to get coach's program assignments
 */
export function useCoachAssignments(coachId?: string) {
  return useQuery({
    queryKey: programKeys.coachAssignments(coachId),
    queryFn: () => coachId ? ProgramService.getCoachAssignments(coachId) : Promise.resolve({ success: false, error: 'No coach ID' } as ServiceResponse<ProgramAssignment[]>),
    enabled: !!coachId,
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes
  });
}

/**
 * Hook to get program statistics
 */
export function useProgramStats(coachId?: string) {
  return useQuery({
    queryKey: programKeys.programStats(coachId),
    queryFn: () => coachId ? ProgramService.getProgramStats(coachId) : Promise.resolve({ success: false, error: 'No coach ID' } as ServiceResponse<ProgramStats>),
    enabled: !!coachId,
    staleTime: 300000, // 5 minutes
    gcTime: 600000, // 10 minutes
  });
}

/**
 * Hook to get program reviews
 */
export function useProgramReviews(programId: string) {
  return useQuery({
    queryKey: programKeys.programReviews(programId),
    queryFn: () => ProgramService.getProgramReviews(programId),
    enabled: !!programId,
    staleTime: 300000, // 5 minutes
    gcTime: 600000, // 10 minutes
  });
}

/**
 * Hook to create a new program
 */
export function useCreateProgram() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (programData: Omit<ProgramTemplate, 'id' | 'coach_id' | 'created_at' | 'updated_at' | 'rating_average' | 'rating_count' | 'enrollment_count'>) => {
      if (!user) throw new Error('No user authenticated');
      return ProgramService.createProgram(user.id, programData);
    },
    onSuccess: () => {
      // Invalidate coach programs query
      if (user) {
        queryClient.invalidateQueries({ queryKey: programKeys.coachPrograms(user.id) });
        queryClient.invalidateQueries({ queryKey: programKeys.programStats(user.id) });
      }
    },
  });
}

/**
 * Hook to update a program
 */
export function useUpdateProgram() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: { programId: string; updates: Partial<ProgramTemplate> }) => {
      return ProgramService.updateProgram(params.programId, params.updates);
    },
    onSuccess: (data, variables) => {
      // Invalidate related queries
      if (user) {
        queryClient.invalidateQueries({ queryKey: programKeys.coachPrograms(user.id) });
        queryClient.invalidateQueries({ queryKey: programKeys.publicPrograms() });
        queryClient.invalidateQueries({ queryKey: programKeys.programStructure(variables.programId) });
      }
    },
  });
}

/**
 * Hook to delete a program
 */
export function useDeleteProgram() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (programId: string) => {
      return ProgramService.deleteProgram(programId);
    },
    onSuccess: () => {
      // Invalidate coach programs query
      if (user) {
        queryClient.invalidateQueries({ queryKey: programKeys.coachPrograms(user.id) });
        queryClient.invalidateQueries({ queryKey: programKeys.programStats(user.id) });
        queryClient.invalidateQueries({ queryKey: programKeys.publicPrograms() });
      }
    },
  });
}

/**
 * Hook to assign a program to a client
 */
export function useAssignProgram() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: {
      programId: string;
      clientId: string;
      startDate: string;
      customizations?: Record<string, any>;
    }) => {
      if (!user) throw new Error('No user authenticated');
      return ProgramService.assignProgram(
        params.programId,
        params.clientId,
        user.id,
        params.startDate,
        params.customizations
      );
    },
    onSuccess: () => {
      // Invalidate assignment queries
      if (user) {
        queryClient.invalidateQueries({ queryKey: programKeys.coachAssignments(user.id) });
        queryClient.invalidateQueries({ queryKey: programKeys.programStats(user.id) });
      }
    },
  });
}

/**
 * Hook to update assignment status
 */
export function useUpdateAssignmentStatus() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: {
      assignmentId: string;
      status: ProgramAssignment['status'];
      notes?: string;
    }) => {
      return ProgramService.updateAssignmentStatus(
        params.assignmentId,
        params.status,
        params.notes
      );
    },
    onSuccess: () => {
      // Invalidate assignment queries
      if (user) {
        queryClient.invalidateQueries({ queryKey: programKeys.coachAssignments(user.id) });
        queryClient.invalidateQueries({ queryKey: programKeys.clientAssignments(user.id) });
        queryClient.invalidateQueries({ queryKey: programKeys.programStats(user.id) });
      }
    },
  });
}

/**
 * Hook to record workout completion
 */
export function useRecordWorkoutCompletion() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: {
      assignmentId: string;
      weekNumber: number;
      dayNumber: number;
      workoutId: string;
      completionData: {
        completed?: boolean;
        skipped?: boolean;
        skipReason?: string;
        feedback?: string;
        difficultyRating?: number;
        completionTime?: number;
        notes?: string;
      };
    }) => {
      return ProgramService.recordWorkoutCompletion(
        params.assignmentId,
        params.weekNumber,
        params.dayNumber,
        params.workoutId,
        params.completionData
      );
    },
    onSuccess: () => {
      // Invalidate assignment queries
      if (user) {
        queryClient.invalidateQueries({ queryKey: programKeys.clientAssignments(user.id) });
        queryClient.invalidateQueries({ queryKey: programKeys.coachAssignments(user.id) });
      }
    },
  });
}

/**
 * Hook to add a program review
 */
export function useAddProgramReview() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: {
      programId: string;
      assignmentId: string;
      reviewData: {
        rating: number;
        reviewText?: string;
        wouldRecommend: boolean;
      };
    }) => {
      if (!user) throw new Error('No user authenticated');
      return ProgramService.addProgramReview(
        params.programId,
        user.id,
        params.assignmentId,
        params.reviewData
      );
    },
    onSuccess: (data, variables) => {
      // Invalidate review and program queries
      queryClient.invalidateQueries({ queryKey: programKeys.programReviews(variables.programId) });
      queryClient.invalidateQueries({ queryKey: programKeys.publicPrograms() });
      if (user) {
        queryClient.invalidateQueries({ queryKey: programKeys.coachPrograms(user.id) });
      }
    },
  });
}

/**
 * Hook for program search and filtering
 */
export function useProgramSearch() {
  const { data: programsResponse, isLoading, error, refetch } = usePublicPrograms();
  
  const searchPrograms = (query: string, filters?: {
    difficulty?: string;
    type?: string;
    minPrice?: number;
    maxPrice?: number;
  }) => {
    return refetch();
  };

  return {
    programs: programsResponse?.success ? programsResponse.data : [],
    isLoading,
    error,
    searchPrograms,
  };
}

/**
 * Hook to get active client assignments for current user
 */
export function useActiveAssignments() {
  const { data: assignmentsResponse } = useClientAssignments();
  
  const assignments = assignmentsResponse?.success ? assignmentsResponse.data : [];
  const activeAssignments = assignments.filter((a: ProgramAssignment) => a.status === 'active');
  
  return {
    activeAssignments,
    totalActive: activeAssignments.length,
    hasActivePrograms: activeAssignments.length > 0,
  };
}

/**
 * Hook to get program dashboard data for coaches
 */
export function useProgramDashboard(coachId?: string) {
  const { data: programsResponse, isLoading: programsLoading } = useCoachPrograms(coachId);
  const { data: assignmentsResponse, isLoading: assignmentsLoading } = useCoachAssignments(coachId);
  const { data: statsResponse, isLoading: statsLoading } = useProgramStats(coachId);

  const programs = programsResponse?.success ? programsResponse.data : [];
  const assignments = assignmentsResponse?.success ? assignmentsResponse.data : [];
  const stats = statsResponse?.success ? statsResponse.data : null;

  const recentAssignments = assignments
    .sort((a: ProgramAssignment, b: ProgramAssignment) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const activeAssignments = assignments.filter((a: ProgramAssignment) => a.status === 'active');
  const pendingAssignments = assignments.filter((a: ProgramAssignment) => a.status === 'pending');

  return {
    programs,
    assignments,
    recentAssignments,
    activeAssignments,
    pendingAssignments,
    stats,
    isLoading: programsLoading || assignmentsLoading || statsLoading,
  };
}