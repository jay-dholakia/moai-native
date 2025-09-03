import { supabase } from '@/lib/supabase';
import { ServiceResponse, MessageReaction } from './types';

export interface ChatChannel {
  id: string;
  name: string;
  type: 'moai' | 'buddy' | 'coach' | 'coach_private';
  created_at: string;
  updated_at: string;
  moai_id?: string;
  participants?: string[];
  last_message?: ChatMessage;
  unread_count?: number;
  buddy_group?: any[];
  week_start_date?: string;
  coach_id?: string;
  is_active?: boolean;
}

export interface ChatMessage {
  id: string;
  moai_id?: string;
  content: string;
  profile_id: string;
  created_at: string;
  message_type: 'text' | 'image' | 'voice' | 'system';
  metadata?: Record<string, any>;
  reactions?: MessageReaction[];
  is_buddy_chat?: boolean;
  buddy_chat_week_start?: string;
  chat_type?: string;
  coach_private_chat_id?: string;
  moai_coaching_chat_id?: string;
  sender?: {
    id: string;
    first_name?: string;
    last_name?: string;
    profile_image?: string;
    total_activities_logged?: number;
  };
}


export interface SendMessageRequest {
  moai_id?: string;
  content: string;
  message_type?: 'text' | 'image' | 'voice';
  metadata?: Record<string, any>;
  is_buddy_chat?: boolean;
  buddy_chat_week_start?: string;
  chat_type?: string;
  coach_private_chat_id?: string;
  moai_coaching_chat_id?: string;
}

export interface CreateChannelRequest {
  name: string;
  type: 'moai' | 'buddy' | 'coach' | 'coach_private';
  moai_id?: string;
  participants?: string[];
  buddy_group?: any[];
  week_start_date?: string;
  coach_id?: string;
}

/**
 * Helper function to parse channel ID and create send message request
 */
function parseChannelIdForMessage(channelId: string): Partial<SendMessageRequest> {
  if (channelId.startsWith('moai-')) {
    const moaiId = channelId.replace('moai-', '');
    return {
      moai_id: moaiId,
      chat_type: 'moai_general',
      is_buddy_chat: false
    };
  } else if (channelId.startsWith('buddy-')) {
    // For buddy chats, we need to get the buddy chat details
    // This would need to be async, so we'll handle it in the method
    return {};
  } else if (channelId.startsWith('coach-')) {
    const coachChatId = channelId.replace('coach-', '');
    return {
      moai_coaching_chat_id: coachChatId,
      chat_type: 'coaching'
    };
  }
  return {};
}

/**
 * Enhanced Chat service with comprehensive Supabase Realtime and Presence integration
 */
export class ChatService {
  // Track active subscriptions to prevent memory leaks
  private static activeSubscriptions = new Map<string, any>();
  
  // Track presence states per channel
  private static presenceStates = new Map<string, any>();
  /**
   * Get user's chat channels (moais, buddy chats, coach chats)
   */
  static async getUserChannels(userId: string): Promise<ServiceResponse<ChatChannel[]>> {
    try {
      const channels: ChatChannel[] = [];

      // Get moais user belongs to
      const { data: userMoais, error: moaisError } = await supabase
        .from('moai_members')
        .select(`
          moais:moai_id(
            id,
            name,
            image_url,
            created_at,
            updated_at
          )
        `)
        .eq('profile_id', userId)
        .eq('is_active', true);

      if (moaisError) {
        console.error('Error fetching user moais:', moaisError);
        return { success: false, error: moaisError.message };
      }

      // Add moai channels
      if (userMoais) {
        for (const member of userMoais) {
          const moai = member.moais as any;
          if (moai && typeof moai === 'object' && !Array.isArray(moai)) {
            channels.push({
              id: `moai-${moai.id}`,
              name: moai.name,
              type: 'moai',
              created_at: moai.created_at,
              updated_at: moai.updated_at,
              moai_id: moai.id
            });
          }
        }
      }

      // Get buddy chat channels
      const { data: buddyChats, error: buddyError } = await supabase
        .from('buddy_chat_channels')
        .select('*')
        .contains('buddy_group', [userId])
        .eq('is_active', true);

      if (!buddyError && buddyChats) {
        for (const chat of buddyChats) {
          channels.push({
            id: `buddy-${chat.id}`,
            name: chat.chat_name,
            type: 'buddy',
            created_at: chat.created_at,
            updated_at: chat.updated_at,
            moai_id: chat.moai_id,
            buddy_group: chat.buddy_group,
            week_start_date: chat.week_start_date
          });
        }
      }

      // Get coach chats (where user is either coach or member)
      const { data: coachChats, error: coachError } = await supabase
        .from('moai_coaching_chats')
        .select(`
          *,
          moais:moai_id(name),
          coaches:coach_id(first_name, last_name)
        `)
        .eq('is_active', true);

      if (!coachError && coachChats) {
        for (const chat of coachChats) {
          // Check if user is member of this moai or is the coach
          const isMember = userMoais?.some(m => {
            const moai = m.moais as any;
            return moai && typeof moai === 'object' && !Array.isArray(moai) && moai.id === chat.moai_id;
          });
          const isCoach = chat.coach_id === userId;
          
          if (isMember || isCoach) {
            channels.push({
              id: `coach-${chat.id}`,
              name: `Coach Chat - ${chat.moais?.name || 'Unknown'}`,
              type: 'coach',
              created_at: chat.created_at,
              updated_at: chat.created_at,
              moai_id: chat.moai_id,
              coach_id: chat.coach_id
            });
          }
        }
      }

      // TODO: Add private coach chats if needed

      return { success: true, data: channels };
    } catch (error) {
      console.error('Error fetching user channels:', error);
      return { success: false, error: 'Failed to fetch channels' };
    }
  }

  /**
   * Get messages for a specific channel
   */
  static async getChannelMessages(
    channelId: string, 
    limit: number = 50,
    offset: number = 0
  ): Promise<ServiceResponse<ChatMessage[]>> {
    try {
      console.log('Fetching messages for channel:', channelId);
      
      // Validate channelId
      if (!channelId || channelId.trim() === '') {
        return { success: false, error: 'Channel ID is required' };
      }

      let query = supabase
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
            created_at
          )
        `);

      // Parse channel ID to determine query
      if (channelId.startsWith('moai-')) {
        const moaiId = channelId.replace('moai-', '');
        query = query
          .eq('moai_id', moaiId)
          .eq('is_buddy_chat', false)
          .in('chat_type', ['moai_general', 'general']);
      } else if (channelId.startsWith('buddy-')) {
        const buddyChatId = channelId.replace('buddy-', '');
        // Get buddy chat details to filter messages
        const { data: buddyChat } = await supabase
          .from('buddy_chat_channels')
          .select('moai_id, week_start_date')
          .eq('id', buddyChatId)
          .single();
        
        if (buddyChat) {
          query = query
            .eq('moai_id', buddyChat.moai_id)
            .eq('is_buddy_chat', true)
            .eq('buddy_chat_week_start', buddyChat.week_start_date);
        }
      } else if (channelId.startsWith('coach-')) {
        const coachChatId = channelId.replace('coach-', '');
        query = query.eq('moai_coaching_chat_id', coachChatId);
      } else {
        console.warn('Unknown channel ID format:', channelId);
        return { success: false, error: 'Invalid channel ID format' };
      }

      console.log('Executing messages query for channel:', channelId);
      
      const { data, error } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Database error fetching channel messages:', error);
        
        // Handle specific database errors
        if (error.code === '42P01') {
          return { success: false, error: 'Messages table not found - database not initialized' };
        }
        if (error.code === '42703') {
          return { success: false, error: 'Database column not found - schema mismatch' };
        }
        
        return { success: false, error: `Database error: ${error.message}` };
      }

      // Reverse to show oldest first
      const messages = (data || []).reverse();
      console.log(`Successfully fetched ${messages.length} messages for channel: ${channelId}`);
      return { success: true, data: messages };
    } catch (error: any) {
      console.error('Unexpected error fetching channel messages:', error);
      
      // Handle network errors
      if (error?.message?.includes('fetch')) {
        return { success: false, error: 'Network error - please check your connection' };
      }
      
      return { success: false, error: `Failed to fetch messages: ${error?.message || 'Unknown error'}` };
    }
  }

  /**
   * Send a message to a channel
   */
  static async sendMessage(request: SendMessageRequest): Promise<ServiceResponse<ChatMessage>> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return { success: false, error: 'User not authenticated' };
      }

      const messageData = {
        content: request.content,
        profile_id: user.user.id,
        message_type: request.message_type || 'text',
        metadata: request.metadata,
        moai_id: request.moai_id,
        is_buddy_chat: request.is_buddy_chat || false,
        buddy_chat_week_start: request.buddy_chat_week_start,
        chat_type: request.chat_type || 'moai_general',
        coach_private_chat_id: request.coach_private_chat_id,
        moai_coaching_chat_id: request.moai_coaching_chat_id,
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
        console.error('Error sending message:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error sending message:', error);
      return { success: false, error: 'Failed to send message' };
    }
  }

  /**
   * Send a message to a channel by channel ID (convenience method)
   */
  static async sendMessageToChannel(
    channelId: string, 
    content: string, 
    messageType: 'text' | 'image' | 'voice' = 'text'
  ): Promise<ServiceResponse<ChatMessage>> {
    try {
      let messageRequest: SendMessageRequest = {
        content,
        message_type: messageType,
        ...parseChannelIdForMessage(channelId)
      };

      // Handle buddy chats specially since we need to fetch the buddy chat details
      if (channelId.startsWith('buddy-')) {
        const buddyChatId = channelId.replace('buddy-', '');
        const { data: buddyChat, error } = await supabase
          .from('buddy_chat_channels')
          .select('moai_id, week_start_date')
          .eq('id', buddyChatId)
          .single();
        
        if (error || !buddyChat) {
          return { success: false, error: 'Buddy chat not found' };
        }

        messageRequest = {
          ...messageRequest,
          moai_id: buddyChat.moai_id,
          is_buddy_chat: true,
          buddy_chat_week_start: buddyChat.week_start_date,
          chat_type: 'buddy'
        };
      }

      return this.sendMessage(messageRequest);
    } catch (error) {
      console.error('Error sending message to channel:', error);
      return { success: false, error: 'Failed to send message to channel' };
    }
  }

  /**
   * Create a new chat channel (buddy chat)
   */
  static async createChannel(request: CreateChannelRequest): Promise<ServiceResponse<ChatChannel>> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return { success: false, error: 'User not authenticated' };
      }

      if (request.type === 'buddy' && request.moai_id && request.buddy_group && request.week_start_date) {
        // Create buddy chat channel
        const channelData = {
          moai_id: request.moai_id,
          week_start_date: request.week_start_date,
          buddy_group: request.buddy_group,
          chat_name: request.name,
          is_active: true
        };

        const { data, error } = await supabase
          .from('buddy_chat_channels')
          .insert(channelData)
          .select()
          .single();

        if (error) {
          console.error('Error creating buddy channel:', error);
          return { success: false, error: error.message };
        }

        return { 
          success: true, 
          data: {
            id: `buddy-${data.id}`,
            name: data.chat_name,
            type: 'buddy',
            created_at: data.created_at,
            updated_at: data.updated_at,
            moai_id: data.moai_id,
            buddy_group: data.buddy_group,
            week_start_date: data.week_start_date
          }
        };
      }

      // For now, other channel types are not supported through this method
      return { success: false, error: 'Unsupported channel type' };
    } catch (error) {
      console.error('Error creating channel:', error);
      return { success: false, error: 'Failed to create channel' };
    }
  }

  /**
   * Add reaction to a message
   */
  static async addReaction(messageId: string, emoji: string): Promise<ServiceResponse<MessageReaction>> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return { success: false, error: 'User not authenticated' };
      }

      const reactionData = {
        message_id: messageId,
        profile_id: user.user.id,
        emoji,
      };

      const { data, error } = await supabase
        .from('message_reactions')
        .insert(reactionData)
        .select()
        .single();

      if (error) {
        console.error('Error adding reaction:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error adding reaction:', error);
      return { success: false, error: 'Failed to add reaction' };
    }
  }

  /**
   * Remove reaction from a message
   */
  static async removeReaction(messageId: string, emoji: string): Promise<ServiceResponse<void>> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { error } = await supabase
        .from('message_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('profile_id', user.user.id)
        .eq('emoji', emoji);

      if (error) {
        console.error('Error removing reaction:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: undefined };
    } catch (error) {
      console.error('Error removing reaction:', error);
      return { success: false, error: 'Failed to remove reaction' };
    }
  }

  /**
   * Enhanced subscribe to real-time messages with comprehensive Supabase features
   */
  static subscribeToChannelMessages(
    channelId: string,
    callbacks: {
      onMessage?: (message: ChatMessage) => void;
      onReaction?: (reaction: any) => void;
      onReadReceipt?: (receipt: any) => void;
      onTyping?: (typingUsers: string[]) => void;
      onPresence?: (presenceState: any) => void;
      onError?: (error: any) => void;
    } = {}
  ) {
    // Cleanup existing subscription if it exists
    this.unsubscribeFromChannel(channelId);
    
    // Build filter based on channel type
    let messageFilter = '';
    let reactionFilter = '';
    let readReceiptFilter = '';
    
    if (channelId.startsWith('moai-')) {
      const moaiId = channelId.replace('moai-', '');
      messageFilter = `moai_id=eq.${moaiId}`;
      // For reactions and read receipts, we need to join with messages
      reactionFilter = `message_id.in.(SELECT id FROM messages WHERE moai_id='${moaiId}' AND is_buddy_chat=false)`;
      readReceiptFilter = reactionFilter; // Same logic
    } else if (channelId.startsWith('buddy-')) {
      const buddyChatId = channelId.replace('buddy-', '');
      messageFilter = `is_buddy_chat=eq.true`; // We'll refine this with buddy chat details
      reactionFilter = `message_id.in.(SELECT id FROM messages WHERE is_buddy_chat=true)`;
      readReceiptFilter = reactionFilter;
    } else if (channelId.startsWith('coach-')) {
      const coachChatId = channelId.replace('coach-', '');
      messageFilter = `moai_coaching_chat_id=eq.${coachChatId}`;
      reactionFilter = `message_id.in.(SELECT id FROM messages WHERE moai_coaching_chat_id='${coachChatId}')`;
      readReceiptFilter = reactionFilter;
    }

    const channel = supabase
      .channel(`chat:${channelId}`, {
        config: {
          presence: {
            key: channelId,
          },
        },
      })
      // Subscribe to new messages
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: messageFilter,
        },
        async (payload) => {
          console.log('New message received:', payload.new);
          
          // Fetch full message with sender details and reactions
          const { data } = await supabase
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
            .eq('id', payload.new.id)
            .single();

          if (data && callbacks.onMessage) {
            callbacks.onMessage(data);
          }
        }
      )
      // Subscribe to message reactions
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'message_reactions',
        },
        async (payload) => {
          console.log('Reaction update:', payload);
          
          if (callbacks.onReaction) {
            // Fetch full reaction with profile details
            if (payload.eventType === 'INSERT') {
              const { data } = await supabase
                .from('message_reactions')
                .select(`
                  *,
                  profile:profiles(first_name, last_name, profile_image)
                `)
                .eq('id', payload.new.id)
                .single();
              
              if (data) {
                callbacks.onReaction({ ...data, eventType: 'INSERT' });
              }
            } else if (payload.eventType === 'DELETE') {
              callbacks.onReaction({ ...payload.old, eventType: 'DELETE' });
            }
          }
        }
      )
      // Subscribe to read receipts
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'message_read_receipts',
        },
        async (payload) => {
          console.log('Read receipt update:', payload);
          
          if (callbacks.onReadReceipt) {
            const { data } = await supabase
              .from('message_read_receipts')
              .select(`
                *,
                profiles(first_name, last_name, profile_image)
              `)
              .eq('id', payload.new.id)
              .single();
            
            if (data) {
              callbacks.onReadReceipt(data);
            }
          }
        }
      )
      // Subscribe to typing indicators via broadcast
      .on('broadcast', { event: 'typing' }, (payload) => {
        console.log('Typing indicator:', payload);
        if (callbacks.onTyping) {
          callbacks.onTyping(payload.typingUsers || []);
        }
      })
      // Subscribe to presence (online users)
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState();
        this.presenceStates.set(channelId, presenceState);
        console.log('Presence sync:', presenceState);
        
        if (callbacks.onPresence) {
          callbacks.onPresence(presenceState);
        }
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
        const presenceState = channel.presenceState();
        this.presenceStates.set(channelId, presenceState);
        
        if (callbacks.onPresence) {
          callbacks.onPresence(presenceState);
        }
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
        const presenceState = channel.presenceState();
        this.presenceStates.set(channelId, presenceState);
        
        if (callbacks.onPresence) {
          callbacks.onPresence(presenceState);
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Successfully subscribed to channel: ${channelId}`);
          
          // Track user presence in this channel
          const { data: user } = await supabase.auth.getUser();
          if (user.user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('first_name, last_name, profile_image')
              .eq('id', user.user.id)
              .single();
            
            await channel.track({
              user_id: user.user.id,
              user_name: profile ? `${profile.first_name} ${profile.last_name}`.trim() : 'User',
              profile_image: profile?.profile_image,
              online_at: new Date().toISOString(),
              typing: false,
            });
          }
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.error(`Channel subscription error for ${channelId}:`, status);
          callbacks.onError?.(status);
        }
      });

    // Store subscription for cleanup
    this.activeSubscriptions.set(channelId, channel);
    
    return channel;
  }
  
  /**
   * Unsubscribe from a channel
   */
  static unsubscribeFromChannel(channelId: string) {
    const subscription = this.activeSubscriptions.get(channelId);
    if (subscription) {
      subscription.unsubscribe();
      this.activeSubscriptions.delete(channelId);
      this.presenceStates.delete(channelId);
      console.log(`Unsubscribed from channel: ${channelId}`);
    }
  }
  
  /**
   * Cleanup all subscriptions (call on app cleanup/logout)
   */
  static unsubscribeFromAllChannels() {
    for (const [channelId, subscription] of this.activeSubscriptions.entries()) {
      subscription.unsubscribe();
    }
    this.activeSubscriptions.clear();
    this.presenceStates.clear();
    console.log('Unsubscribed from all channels');
  }
  
  /**
   * Broadcast typing indicator
   */
  static async broadcastTyping(channelId: string, isTyping: boolean) {
    const subscription = this.activeSubscriptions.get(channelId);
    if (!subscription) {
      console.warn(`No active subscription for channel: ${channelId}`);
      return;
    }
    
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;
    
    // Update presence with typing status
    await subscription.track({
      user_id: user.user.id,
      typing: isTyping,
      last_typing_at: new Date().toISOString(),
    });
    
    // Also broadcast typing event
    await subscription.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        user_id: user.user.id,
        typing: isTyping,
        timestamp: new Date().toISOString(),
      },
    });
  }
  
  /**
   * Get current presence state for a channel
   */
  static getChannelPresence(channelId: string) {
    return this.presenceStates.get(channelId) || {};
  }
  
  /**
   * Get online users for a channel
   */
  static getOnlineUsers(channelId: string): Array<{user_id: string, user_name: string, profile_image?: string}> {
    const presenceState = this.getChannelPresence(channelId);
    const users: Array<{user_id: string, user_name: string, profile_image?: string}> = [];
    
    for (const userId in presenceState) {
      const userPresences = presenceState[userId];
      if (userPresences && userPresences.length > 0) {
        const latestPresence = userPresences[0];
        users.push({
          user_id: latestPresence.user_id,
          user_name: latestPresence.user_name || 'User',
          profile_image: latestPresence.profile_image,
        });
      }
    }
    
    return users;
  }
  
  /**
   * Get typing users for a channel
   */
  static getTypingUsers(channelId: string): Array<{user_id: string, user_name: string}> {
    const presenceState = this.getChannelPresence(channelId);
    const typingUsers: Array<{user_id: string, user_name: string}> = [];
    
    for (const userId in presenceState) {
      const userPresences = presenceState[userId];
      if (userPresences && userPresences.length > 0) {
        const latestPresence = userPresences[0];
        if (latestPresence.typing) {
          typingUsers.push({
            user_id: latestPresence.user_id,
            user_name: latestPresence.user_name || 'User',
          });
        }
      }
    }
    
    return typingUsers;
  }

  /**
   * Enhanced mark messages as read with automatic read receipt generation
   */
  static async markMessagesAsRead(channelId: string, messageIds?: string[]): Promise<ServiceResponse<void>> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return { success: false, error: 'User not authenticated' };
      }

      // If specific message IDs provided, mark those messages as read
      if (messageIds && messageIds.length > 0) {
        const readReceipts = messageIds.map(messageId => ({
          message_id: messageId,
          profile_id: user.user.id,
          read_at: new Date().toISOString(),
        }));
        
        const { error } = await supabase
          .from('message_read_receipts')
          .upsert(readReceipts, {
            onConflict: 'message_id,profile_id',
          });

        if (error) {
          console.error('Error marking messages as read:', error);
          return { success: false, error: error.message };
        }
      } else {
        // Mark all unread messages in the channel as read
        const messagesResponse = await this.getChannelMessages(channelId, 50, 0);
        if (messagesResponse.success && messagesResponse.data.length > 0) {
          // Get messages that don't have read receipts from current user
          const { data: existingReceipts } = await supabase
            .from('message_read_receipts')
            .select('message_id')
            .eq('profile_id', user.user.id)
            .in('message_id', messagesResponse.data.map(m => m.id));
          
          const readMessageIds = new Set(existingReceipts?.map(r => r.message_id) || []);
          const unreadMessages = messagesResponse.data.filter(m => 
            !readMessageIds.has(m.id) && m.profile_id !== user.user.id // Don't mark own messages
          );
          
          if (unreadMessages.length > 0) {
            const readReceipts = unreadMessages.map(message => ({
              message_id: message.id,
              profile_id: user.user.id,
              read_at: new Date().toISOString(),
            }));
            
            const { error } = await supabase
              .from('message_read_receipts')
              .insert(readReceipts);

            if (error) {
              console.error('Error marking channel messages as read:', error);
              return { success: false, error: error.message };
            }
          }
        }
      }
      
      return { success: true, data: undefined };
    } catch (error) {
      console.error('Error marking messages as read:', error);
      return { success: false, error: 'Failed to mark messages as read' };
    }
  }
  
  /**
   * Auto-mark message as read when user views it (presence-based)
   */
  static async autoMarkMessageAsRead(messageId: string): Promise<ServiceResponse<void>> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Check if message is from current user (don't mark own messages as read)
      const { data: message } = await supabase
        .from('messages')
        .select('profile_id')
        .eq('id', messageId)
        .single();
      
      if (!message || message.profile_id === user.user.id) {
        return { success: true, data: undefined }; // Skip own messages
      }
      
      // Check if already marked as read
      const { data: existingReceipt } = await supabase
        .from('message_read_receipts')
        .select('id')
        .eq('message_id', messageId)
        .eq('profile_id', user.user.id)
        .single();
      
      if (existingReceipt) {
        return { success: true, data: undefined }; // Already marked as read
      }

      // Mark as read
      const { error } = await supabase
        .from('message_read_receipts')
        .insert({
          message_id: messageId,
          profile_id: user.user.id,
          read_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error auto-marking message as read:', error);
        return { success: false, error: error.message };
      }
      
      return { success: true, data: undefined };
    } catch (error) {
      console.error('Error auto-marking message as read:', error);
      return { success: false, error: 'Failed to auto-mark message as read' };
    }
  }

  /**
   * Create a direct message channel (using coach private chats)
   */
  static async createDirectMessageChannel(otherUserId: string): Promise<ServiceResponse<ChatChannel>> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Check if either user is a coach and create appropriate chat
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', otherUserId)
        .single();

      const { data: isCoach } = await supabase
        .from('coaches')
        .select('id')
        .or(`id.eq.${user.user.id},id.eq.${otherUserId}`);

      if (isCoach && isCoach.length > 0) {
        // This is a coach-client conversation, create private coach chat
        const coachId = isCoach[0].id === user.user.id ? user.user.id : otherUserId;
        const clientId = coachId === user.user.id ? otherUserId : user.user.id;

        // Check if private chat already exists
        const { data: existingChat, error: chatError } = await supabase
          .from('coach_private_chats')
          .select('*')
          .eq('coach_id', coachId)
          .eq('client_id', clientId)
          .single();

        if (!chatError && existingChat) {
          return {
            success: true,
            data: {
              id: `coach_private-${existingChat.id}`,
              name: userProfile ? `${userProfile.first_name} ${userProfile.last_name}`.trim() : 'Coach Chat',
              type: 'coach_private',
              created_at: existingChat.created_at,
              updated_at: existingChat.updated_at,
              coach_id: coachId
            }
          };
        }
      }

      // For regular users, we don't have direct DM functionality in the current schema
      // They would need to communicate through moai chats
      return { success: false, error: 'Direct messaging is not available. Use moai chats instead.' };
    } catch (error) {
      console.error('Error creating DM channel:', error);
      return { success: false, error: 'Failed to create direct message channel' };
    }
  }
}

export default ChatService;