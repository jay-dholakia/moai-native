import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { OnboardingService } from '@/services/onboarding-service';
import { OnboardingProgress, SaveOnboardingProgressParams, OnboardingFormData } from '@/types/onboarding';
import { useProfile } from './use-profile';
import { hasArrayItems, hasObjectKeys, safeGetBoolean } from '@/utils/profile-data-utils';

// Query keys
export const ONBOARDING_QUERY_KEYS = {
  progress: ['onboarding', 'progress'] as const,
  profileComplete: ['onboarding', 'profileComplete'] as const,
  profileData: ['onboarding', 'profileData'] as const,
};

export interface OnboardingProgressResult {
  currentStep: number;
  isCompleted: boolean;
  isLoading: boolean;
  canResume: boolean;
}

// Defines which fields are required for a profile to be considered complete
const REQUIRED_PROFILE_FIELDS = [
  'first_name', 
  'last_name',
];

// New onboarding required fields (after personal info)
const NEW_ONBOARDING_FIELDS = [
  'fitness_goals',
  'movement_activities', 
  'equipment_access',
  'first_week_commitment_set'
];

/**
 * Hook to get onboarding progress (matching web app logic)
 */
export function useOnboardingProgress(): OnboardingProgressResult {
  const { userProfile } = useProfile();

  const profile = userProfile.data;
  const isLoading = userProfile.isLoading;
  const hasError = userProfile.error;

  // If there's an error, treat as not loading
  if (hasError) {
    console.log('Profile error detected, treating as not authenticated:', hasError);
    return {
      currentStep: 1,
      isCompleted: false,
      isLoading: false,
      canResume: false,
    };
  }

  if (isLoading) {
    return {
      currentStep: 1,
      isCompleted: false,
      isLoading: true,
      canResume: false,
    };
  }

  // If no profile after loading, user might not exist
  if (!profile) {
    console.log('No profile found after loading completed');
    return {
      currentStep: 1,
      isCompleted: false,
      isLoading: false,
      canResume: false,
    };
  }

  // If onboarding is already marked as completed
  if (profile.onboarding_completed) {
    return {
      currentStep: 7, // Last step (now 7 total steps: 0-6)
      isCompleted: true,
      isLoading: false,
      canResume: false,
    };
  }

  // Determine the current step based on what's been filled
  let currentStep = profile.onboarding_step || 1;
  
  // Validate the step based on actual data for new 7-step flow
  if (currentStep > 1 && (!profile.first_name || !profile.last_name)) {
    currentStep = 1; // Reset to step 1 if personal info is missing
  }
  
  if (currentStep > 2 && !hasArrayItems(profile.fitness_goals)) {
    currentStep = 2; // Reset to step 2 if fitness goals are missing
  }
  
  if (currentStep > 3 && !hasObjectKeys(profile.movement_activities)) {
    currentStep = 3; // Reset to step 3 if movement activities are missing
  }
  
  // Check if onboarding should be marked as completed
  // User has completed all required steps if they have:
  // 1. Personal info, 2. Fitness goals, 3. Movement activities, 4. Weekly plan created
  const hasCompletedRequiredSteps = profile.first_name && 
    hasArrayItems(profile.fitness_goals) && 
    hasObjectKeys(profile.movement_activities);
    
  // If they're on step 6+ and have completed required steps, mark as completed
  if (currentStep >= 6 && hasCompletedRequiredSteps) {
    return {
      currentStep: 6, // Final step index (0-based)
      isCompleted: true,
      isLoading: false,
      canResume: false,
    };
  }

  return {
    currentStep: Math.max(1, currentStep - 1), // Convert to 0-based indexing
    isCompleted: false,
    isLoading: false,
    canResume: currentStep > 1, // Can resume if they've progressed past step 1
  };
}

/**
 * Hook to save onboarding progress
 */
export function useSaveOnboardingProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: SaveOnboardingProgressParams) => 
      OnboardingService.saveOnboardingProgress(params),
    onSuccess: (response) => {
      if (response.success) {
        // Invalidate progress query to refetch latest state
        queryClient.invalidateQueries({ queryKey: ONBOARDING_QUERY_KEYS.progress });
        queryClient.invalidateQueries({ queryKey: ONBOARDING_QUERY_KEYS.profileComplete });
      }
    },
  });
}

/**
 * Hook to complete onboarding
 */
export function useCompleteOnboarding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (finalData: Partial<OnboardingFormData>) => 
      OnboardingService.completeOnboarding(finalData),
    onSuccess: (response) => {
      if (response.success) {
        // Invalidate all onboarding-related queries
        queryClient.invalidateQueries({ queryKey: ONBOARDING_QUERY_KEYS.progress });
        queryClient.invalidateQueries({ queryKey: ONBOARDING_QUERY_KEYS.profileComplete });
        
        // Also invalidate profile queries since they may be affected
        queryClient.invalidateQueries({ queryKey: ['profile'] });
      }
    },
  });
}

/**
 * Hook to check if profile is complete (matching web app logic)
 */
export function useProfileCompletion() {
  const { userProfile } = useProfile();
  
  const isLoading = userProfile.isLoading;
  const profile = userProfile.data;
  
  // If we're still loading, we can't determine completion
  if (isLoading) {
    return { isComplete: false, isLoading: true };
  }
  
  // If profile is null (doesn't exist), it's definitely not complete
  if (!profile) {
    console.log("No profile found - incomplete");
    return { isComplete: false, isLoading: false };
  }
  
  // Check if all required fields have values
  const hasRequiredFields = REQUIRED_PROFILE_FIELDS.every(field => {
    const value = profile[field as keyof typeof profile];
    return value !== null && value !== undefined && value !== '';
  });
  
  // Check if all new onboarding fields have values with proper validation
  const hasNewOnboardingFields = NEW_ONBOARDING_FIELDS.every(field => {
    const value = profile[field as keyof typeof profile];
    
    if (value === null || value === undefined || value === '') return false;
    
    // Handle specific field types safely
    if (field === 'fitness_goals' || field === 'equipment_access') {
      return hasArrayItems(value);
    }
    
    if (field === 'movement_activities') {
      return hasObjectKeys(value);
    }
    
    if (field === 'first_week_commitment_set') {
      return safeGetBoolean(value, false);
    }
    
    return true;
  });

  // Profile is complete ONLY if all checkpoint requirements are met
  // This ensures users must complete the new structured onboarding flow
  const isComplete = hasRequiredFields && hasNewOnboardingFields && profile.onboarding_completed === true;
  
  console.log("Profile completion check:", {
    hasRequiredFields,
    hasNewOnboardingFields,
    isComplete,
    onboardingCompleted: profile.onboarding_completed
  });

  return { 
    isComplete,
    isLoading: false,
    profile,
    hasRequiredFields,
    hasNewOnboardingFields
  };
}

/**
 * Hook to upload profile photo
 */
export function useUploadProfilePhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, userId }: { file: File; userId: string }) => 
      OnboardingService.uploadProfilePhoto(file, userId),
    onSuccess: (response) => {
      if (response.success) {
        // Invalidate profile-related queries
        queryClient.invalidateQueries({ queryKey: ['profile'] });
        queryClient.invalidateQueries({ queryKey: ONBOARDING_QUERY_KEYS.profileData });
      }
    },
  });
}

/**
 * Hook to reset onboarding progress (for testing/restart)
 */
export function useResetOnboardingProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => OnboardingService.resetOnboardingProgress(),
    onSuccess: (response) => {
      if (response.success) {
        // Invalidate all onboarding queries
        queryClient.invalidateQueries({ queryKey: ONBOARDING_QUERY_KEYS.progress });
        queryClient.invalidateQueries({ queryKey: ONBOARDING_QUERY_KEYS.profileComplete });
        queryClient.invalidateQueries({ queryKey: ONBOARDING_QUERY_KEYS.profileData });
      }
    },
  });
}

/**
 * Hook to get profile data for pre-filling onboarding form
 */
export function useOnboardingProfileData() {
  return useQuery({
    queryKey: ONBOARDING_QUERY_KEYS.profileData,
    queryFn: () => OnboardingService.getProfileDataForOnboarding(),
    staleTime: 10 * 60 * 1000, // 10 minutes - this data doesn't change often
  });
}

/**
 * Combined hook for onboarding state management (matching web app logic)
 */
export function useOnboarding() {
  const progress = useOnboardingProgress();
  const profileCompletion = useProfileCompletion();
  const saveProgress = useSaveOnboardingProgress();
  const completeOnboarding = useCompleteOnboarding();
  const resetProgress = useResetOnboardingProgress();
  const profileData = useOnboardingProfileData();

  const isOnboardingRequired = !profileCompletion.isComplete && !profileCompletion.isLoading;
  const shouldShowOnboarding = isOnboardingRequired;
  

  return {
    // Progress state
    currentStep: progress.currentStep,
    completedSteps: [], // Simplified for mobile
    canResume: progress.canResume,
    
    // Completion state
    isComplete: profileCompletion.isComplete,
    isOnboardingRequired,
    shouldShowOnboarding,
    
    // Loading states
    isLoadingProgress: progress.isLoading,
    isLoadingCompletion: profileCompletion.isLoading,
    isLoading: progress.isLoading || profileCompletion.isLoading,
    
    // Actions
    saveProgress: saveProgress.mutateAsync,
    completeOnboarding: completeOnboarding.mutateAsync,
    resetProgress: resetProgress.mutateAsync,
    
    // Action states
    isSaving: saveProgress.isPending,
    isCompleting: completeOnboarding.isPending,
    isResetting: resetProgress.isPending,
    
    // Data
    profileData: profileData.data?.success ? profileData.data.data : null,
    
    // Errors
    progressError: null, // Simplified for mobile
    completionError: null, // Simplified for mobile
    saveError: saveProgress.error,
    completeError: completeOnboarding.error,
    
    // Refetch functions
    refetchProgress: () => {},
    refetchCompletion: () => {},
  };
}