import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import {
  fetchProfile,
  fetchProfileById,
  updateProfile,
  updateProfileImage,
  checkUsernameAvailability,
  searchProfiles,
  updateProfileSettings,
  fetchProfileStats
} from '@/services/profile-service';
import { Profile, UpdateProfileData, ServiceResponse } from '@/services/types';

export function useProfile() {
  const queryClient = useQueryClient();
  const { user, session } = useAuth();
  
  // Get current user profile
  const userProfile = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async (): Promise<Profile | null> => {
      if (!user?.id || !session) {
        console.log('No user or session available for profile fetch');
        return null;
      }
      
      console.log('Fetching profile for user:', user.id);
      const result = await fetchProfile();
      
      if (!result.success) {
        console.error('Profile fetch failed:', result.error);
        
        // If it's an auth error, throw to let auth system handle it
        if (result.error?.includes('JWT') || result.error?.includes('Authentication') || result.error?.includes('No authenticated user')) {
          throw new Error(result.error);
        }
        
        // For other errors, return null instead of throwing
        console.log('Returning null due to non-auth error:', result.error);
        return null;
      }
      
      console.log('Profile fetched successfully:', !!result.data);
      return result.data;
    },
    enabled: !!user?.id && !!session,
    retry: (failureCount, error: any) => {
      console.log(`Profile query retry attempt ${failureCount}:`, error?.message);
      
      // Don't retry on JWT expired errors - let the auth system handle it
      if (error?.message?.includes('JWT') || error?.message?.includes('Authentication') || error?.message?.includes('No authenticated user')) {
        console.log("Auth error in profile query, not retrying");
        return false;
      }
      return failureCount < 2; // Reduce retry attempts
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    // Add timeout to prevent infinite loading
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
  
  // Get profile by ID
  const useProfileById = (userId: string) => {
    return useQuery({
      queryKey: ['profile', userId],
      queryFn: async (): Promise<Profile | null> => {
        const result = await fetchProfileById(userId);
        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch profile');
        }
        return result.data;
      },
      enabled: !!userId,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    });
  };
  
  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updates: UpdateProfileData): Promise<Profile> => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      
      const result = await updateProfile(user.id, updates);
      if (!result.success) {
        throw new Error(result.error || 'Failed to update profile');
      }
      return result.data!;
    },
    onSuccess: (updatedProfile) => {
      // Update the profile cache
      queryClient.setQueryData(['profile', user?.id], updatedProfile);
      
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: ['profile']
      });
    },
  });
  
  // Update profile image mutation
  const updateProfileImageMutation = useMutation({
    mutationFn: async (imageUrl: string): Promise<Profile> => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      
      const result = await updateProfileImage(user.id, imageUrl);
      if (!result.success) {
        throw new Error(result.error || 'Failed to update profile image');
      }
      return result.data!;
    },
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(['profile', user?.id], updatedProfile);
      queryClient.invalidateQueries({
        queryKey: ['profile']
      });
    },
  });
  
  // Check username availability
  const checkUsernameAvailabilityMutation = useMutation({
    mutationFn: async (username: string): Promise<boolean> => {
      const result = await checkUsernameAvailability(username, user?.id);
      if (!result.success) {
        throw new Error(result.error || 'Failed to check username availability');
      }
      return result.data!;
    },
  });
  
  // Update profile settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: Profile['settings']): Promise<Profile> => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      
      const result = await updateProfileSettings(user.id, settings);
      if (!result.success) {
        throw new Error(result.error || 'Failed to update settings');
      }
      return result.data!;
    },
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(['profile', user?.id], updatedProfile);
    },
  });
  
  return {
    // Queries
    userProfile,
    useProfileById,
    
    // Mutations
    updateProfile: updateProfileMutation.mutate,
    updateProfileAsync: updateProfileMutation.mutateAsync,
    isUpdatingProfile: updateProfileMutation.isPending,
    updateProfileError: updateProfileMutation.error,
    
    updateProfileImage: updateProfileImageMutation.mutate,
    updateProfileImageAsync: updateProfileImageMutation.mutateAsync,
    isUpdatingProfileImage: updateProfileImageMutation.isPending,
    
    checkUsernameAvailability: checkUsernameAvailabilityMutation.mutate,
    checkUsernameAvailabilityAsync: checkUsernameAvailabilityMutation.mutateAsync,
    isCheckingUsername: checkUsernameAvailabilityMutation.isPending,
    
    updateSettings: updateSettingsMutation.mutate,
    updateSettingsAsync: updateSettingsMutation.mutateAsync,
    isUpdatingSettings: updateSettingsMutation.isPending,
    
    // Utilities
    refetchProfile: userProfile.refetch,
  };
}

// Hook for searching profiles
export function useProfileSearch() {
  const searchProfilesMutation = useMutation({
    mutationFn: async ({ searchTerm, limit = 20 }: { searchTerm: string; limit?: number }): Promise<Profile[]> => {
      const result = await searchProfiles(searchTerm, limit);
      if (!result.success) {
        throw new Error(result.error || 'Failed to search profiles');
      }
      return result.data!;
    },
  });
  
  return {
    searchProfiles: searchProfilesMutation.mutate,
    searchProfilesAsync: searchProfilesMutation.mutateAsync,
    isSearching: searchProfilesMutation.isPending,
    searchResults: searchProfilesMutation.data,
    searchError: searchProfilesMutation.error,
  };
}

// Hook for profile statistics
export function useProfileStats(userId?: string) {
  const targetUserId = userId;
  
  return useQuery({
    queryKey: ['profileStats', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return null;
      
      const result = await fetchProfileStats(targetUserId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch profile stats');
      }
      return result.data;
    },
    enabled: !!targetUserId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}