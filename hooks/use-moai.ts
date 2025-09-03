import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import {
  fetchMoais,
  fetchUserMoais,
  fetchMoaiById,
  fetchMoaiMembers,
  createMoai,
  updateMoai,
  deleteMoai,
  joinMoai,
  leaveMoai,
  searchMoais,
  canJoinMoai,
  fetchMoaiPosts,
  createMoaiPost,
  pinMoaiPost,
  fetchMoaiMoments,
  getMomentsStatus
} from '@/services/moai-service';
import { Moai, MoaiMember, CreateMoaiData, PaginatedResponse } from '@/services/types';

// Types for posts and moments
interface MoaiPost {
  id: string;
  content: string;
  image_url?: string;
  created_at: string;
  profile_id: string;
  profile: {
    first_name: string;
    last_name: string;
    profile_image?: string;
  };
  is_pinned?: boolean;
}

interface MoaiMoment {
  id: string;
  content?: string;
  image_url?: string;
  video_url?: string;
  created_at: string;
  expires_at: string;
  profile_id: string;
  profile: {
    first_name: string;
    last_name: string;
    profile_image?: string;
  };
}

export function useMoais() {
  const queryClient = useQueryClient();
  
  // Infinite query for public moais
  const moaisQuery = useInfiniteQuery({
    queryKey: ['moais'],
    queryFn: async ({ pageParam = 0 }): Promise<PaginatedResponse<Moai>> => {
      const result = await fetchMoais(pageParam);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch moais');
      }
      return result.data!;
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
  
  return {
    moais: moaisQuery.data,
    isLoading: moaisQuery.isLoading,
    isError: moaisQuery.isError,
    error: moaisQuery.error,
    fetchNextPage: moaisQuery.fetchNextPage,
    hasNextPage: moaisQuery.hasNextPage,
    isFetchingNextPage: moaisQuery.isFetchingNextPage,
    refetch: moaisQuery.refetch,
  };
}

export function useUserMoais(userId?: string) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;
  
  // Infinite query for user's moais
  const userMoaisQuery = useInfiniteQuery({
    queryKey: ['userMoais', targetUserId],
    queryFn: async ({ pageParam = 0 }): Promise<PaginatedResponse<Moai>> => {
      const result = await fetchUserMoais(targetUserId, pageParam);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch user moais');
      }
      return result.data!;
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    enabled: !!targetUserId,
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
  
  return {
    userMoais: userMoaisQuery.data,
    isLoading: userMoaisQuery.isLoading,
    isError: userMoaisQuery.isError,
    error: userMoaisQuery.error,
    fetchNextPage: userMoaisQuery.fetchNextPage,
    hasNextPage: userMoaisQuery.hasNextPage,
    isFetchingNextPage: userMoaisQuery.isFetchingNextPage,
    refetch: userMoaisQuery.refetch,
  };
}

export function useMoaiById(moaiId: string) {
  const queryClient = useQueryClient();
  
  const moaiQuery = useQuery({
    queryKey: ['moai', moaiId],
    queryFn: async (): Promise<Moai & { members?: MoaiMember[] }> => {
      const result = await fetchMoaiById(moaiId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch moai');
      }
      return result.data!;
    },
    enabled: !!moaiId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
  
  return {
    moai: moaiQuery.data,
    isLoading: moaiQuery.isLoading,
    isError: moaiQuery.isError,
    error: moaiQuery.error,
    refetch: moaiQuery.refetch,
  };
}

export function useMoaiMembers(moaiId: string) {
  return useQuery({
    queryKey: ['moaiMembers', moaiId],
    queryFn: async (): Promise<MoaiMember[]> => {
      const result = await fetchMoaiMembers(moaiId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch moai members');
      }
      return result.data!;
    },
    enabled: !!moaiId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useMoaiActions() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Create moai mutation
  const createMoaiMutation = useMutation({
    mutationFn: async (moaiData: CreateMoaiData): Promise<Moai> => {
      const result = await createMoai(moaiData);
      if (!result.success) {
        throw new Error(result.error || 'Failed to create moai');
      }
      return result.data!;
    },
    onSuccess: (newMoai) => {
      // Invalidate moais list
      queryClient.invalidateQueries({ queryKey: ['moais'] });
      queryClient.invalidateQueries({ queryKey: ['userMoais'] });
      
      // Add to cache
      queryClient.setQueryData(['moai', newMoai.id], newMoai);
    },
  });
  
  // Update moai mutation
  const updateMoaiMutation = useMutation({
    mutationFn: async ({ moaiId, updates }: { moaiId: string; updates: Partial<CreateMoaiData> }): Promise<Moai> => {
      const result = await updateMoai(moaiId, updates);
      if (!result.success) {
        throw new Error(result.error || 'Failed to update moai');
      }
      return result.data!;
    },
    onSuccess: (updatedMoai) => {
      // Update cache
      queryClient.setQueryData(['moai', updatedMoai.id], updatedMoai);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['moais'] });
      queryClient.invalidateQueries({ queryKey: ['userMoais'] });
    },
  });
  
  // Delete moai mutation
  const deleteMoaiMutation = useMutation({
    mutationFn: async (moaiId: string): Promise<boolean> => {
      const result = await deleteMoai(moaiId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete moai');
      }
      return result.data!;
    },
    onSuccess: (_, moaiId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: ['moai', moaiId] });
      queryClient.removeQueries({ queryKey: ['moaiMembers', moaiId] });
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: ['moais'] });
      queryClient.invalidateQueries({ queryKey: ['userMoais'] });
    },
  });
  
  // Join moai mutation
  const joinMoaiMutation = useMutation({
    mutationFn: async (moaiId: string): Promise<MoaiMember> => {
      const result = await joinMoai(moaiId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to join moai');
      }
      return result.data!;
    },
    onSuccess: (_, moaiId) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['moai', moaiId] });
      queryClient.invalidateQueries({ queryKey: ['moaiMembers', moaiId] });
      queryClient.invalidateQueries({ queryKey: ['userMoais', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['canJoinMoai', moaiId] });
    },
  });
  
  // Leave moai mutation
  const leaveMoaiMutation = useMutation({
    mutationFn: async (moaiId: string): Promise<boolean> => {
      const result = await leaveMoai(moaiId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to leave moai');
      }
      return result.data!;
    },
    onSuccess: (_, moaiId) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['moai', moaiId] });
      queryClient.invalidateQueries({ queryKey: ['moaiMembers', moaiId] });
      queryClient.invalidateQueries({ queryKey: ['userMoais', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['canJoinMoai', moaiId] });
    },
  });
  
  return {
    // Create moai
    createMoai: createMoaiMutation.mutate,
    createMoaiAsync: createMoaiMutation.mutateAsync,
    isCreatingMoai: createMoaiMutation.isPending,
    createMoaiError: createMoaiMutation.error,
    
    // Update moai
    updateMoai: updateMoaiMutation.mutate,
    updateMoaiAsync: updateMoaiMutation.mutateAsync,
    isUpdatingMoai: updateMoaiMutation.isPending,
    updateMoaiError: updateMoaiMutation.error,
    
    // Delete moai
    deleteMoai: deleteMoaiMutation.mutate,
    deleteMoaiAsync: deleteMoaiMutation.mutateAsync,
    isDeletingMoai: deleteMoaiMutation.isPending,
    deleteMoaiError: deleteMoaiMutation.error,
    
    // Join moai
    joinMoai: joinMoaiMutation.mutate,
    joinMoaiAsync: joinMoaiMutation.mutateAsync,
    isJoiningMoai: joinMoaiMutation.isPending,
    joinMoaiError: joinMoaiMutation.error,
    
    // Leave moai
    leaveMoai: leaveMoaiMutation.mutate,
    leaveMoaiAsync: leaveMoaiMutation.mutateAsync,
    isLeavingMoai: leaveMoaiMutation.isPending,
    leaveMoaiError: leaveMoaiMutation.error,
  };
}

export function useMoaiSearch() {
  const searchMoaisMutation = useMutation({
    mutationFn: async ({
      searchTerm,
      filters,
      page = 0,
      limit = 20
    }: {
      searchTerm: string;
      filters?: {
        type?: string;
        hobbies?: string[];
        location?: string;
      };
      page?: number;
      limit?: number;
    }): Promise<PaginatedResponse<Moai>> => {
      const result = await searchMoais(searchTerm, filters, page, limit);
      if (!result.success) {
        throw new Error(result.error || 'Failed to search moais');
      }
      return result.data!;
    },
  });
  
  return {
    searchMoais: searchMoaisMutation.mutate,
    searchMoaisAsync: searchMoaisMutation.mutateAsync,
    isSearching: searchMoaisMutation.isPending,
    searchResults: searchMoaisMutation.data,
    searchError: searchMoaisMutation.error,
  };
}

export function useCanJoinMoai(moaiId: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['canJoinMoai', moaiId, user?.id],
    queryFn: async (): Promise<boolean> => {
      const result = await canJoinMoai(moaiId);
      if (!result.success) {
        return false;
      }
      return result.data!;
    },
    enabled: !!moaiId && !!user?.id,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Real service functions now implemented

// Hook for moai posts
export function useMoaiPosts(moaiId: string) {
  return useQuery({
    queryKey: ['moaiPosts', moaiId],
    queryFn: async (): Promise<MoaiPost[]> => {
      const result = await fetchMoaiPosts(moaiId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch moai posts');
      }
      return result.data!;
    },
    enabled: !!moaiId,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook for creating posts
export function useCreateMoaiPost() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ moaiId, content, imageUrl }: { moaiId: string; content: string; imageUrl?: string }): Promise<MoaiPost> => {
      const result = await createMoaiPost(moaiId, content, imageUrl);
      if (!result.success) {
        throw new Error(result.error || 'Failed to create post');
      }
      return result.data!;
    },
    onSuccess: (newPost, variables) => {
      // Add to cache optimistically
      queryClient.setQueryData(['moaiPosts', variables.moaiId], (old: MoaiPost[] | undefined) => {
        if (!old) return [newPost];
        return [newPost, ...old];
      });
    },
  });
}

// Hook for pinning posts
export function usePinMoaiPost() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ moaiId, postId }: { moaiId: string; postId: string }): Promise<boolean> => {
      const result = await pinMoaiPost(moaiId, postId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to pin post');
      }
      return result.data!;
    },
    onSuccess: (_, variables) => {
      // Invalidate posts to refetch with updated pin status
      queryClient.invalidateQueries({ queryKey: ['moaiPosts', variables.moaiId] });
    },
  });
}

// Hook for moai moments
export function useMoaiMoments(moaiId: string) {
  return useQuery({
    queryKey: ['moaiMoments', moaiId],
    queryFn: async (): Promise<MoaiMoment[]> => {
      const result = await fetchMoaiMoments(moaiId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch moai moments');
      }
      return result.data!;
    },
    enabled: !!moaiId,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Hook for moments status across multiple moais
export function useMomentsStatus(moaiIds: string[]) {
  return useQuery({
    queryKey: ['momentsStatus', ...moaiIds.sort()],
    queryFn: async (): Promise<Record<string, { hasStories: boolean; hasViewedStories: boolean }>> => {
      const result = await getMomentsStatus(moaiIds);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch moments status');
      }
      return result.data!;
    },
    enabled: moaiIds.length > 0,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Export types
export type { MoaiPost, MoaiMoment };