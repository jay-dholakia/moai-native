import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/use-profile';
import { hasArrayItems, hasObjectKeys, safeGetBoolean } from '@/utils/profile-data-utils';

export interface OnboardingCheckpointsState {
  currentCheckpoint: number;
  isLoading: boolean;
  canProceedToStep: (stepNumber: number) => boolean;
  getCheckpointStatus: (stepNumber: number) => { completed: boolean; canAccess: boolean };
  isOnboardingComplete: boolean;
}

export function useOnboardingCheckpoints(): OnboardingCheckpointsState {
  const { user } = useAuth();
  const { userProfile } = useProfile();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userProfile.data !== undefined || !userProfile.isLoading) {
      setIsLoading(false);
    }
  }, [userProfile.data, userProfile.isLoading]);

  // Get current step from database (1-based) and convert to 0-based for UI
  const getDatabaseCurrentStep = (): number => {
    if (!userProfile.data) return 0;
    
    const dbStep = userProfile.data.onboarding_step || 1;
    return Math.max(0, dbStep - 1); // Convert to 0-based indexing
  };

  // Simplified checkpoint validation based on profile data
  const getCheckpointStatus = (stepNumber: number) => {
    if (!userProfile.data) {
      return { completed: false, canAccess: stepNumber === 1 };
    }

    const profile = userProfile.data;
    let completed = false;

    switch (stepNumber) {
      case 1: // Identity
        completed = !!(profile.first_name && profile.last_name);
        break;
      case 2: // Goals
        completed = hasArrayItems(profile.fitness_goals);
        break;
      case 3: // Movement
        completed = hasObjectKeys(profile.movement_activities);
        break;
      case 4: // Access
        completed = hasArrayItems(profile.equipment_access);
        break;
      case 5: // Commitment
        completed = safeGetBoolean(profile.first_week_commitment_set, false);
        break;
      case 6: // Moai Setup
        completed = safeGetBoolean(profile.onboarding_completed, false);
        break;
      default:
        completed = false;
    }

    return {
      completed,
      canAccess: canProceedToStep(stepNumber)
    };
  };

  // Check if user can proceed to a specific step
  const canProceedToStep = (stepNumber: number): boolean => {
    if (stepNumber === 1) return true; // Can always access first step
    
    // Must complete all previous steps first
    for (let i = 1; i < stepNumber; i++) {
      const status = getCheckpointStatus(i);
      if (!status.completed) {
        return false;
      }
    }
    return true;
  };

  // Find current checkpoint - use database step as primary source, fallback to validation
  const getCurrentCheckpoint = (): number => {
    if (!userProfile.data) return 1;
    
    // Start with database step as source of truth
    const dbStep = userProfile.data.onboarding_step || 1;
    
    // Validate that the user can actually access this step
    if (canProceedToStep(dbStep)) {
      return dbStep;
    }
    
    // If database step is invalid, find the furthest valid step
    for (let i = 1; i <= 6; i++) {
      const status = getCheckpointStatus(i);
      if (!status.completed && status.canAccess) {
        return i;
      }
    }
    return 6; // If all completed, stay on last step
  };

  // Check if all onboarding is complete
  const isOnboardingComplete = userProfile.data?.onboarding_completed === true;

  return {
    currentCheckpoint: getCurrentCheckpoint(),
    isLoading,
    canProceedToStep,
    getCheckpointStatus,
    isOnboardingComplete
  };
}