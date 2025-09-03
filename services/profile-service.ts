import { supabase } from '@/lib/supabase';
import { Profile, UpdateProfileData, ServiceResponse } from './types';
import { withServiceWrapper, getValidSessionForRequest } from './base-service';

// Create a profile if it doesn't exist
const createProfileIfNotExists = async (userId: string): Promise<Profile | null> => {
  try {
    console.log("Creating profile for user:", userId);
    
    // Get user data from auth
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("Failed to get user data:", userError);
      return null;
    }

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (existingProfile) {
      console.log("Profile already exists");
      return existingProfile;
    }

    // Create new profile with basic data from auth
    const profileData = {
      id: userId,
      email: user.email,
      first_name: user.user_metadata?.first_name || null,
      last_name: user.user_metadata?.last_name || null,
      full_name: user.user_metadata?.full_name || 
                 `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim() || null,
      profile_image: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
      is_active: true,
      app_notifications_enabled: true,
      email_verified_at: user.email_confirmed_at || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert([profileData])
      .select()
      .single();

    if (insertError) {
      console.error("Failed to create profile:", insertError);
      return null;
    }

    console.log("Profile created successfully:", newProfile);
    return newProfile;
  } catch (error) {
    console.error("Error in createProfileIfNotExists:", error);
    return null;
  }
};

// Fetch current user's profile
export const fetchProfile = async (): Promise<ServiceResponse<Profile>> => {
  return withServiceWrapper(async () => {
    const session = await getValidSessionForRequest();
    if (!session?.user?.id) {
      throw new Error('No authenticated user found');
    }

    // Try to fetch existing profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (error && error.code === 'PGRST116') {
      // Profile doesn't exist, create it
      console.log("Profile not found, creating new one");
      const newProfile = await createProfileIfNotExists(session.user.id);
      if (!newProfile) {
        throw new Error('Failed to create profile');
      }
      return newProfile;
    }

    if (error) {
      throw error;
    }

    return profile;
  }, 'Fetch profile');
};

// Fetch profile by ID
export const fetchProfileById = async (userId: string): Promise<ServiceResponse<Profile>> => {
  return withServiceWrapper(async () => {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return profile;
  }, 'Fetch profile by ID');
};

// Update user profile
export const updateProfile = async (
  userId: string, 
  updates: UpdateProfileData
): Promise<ServiceResponse<Profile>> => {
  return withServiceWrapper(async () => {
    // Add updated_at timestamp
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return updatedProfile;
  }, 'Update profile', true, 'Profile updated successfully');
};

// Update profile image
export const updateProfileImage = async (
  userId: string, 
  imageUrl: string
): Promise<ServiceResponse<Profile>> => {
  return withServiceWrapper(async () => {
    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update({ 
        profile_image: imageUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return updatedProfile;
  }, 'Update profile image', true, 'Profile image updated successfully');
};

// Check if username is available
export const checkUsernameAvailability = async (
  username: string, 
  currentUserId?: string
): Promise<ServiceResponse<boolean>> => {
  return withServiceWrapper(async () => {
    let query = supabase
      .from('profiles')
      .select('id')
      .eq('username', username);

    // Exclude current user if updating their own username
    if (currentUserId) {
      query = query.neq('id', currentUserId);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Username is available if no profiles found
    return data.length === 0;
  }, 'Check username availability');
};

// Search profiles by name or username
export const searchProfiles = async (
  searchTerm: string, 
  limit: number = 20
): Promise<ServiceResponse<Profile[]>> => {
  return withServiceWrapper(async () => {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,username.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`)
      .eq('is_active', true)
      .limit(limit)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return profiles || [];
  }, 'Search profiles');
};

// Get profiles for multiple user IDs
export const fetchProfilesByIds = async (userIds: string[]): Promise<ServiceResponse<Profile[]>> => {
  return withServiceWrapper(async () => {
    if (userIds.length === 0) return [];

    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .in('id', userIds);

    if (error) throw error;
    return profiles || [];
  }, 'Fetch profiles by IDs');
};

// Delete user profile (soft delete by setting is_active to false)
export const deleteProfile = async (userId: string): Promise<ServiceResponse<boolean>> => {
  return withServiceWrapper(async () => {
    const { error } = await supabase
      .from('profiles')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) throw error;
    return true;
  }, 'Delete profile', true, 'Profile deleted successfully');
};

// Update user preferences/settings
export const updateProfileSettings = async (
  userId: string,
  settings: Profile['settings']
): Promise<ServiceResponse<Profile>> => {
  return withServiceWrapper(async () => {
    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update({ 
        settings,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return updatedProfile;
  }, 'Update profile settings', true, 'Settings updated successfully');
};

// Get user activity statistics
export const fetchProfileStats = async (userId: string): Promise<ServiceResponse<any>> => {
  return withServiceWrapper(async () => {
    // This would typically fetch from a view or run aggregated queries
    // For now, return basic stats structure
    const stats = {
      totalActivities: 0,
      totalMoais: 0,
      currentStreak: 0,
      longestStreak: 0
    };

    // You can implement actual stats queries here
    return stats;
  }, 'Fetch profile stats');
};