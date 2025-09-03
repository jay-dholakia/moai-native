import { useMachine } from '@xstate/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { 
  buddyMatchingMachine, 
  buddyMatchSelectors,
  BuddyPreferences,
  PotentialBuddy 
} from '@/lib/machines/buddy-matching-machine';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

// Service functions (would be in a separate service file)
const buddyService = {
  async getCurrentBuddy(userId: string) {
    const { data, error } = await supabase
      .from('buddy_assignments')
      .select(`
        *,
        buddy:buddy_id(
          id,
          first_name,
          last_name,
          profile_image
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();
    
    if (error) throw error;
    return data;
  },

  async getBuddyRequests(userId: string) {
    const { data, error } = await supabase
      .from('buddy_requests')
      .select(`
        *,
        sender:sender_id(
          id,
          first_name,
          last_name,
          profile_image
        )
      `)
      .eq('receiver_id', userId)
      .eq('status', 'pending');
    
    if (error) throw error;
    return data;
  },

  async sendBuddyRequest(senderId: string, receiverId: string) {
    const { data, error } = await supabase
      .from('buddy_requests')
      .insert({
        sender_id: senderId,
        receiver_id: receiverId,
        status: 'pending',
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async acceptBuddyRequest(requestId: string) {
    const { data: request, error: requestError } = await supabase
      .from('buddy_requests')
      .update({ status: 'accepted' })
      .eq('id', requestId)
      .select()
      .single();
    
    if (requestError) throw requestError;

    // Create buddy assignment
    const { data, error } = await supabase
      .from('buddy_assignments')
      .insert([
        {
          user_id: request.sender_id,
          buddy_id: request.receiver_id,
          status: 'active',
        },
        {
          user_id: request.receiver_id,
          buddy_id: request.sender_id,
          status: 'active',
        }
      ]);
    
    if (error) throw error;
    return data;
  },
};

export function useBuddySystem() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [matchState, matchSend] = useMachine(buddyMatchingMachine);

  // React Query for buddy data
  const currentBuddy = useQuery({
    queryKey: ['buddy', 'current', user?.id],
    queryFn: () => buddyService.getCurrentBuddy(user!.id),
    enabled: !!user,
  });

  const buddyRequests = useQuery({
    queryKey: ['buddy', 'requests', user?.id],
    queryFn: () => buddyService.getBuddyRequests(user!.id),
    enabled: !!user,
  });

  // Mutations
  const sendRequest = useMutation({
    mutationFn: ({ receiverId }: { receiverId: string }) =>
      buddyService.sendBuddyRequest(user!.id, receiverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buddy'] });
    },
  });

  const acceptRequest = useMutation({
    mutationFn: (requestId: string) =>
      buddyService.acceptBuddyRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buddy'] });
    },
  });

  // Combined actions that use both XState and React Query
  const startBuddySearch = useCallback((preferences: BuddyPreferences) => {
    matchSend({ type: 'SET_PREFERENCES', preferences });
    matchSend({ type: 'SEARCH_BUDDIES' });
  }, [matchSend]);

  const selectAndRequestBuddy = useCallback(async (buddy: PotentialBuddy) => {
    matchSend({ type: 'SELECT_BUDDY', buddy });
    matchSend({ type: 'SEND_REQUEST' });
    
    // When the state machine confirms, send actual request
    if (matchState.matches('sendingRequest')) {
      await sendRequest.mutateAsync({ receiverId: buddy.profile.id });
    }
  }, [matchSend, matchState, sendRequest]);

  return {
    // Current buddy data
    currentBuddy: currentBuddy.data,
    hasBuddy: !!currentBuddy.data,
    buddyLoading: currentBuddy.isLoading,

    // Buddy requests
    requests: buddyRequests.data || [],
    requestCount: buddyRequests.data?.length || 0,

    // Matching state
    matchingState: matchState.value,
    isSearching: matchState.matches('searching'),
    isBrowsing: matchState.matches('browsing'),
    isMatched: matchState.matches('matched'),
    potentialMatches: matchState.context.potentialMatches,
    selectedBuddy: matchState.context.selectedBuddy,
    
    // Selectors
    hasMatches: buddyMatchSelectors.hasMatches(matchState.context),
    topMatch: buddyMatchSelectors.topMatch(matchState.context),
    matchCount: buddyMatchSelectors.matchCount(matchState.context),

    // Actions
    startBuddySearch,
    selectAndRequestBuddy,
    acceptBuddyRequest: acceptRequest.mutate,
    cancelSearch: () => matchSend({ type: 'RESET' }),
  };
}

// Hook for buddy chat integration
export function useBuddyChat(buddyId?: string) {
  const { user } = useAuth();
  
  const buddyChannel = useQuery({
    queryKey: ['buddy', 'channel', user?.id, buddyId],
    queryFn: async () => {
      if (!buddyId || !user) return null;
      
      // Find or create buddy chat channel
      const { data, error } = await supabase
        .from('buddy_chat_channels')
        .select('*')
        .contains('buddy_group', [user.id, buddyId])
        .single();
      
      if (error && error.code === 'PGRST116') {
        // Channel doesn't exist, create it
        const { data: newChannel, error: createError } = await supabase
          .from('buddy_chat_channels')
          .insert({
            buddy_group: [user.id, buddyId],
            channel_name: 'Buddy Chat',
          })
          .select()
          .single();
        
        if (createError) throw createError;
        return newChannel;
      }
      
      if (error) throw error;
      return data;
    },
    enabled: !!buddyId && !!user,
  });

  return {
    channel: buddyChannel.data,
    channelId: buddyChannel.data?.id,
    isLoading: buddyChannel.isLoading,
  };
}