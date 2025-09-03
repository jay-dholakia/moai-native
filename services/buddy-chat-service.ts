import { supabase } from '@/lib/supabase';
import { ServiceResponse } from './types';
import { ChatService, ChatMessage } from './chat-service';
import { PresenceService } from './presence-service';

export interface BuddyChatChannel {
  id: string;
  moai_id: string;
  week_start_date: string;
  cycle_start_date?: string;
  cycle_end_date?: string;
  buddy_group: string[]; // Array of user IDs
  chat_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  buddy_type: 'buddy_1on1' | 'buddy_group';
  
  // Enhanced fields for realtime
  last_message?: ChatMessage;
  unread_count?: number;
  participants?: Array<{
    user_id: string;
    first_name: string;
    last_name: string;
    profile_image?: string;
    is_online: boolean;
    last_seen?: string;
  }>;
}

export interface BuddyCycleInfo {
  cycle_number: number;
  cycle_start_date: string;
  cycle_end_date: string;
  is_current: boolean;
  participants: Array<{
    user_id: string;
    first_name: string;
    last_name: string;
    profile_image?: string;
    joined_at: string;
  }>;
}

export interface BuddyChatMessage extends ChatMessage {
  buddy_chat_id: string;
  buddy_cycle_start?: string;
  buddy_group_members?: string[];
}

export interface BuddyMatchingOptions {
  moai_id: string;
  cycle_duration_weeks?: number;
  group_size?: number;
  matching_criteria?: {
    timezone_preference?: boolean;
    activity_level_match?: boolean;
    goal_similarity?: boolean;
    experience_level_match?: boolean;
  };
}

export class BuddyChatService {
  /**
   * Get all buddy chat channels for current user
   */
  static async getUserBuddyChats(): Promise<ServiceResponse<BuddyChatChannel[]>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data: buddyChats, error } = await supabase
        .from('buddy_chat_channels')
        .select(`
          *,
          moais:moai_id(name, image_url)
        `)
        .contains('buddy_group', [user.id])
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching buddy chats:', error);
        return { success: false, error: error.message };
      }

      // Enhance with participant info and presence
      const enhancedChats: BuddyChatChannel[] = [];
      
      for (const chat of buddyChats || []) {
        // Get participant profiles
        const { data: participants } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, profile_image')
          .in('id', chat.buddy_group);

        // Check online status for each participant
        const participantsWithPresence = (participants || []).map(participant => ({
          user_id: participant.id,
          first_name: participant.first_name,
          last_name: participant.last_name,
          profile_image: participant.profile_image,
          is_online: PresenceService.isUserOnline(participant.id),
          last_seen: PresenceService.getUserLastSeen(participant.id),
        }));

        // Get last message for this buddy chat
        const { data: lastMessage } = await supabase
          .from('messages')
          .select(`
            *,
            sender:profiles(first_name, last_name, profile_image)
          `)
          .eq('moai_id', chat.moai_id)
          .eq('is_buddy_chat', true)
          .eq('buddy_chat_week_start', chat.week_start_date)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Get unread count for current user
        let unreadCount = 0;
        if (lastMessage) {
          const { data: readReceipt } = await supabase
            .from('message_read_receipts')
            .select('id')
            .eq('message_id', lastMessage.id)
            .eq('profile_id', user.id)
            .single();
          
          if (!readReceipt) {
            unreadCount = 1; // Simplified - in a full implementation, count all unread messages
          }
        }

        enhancedChats.push({
          ...chat,
          participants: participantsWithPresence,
          last_message: lastMessage,
          unread_count: unreadCount,
        });
      }

      return { success: true, data: enhancedChats };
    } catch (error) {
      console.error('Error fetching buddy chats:', error);
      return { success: false, error: 'Failed to fetch buddy chats' };
    }
  }

  /**
   * Get messages for a specific buddy chat
   */
  static async getBuddyChatMessages(
    moaiId: string,
    weekStartDate: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<ServiceResponse<BuddyChatMessage[]>> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles(
            id,
            first_name,
            last_name,
            profile_image,
            total_activities_logged
          ),
          reactions:message_reactions(
            id,
            emoji,
            profile_id,
            created_at,
            profile:profiles(first_name, last_name, profile_image)
          )
        `)
        .eq('moai_id', moaiId)
        .eq('is_buddy_chat', true)
        .eq('buddy_chat_week_start', weekStartDate)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching buddy chat messages:', error);
        return { success: false, error: error.message };
      }

      // Transform and reverse to show oldest first
      const messages: BuddyChatMessage[] = (data || []).reverse().map(msg => ({
        ...msg,
        buddy_chat_id: `${moaiId}-${weekStartDate}`,
        buddy_cycle_start: weekStartDate,
      }));

      return { success: true, data: messages };
    } catch (error) {
      console.error('Error fetching buddy chat messages:', error);
      return { success: false, error: 'Failed to fetch buddy chat messages' };
    }
  }

  /**
   * Send message to buddy chat
   */
  static async sendBuddyChatMessage(
    moaiId: string,
    weekStartDate: string,
    content: string,
    messageType: 'text' | 'image' | 'voice' = 'text',
    metadata?: Record<string, any>
  ): Promise<ServiceResponse<BuddyChatMessage>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const messageData = {
        content,
        profile_id: user.id,
        moai_id: moaiId,
        message_type: messageType,
        metadata,
        is_buddy_chat: true,
        buddy_chat_week_start: weekStartDate,
        chat_type: 'buddy',
      };

      const { data, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select(`
          *,
          sender:profiles(
            id,
            first_name,
            last_name,
            profile_image,
            total_activities_logged
          )
        `)
        .single();

      if (error) {
        console.error('Error sending buddy chat message:', error);
        return { success: false, error: error.message };
      }

      // Update buddy chat updated_at timestamp
      await supabase
        .from('buddy_chat_channels')
        .update({ updated_at: new Date().toISOString() })
        .eq('moai_id', moaiId)
        .eq('week_start_date', weekStartDate);

      const buddyChatMessage: BuddyChatMessage = {
        ...data,
        buddy_chat_id: `${moaiId}-${weekStartDate}`,
        buddy_cycle_start: weekStartDate,
      };

      return { success: true, data: buddyChatMessage };
    } catch (error) {
      console.error('Error sending buddy chat message:', error);
      return { success: false, error: 'Failed to send buddy chat message' };
    }
  }

  /**
   * Create a new buddy chat channel
   */
  static async createBuddyChat(
    moaiId: string,
    buddyGroup: string[],
    weekStartDate: string,
    chatName?: string,
    buddyType: 'buddy_1on1' | 'buddy_group' = 'buddy_1on1'
  ): Promise<ServiceResponse<BuddyChatChannel>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Ensure current user is in the buddy group
      if (!buddyGroup.includes(user.id)) {
        buddyGroup.push(user.id);
      }

      // Generate chat name if not provided
      if (!chatName) {
        if (buddyType === 'buddy_1on1' && buddyGroup.length === 2) {
          // Get the other user's name
          const otherUserId = buddyGroup.find(id => id !== user.id);
          if (otherUserId) {
            const { data: otherUser } = await supabase
              .from('profiles')
              .select('first_name, last_name')
              .eq('id', otherUserId)
              .single();
            
            if (otherUser) {
              chatName = `${otherUser.first_name} ${otherUser.last_name}`;
            }
          }
        } else {
          chatName = `Buddy Group (${buddyGroup.length} members)`;
        }
      }

      const channelData = {
        moai_id: moaiId,
        week_start_date: weekStartDate,
        cycle_start_date: weekStartDate,
        buddy_group: buddyGroup,
        chat_name: chatName || 'Buddy Chat',
        is_active: true,
        buddy_type: buddyType,
      };

      const { data, error } = await supabase
        .from('buddy_chat_channels')
        .insert(channelData)
        .select()
        .single();

      if (error) {
        console.error('Error creating buddy chat:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error creating buddy chat:', error);
      return { success: false, error: 'Failed to create buddy chat' };
    }
  }

  /**
   * Get current buddy cycle information
   */
  static async getCurrentBuddyCycle(moaiId: string): Promise<ServiceResponse<BuddyCycleInfo | null>> {
    try {
      // Get the most recent buddy cycle
      const { data: currentCycle, error } = await supabase
        .from('buddy_cycles')
        .select('*')
        .eq('moai_id', moaiId)
        .order('cycle_start_date', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found is OK
        console.error('Error fetching current buddy cycle:', error);
        return { success: false, error: error.message };
      }

      if (!currentCycle) {
        return { success: true, data: null };
      }

      // Get participants for this cycle
      const { data: participants } = await supabase
        .from('buddy_cycle_pairings')
        .select(`
          profile_id,
          profiles:profile_id(
            id,
            first_name,
            last_name,
            profile_image
          ),
          created_at
        `)
        .eq('cycle_id', currentCycle.id);

      const cycleInfo: BuddyCycleInfo = {
        cycle_number: currentCycle.cycle_number,
        cycle_start_date: currentCycle.cycle_start_date,
        cycle_end_date: currentCycle.cycle_end_date,
        is_current: new Date() >= new Date(currentCycle.cycle_start_date) && 
                   new Date() <= new Date(currentCycle.cycle_end_date),
        participants: (participants || []).map(p => ({
          user_id: p.profile_id,
          first_name: p.profiles?.first_name || '',
          last_name: p.profiles?.last_name || '',
          profile_image: p.profiles?.profile_image,
          joined_at: p.created_at,
        })),
      };

      return { success: true, data: cycleInfo };
    } catch (error) {
      console.error('Error fetching current buddy cycle:', error);
      return { success: false, error: 'Failed to fetch current buddy cycle' };
    }
  }

  /**
   * Join a buddy chat channel
   */
  static async joinBuddyChat(buddyChatId: string): Promise<ServiceResponse<void>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Get the buddy chat
      const { data: buddyChat, error: fetchError } = await supabase
        .from('buddy_chat_channels')
        .select('*')
        .eq('id', buddyChatId)
        .single();

      if (fetchError || !buddyChat) {
        return { success: false, error: 'Buddy chat not found' };
      }

      // Add user to buddy group if not already present
      if (!buddyChat.buddy_group.includes(user.id)) {
        const updatedBuddyGroup = [...buddyChat.buddy_group, user.id];
        
        const { error: updateError } = await supabase
          .from('buddy_chat_channels')
          .update({ 
            buddy_group: updatedBuddyGroup,
            updated_at: new Date().toISOString()
          })
          .eq('id', buddyChatId);

        if (updateError) {
          console.error('Error joining buddy chat:', updateError);
          return { success: false, error: updateError.message };
        }
      }

      // Update presence to show user is in this buddy chat
      await PresenceService.joinChannel(
        `buddy-${buddyChatId}`,
        buddyChat.chat_name,
        'buddy'
      );

      return { success: true, data: undefined };
    } catch (error) {
      console.error('Error joining buddy chat:', error);
      return { success: false, error: 'Failed to join buddy chat' };
    }
  }

  /**
   * Leave a buddy chat channel
   */
  static async leaveBuddyChat(buddyChatId: string): Promise<ServiceResponse<void>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Get the buddy chat
      const { data: buddyChat, error: fetchError } = await supabase
        .from('buddy_chat_channels')
        .select('*')
        .eq('id', buddyChatId)
        .single();

      if (fetchError || !buddyChat) {
        return { success: false, error: 'Buddy chat not found' };
      }

      // Remove user from buddy group
      const updatedBuddyGroup = buddyChat.buddy_group.filter(id => id !== user.id);
      
      // If no one left, deactivate the chat
      if (updatedBuddyGroup.length === 0) {
        const { error: updateError } = await supabase
          .from('buddy_chat_channels')
          .update({ 
            is_active: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', buddyChatId);

        if (updateError) {
          console.error('Error deactivating buddy chat:', updateError);
          return { success: false, error: updateError.message };
        }
      } else {
        const { error: updateError } = await supabase
          .from('buddy_chat_channels')
          .update({ 
            buddy_group: updatedBuddyGroup,
            updated_at: new Date().toISOString()
          })
          .eq('id', buddyChatId);

        if (updateError) {
          console.error('Error leaving buddy chat:', updateError);
          return { success: false, error: updateError.message };
        }
      }

      // Update presence
      await PresenceService.leaveChannel(`buddy-${buddyChatId}`);

      return { success: true, data: undefined };
    } catch (error) {
      console.error('Error leaving buddy chat:', error);
      return { success: false, error: 'Failed to leave buddy chat' };
    }
  }

  /**
   * Subscribe to buddy chat real-time updates
   */
  static subscribeToBuddyChat(
    buddyChatId: string,
    callbacks: {
      onMessage?: (message: BuddyChatMessage) => void;
      onParticipantJoin?: (participant: any) => void;
      onParticipantLeave?: (participantId: string) => void;
      onPresenceUpdate?: (presence: any) => void;
      onError?: (error: any) => void;
    }
  ) {
    const channelId = `buddy-${buddyChatId}`;
    
    return ChatService.subscribeToChannelMessages(channelId, {
      onMessage: callbacks.onMessage,
      onPresence: callbacks.onPresenceUpdate,
      onError: callbacks.onError,
    });
  }

  /**
   * Create buddy matching for a moai
   */
  static async createBuddyMatching(options: BuddyMatchingOptions): Promise<ServiceResponse<BuddyChatChannel[]>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // This is a complex algorithm that would typically be handled by an Edge Function
      // For now, we'll implement a simple version
      
      // Get all active members of the moai
      const { data: moaiMembers, error: membersError } = await supabase
        .from('moai_members')
        .select(`
          profile_id,
          profiles:profile_id(
            id,
            first_name,
            last_name,
            profile_image,
            timezone,
            fitness_goals,
            experience_level
          )
        `)
        .eq('moai_id', options.moai_id)
        .eq('is_active', true);

      if (membersError || !moaiMembers) {
        return { success: false, error: 'Failed to fetch moai members' };
      }

      // Simple buddy matching: pair users randomly
      const availableMembers = [...moaiMembers];
      const buddyPairs: string[][] = [];
      const groupSize = options.group_size || 2;

      while (availableMembers.length >= groupSize) {
        const group: string[] = [];
        for (let i = 0; i < groupSize && availableMembers.length > 0; i++) {
          const randomIndex = Math.floor(Math.random() * availableMembers.length);
          const member = availableMembers.splice(randomIndex, 1)[0];
          group.push(member.profile_id);
        }
        if (group.length === groupSize) {
          buddyPairs.push(group);
        }
      }

      // Create buddy chat channels for each pair/group
      const createdChats: BuddyChatChannel[] = [];
      const weekStartDate = new Date().toISOString().split('T')[0]; // Current date as start

      for (const buddyGroup of buddyPairs) {
        const buddyType = buddyGroup.length === 2 ? 'buddy_1on1' : 'buddy_group';
        const result = await this.createBuddyChat(
          options.moai_id,
          buddyGroup,
          weekStartDate,
          undefined,
          buddyType
        );
        
        if (result.success) {
          createdChats.push(result.data);
        }
      }

      return { success: true, data: createdChats };
    } catch (error) {
      console.error('Error creating buddy matching:', error);
      return { success: false, error: 'Failed to create buddy matching' };
    }
  }

  /**
   * Get buddy chat statistics for analytics
   */
  static async getBuddyChatStats(moaiId?: string): Promise<ServiceResponse<{
    totalChats: number;
    activeChats: number;
    totalMessages: number;
    averageMessagesPerChat: number;
    mostActiveChat?: BuddyChatChannel;
  }>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Build base query
      let query = supabase
        .from('buddy_chat_channels')
        .select('*', { count: 'exact' })
        .contains('buddy_group', [user.id]);

      if (moaiId) {
        query = query.eq('moai_id', moaiId);
      }

      const { data: buddyChats, count: totalChats, error } = await query;

      if (error) {
        return { success: false, error: error.message };
      }

      const activeChats = (buddyChats || []).filter(chat => chat.is_active).length;

      // Get message count
      let messageQuery = supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('is_buddy_chat', true);

      if (moaiId) {
        messageQuery = messageQuery.eq('moai_id', moaiId);
      }

      const { count: totalMessages } = await messageQuery;

      const averageMessagesPerChat = totalChats > 0 ? (totalMessages || 0) / totalChats : 0;

      return {
        success: true,
        data: {
          totalChats: totalChats || 0,
          activeChats,
          totalMessages: totalMessages || 0,
          averageMessagesPerChat,
        }
      };
    } catch (error) {
      console.error('Error fetching buddy chat stats:', error);
      return { success: false, error: 'Failed to fetch buddy chat stats' };
    }
  }
}