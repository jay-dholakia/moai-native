import { supabase } from '@/lib/supabase';
import { ServiceResponse } from './types';
import { ChatService, ChatMessage } from './chat-service';
import { PresenceService } from './presence-service';

export interface CoachProfile {
  id: string;
  first_name: string;
  last_name: string;
  profile_image?: string;
  bio?: string;
  specializations?: string[];
  years_experience?: number;
  certification_level?: string;
  rating?: number;
  total_clients?: number;
  is_available?: boolean;
  hourly_rate?: number;
}

export interface CoachPrivateChat {
  id: string;
  coach_id: string;
  client_id: string;
  created_at: string;
  is_active: boolean;
  archived_at?: string;
  archived_by?: string;
  
  // Enhanced fields for realtime
  coach_profile?: CoachProfile;
  client_profile?: {
    id: string;
    first_name: string;
    last_name: string;
    profile_image?: string;
  };
  last_message?: ChatMessage;
  unread_count?: number;
  is_coach_online?: boolean;
  is_client_online?: boolean;
}

export interface MoaiCoachingChat {
  id: string;
  moai_id: string;
  coach_id: string;
  created_at: string;
  is_active: boolean;
  unlock_percentage: number;
  
  // Enhanced fields for realtime
  coach_profile?: CoachProfile;
  moai_info?: {
    id: string;
    name: string;
    image_url?: string;
    member_count?: number;
  };
  last_message?: ChatMessage;
  unread_count?: number;
  participants?: Array<{
    user_id: string;
    first_name: string;
    last_name: string;
    profile_image?: string;
    is_online: boolean;
  }>;
}

export interface CoachChatMessage extends ChatMessage {
  coach_chat_type: 'private' | 'group';
  coach_private_chat_id?: string;
  moai_coaching_chat_id?: string;
  is_coach_message: boolean;
  coach_metadata?: {
    session_type?: 'check-in' | 'guidance' | 'motivation' | 'planning';
    tags?: string[];
    follow_up_required?: boolean;
    priority?: 'low' | 'medium' | 'high';
  };
}

export interface CoachingSession {
  id: string;
  coach_id: string;
  client_id?: string;
  moai_id?: string;
  session_type: 'individual' | 'group' | 'workshop';
  title: string;
  description?: string;
  scheduled_at: string;
  duration_minutes: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  meeting_link?: string;
  notes?: string;
  created_at: string;
}

export class CoachChatService {
  /**
   * Get all coach chats for current user (as coach or client)
   */
  static async getUserCoachChats(): Promise<ServiceResponse<{
    privateChats: CoachPrivateChat[];
    groupChats: MoaiCoachingChat[];
  }>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Check if user is a coach
      const { data: coachProfile } = await supabase
        .from('coaches')
        .select('*')
        .eq('id', user.id)
        .single();

      const isCoach = !!coachProfile;
      const privateChats: CoachPrivateChat[] = [];
      const groupChats: MoaiCoachingChat[] = [];

      // Get private coach chats
      if (isCoach) {
        // User is a coach - get chats where they are the coach
        const { data: coachPrivateChats, error: privateError } = await supabase
          .from('coach_private_chats')
          .select(`
            *,
            client:profiles!coach_private_chats_client_id_fkey(
              id,
              first_name,
              last_name,
              profile_image
            )
          `)
          .eq('coach_id', user.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (!privateError && coachPrivateChats) {
          for (const chat of coachPrivateChats) {
            // Get last message
            const { data: lastMessage } = await supabase
              .from('messages')
              .select(`
                *,
                sender:profiles(first_name, last_name, profile_image)
              `)
              .eq('coach_private_chat_id', chat.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            // Get unread count for coach
            const { count: unreadCount } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('coach_private_chat_id', chat.id)
              .not('profile_id', 'eq', user.id)
              .not('id', 'in', `(
                SELECT message_id FROM message_read_receipts 
                WHERE profile_id = '${user.id}'
              )`);

            privateChats.push({
              ...chat,
              coach_profile: coachProfile,
              client_profile: chat.client,
              last_message: lastMessage,
              unread_count: unreadCount || 0,
              is_coach_online: true, // Current user
              is_client_online: PresenceService.isUserOnline(chat.client_id),
            });
          }
        }

        // Get group coaching chats where user is the coach
        const { data: coachGroupChats, error: groupError } = await supabase
          .from('moai_coaching_chats')
          .select(`
            *,
            moais:moai_id(id, name, image_url)
          `)
          .eq('coach_id', user.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (!groupError && coachGroupChats) {
          for (const chat of coachGroupChats) {
            // Get last message
            const { data: lastMessage } = await supabase
              .from('messages')
              .select(`
                *,
                sender:profiles(first_name, last_name, profile_image)
              `)
              .eq('moai_coaching_chat_id', chat.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            // Get moai members for participants
            const { data: moaiMembers } = await supabase
              .from('moai_members')
              .select(`
                profiles:profile_id(
                  id,
                  first_name,
                  last_name,
                  profile_image
                )
              `)
              .eq('moai_id', chat.moai_id)
              .eq('is_active', true);

            const participants = (moaiMembers || []).map(member => ({
              user_id: member.profiles?.id || '',
              first_name: member.profiles?.first_name || '',
              last_name: member.profiles?.last_name || '',
              profile_image: member.profiles?.profile_image,
              is_online: PresenceService.isUserOnline(member.profiles?.id || ''),
            }));

            groupChats.push({
              ...chat,
              coach_profile: coachProfile,
              moai_info: {
                id: chat.moais?.id || '',
                name: chat.moais?.name || '',
                image_url: chat.moais?.image_url,
                member_count: participants.length,
              },
              last_message: lastMessage,
              unread_count: 0, // TODO: Calculate unread count
              participants,
            });
          }
        }
      } else {
        // User is a client - get chats where they are the client
        const { data: clientPrivateChats, error: privateError } = await supabase
          .from('coach_private_chats')
          .select(`
            *,
            coach:coaches!coach_private_chats_coach_id_fkey(
              id,
              first_name,
              last_name,
              profile_image,
              bio,
              specializations,
              years_experience,
              certification_level,
              rating,
              is_available
            )
          `)
          .eq('client_id', user.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (!privateError && clientPrivateChats) {
          for (const chat of clientPrivateChats) {
            // Get last message
            const { data: lastMessage } = await supabase
              .from('messages')
              .select(`
                *,
                sender:profiles(first_name, last_name, profile_image)
              `)
              .eq('coach_private_chat_id', chat.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            privateChats.push({
              ...chat,
              coach_profile: chat.coach,
              last_message: lastMessage,
              unread_count: 0, // TODO: Calculate unread count
              is_coach_online: PresenceService.isUserOnline(chat.coach_id),
              is_client_online: true, // Current user
            });
          }
        }

        // Get group coaching chats where user is a moai member
        const { data: userMoais } = await supabase
          .from('moai_members')
          .select('moai_id')
          .eq('profile_id', user.id)
          .eq('is_active', true);

        if (userMoais && userMoais.length > 0) {
          const moaiIds = userMoais.map(m => m.moai_id);
          
          const { data: moaiCoachingChats, error: groupError } = await supabase
            .from('moai_coaching_chats')
            .select(`
              *,
              moais:moai_id(id, name, image_url),
              coaches:coach_id(
                id,
                first_name,
                last_name,
                profile_image,
                bio,
                specializations,
                rating,
                is_available
              )
            `)
            .in('moai_id', moaiIds)
            .eq('is_active', true)
            .order('created_at', { ascending: false });

          if (!groupError && moaiCoachingChats) {
            for (const chat of moaiCoachingChats) {
              // Get last message
              const { data: lastMessage } = await supabase
                .from('messages')
                .select(`
                  *,
                  sender:profiles(first_name, last_name, profile_image)
                `)
                .eq('moai_coaching_chat_id', chat.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

              groupChats.push({
                ...chat,
                coach_profile: chat.coaches,
                moai_info: {
                  id: chat.moais?.id || '',
                  name: chat.moais?.name || '',
                  image_url: chat.moais?.image_url,
                },
                last_message: lastMessage,
                unread_count: 0, // TODO: Calculate unread count
              });
            }
          }
        }
      }

      return {
        success: true,
        data: {
          privateChats,
          groupChats,
        }
      };
    } catch (error) {
      console.error('Error fetching coach chats:', error);
      return { success: false, error: 'Failed to fetch coach chats' };
    }
  }

  /**
   * Get messages for a private coach chat
   */
  static async getCoachPrivateChatMessages(
    chatId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<ServiceResponse<CoachChatMessage[]>> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles(
            id,
            first_name,
            last_name,
            profile_image
          ),
          reactions:message_reactions(
            id,
            emoji,
            profile_id,
            created_at,
            profile:profiles(first_name, last_name, profile_image)
          )
        `)
        .eq('coach_private_chat_id', chatId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching coach private chat messages:', error);
        return { success: false, error: error.message };
      }

      // Transform and reverse to show oldest first
      const messages: CoachChatMessage[] = (data || []).reverse().map(msg => ({
        ...msg,
        coach_chat_type: 'private',
        coach_private_chat_id: chatId,
        is_coach_message: false, // Will be determined by checking if sender is coach
      }));

      return { success: true, data: messages };
    } catch (error) {
      console.error('Error fetching coach private chat messages:', error);
      return { success: false, error: 'Failed to fetch coach private chat messages' };
    }
  }

  /**
   * Get messages for a group coaching chat
   */
  static async getGroupCoachingChatMessages(
    chatId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<ServiceResponse<CoachChatMessage[]>> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles(
            id,
            first_name,
            last_name,
            profile_image
          ),
          reactions:message_reactions(
            id,
            emoji,
            profile_id,
            created_at,
            profile:profiles(first_name, last_name, profile_image)
          )
        `)
        .eq('moai_coaching_chat_id', chatId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching group coaching chat messages:', error);
        return { success: false, error: error.message };
      }

      // Transform and reverse to show oldest first
      const messages: CoachChatMessage[] = (data || []).reverse().map(msg => ({
        ...msg,
        coach_chat_type: 'group',
        moai_coaching_chat_id: chatId,
        is_coach_message: false, // Will be determined by checking if sender is coach
      }));

      return { success: true, data: messages };
    } catch (error) {
      console.error('Error fetching group coaching chat messages:', error);
      return { success: false, error: 'Failed to fetch group coaching chat messages' };
    }
  }

  /**
   * Send message to private coach chat
   */
  static async sendPrivateCoachMessage(
    chatId: string,
    content: string,
    messageType: 'text' | 'image' | 'voice' = 'text',
    coachMetadata?: {
      session_type?: 'check-in' | 'guidance' | 'motivation' | 'planning';
      tags?: string[];
      follow_up_required?: boolean;
      priority?: 'low' | 'medium' | 'high';
    }
  ): Promise<ServiceResponse<CoachChatMessage>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Check if user is coach for this chat
      const { data: coachChat } = await supabase
        .from('coach_private_chats')
        .select('coach_id, client_id')
        .eq('id', chatId)
        .single();

      if (!coachChat) {
        return { success: false, error: 'Coach chat not found' };
      }

      const isCoach = coachChat.coach_id === user.id;
      const metadata = {
        ...coachMetadata,
        is_coach_message: isCoach,
      };

      const messageData = {
        content,
        profile_id: user.id,
        message_type: messageType,
        metadata,
        coach_private_chat_id: chatId,
        chat_type: 'coach_private',
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
            profile_image
          )
        `)
        .single();

      if (error) {
        console.error('Error sending coach private message:', error);
        return { success: false, error: error.message };
      }

      const coachChatMessage: CoachChatMessage = {
        ...data,
        coach_chat_type: 'private',
        coach_private_chat_id: chatId,
        is_coach_message: isCoach,
        coach_metadata: coachMetadata,
      };

      return { success: true, data: coachChatMessage };
    } catch (error) {
      console.error('Error sending coach private message:', error);
      return { success: false, error: 'Failed to send coach private message' };
    }
  }

  /**
   * Send message to group coaching chat
   */
  static async sendGroupCoachingMessage(
    chatId: string,
    content: string,
    messageType: 'text' | 'image' | 'voice' = 'text',
    coachMetadata?: {
      session_type?: 'check-in' | 'guidance' | 'motivation' | 'planning';
      tags?: string[];
      follow_up_required?: boolean;
      priority?: 'low' | 'medium' | 'high';
    }
  ): Promise<ServiceResponse<CoachChatMessage>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Check if user has access to this coaching chat
      const { data: coachingChat } = await supabase
        .from('moai_coaching_chats')
        .select('coach_id, moai_id')
        .eq('id', chatId)
        .single();

      if (!coachingChat) {
        return { success: false, error: 'Coaching chat not found' };
      }

      const isCoach = coachingChat.coach_id === user.id;
      
      // If not coach, verify user is member of the moai
      if (!isCoach) {
        const { data: membership } = await supabase
          .from('moai_members')
          .select('id')
          .eq('moai_id', coachingChat.moai_id)
          .eq('profile_id', user.id)
          .eq('is_active', true)
          .single();

        if (!membership) {
          return { success: false, error: 'Access denied to coaching chat' };
        }
      }

      const metadata = {
        ...coachMetadata,
        is_coach_message: isCoach,
      };

      const messageData = {
        content,
        profile_id: user.id,
        moai_id: coachingChat.moai_id,
        message_type: messageType,
        metadata,
        moai_coaching_chat_id: chatId,
        chat_type: 'coaching',
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
            profile_image
          )
        `)
        .single();

      if (error) {
        console.error('Error sending group coaching message:', error);
        return { success: false, error: error.message };
      }

      const coachChatMessage: CoachChatMessage = {
        ...data,
        coach_chat_type: 'group',
        moai_coaching_chat_id: chatId,
        is_coach_message: isCoach,
        coach_metadata: coachMetadata,
      };

      return { success: true, data: coachChatMessage };
    } catch (error) {
      console.error('Error sending group coaching message:', error);
      return { success: false, error: 'Failed to send group coaching message' };
    }
  }

  /**
   * Create a new private coach chat
   */
  static async createPrivateCoachChat(clientId: string): Promise<ServiceResponse<CoachPrivateChat>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Verify user is a coach
      const { data: coachProfile } = await supabase
        .from('coaches')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!coachProfile) {
        return { success: false, error: 'User is not a coach' };
      }

      // Check if chat already exists
      const { data: existingChat } = await supabase
        .from('coach_private_chats')
        .select('*')
        .eq('coach_id', user.id)
        .eq('client_id', clientId)
        .single();

      if (existingChat) {
        if (existingChat.is_active) {
          return { success: true, data: existingChat };
        } else {
          // Reactivate existing chat
          const { data: reactivatedChat, error: updateError } = await supabase
            .from('coach_private_chats')
            .update({ is_active: true, archived_at: null, archived_by: null })
            .eq('id', existingChat.id)
            .select()
            .single();

          if (updateError) {
            return { success: false, error: updateError.message };
          }

          return { success: true, data: reactivatedChat };
        }
      }

      // Create new private chat
      const chatData = {
        coach_id: user.id,
        client_id: clientId,
        is_active: true,
      };

      const { data, error } = await supabase
        .from('coach_private_chats')
        .insert(chatData)
        .select()
        .single();

      if (error) {
        console.error('Error creating private coach chat:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error creating private coach chat:', error);
      return { success: false, error: 'Failed to create private coach chat' };
    }
  }

  /**
   * Create a new group coaching chat for a moai
   */
  static async createGroupCoachingChat(moaiId: string): Promise<ServiceResponse<MoaiCoachingChat>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Verify user is a coach
      const { data: coachProfile } = await supabase
        .from('coaches')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!coachProfile) {
        return { success: false, error: 'User is not a coach' };
      }

      // Check if coaching chat already exists for this moai
      const { data: existingChat } = await supabase
        .from('moai_coaching_chats')
        .select('*')
        .eq('moai_id', moaiId)
        .eq('coach_id', user.id)
        .single();

      if (existingChat) {
        if (existingChat.is_active) {
          return { success: true, data: existingChat };
        } else {
          // Reactivate existing chat
          const { data: reactivatedChat, error: updateError } = await supabase
            .from('moai_coaching_chats')
            .update({ is_active: true })
            .eq('id', existingChat.id)
            .select()
            .single();

          if (updateError) {
            return { success: false, error: updateError.message };
          }

          return { success: true, data: reactivatedChat };
        }
      }

      // Create new group coaching chat
      const chatData = {
        moai_id: moaiId,
        coach_id: user.id,
        is_active: true,
        unlock_percentage: 0, // Initially locked, can be unlocked based on moai progress
      };

      const { data, error } = await supabase
        .from('moai_coaching_chats')
        .insert(chatData)
        .select()
        .single();

      if (error) {
        console.error('Error creating group coaching chat:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error creating group coaching chat:', error);
      return { success: false, error: 'Failed to create group coaching chat' };
    }
  }

  /**
   * Subscribe to coach chat real-time updates
   */
  static subscribeToCoachChat(
    chatId: string,
    chatType: 'private' | 'group',
    callbacks: {
      onMessage?: (message: CoachChatMessage) => void;
      onPresenceUpdate?: (presence: any) => void;
      onError?: (error: any) => void;
    }
  ) {
    const channelId = `coach-${chatType}-${chatId}`;
    
    return ChatService.subscribeToChannelMessages(channelId, {
      onMessage: callbacks.onMessage,
      onPresence: callbacks.onPresenceUpdate,
      onError: callbacks.onError,
    });
  }

  /**
   * Schedule a coaching session
   */
  static async scheduleCoachingSession(session: {
    client_id?: string;
    moai_id?: string;
    session_type: 'individual' | 'group' | 'workshop';
    title: string;
    description?: string;
    scheduled_at: string;
    duration_minutes: number;
    meeting_link?: string;
  }): Promise<ServiceResponse<CoachingSession>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Verify user is a coach
      const { data: coachProfile } = await supabase
        .from('coaches')
        .select('id')
        .eq('id', user.id)
        .single();

      if (!coachProfile) {
        return { success: false, error: 'User is not a coach' };
      }

      const sessionData = {
        ...session,
        coach_id: user.id,
        status: 'scheduled' as const,
      };

      const { data, error } = await supabase
        .from('coach_sessions')
        .insert(sessionData)
        .select()
        .single();

      if (error) {
        console.error('Error scheduling coaching session:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error scheduling coaching session:', error);
      return { success: false, error: 'Failed to schedule coaching session' };
    }
  }

  /**
   * Get coaching sessions for current user
   */
  static async getCoachingSessions(
    filter?: {
      status?: string;
      upcoming_only?: boolean;
      as_coach?: boolean;
    }
  ): Promise<ServiceResponse<CoachingSession[]>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      let query = supabase
        .from('coach_sessions')
        .select('*')
        .order('scheduled_at', { ascending: true });

      if (filter?.as_coach) {
        query = query.eq('coach_id', user.id);
      } else {
        // As client or participant
        query = query.or(`client_id.eq.${user.id},moai_id.in.(
          SELECT moai_id FROM moai_members WHERE profile_id = '${user.id}'
        )`);
      }

      if (filter?.status) {
        query = query.eq('status', filter.status);
      }

      if (filter?.upcoming_only) {
        query = query.gte('scheduled_at', new Date().toISOString());
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching coaching sessions:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching coaching sessions:', error);
      return { success: false, error: 'Failed to fetch coaching sessions' };
    }
  }

  /**
   * Archive a coach chat
   */
  static async archiveCoachChat(
    chatId: string,
    chatType: 'private' | 'group'
  ): Promise<ServiceResponse<void>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const updateData = {
        is_active: false,
        archived_at: new Date().toISOString(),
        archived_by: user.id,
      };

      if (chatType === 'private') {
        const { error } = await supabase
          .from('coach_private_chats')
          .update(updateData)
          .eq('id', chatId);

        if (error) {
          return { success: false, error: error.message };
        }
      } else {
        const { error } = await supabase
          .from('moai_coaching_chats')
          .update({ is_active: false })
          .eq('id', chatId);

        if (error) {
          return { success: false, error: error.message };
        }
      }

      // Leave presence channel
      await PresenceService.leaveChannel(`coach-${chatType}-${chatId}`);

      return { success: true, data: undefined };
    } catch (error) {
      console.error('Error archiving coach chat:', error);
      return { success: false, error: 'Failed to archive coach chat' };
    }
  }
}