import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import EventService, { 
  Event, 
  EventParticipant, 
  Challenge, 
  ChallengeParticipant,
  ChallengeProgress,
  EventStats,
  ChallengeStats
} from '@/services/event-service';
import { ServiceResponse } from '@/services/types';

// Query keys
export const eventKeys = {
  all: ['events'] as const,
  publicEvents: (filters?: any) => [...eventKeys.all, 'public', filters] as const,
  userEvents: (userId?: string) => [...eventKeys.all, 'user', userId] as const,
  registeredEvents: (userId?: string) => [...eventKeys.all, 'registered', userId] as const,
  eventParticipants: (eventId: string) => [...eventKeys.all, 'participants', eventId] as const,
  eventStats: (organizerId?: string) => [...eventKeys.all, 'stats', organizerId] as const,
};

export const challengeKeys = {
  all: ['challenges'] as const,
  publicChallenges: (filters?: any) => [...challengeKeys.all, 'public', filters] as const,
  userChallenges: (userId?: string) => [...challengeKeys.all, 'user', userId] as const,
  challengeLeaderboard: (challengeId: string) => [...challengeKeys.all, 'leaderboard', challengeId] as const,
  challengeStats: (creatorId?: string) => [...challengeKeys.all, 'stats', creatorId] as const,
};

// Event Hooks

/**
 * Hook to get public events with filtering
 */
export function usePublicEvents(filters?: {
  category?: string;
  eventType?: string;
  startDate?: string;
  endDate?: string;
  locationType?: string;
  searchQuery?: string;
  featured?: boolean;
}) {
  return useQuery({
    queryKey: eventKeys.publicEvents(filters),
    queryFn: () => EventService.getPublicEvents(filters),
    staleTime: 300000, // 5 minutes
    gcTime: 600000, // 10 minutes
  });
}

/**
 * Hook to get user's organized events
 */
export function useUserEvents() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: eventKeys.userEvents(user?.id),
    queryFn: () => user ? EventService.getUserEvents(user.id) : Promise.resolve({ success: false, error: 'No user' } as ServiceResponse<Event[]>),
    enabled: !!user,
    staleTime: 300000, // 5 minutes
    gcTime: 600000, // 10 minutes
  });
}

/**
 * Hook to get user's registered events
 */
export function useRegisteredEvents() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: eventKeys.registeredEvents(user?.id),
    queryFn: () => user ? EventService.getUserRegisteredEvents(user.id) : Promise.resolve({ success: false, error: 'No user' } as ServiceResponse<Event[]>),
    enabled: !!user,
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes
  });
}

/**
 * Hook to get event participants
 */
export function useEventParticipants(eventId: string) {
  return useQuery({
    queryKey: eventKeys.eventParticipants(eventId),
    queryFn: () => EventService.getEventParticipants(eventId),
    enabled: !!eventId,
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes
  });
}

/**
 * Hook to get event statistics
 */
export function useEventStats(organizerId?: string) {
  return useQuery({
    queryKey: eventKeys.eventStats(organizerId),
    queryFn: () => EventService.getEventStats(organizerId),
    staleTime: 300000, // 5 minutes
    gcTime: 600000, // 10 minutes
  });
}

/**
 * Hook to create an event
 */
export function useCreateEvent() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (eventData: Omit<Event, 'id' | 'organizer_id' | 'current_participants' | 'created_at' | 'updated_at'>) => {
      if (!user) throw new Error('No user authenticated');
      return EventService.createEvent(user.id, eventData);
    },
    onSuccess: () => {
      // Invalidate related queries
      if (user) {
        queryClient.invalidateQueries({ queryKey: eventKeys.userEvents(user.id) });
        queryClient.invalidateQueries({ queryKey: eventKeys.publicEvents() });
        queryClient.invalidateQueries({ queryKey: eventKeys.eventStats(user.id) });
      }
    },
  });
}

/**
 * Hook to register for an event
 */
export function useRegisterForEvent() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (eventId: string) => {
      if (!user) throw new Error('No user authenticated');
      return EventService.registerForEvent(eventId, user.id);
    },
    onSuccess: (data, eventId) => {
      // Invalidate related queries
      if (user) {
        queryClient.invalidateQueries({ queryKey: eventKeys.registeredEvents(user.id) });
        queryClient.invalidateQueries({ queryKey: eventKeys.eventParticipants(eventId) });
        queryClient.invalidateQueries({ queryKey: eventKeys.publicEvents() });
      }
    },
  });
}

/**
 * Hook to cancel event registration
 */
export function useCancelEventRegistration() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (eventId: string) => {
      if (!user) throw new Error('No user authenticated');
      return EventService.cancelEventRegistration(eventId, user.id);
    },
    onSuccess: (data, eventId) => {
      // Invalidate related queries
      if (user) {
        queryClient.invalidateQueries({ queryKey: eventKeys.registeredEvents(user.id) });
        queryClient.invalidateQueries({ queryKey: eventKeys.eventParticipants(eventId) });
        queryClient.invalidateQueries({ queryKey: eventKeys.publicEvents() });
      }
    },
  });
}

/**
 * Hook to mark event attendance
 */
export function useMarkAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { eventId: string; userId: string; attended: boolean }) => {
      return EventService.markAttendance(params.eventId, params.userId, params.attended);
    },
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: eventKeys.eventParticipants(variables.eventId) });
    },
  });
}

// Challenge Hooks

/**
 * Hook to get public challenges with filtering
 */
export function usePublicChallenges(filters?: {
  category?: string;
  challengeType?: string;
  status?: string;
  searchQuery?: string;
  featured?: boolean;
}) {
  return useQuery({
    queryKey: challengeKeys.publicChallenges(filters),
    queryFn: () => EventService.getPublicChallenges(filters),
    staleTime: 300000, // 5 minutes
    gcTime: 600000, // 10 minutes
  });
}

/**
 * Hook to get challenge leaderboard
 */
export function useChallengeLeaderboard(challengeId: string) {
  return useQuery({
    queryKey: challengeKeys.challengeLeaderboard(challengeId),
    queryFn: () => EventService.getChallengeLeaderboard(challengeId),
    enabled: !!challengeId,
    staleTime: 30000, // 30 seconds (more frequent updates for leaderboards)
    gcTime: 300000, // 5 minutes
  });
}

/**
 * Hook to get challenge statistics
 */
export function useChallengeStats(creatorId?: string) {
  return useQuery({
    queryKey: challengeKeys.challengeStats(creatorId),
    queryFn: () => EventService.getChallengeStats(creatorId),
    staleTime: 300000, // 5 minutes
    gcTime: 600000, // 10 minutes
  });
}

/**
 * Hook to create a challenge
 */
export function useCreateChallenge() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (challengeData: Omit<Challenge, 'id' | 'creator_id' | 'current_participants' | 'status' | 'created_at' | 'updated_at'>) => {
      if (!user) throw new Error('No user authenticated');
      return EventService.createChallenge(user.id, challengeData);
    },
    onSuccess: () => {
      // Invalidate related queries
      if (user) {
        queryClient.invalidateQueries({ queryKey: challengeKeys.publicChallenges() });
        queryClient.invalidateQueries({ queryKey: challengeKeys.challengeStats(user.id) });
      }
    },
  });
}

/**
 * Hook to join a challenge
 */
export function useJoinChallenge() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: { challengeId: string; teamName?: string }) => {
      if (!user) throw new Error('No user authenticated');
      return EventService.joinChallenge(params.challengeId, user.id, params.teamName);
    },
    onSuccess: (data, variables) => {
      // Invalidate related queries
      if (user) {
        queryClient.invalidateQueries({ queryKey: challengeKeys.publicChallenges() });
        queryClient.invalidateQueries({ queryKey: challengeKeys.challengeLeaderboard(variables.challengeId) });
      }
    },
  });
}

/**
 * Hook to update challenge progress
 */
export function useUpdateChallengeProgress() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: {
      challengeId: string;
      progressValue: number;
      activityType?: string;
      notes?: string;
    }) => {
      if (!user) throw new Error('No user authenticated');
      return EventService.updateChallengeProgress(
        params.challengeId,
        user.id,
        params.progressValue,
        params.activityType,
        params.notes
      );
    },
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: challengeKeys.challengeLeaderboard(variables.challengeId) });
      queryClient.invalidateQueries({ queryKey: challengeKeys.publicChallenges() });
    },
  });
}

// Combined Hooks

/**
 * Hook for event discovery with search and filtering
 */
export function useEventDiscovery() {
  const { data: eventsResponse, isLoading, error, refetch } = usePublicEvents();
  
  const searchEvents = (query: string, filters?: {
    category?: string;
    eventType?: string;
    locationType?: string;
  }) => {
    return refetch();
  };

  return {
    events: eventsResponse?.success ? eventsResponse.data : [],
    isLoading,
    error,
    searchEvents,
  };
}

/**
 * Hook for challenge discovery with search and filtering
 */
export function useChallengeDiscovery() {
  const { data: challengesResponse, isLoading, error, refetch } = usePublicChallenges();
  
  const searchChallenges = (query: string, filters?: {
    category?: string;
    challengeType?: string;
    status?: string;
  }) => {
    return refetch();
  };

  return {
    challenges: challengesResponse?.success ? challengesResponse.data : [],
    isLoading,
    error,
    searchChallenges,
  };
}

/**
 * Hook to get user's active events and challenges
 */
export function useUserActivity() {
  const { data: registeredEventsResponse } = useRegisteredEvents();
  const { data: userEventsResponse } = useUserEvents();
  
  const registeredEvents = registeredEventsResponse?.success ? registeredEventsResponse.data : [];
  const organizedEvents = userEventsResponse?.success ? userEventsResponse.data : [];
  
  const upcomingEvents = [...registeredEvents, ...organizedEvents]
    .filter(event => new Date(event.start_date) > new Date())
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
    .slice(0, 5);

  return {
    upcomingEvents,
    registeredCount: registeredEvents.length,
    organizedCount: organizedEvents.length,
    hasActivity: upcomingEvents.length > 0,
  };
}

/**
 * Hook for event management dashboard
 */
export function useEventDashboard() {
  const { user } = useAuth();
  const { data: eventsResponse, isLoading: eventsLoading } = useUserEvents();
  const { data: statsResponse, isLoading: statsLoading } = useEventStats(user?.id);
  
  const events = eventsResponse?.success ? eventsResponse.data : [];
  const stats = statsResponse?.success ? statsResponse.data : null;
  
  const now = new Date();
  const upcomingEvents = events.filter((event: Event) => new Date(event.start_date) > now);
  const pastEvents = events.filter((event: Event) => new Date(event.start_date) <= now);
  
  return {
    events,
    upcomingEvents,
    pastEvents,
    stats,
    isLoading: eventsLoading || statsLoading,
  };
}

/**
 * Hook for challenge management dashboard
 */
export function useChallengeDashboard() {
  const { user } = useAuth();
  const { data: challengesResponse, isLoading: challengesLoading } = usePublicChallenges();
  const { data: statsResponse, isLoading: statsLoading } = useChallengeStats(user?.id);
  
  const allChallenges = challengesResponse?.success ? challengesResponse.data : [];
  const userChallenges = allChallenges.filter(challenge => challenge.creator_id === user?.id);
  const stats = statsResponse?.success ? statsResponse.data : null;
  
  const activeChallenges = userChallenges.filter(challenge => challenge.status === 'active');
  const upcomingChallenges = userChallenges.filter(challenge => challenge.status === 'upcoming');
  const completedChallenges = userChallenges.filter(challenge => challenge.status === 'completed');
  
  return {
    userChallenges,
    activeChallenges,
    upcomingChallenges,
    completedChallenges,
    stats,
    isLoading: challengesLoading || statsLoading,
  };
}

/**
 * Hook to check user's participation status in events/challenges
 */
export function useParticipationStatus(eventId?: string, challengeId?: string) {
  const { user } = useAuth();
  const { data: registeredEvents } = useRegisteredEvents();
  const { data: publicChallenges } = usePublicChallenges();
  
  const isRegisteredForEvent = eventId && registeredEvents?.success 
    ? registeredEvents.data.some((event: Event) => event.id === eventId)
    : false;
    
  const isJoinedChallenge = challengeId && publicChallenges?.success
    ? publicChallenges.data.some(challenge => 
        challenge.id === challengeId && 
        challenge.current_participants > 0 // This would need a more specific check
      )
    : false;
  
  return {
    isRegisteredForEvent,
    isJoinedChallenge,
    canRegister: !!user && eventId && !isRegisteredForEvent,
    canJoin: !!user && challengeId && !isJoinedChallenge,
  };
}