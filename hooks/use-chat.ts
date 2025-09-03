import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChatService, ChatChannel, ChatMessage, SendMessageRequest } from '@/services/chat-service';
import { MessageReactionService, MessageReaction } from '@/services/message-reaction-service';
import { ReadReceiptsService, ReadReceipt } from '@/services/read-receipts-service';
import { TypingIndicatorService, TypingUser } from '@/services/typing-indicator-service';
import { PresenceService, UserPresence } from '@/services/presence-service';
import { ServiceResponse } from '@/services/types';
import { useAuth } from './useAuth';

/**
 * Hook for managing user's chat channels
 */
export function useUserChannels() {
  const { user } = useAuth();
  
  return useQuery<ServiceResponse<ChatChannel[]>, Error, ServiceResponse<ChatChannel[]>>({
    queryKey: ['chat-channels', user?.id],
    queryFn: () => user ? ChatService.getUserChannels(user.id) : Promise.resolve({ success: false, error: 'No user' } as ServiceResponse<ChatChannel[]>),
    enabled: !!user,
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Enhanced hook for managing messages in a specific channel with comprehensive realtime features
 */
export function useChannelMessages(channelId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [reactions, setReactions] = useState<Record<string, MessageReaction[]>>({});
  const [readReceipts, setReadReceipts] = useState<Record<string, ReadReceipt[]>>({});
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const subscriptionRef = useRef<any>(null);
  const { user } = useAuth();

  // Fetch initial messages
  const fetchMessages = useCallback(async () => {
    if (!channelId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await ChatService.getChannelMessages(channelId);
      if (response.success) {
        const messagesData = response.data;
        setMessages(messagesData);
        
        // Initialize reactions and read receipts from cached data
        const messageIds = messagesData.map(m => m.id);
        messageIds.forEach(messageId => {
          const cachedReactions = MessageReactionService.getCachedReactions(messageId);
          if (cachedReactions.length > 0) {
            setReactions(prev => ({ ...prev, [messageId]: cachedReactions }));
          }
          
          const cachedReceipts = ReadReceiptsService.getCachedReadReceipts(messageId);
          if (cachedReceipts.length > 0) {
            setReadReceipts(prev => ({ ...prev, [messageId]: cachedReceipts }));
          }
        });
        
        // Auto-mark messages as read
        const unreadMessageIds = messageIds.filter(id => 
          !ReadReceiptsService.hasUserReadMessage(id)
        );
        if (unreadMessageIds.length > 0) {
          await ReadReceiptsService.markMessagesAsRead(unreadMessageIds);
        }
      } else {
        setError(response.error);
      }
    } catch (err) {
      setError('Failed to fetch messages');
    } finally {
      setIsLoading(false);
    }
  }, [channelId]);

  // Subscribe to comprehensive real-time updates
  useEffect(() => {
    if (!channelId) return;

    // Clean up previous subscription
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }

    // Fetch initial messages
    fetchMessages();

    // Subscribe to all realtime events
    subscriptionRef.current = ChatService.subscribeToChannelMessages(channelId, {
      onMessage: (newMessage) => {
        setMessages(prev => {
          // Avoid duplicates
          if (prev.some(msg => msg.id === newMessage.id)) {
            return prev;
          }
          return [...prev, newMessage];
        });
        
        // Auto-mark new message as read if it's not from current user
        if (user && newMessage.profile_id !== user.id) {
          setTimeout(() => {
            ReadReceiptsService.autoMarkAsReadSingle(newMessage.id, newMessage.profile_id);
          }, 1000); // Delay to simulate "reading"
        }
      },
      
      onReaction: (reactionUpdate) => {
        MessageReactionService.handleReactionUpdate(reactionUpdate.message_id, reactionUpdate);
        const updatedReactions = MessageReactionService.getCachedReactions(reactionUpdate.message_id);
        setReactions(prev => ({
          ...prev,
          [reactionUpdate.message_id]: updatedReactions
        }));
      },
      
      onReadReceipt: (receiptUpdate) => {
        ReadReceiptsService.handleReadReceiptUpdate(receiptUpdate);
        const updatedReceipts = ReadReceiptsService.getCachedReadReceipts(receiptUpdate.message_id);
        setReadReceipts(prev => ({
          ...prev,
          [receiptUpdate.message_id]: updatedReceipts
        }));
      },
      
      onTyping: (typingUserIds) => {
        // Convert string array to TypingUser array using cached data
        const typingUsersData = channelId ? TypingIndicatorService.getTypingUsers(channelId) : [];
        setTypingUsers(typingUsersData);
      },
      
      onPresence: (presenceState) => {
        PresenceService.handlePresenceUpdate(channelId, presenceState);
        const online = PresenceService.getOnlineUsersForChannel(channelId);
        setOnlineUsers(online);
      },
      
      onError: (error) => {
        console.error('Real-time subscription error:', error);
        setError('Connection error');
      }
    });

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [channelId, fetchMessages, user]);

  // Initialize presence and typing services for channel
  useEffect(() => {
    if (channelId && user) {
      // Initialize presence for this channel
      PresenceService.joinChannel(channelId, `Channel ${channelId}`, 'moai');
      
      return () => {
        PresenceService.leaveChannel(channelId);
      };
    }
  }, [channelId, user]);

  return {
    messages,
    reactions,
    readReceipts,
    typingUsers,
    onlineUsers,
    isLoading,
    error,
    refetch: fetchMessages,
  };
}

/**
 * Hook for sending messages
 */
export function useSendMessage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (request: SendMessageRequest) => ChatService.sendMessage(request),
    onSuccess: (response, variables) => {
      if (response.success) {
        // Invalidate channels to update last message
        queryClient.invalidateQueries({ queryKey: ['chat-channels'] });
      }
    },
    onError: (error) => {
      console.error('Error sending message:', error);
    },
  });
}

/**
 * Hook for creating new channels
 */
export function useCreateChannel() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ChatService.createChannel,
    onSuccess: () => {
      // Invalidate channels list
      queryClient.invalidateQueries({ queryKey: ['chat-channels'] });
    },
    onError: (error) => {
      console.error('Error creating channel:', error);
    },
  });
}

/**
 * Hook for creating direct message channels
 */
export function useCreateDirectMessage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (otherUserId: string) => ChatService.createDirectMessageChannel(otherUserId),
    onSuccess: () => {
      // Invalidate channels list
      queryClient.invalidateQueries({ queryKey: ['chat-channels'] });
    },
    onError: (error) => {
      console.error('Error creating DM channel:', error);
    },
  });
}

/**
 * Hook for message reactions
 */
export function useMessageReactions() {
  const addReactionMutation = useMutation({
    mutationFn: ({ messageId, emoji }: { messageId: string; emoji: string }) => 
      ChatService.addReaction(messageId, emoji),
    onError: (error) => {
      console.error('Error adding reaction:', error);
    },
  });

  const removeReactionMutation = useMutation({
    mutationFn: ({ messageId, emoji }: { messageId: string; emoji: string }) => 
      ChatService.removeReaction(messageId, emoji),
    onError: (error) => {
      console.error('Error removing reaction:', error);
    },
  });

  return {
    addReaction: addReactionMutation.mutate,
    removeReaction: removeReactionMutation.mutate,
    isAddingReaction: addReactionMutation.isPending,
    isRemovingReaction: removeReactionMutation.isPending,
  };
}

/**
 * Hook for comprehensive chat functionality with full realtime features
 */
export function useChat(channelId: string | null = null) {
  const { user } = useAuth();
  const channels = useUserChannels();
  const messages = useChannelMessages(channelId);
  const sendMessage = useSendMessage();
  const createChannel = useCreateChannel();
  const createDM = useCreateDirectMessage();
  const reactions = useMessageReactions();
  const [isTyping, setIsTyping] = useState(false);

  const sendMessageToChannel = useCallback(
    async (content: string, messageType: 'text' | 'image' | 'voice' = 'text') => {
      if (!channelId || !content.trim()) return;
      
      // Stop typing indicator
      if (isTyping) {
        await TypingIndicatorService.stopTyping(channelId);
        setIsTyping(false);
      }
      
      // Send the message
      try {
        const result = await ChatService.sendMessageToChannel(channelId, content.trim(), messageType);
        if (result.success) {
          // Message will be received via realtime subscription
        } else {
          console.error('Failed to send message:', result.error);
        }
      } catch (error) {
        console.error('Error sending message:', error);
      }
    },
    [channelId, isTyping]
  );

  const startTyping = useCallback(
    async () => {
      if (!channelId || isTyping) return;
      setIsTyping(true);
      await TypingIndicatorService.startTyping(channelId);
    },
    [channelId, isTyping]
  );

  const stopTyping = useCallback(
    async () => {
      if (!channelId || !isTyping) return;
      setIsTyping(false);
      await TypingIndicatorService.stopTyping(channelId);
    },
    [channelId, isTyping]
  );

  const toggleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      try {
        const result = await MessageReactionService.toggleReaction(messageId, emoji);
        if (result.success) {
          // Reaction update will be received via realtime subscription
        } else {
          console.error('Failed to toggle reaction:', result.error);
        }
      } catch (error) {
        console.error('Error toggling reaction:', error);
      }
    },
    []
  );

  const markMessageAsRead = useCallback(
    async (messageId: string) => {
      try {
        await ReadReceiptsService.markMessageAsRead(messageId);
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    },
    []
  );

  const startDirectMessage = useCallback(
    async (otherUserId: string) => {
      const result = await createDM.mutateAsync(otherUserId);
      return result.success ? result.data : null;
    },
    [createDM]
  );

  // Get typing indicator text for display
  const typingText = channelId ? TypingIndicatorService.getTypingText(channelId) : '';
  
  // Get online user count
  const onlineCount = messages.onlineUsers.length;

  return {
    // Channel data
    channels: (channels.data?.success ? channels.data.data : []) || [],
    isLoadingChannels: channels.isLoading,
    channelsError: channels.error,
    
    // Message data
    messages: messages.messages,
    reactions: messages.reactions,
    readReceipts: messages.readReceipts,
    isLoadingMessages: messages.isLoading,
    messagesError: messages.error,
    
    // Realtime data
    typingUsers: messages.typingUsers,
    onlineUsers: messages.onlineUsers,
    onlineCount,
    typingText,
    
    // Actions
    sendMessage: sendMessageToChannel,
    createChannel: createChannel.mutate,
    startDirectMessage,
    addReaction: reactions.addReaction,
    removeReaction: reactions.removeReaction,
    toggleReaction,
    startTyping,
    stopTyping,
    markMessageAsRead,
    
    // Loading states
    isSendingMessage: sendMessage.isPending,
    isCreatingChannel: createChannel.isPending,
    isCreatingDM: createDM.isPending,
    isTyping,
    
    // Current user
    currentUser: user,
  };
}

export default useChat;