import { supabase } from '@/lib/supabase';
import { ServiceResponse } from './types';

export interface BuddyPreferences {
  timezone?: string;
  workout_types: string[];
  commitment_level: 'low' | 'medium' | 'high';
  communication_style: 'daily' | 'weekly' | 'as-needed';
  availability_hours?: string[]; // ['morning', 'afternoon', 'evening']
  fitness_goals?: string[];
  experience_level?: 'beginner' | 'intermediate' | 'advanced';
}

export interface BuddyMatch {
  id: string;
  user_id: string;
  profile: {
    id: string;
    first_name: string;
    last_name: string;
    profile_image?: string;
    bio?: string;
  };
  compatibility_score: number;
  shared_interests: string[];
  timezone_match: boolean;
  activity_level_match: boolean;
  mutual_friends_count: number;
}

export interface BuddyRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  created_at: string;
  updated_at: string;
  sender_profile?: any;
  receiver_profile?: any;
}

export interface BuddyPair {
  id: string;
  user_id: string;
  friend_id: string;
  created_at: string;
  buddy_profile?: any;
}

export interface BuddyCheckIn {
  id: string;
  buddy_pair_id: string;
  user_id: string;
  week_start: string;
  activities_completed: number;
  goals_met: boolean;
  notes?: string;
  mood_rating?: number; // 1-5
  created_at: string;
}

export class BuddyService {
  /**
   * Find potential buddies based on user preferences
   */
  static async findPotentialMatches(preferences: BuddyPreferences): Promise<ServiceResponse<BuddyMatch[]>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Get user's profile for matching
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!userProfile) {
        return { success: false, error: 'User profile not found' };
      }

      // Find potential matches based on preferences
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          profile_image,
          bio,
          timezone,
          fitness_goals,
          experience_level,
          preferred_workout_types,
          communication_preferences
        `)
        .neq('id', user.id) // Exclude current user
        .not('id', 'in', `(
          SELECT CASE 
            WHEN sender_id = '${user.id}' THEN receiver_id 
            ELSE sender_id 
          END 
          FROM friend_requests 
          WHERE (sender_id = '${user.id}' OR receiver_id = '${user.id}')
          AND status IN ('pending', 'accepted')
        )`) // Exclude users with existing requests or active buddies
        .limit(20);

      if (error) {
        console.error('Error finding potential matches:', error);
        return { success: false, error: error.message };
      }

      // Calculate compatibility scores
      const matches: BuddyMatch[] = (profiles || []).map(profile => {
        const compatibilityScore = this.calculateCompatibilityScore(
          userProfile,
          profile,
          preferences
        );

        const sharedInterests = this.findSharedInterests(
          userProfile.preferred_workout_types || [],
          profile.preferred_workout_types || []
        );

        const timezoneMatch = userProfile.timezone === profile.timezone;

        return {
          id: profile.id,
          user_id: profile.id,
          profile: {
            id: profile.id,
            first_name: profile.first_name,
            last_name: profile.last_name,
            profile_image: profile.profile_image,
            bio: profile.bio,
          },
          compatibility_score: compatibilityScore,
          shared_interests: sharedInterests,
          timezone_match: timezoneMatch,
          activity_level_match: this.checkActivityLevelMatch(userProfile, profile),
          mutual_friends_count: 0, // TODO: Calculate mutual friends
        };
      });

      // Sort by compatibility score
      matches.sort((a, b) => b.compatibility_score - a.compatibility_score);

      return { success: true, data: matches };
    } catch (error) {
      console.error('Error finding potential matches:', error);
      return { success: false, error: 'Failed to find potential matches' };
    }
  }

  /**
   * Send a buddy request
   */
  static async sendBuddyRequest(
    requesteeId: string,
    message?: string
  ): Promise<ServiceResponse<BuddyRequest>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Check if request already exists
      const { data: existingRequest } = await supabase
.from('friend_requests')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${requesteeId}),and(sender_id.eq.${requesteeId},receiver_id.eq.${user.id})`)
        .single();

      if (existingRequest) {
        return { success: false, error: 'Buddy request already exists' };
      }

      const requestData = {
        sender_id: user.id,
        receiver_id: requesteeId,
        status: 'pending' as const,
        message,
      };

      const { data, error } = await supabase
.from('friend_requests')
        .insert(requestData)
        .select(`
          *,
          sender_profile:profiles!sender_id(*),
          receiver_profile:profiles!receiver_id(*)
        `)
        .single();

      if (error) {
        console.error('Error sending buddy request:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error sending buddy request:', error);
      return { success: false, error: 'Failed to send buddy request' };
    }
  }

  /**
   * Get pending buddy requests for the current user
   */
  static async getPendingRequests(): Promise<ServiceResponse<BuddyRequest[]>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data, error } = await supabase
.from('friend_requests')
        .select(`
          *,
          sender_profile:profiles!sender_id(*),
          receiver_profile:profiles!receiver_id(*)
        `)
        .eq('receiver_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting pending requests:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error getting pending requests:', error);
      return { success: false, error: 'Failed to get pending requests' };
    }
  }

  /**
   * Respond to a buddy request
   */
  static async respondToBuddyRequest(
    requestId: string,
    accept: boolean
  ): Promise<ServiceResponse<BuddyRequest | BuddyPair>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const status = accept ? 'accepted' : 'declined';

      const { data: request, error: updateError } = await supabase
.from('friend_requests')
        .update({ status })
        .eq('id', requestId)
        .eq('receiver_id', user.id)
        .select('*')
        .single();

      if (updateError) {
        console.error('Error updating buddy request:', updateError);
        return { success: false, error: updateError.message };
      }

      if (accept && request) {
        // Create buddy pair
        const { data: buddyPair, error: pairError } = await supabase
          .from('friendships')
          .insert({
            user_id: request.sender_id,
            friend_id: request.receiver_id,
          })
          .select('*')
          .single();

        if (pairError) {
          console.error('Error creating buddy pair:', pairError);
          return { success: false, error: pairError.message };
        }

        return { success: true, data: buddyPair };
      }

      return { success: true, data: request };
    } catch (error) {
      console.error('Error responding to buddy request:', error);
      return { success: false, error: 'Failed to respond to buddy request' };
    }
  }

  /**
   * Get current buddy for the user
   */
  static async getCurrentBuddy(): Promise<ServiceResponse<BuddyPair | null>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data, error } = await supabase
        .from('friendships')
        .select(`
          *,
          buddy_profile:profiles!friend_id(*)
        `)
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found is okay
        console.error('Error getting current buddy:', error);
        return { success: false, error: error.message };
      }

      // Adjust buddy_profile to point to the other user
      if (data) {
        const isMainUser = data.user_id === user.id;
        const buddyId = isMainUser ? data.friend_id : data.user_id;
        
        const { data: buddyProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', buddyId)
          .single();

        data.buddy_profile = buddyProfile;
      }

      return { success: true, data: data || null };
    } catch (error) {
      console.error('Error getting current buddy:', error);
      return { success: false, error: 'Failed to get current buddy' };
    }
  }

  /**
   * Submit weekly check-in
   */
  static async submitCheckIn(
    buddyPairId: string,
    checkInData: Omit<BuddyCheckIn, 'id' | 'user_id' | 'created_at'>
  ): Promise<ServiceResponse<BuddyCheckIn>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data, error } = await supabase
        .from('buddy_checkins')
        .insert({
          ...checkInData,
          buddy_pair_id: buddyPairId,
          user_id: user.id,
        })
        .select('*')
        .single();

      if (error) {
        console.error('Error submitting check-in:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error submitting check-in:', error);
      return { success: false, error: 'Failed to submit check-in' };
    }
  }

  /**
   * Get buddy check-ins for tracking progress
   */
  static async getBuddyCheckIns(
    buddyPairId: string,
    limit = 10
  ): Promise<ServiceResponse<BuddyCheckIn[]>> {
    try {
      const { data, error } = await supabase
        .from('buddy_checkins')
        .select('*')
        .eq('buddy_pair_id', buddyPairId)
        .order('week_start', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error getting buddy check-ins:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error getting buddy check-ins:', error);
      return { success: false, error: 'Failed to get buddy check-ins' };
    }
  }

  /**
   * Calculate compatibility score between two users
   */
  private static calculateCompatibilityScore(
    user1: any,
    user2: any,
    preferences: BuddyPreferences
  ): number {
    let score = 0;
    let factors = 0;

    // Timezone match (25% weight)
    if (user1.timezone === user2.timezone) {
      score += 0.25;
    }
    factors += 0.25;

    // Workout types match (30% weight)
    const sharedWorkouts = this.findSharedInterests(
      user1.preferred_workout_types || [],
      user2.preferred_workout_types || []
    );
    const workoutMatch = sharedWorkouts.length / Math.max(
      user1.preferred_workout_types?.length || 1,
      user2.preferred_workout_types?.length || 1
    );
    score += workoutMatch * 0.3;
    factors += 0.3;

    // Experience level match (20% weight)
    if (user1.experience_level === user2.experience_level) {
      score += 0.2;
    } else if (
      (user1.experience_level === 'beginner' && user2.experience_level === 'intermediate') ||
      (user1.experience_level === 'intermediate' && user2.experience_level === 'advanced') ||
      (user1.experience_level === 'intermediate' && user2.experience_level === 'beginner') ||
      (user1.experience_level === 'advanced' && user2.experience_level === 'intermediate')
    ) {
      score += 0.1; // Partial match for adjacent levels
    }
    factors += 0.2;

    // Communication preferences (15% weight)
    if (user1.communication_preferences === user2.communication_preferences) {
      score += 0.15;
    }
    factors += 0.15;

    // Fitness goals match (10% weight)
    const sharedGoals = this.findSharedInterests(
      user1.fitness_goals || [],
      user2.fitness_goals || []
    );
    const goalMatch = sharedGoals.length / Math.max(
      user1.fitness_goals?.length || 1,
      user2.fitness_goals?.length || 1
    );
    score += goalMatch * 0.1;
    factors += 0.1;

    return Math.min(score / factors, 1); // Normalize to 0-1
  }

  /**
   * Find shared interests between two arrays
   */
  private static findSharedInterests(interests1: string[], interests2: string[]): string[] {
    return interests1.filter(interest => 
      interests2.some(other => 
        other.toLowerCase() === interest.toLowerCase()
      )
    );
  }

  /**
   * Check if activity levels match
   */
  private static checkActivityLevelMatch(user1: any, user2: any): boolean {
    // This would be based on activity logs and frequency
    // For now, just return a random match
    return Math.random() > 0.3;
  }
}