import { supabase } from '@/lib/supabase';
import { ServiceResponse } from './types';

export interface Event {
  id: string;
  organizer_id: string;
  title: string;
  description: string;
  event_type: 'workout_session' | 'challenge' | 'competition' | 'social' | 'educational';
  category: 'fitness' | 'nutrition' | 'wellness' | 'community' | 'competition';
  start_date: string;
  end_date?: string;
  duration_minutes?: number;
  location_type: 'virtual' | 'in_person' | 'hybrid';
  location_details?: string;
  max_participants?: number;
  current_participants: number;
  is_public: boolean;
  is_featured: boolean;
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  image_url?: string;
  meeting_link?: string;
  price?: number;
  requirements?: string[];
  created_at: string;
  updated_at: string;
  organizer_profile?: {
    id: string;
    first_name: string;
    last_name: string;
    username: string;
    avatar_url?: string;
  };
}

export interface EventParticipant {
  id: string;
  event_id: string;
  user_id: string;
  status: 'registered' | 'confirmed' | 'attended' | 'no_show' | 'cancelled';
  registered_at: string;
  attended_at?: string;
  feedback_rating?: number;
  feedback_text?: string;
  user_profile?: {
    id: string;
    first_name: string;
    last_name: string;
    username: string;
    avatar_url?: string;
  };
}

export interface Challenge {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  challenge_type: 'individual' | 'team' | 'group';
  category: 'steps' | 'workouts' | 'duration' | 'distance' | 'calories' | 'custom';
  goal_type: 'target' | 'leaderboard' | 'completion';
  goal_value?: number;
  goal_unit?: string;
  start_date: string;
  end_date: string;
  is_public: boolean;
  is_featured: boolean;
  max_participants?: number;
  current_participants: number;
  entry_fee?: number;
  prize_pool?: number;
  prizes?: {
    first?: string;
    second?: string;
    third?: string;
    participation?: string;
  };
  rules: string[];
  image_url?: string;
  status: 'draft' | 'upcoming' | 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  creator_profile?: {
    id: string;
    first_name: string;
    last_name: string;
    username: string;
    avatar_url?: string;
  };
}

export interface ChallengeParticipant {
  id: string;
  challenge_id: string;
  user_id: string;
  team_name?: string;
  current_progress: number;
  final_score?: number;
  rank?: number;
  status: 'active' | 'completed' | 'dropped_out';
  joined_at: string;
  last_activity: string;
  user_profile?: {
    id: string;
    first_name: string;
    last_name: string;
    username: string;
    avatar_url?: string;
  };
}

export interface ChallengeProgress {
  id: string;
  challenge_id: string;
  participant_id: string;
  activity_date: string;
  progress_value: number;
  activity_type?: string;
  notes?: string;
  verified: boolean;
  created_at: string;
}

export interface EventStats {
  totalEvents: number;
  upcomingEvents: number;
  completedEvents: number;
  totalParticipants: number;
  averageRating: number;
  popularCategories: Array<{ category: string; count: number }>;
}

export interface ChallengeStats {
  totalChallenges: number;
  activeChallenges: number;
  completedChallenges: number;
  totalParticipants: number;
  completionRate: number;
  popularTypes: Array<{ type: string; count: number }>;
}


export class EventService {
  /**
   * Get public events with filtering
   */
  static async getPublicEvents(filters?: {
    category?: string;
    eventType?: string;
    startDate?: string;
    endDate?: string;
    locationType?: string;
    searchQuery?: string;
    featured?: boolean;
  }): Promise<ServiceResponse<Event[]>> {
    try {
      let query = supabase
        .from('events')
        .select(`
          *,
          organizer_profile:profiles(
            id,
            first_name,
            last_name,
            username,
            avatar_url
          )
        `)
        .eq('is_public', true)
        .gte('start_date', new Date().toISOString());

      // Apply filters
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.eventType) {
        query = query.eq('event_type', filters.eventType);
      }
      if (filters?.startDate) {
        query = query.gte('start_date', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('start_date', filters.endDate);
      }
      if (filters?.locationType) {
        query = query.eq('location_type', filters.locationType);
      }
      if (filters?.featured) {
        query = query.eq('is_featured', true);
      }
      if (filters?.searchQuery) {
        query = query.or(`title.ilike.%${filters.searchQuery}%, description.ilike.%${filters.searchQuery}%`);
      }

      const { data, error } = await query
        .order('is_featured', { ascending: false })
        .order('start_date', { ascending: true });

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching public events:', error);
      return { success: false, error: 'Failed to fetch events' };
    }
  }

  /**
   * Get user's organized events
   */
  static async getUserEvents(userId: string): Promise<ServiceResponse<Event[]>> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          organizer_profile:profiles(
            id,
            first_name,
            last_name,
            username,
            avatar_url
          )
        `)
        .eq('organizer_id', userId)
        .order('start_date', { ascending: true });

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching user events:', error);
      return { success: false, error: 'Failed to fetch user events' };
    }
  }

  /**
   * Get user's registered events
   */
  static async getUserRegisteredEvents(userId: string): Promise<ServiceResponse<Event[]>> {
    try {
      const { data, error } = await supabase
        .from('event_participants')
        .select(`
          event:events(
            *,
            organizer_profile:profiles(
              id,
              first_name,
              last_name,
              username,
              avatar_url
            )
          )
        `)
        .eq('user_id', userId)
        .in('status', ['registered', 'confirmed'])
        .order('registered_at', { ascending: false });

      if (error) throw error;

      const events = (data?.map(item => item.event).filter(Boolean) as unknown as Event[]) || [];
      return { success: true, data: events };
    } catch (error) {
      console.error('Error fetching registered events:', error);
      return { success: false, error: 'Failed to fetch registered events' };
    }
  }

  /**
   * Create a new event
   */
  static async createEvent(
    organizerId: string,
    eventData: Omit<Event, 'id' | 'organizer_id' | 'current_participants' | 'created_at' | 'updated_at'>
  ): Promise<ServiceResponse<Event>> {
    try {
      const { data, error } = await supabase
        .from('events')
        .insert({
          ...eventData,
          organizer_id: organizerId,
          current_participants: 0,
        })
        .select(`
          *,
          organizer_profile:profiles(
            id,
            first_name,
            last_name,
            username,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error creating event:', error);
      return { success: false, error: 'Failed to create event' };
    }
  }

  /**
   * Register for an event
   */
  static async registerForEvent(
    eventId: string,
    userId: string
  ): Promise<ServiceResponse<EventParticipant>> {
    try {
      // Check if already registered
      const { data: existing } = await supabase
        .from('event_participants')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .single();

      if (existing) {
        return { success: false, error: 'Already registered for this event' };
      }

      // Check event capacity
      const { data: event } = await supabase
        .from('events')
        .select('max_participants, current_participants')
        .eq('id', eventId)
        .single();

      if (event?.max_participants && event.current_participants >= event.max_participants) {
        return { success: false, error: 'Event is full' };
      }

      // Register participant
      const { data, error } = await supabase
        .from('event_participants')
        .insert({
          event_id: eventId,
          user_id: userId,
          status: 'registered',
        })
        .select(`
          *,
          user_profile:profiles(
            id,
            first_name,
            last_name,
            username,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      // Update event participant count
      await supabase
        .from('events')
        .update({
          current_participants: (event?.current_participants || 0) + 1,
        })
        .eq('id', eventId);

      return { success: true, data };
    } catch (error) {
      console.error('Error registering for event:', error);
      return { success: false, error: 'Failed to register for event' };
    }
  }

  /**
   * Cancel event registration
   */
  static async cancelEventRegistration(
    eventId: string,
    userId: string
  ): Promise<ServiceResponse<void>> {
    try {
      const { error } = await supabase
        .from('event_participants')
        .update({ status: 'cancelled' })
        .eq('event_id', eventId)
        .eq('user_id', userId);

      if (error) throw error;

      // Update event participant count
      const { data: event } = await supabase
        .from('events')
        .select('current_participants')
        .eq('id', eventId)
        .single();

      if (event) {
        await supabase
          .from('events')
          .update({
            current_participants: Math.max(0, event.current_participants - 1),
          })
          .eq('id', eventId);
      }

      return { success: true, data: undefined };
    } catch (error) {
      console.error('Error cancelling event registration:', error);
      return { success: false, error: 'Failed to cancel registration' };
    }
  }

  /**
   * Get event participants
   */
  static async getEventParticipants(eventId: string): Promise<ServiceResponse<EventParticipant[]>> {
    try {
      const { data, error } = await supabase
        .from('event_participants')
        .select(`
          *,
          user_profile:profiles(
            id,
            first_name,
            last_name,
            username,
            avatar_url
          )
        `)
        .eq('event_id', eventId)
        .in('status', ['registered', 'confirmed', 'attended'])
        .order('registered_at', { ascending: false });

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching event participants:', error);
      return { success: false, error: 'Failed to fetch participants' };
    }
  }

  /**
   * Mark event attendance
   */
  static async markAttendance(
    eventId: string,
    userId: string,
    attended: boolean
  ): Promise<ServiceResponse<EventParticipant>> {
    try {
      const { data, error } = await supabase
        .from('event_participants')
        .update({
          status: attended ? 'attended' : 'no_show',
          attended_at: attended ? new Date().toISOString() : null,
        })
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .select(`
          *,
          user_profile:profiles(
            id,
            first_name,
            last_name,
            username,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error marking attendance:', error);
      return { success: false, error: 'Failed to mark attendance' };
    }
  }

  /**
   * Get public challenges
   */
  static async getPublicChallenges(filters?: {
    category?: string;
    challengeType?: string;
    status?: string;
    searchQuery?: string;
    featured?: boolean;
  }): Promise<ServiceResponse<Challenge[]>> {
    try {
      let query = supabase
        .from('challenges')
        .select(`
          *,
          creator_profile:profiles(
            id,
            first_name,
            last_name,
            username,
            avatar_url
          )
        `)
        .eq('is_public', true);

      // Apply filters
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.challengeType) {
        query = query.eq('challenge_type', filters.challengeType);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.featured) {
        query = query.eq('is_featured', true);
      }
      if (filters?.searchQuery) {
        query = query.or(`title.ilike.%${filters.searchQuery}%, description.ilike.%${filters.searchQuery}%`);
      }

      const { data, error } = await query
        .order('is_featured', { ascending: false })
        .order('start_date', { ascending: true });

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching public challenges:', error);
      return { success: false, error: 'Failed to fetch challenges' };
    }
  }

  /**
   * Create a new challenge
   */
  static async createChallenge(
    creatorId: string,
    challengeData: Omit<Challenge, 'id' | 'creator_id' | 'current_participants' | 'status' | 'created_at' | 'updated_at'>
  ): Promise<ServiceResponse<Challenge>> {
    try {
      const { data, error } = await supabase
        .from('challenges')
        .insert({
          ...challengeData,
          creator_id: creatorId,
          current_participants: 0,
          status: 'upcoming',
        })
        .select(`
          *,
          creator_profile:profiles(
            id,
            first_name,
            last_name,
            username,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error creating challenge:', error);
      return { success: false, error: 'Failed to create challenge' };
    }
  }

  /**
   * Join a challenge
   */
  static async joinChallenge(
    challengeId: string,
    userId: string,
    teamName?: string
  ): Promise<ServiceResponse<ChallengeParticipant>> {
    try {
      // Check if already joined
      const { data: existing } = await supabase
        .from('challenge_participants')
        .select('id')
        .eq('challenge_id', challengeId)
        .eq('user_id', userId)
        .single();

      if (existing) {
        return { success: false, error: 'Already joined this challenge' };
      }

      // Check challenge capacity
      const { data: challenge } = await supabase
        .from('challenges')
        .select('max_participants, current_participants')
        .eq('id', challengeId)
        .single();

      if (challenge?.max_participants && challenge.current_participants >= challenge.max_participants) {
        return { success: false, error: 'Challenge is full' };
      }

      // Join challenge
      const { data, error } = await supabase
        .from('challenge_participants')
        .insert({
          challenge_id: challengeId,
          user_id: userId,
          team_name: teamName,
          current_progress: 0,
          status: 'active',
          last_activity: new Date().toISOString(),
        })
        .select(`
          *,
          user_profile:profiles(
            id,
            first_name,
            last_name,
            username,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      // Update challenge participant count
      await supabase
        .from('challenges')
        .update({
          current_participants: (challenge?.current_participants || 0) + 1,
        })
        .eq('id', challengeId);

      return { success: true, data };
    } catch (error) {
      console.error('Error joining challenge:', error);
      return { success: false, error: 'Failed to join challenge' };
    }
  }

  /**
   * Update challenge progress
   */
  static async updateChallengeProgress(
    challengeId: string,
    userId: string,
    progressValue: number,
    activityType?: string,
    notes?: string
  ): Promise<ServiceResponse<ChallengeProgress>> {
    try {
      // Record progress entry
      const { data: progressEntry, error: progressError } = await supabase
        .from('challenge_progress')
        .insert({
          challenge_id: challengeId,
          participant_id: userId,
          activity_date: new Date().toISOString().split('T')[0],
          progress_value: progressValue,
          activity_type: activityType,
          notes: notes,
          verified: true, // Auto-verify for now
        })
        .select()
        .single();

      if (progressError) throw progressError;

      // Get total progress for participant
      const { data: totalProgress } = await supabase
        .from('challenge_progress')
        .select('progress_value')
        .eq('challenge_id', challengeId)
        .eq('participant_id', userId);

      const currentProgress = totalProgress?.reduce((sum, entry) => sum + entry.progress_value, 0) || 0;

      // Update participant's current progress
      await supabase
        .from('challenge_participants')
        .update({
          current_progress: currentProgress,
          last_activity: new Date().toISOString(),
        })
        .eq('challenge_id', challengeId)
        .eq('user_id', userId);

      return { success: true, data: progressEntry };
    } catch (error) {
      console.error('Error updating challenge progress:', error);
      return { success: false, error: 'Failed to update progress' };
    }
  }

  /**
   * Get challenge leaderboard
   */
  static async getChallengeLeaderboard(challengeId: string): Promise<ServiceResponse<ChallengeParticipant[]>> {
    try {
      const { data, error } = await supabase
        .from('challenge_participants')
        .select(`
          *,
          user_profile:profiles(
            id,
            first_name,
            last_name,
            username,
            avatar_url
          )
        `)
        .eq('challenge_id', challengeId)
        .order('current_progress', { ascending: false });

      if (error) throw error;

      // Add ranks
      const rankedData = data?.map((participant, index) => ({
        ...participant,
        rank: index + 1,
      })) || [];

      return { success: true, data: rankedData };
    } catch (error) {
      console.error('Error fetching challenge leaderboard:', error);
      return { success: false, error: 'Failed to fetch leaderboard' };
    }
  }

  /**
   * Get event statistics
   */
  static async getEventStats(organizerId?: string): Promise<ServiceResponse<EventStats>> {
    try {
      let eventsQuery = supabase.from('events').select('*');
      if (organizerId) {
        eventsQuery = eventsQuery.eq('organizer_id', organizerId);
      }

      const { data: events } = await eventsQuery;

      const now = new Date().toISOString();
      const totalEvents = events?.length || 0;
      const upcomingEvents = events?.filter(e => e.start_date > now).length || 0;
      const completedEvents = events?.filter(e => e.end_date && e.end_date < now).length || 0;

      // Get participant stats
      const { data: participants } = await supabase
        .from('event_participants')
        .select('*, event:events!inner(*)')
        .eq(organizerId ? 'event.organizer_id' : 'status', organizerId || 'attended');

      const totalParticipants = participants?.length || 0;

      // Get ratings
      const ratings = participants?.filter(p => p.feedback_rating).map(p => p.feedback_rating) || [];
      const averageRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 0;

      // Get popular categories
      const categoryCount: Record<string, number> = {};
      events?.forEach(event => {
        categoryCount[event.category] = (categoryCount[event.category] || 0) + 1;
      });

      const popularCategories = Object.entries(categoryCount)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count);

      const stats: EventStats = {
        totalEvents,
        upcomingEvents,
        completedEvents,
        totalParticipants,
        averageRating,
        popularCategories,
      };

      return { success: true, data: stats };
    } catch (error) {
      console.error('Error fetching event stats:', error);
      return { success: false, error: 'Failed to fetch event statistics' };
    }
  }

  /**
   * Get challenge statistics
   */
  static async getChallengeStats(creatorId?: string): Promise<ServiceResponse<ChallengeStats>> {
    try {
      let challengesQuery = supabase.from('challenges').select('*');
      if (creatorId) {
        challengesQuery = challengesQuery.eq('creator_id', creatorId);
      }

      const { data: challenges } = await challengesQuery;

      const totalChallenges = challenges?.length || 0;
      const activeChallenges = challenges?.filter(c => c.status === 'active').length || 0;
      const completedChallenges = challenges?.filter(c => c.status === 'completed').length || 0;

      // Get participant stats
      const { data: participants } = await supabase
        .from('challenge_participants')
        .select('*, challenge:challenges!inner(*)')
        .eq(creatorId ? 'challenge.creator_id' : 'status', creatorId || 'completed');

      const totalParticipants = participants?.length || 0;
      const completedParticipants = participants?.filter(p => p.status === 'completed').length || 0;
      const completionRate = totalParticipants > 0 ? (completedParticipants / totalParticipants) * 100 : 0;

      // Get popular types
      const typeCount: Record<string, number> = {};
      challenges?.forEach(challenge => {
        typeCount[challenge.challenge_type] = (typeCount[challenge.challenge_type] || 0) + 1;
      });

      const popularTypes = Object.entries(typeCount)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count);

      const stats: ChallengeStats = {
        totalChallenges,
        activeChallenges,
        completedChallenges,
        totalParticipants,
        completionRate,
        popularTypes,
      };

      return { success: true, data: stats };
    } catch (error) {
      console.error('Error fetching challenge stats:', error);
      return { success: false, error: 'Failed to fetch challenge statistics' };
    }
  }
}

export default EventService;