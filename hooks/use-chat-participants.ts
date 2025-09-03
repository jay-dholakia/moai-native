import { useQuery } from '@tanstack/react-query';
import { useMoaiMembers } from './use-moai';
import { useAuth } from './useAuth';
import { supabase } from '@/lib/supabase';

export interface ChatParticipant {
  id: string;
  first_name: string;
  last_name: string;
  username?: string;
  profile_image?: string;
  role?: 'admin' | 'member' | 'coach';
  is_online?: boolean;
}

/**
 * Hook to fetch chat participants based on channel ID and type
 */
export function useChatParticipants(channelId: string | null, channelType: 'moai' | 'dm' | 'global' | 'buddy' | 'coach') {
  const { user } = useAuth();

  // For moai chats, extract moai ID and use useMoaiMembers
  const moaiId = channelType === 'moai' && channelId?.startsWith('moai-') 
    ? channelId.replace('moai-', '') 
    : null;

  const moaiMembersQuery = useMoaiMembers(moaiId || '');

  // For buddy, coach, and DM chats, fetch participants from database
  const otherParticipantsQuery = useQuery({
    queryKey: ['chatParticipants', channelId, channelType],
    queryFn: async (): Promise<ChatParticipant[]> => {
      if (!channelId || !user?.id) return [];

      try {
        // Handle different channel types
        if (channelType === 'buddy') {
          // For buddy chats, get participants from buddy_chat_channels
          const { data: buddyChannel, error: buddyError } = await supabase
            .from('buddy_chat_channels')
            .select(`
              buddy_group,
              profiles:buddy_group (
                id,
                first_name,
                last_name,
                username,
                profile_image
              )
            `)
            .eq('channel_id', channelId)
            .single();

          if (buddyError) throw buddyError;

          if (buddyChannel?.buddy_group) {
            // Fetch profiles for buddy group members
            const { data: profiles, error: profilesError } = await supabase
              .from('profiles')
              .select('id, first_name, last_name, username, profile_image')
              .in('id', buddyChannel.buddy_group);

            if (profilesError) throw profilesError;

            return profiles?.map(profile => ({
              id: profile.id,
              first_name: profile.first_name,
              last_name: profile.last_name,
              username: profile.username,
              profile_image: profile.profile_image,
              role: 'member' as const,
              is_online: false // TODO: Implement real presence
            })) || [];
          }
        } else if (channelType === 'coach') {
          // For coach chats, check both private and group coaching chats
          let profiles: any[] = [];

          // Check private coaching chats
          const { data: privateChat } = await supabase
            .from('coach_private_chats')
            .select(`
              coach_id,
              client_id,
              coach:profiles!coach_id(id, first_name, last_name, username, profile_image),
              client:profiles!client_id(id, first_name, last_name, username, profile_image)
            `)
            .eq('channel_id', channelId)
            .single();

          if (privateChat) {
            profiles.push(
              { ...privateChat.coach, role: 'coach' },
              { ...privateChat.client, role: 'member' }
            );
          } else {
            // Check group coaching chats
            const { data: groupChat } = await supabase
              .from('moai_coaching_chats')
              .select(`
                coach_id,
                moai_id,
                coach:profiles!coach_id(id, first_name, last_name, username, profile_image)
              `)
              .eq('channel_id', channelId)
              .single();

            if (groupChat) {
              // Add coach
              profiles.push({ ...groupChat.coach, role: 'coach' });

              // Add moai members
              const { data: moaiMembers } = await supabase
                .from('moai_members')
                .select(`
                  profile:profiles!profile_id(
                    id,
                    first_name,
                    last_name,
                    username,
                    profile_image
                  )
                `)
                .eq('moai_id', groupChat.moai_id)
                .eq('is_active', true);

              if (moaiMembers) {
                profiles.push(...moaiMembers.map(member => ({
                  ...member.profile,
                  role: 'member' as const
                })));
              }
            }
          }

          return profiles.map(profile => ({
            ...profile,
            is_online: false // TODO: Implement real presence
          }));
        } else if (channelType === 'dm') {
          // For DM chats, get participants from message_participants or channel metadata
          const { data: dmParticipants, error: dmError } = await supabase
            .from('message_participants')
            .select(`
              profile:profiles!profile_id(
                id,
                first_name,
                last_name,
                username,
                profile_image
              )
            `)
            .eq('channel_id', channelId);

          if (dmError) throw dmError;

          return dmParticipants?.map(participant => ({
            id: participant.profile.id,
            first_name: participant.profile.first_name,
            last_name: participant.profile.last_name,
            username: participant.profile.username,
            profile_image: participant.profile.profile_image,
            role: 'member' as const,
            is_online: false // TODO: Implement real presence
          })) || [];
        }

        return [];
      } catch (error) {
        console.error('Error fetching chat participants:', error);
        return [];
      }
    },
    enabled: !!channelId && !!user?.id && channelType !== 'moai' && channelType !== 'global',
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Determine which data to return based on channel type
  if (channelType === 'moai') {
    const participants: ChatParticipant[] = moaiMembersQuery.data?.map(member => ({
      id: member.profile?.id || '',
      first_name: member.profile?.first_name || '',
      last_name: member.profile?.last_name || '',
      username: member.profile?.username || undefined,
      profile_image: member.profile?.profile_image || undefined,
      role: member.role_in_moai === 'admin' ? 'admin' : 'member',
      is_online: false // TODO: Implement real presence
    })) || [];

    return {
      participants,
      isLoading: moaiMembersQuery.isLoading,
      error: moaiMembersQuery.error,
      refetch: moaiMembersQuery.refetch
    };
  }

  if (channelType === 'global') {
    // For global chats, return empty participants for now
    // TODO: Implement global chat participants if needed
    return {
      participants: [],
      isLoading: false,
      error: null,
      refetch: () => {}
    };
  }

  return {
    participants: otherParticipantsQuery.data || [],
    isLoading: otherParticipantsQuery.isLoading,
    error: otherParticipantsQuery.error,
    refetch: otherParticipantsQuery.refetch
  };
}

/**
 * Helper hook to get participant count for a channel
 */
export function useChatParticipantCount(channelId: string | null, channelType: 'moai' | 'dm' | 'global' | 'buddy' | 'coach') {
  const { participants, isLoading } = useChatParticipants(channelId, channelType);
  
  return {
    count: participants.length,
    isLoading
  };
}