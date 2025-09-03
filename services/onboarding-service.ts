import { supabase } from '@/lib/supabase';
import { ServiceResponse } from './types';
import { OnboardingFormData, OnboardingProgress, SaveOnboardingProgressParams } from '@/types/onboarding';

export class OnboardingService {
  /**
   * Get the current user's onboarding progress
   */
  static async getOnboardingProgress(): Promise<ServiceResponse<OnboardingProgress | null>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('onboarding_step, onboarding_completed_at, updated_at')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching onboarding progress:', error);
        return { success: false, error: error.message };
      }

      if (!profile) {
        return { success: true, data: null };
      }

      const progress: OnboardingProgress = {
        currentStep: profile.onboarding_step || 0,
        completedSteps: Array.from({ length: profile.onboarding_step || 0 }, (_, i) => i),
        isComplete: !!profile.onboarding_completed_at,
        lastSavedAt: profile.updated_at || new Date().toISOString(),
        userId: user.id,
      };

      return { success: true, data: progress };
    } catch (error) {
      console.error('Error getting onboarding progress:', error);
      return { success: false, error: 'Failed to get onboarding progress' };
    }
  }

  /**
   * Save onboarding progress for a specific step
   */
  static async saveOnboardingProgress(params: SaveOnboardingProgressParams): Promise<ServiceResponse<void>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Build update object based on step
      const updateData: any = {
        onboarding_step: Math.max(params.step + 1, 1), // Always at least step 1
        updated_at: new Date().toISOString(),
      };

      // Add step-specific data for new 6-step flow
      switch (params.step) {
        case 0: // Personal Info (Identity & Personal Info)
          if (params.data.firstName) updateData.first_name = params.data.firstName;
          if (params.data.lastName) updateData.last_name = params.data.lastName;
          if (params.data.birthDate) updateData.birth_date = params.data.birthDate;
          if (params.data.height) updateData.height = params.data.height;
          if (params.data.weight) updateData.weight = params.data.weight;
          if (params.data.measurementSystem) updateData.measurement_system = params.data.measurementSystem;
          break;
          
        case 1: // Goal Setting
          if (params.data.fitnessGoals) updateData.fitness_goals = params.data.fitnessGoals;
          break;
          
        case 2: // Movement Snapshot
          if (params.data.movementActivities) {
            updateData.movement_activities = params.data.movementActivities;
          }
          break;
          
        case 3: // Access & Constraints
          if (params.data.equipmentAccess) {
            updateData.equipment_access = params.data.equipmentAccess;
          }
          if (params.data.physicalLimitations) {
            updateData.physical_limitations = params.data.physicalLimitations;
          }
          break;
          
        case 4: // Weekly Commitment
          if (params.data.weeklyCommitment) {
            updateData.weekly_commitment = params.data.weeklyCommitment;
          }
          break;
          
        case 5: // Moai Setup
          if (params.data.moaiPath) updateData.moai_path = params.data.moaiPath;
          if (params.data.selectedMoaiType) updateData.selected_moai_type = params.data.selectedMoaiType;
          break;
      }

      // Update profile with step data
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) {
        console.error('Error saving onboarding progress:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: undefined };
    } catch (error) {
      console.error('Error saving onboarding progress:', error);
      return { success: false, error: 'Failed to save onboarding progress' };
    }
  }

  /**
   * Complete the onboarding process
   */
  static async completeOnboarding(finalData: Partial<OnboardingFormData>): Promise<ServiceResponse<void>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const updateData: any = {
        onboarding_completed_at: new Date().toISOString(),
        onboarding_step: 6, // All 6 steps completed
        updated_at: new Date().toISOString(),
      };

      // Add any final data
      if (finalData.moaiPath) updateData.moai_path = finalData.moaiPath;
      if (finalData.selectedMoaiType) updateData.selected_moai_type = finalData.selectedMoaiType;

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) {
        console.error('Error completing onboarding:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: undefined };
    } catch (error) {
      console.error('Error completing onboarding:', error);
      return { success: false, error: 'Failed to complete onboarding' };
    }
  }

  /**
   * Check if user profile is complete (all required onboarding steps done)
   */
  static async isProfileComplete(): Promise<ServiceResponse<boolean>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('onboarding_completed_at, first_name, last_name, fitness_goals')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error checking profile completion:', error);
        return { success: false, error: error.message };
      }

      // Check if onboarding is marked as complete and required fields are present
      const isComplete = !!(
        profile?.onboarding_completed_at &&
        profile?.first_name &&
        profile?.last_name &&
        profile?.fitness_goals
      );

      return { success: true, data: isComplete };
    } catch (error) {
      console.error('Error checking profile completion:', error);
      return { success: false, error: 'Failed to check profile completion' };
    }
  }

  /**
   * Upload profile photo during onboarding
   */
  static async uploadProfilePhoto(file: File, userId: string): Promise<ServiceResponse<string>> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Math.random()}.${fileExt}`;
      const filePath = `profile-images/${fileName}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Error uploading profile photo:', uploadError);
        return { success: false, error: uploadError.message };
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath);

      // Update profile with image URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_image: publicUrl })
        .eq('id', userId);

      if (updateError) {
        console.error('Error updating profile with image URL:', updateError);
        return { success: false, error: updateError.message };
      }

      return { success: true, data: publicUrl };
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      return { success: false, error: 'Failed to upload profile photo' };
    }
  }

  /**
   * Reset onboarding progress (for testing or restart)
   */
  static async resetOnboardingProgress(): Promise<ServiceResponse<void>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          onboarding_step: 0,
          onboarding_completed_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error resetting onboarding progress:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: undefined };
    } catch (error) {
      console.error('Error resetting onboarding progress:', error);
      return { success: false, error: 'Failed to reset onboarding progress' };
    }
  }

  /**
   * Get profile data for pre-filling onboarding form
   */
  static async getProfileDataForOnboarding(): Promise<ServiceResponse<Partial<OnboardingFormData>>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile data:', error);
        return { success: false, error: error.message };
      }

      // Map profile data to onboarding form data for new 6-step flow
      // Note: Supabase returns array fields as arrays and JSON fields as objects, no parsing needed
      const formData: Partial<OnboardingFormData> = {
        firstName: profile?.first_name || '',
        lastName: profile?.last_name || '',
        birthDate: profile?.birth_date || '',
        height: profile?.height || null,
        weight: profile?.weight || null,
        measurementSystem: profile?.measurement_system || 'imperial',
        fitnessGoals: profile?.fitness_goals || [],
        movementActivities: profile?.movement_activities || {},
        equipmentAccess: profile?.equipment_access || [],
        physicalLimitations: profile?.physical_limitations || '',
        weeklyCommitment: profile?.weekly_commitment || {},
        moaiPath: profile?.moai_path || '',
        selectedMoaiType: profile?.selected_moai_type || undefined,
        profileImage: null, // Will be handled separately
      };

      return { success: true, data: formData };
    } catch (error) {
      console.error('Error getting profile data for onboarding:', error);
      return { success: false, error: 'Failed to get profile data' };
    }
  }
}