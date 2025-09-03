import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { ReadReceiptsService, MessageReadStatus } from '@/services/read-receipts-service';
import { useAuth } from '@/hooks/useAuth';

export function useMessageReadReceipts(messageId: string | undefined) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch read receipts for a single message
  const { data: readReceipts, isLoading } = useQuery({
    queryKey: ['message-read-receipts', messageId],
    queryFn: () => ReadReceiptsService.getMessageReadReceipts(messageId!),
    enabled: !!messageId && !!user,
    select: (response) => response.success ? response.data : [],
  });

  // Mark message as read mutation
  const markAsRead = useMutation({
    mutationFn: (msgId: string) => ReadReceiptsService.markMessageAsRead(msgId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-read-receipts', messageId] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });

  // Subscribe to real-time updates
  useEffect(() => {
    if (!messageId || !user) return;

    const subscription = ReadReceiptsService.subscribeToMessageReadReceipts(
      messageId,
      () => {
        queryClient.invalidateQueries({ queryKey: ['message-read-receipts', messageId] });
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [messageId, user, queryClient]);

  return {
    readReceipts: readReceipts || [],
    isLoading,
    markAsRead: markAsRead.mutate,
    isMarkingRead: markAsRead.isPending,
  };
}

// Hook for batch read status (for message lists)
export function useBatchReadStatus(messageIds: string[], channelParticipants: string[]) {
  const { user } = useAuth();

  const { data: readStatusByMessage, isLoading } = useQuery({
    queryKey: ['message-read-status-batch', messageIds, channelParticipants],
    queryFn: () => ReadReceiptsService.getBatchMessageReadStatus(messageIds, channelParticipants),
    enabled: messageIds.length > 0 && channelParticipants.length > 0 && !!user,
    select: (response) => response.success ? response.data : {},
  });

  return {
    readStatusByMessage: readStatusByMessage || {},
    isLoading,
  };
}

// Hook for unread count in a channel
export function useUnreadCount(channelId: string | undefined, since?: string) {
  const { user } = useAuth();

  const { data: unreadCount, isLoading } = useQuery({
    queryKey: ['unread-count', channelId, since],
    queryFn: () => ReadReceiptsService.getUnreadMessageCount(channelId!, since),
    enabled: !!channelId && !!user,
    select: (response) => response.success ? response.data : 0,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  return {
    unreadCount: unreadCount || 0,
    isLoading,
  };
}

// Hook for auto-marking messages as read when they come into view
export function useAutoMarkAsRead(enabled: boolean = true) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const pendingMessages = useRef<Set<string>>(new Set());
  const timeoutRef = useRef<number | null>(null);

  const markMessageAsRead = async (messageId: string) => {
    if (!user || !enabled) return;

    pendingMessages.current.add(messageId);

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounce the marking to avoid excessive API calls
    timeoutRef.current = setTimeout(async () => {
      const messagesToMark = Array.from(pendingMessages.current);
      pendingMessages.current.clear();

      if (messagesToMark.length > 0) {
        const result = await ReadReceiptsService.markMessagesAsRead(messagesToMark);
        if (result.success) {
          // Invalidate relevant queries
          queryClient.invalidateQueries({ queryKey: ['message-read-receipts'] });
          queryClient.invalidateQueries({ queryKey: ['unread-count'] });
        }
      }
    }, 1000);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { markMessageAsRead };
}

// Hook for managing read receipts in a chat interface
export function useChatReadReceipts(channelId: string | undefined, channelParticipants: string[] = []) {
  const { user } = useAuth();
  const { markMessageAsRead } = useAutoMarkAsRead();
  
  // Get last read message for scroll position
  const { data: lastReadMessageId, error: lastReadError } = useQuery({
    queryKey: ['last-read-message', channelId],
    queryFn: () => ReadReceiptsService.getLastReadMessageId(channelId!),
    enabled: !!channelId && !!user,
    select: (response) => response.success ? response.data : null,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 60000, // Cache for 1 minute
  });

  // Log errors when they occur
  useEffect(() => {
    if (lastReadError) {
      console.error('Error fetching last read message:', lastReadError);
    }
  }, [lastReadError]);

  // Function to handle message visibility (call when message enters viewport)
  const handleMessageVisible = (messageId: string, messageUserId: string) => {
    // Don't mark own messages as read
    if (messageUserId === user?.id) return;
    
    markMessageAsRead(messageId);
  };

  return {
    lastReadMessageId,
    lastReadError,
    handleMessageVisible,
  };
}