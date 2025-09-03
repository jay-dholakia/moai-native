import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { MessageReactionService, MessageReactionCount } from '@/services/message-reaction-service';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export function useMessageReactions(messageId: string | undefined) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch reactions for a single message
  const { data: reactions, isLoading } = useQuery({
    queryKey: ['message-reactions', messageId],
    queryFn: () => MessageReactionService.getMessageReactionCounts(messageId!),
    enabled: !!messageId && !!user,
    select: (response) => response.success ? response.data : [],
  });

  // Toggle reaction mutation
  const toggleReaction = useMutation({
    mutationFn: (emoji: string) => 
      MessageReactionService.toggleReaction(messageId!, emoji),
    onMutate: async (emoji) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['message-reactions', messageId] });

      // Snapshot the previous value
      const previousReactions = queryClient.getQueryData(['message-reactions', messageId]);

      // Optimistically update
      queryClient.setQueryData(['message-reactions', messageId], (old: any) => {
        if (!old?.success) return old;

        const reactions = [...(old.data || [])] as MessageReactionCount[];
        const existingIndex = reactions.findIndex((r) => r.emoji === emoji);

        if (existingIndex >= 0) {
          const existing = reactions[existingIndex];
          if (existing.hasReacted) {
            // Remove reaction
            if (existing.count === 1) {
              reactions.splice(existingIndex, 1);
            } else {
              reactions[existingIndex] = {
                ...existing,
                count: existing.count - 1,
                hasReacted: false,
                reactors: existing.reactors.filter((r) => r.id !== user?.id),
              };
            }
          } else {
            // Add reaction
            reactions[existingIndex] = {
              ...existing,
              count: existing.count + 1,
              hasReacted: true,
              reactors: [...existing.reactors, {
                id: user!.id,
                first_name: user!.user_metadata?.first_name || '',
                last_name: user!.user_metadata?.last_name || '',
                profile_image: user!.user_metadata?.profile_image,
              }],
            };
          }
        } else {
          // New reaction
          reactions.push({
            emoji,
            count: 1,
            hasReacted: true,
            reactors: [{
              id: user!.id,
              first_name: user!.user_metadata?.first_name || '',
              last_name: user!.user_metadata?.last_name || '',
              profile_image: user!.user_metadata?.profile_image,
            }],
          });
        }

        return { ...old, data: reactions };
      });

      return { previousReactions };
    },
    onError: (err, emoji, context) => {
      // Revert the optimistic update
      queryClient.setQueryData(['message-reactions', messageId], context?.previousReactions);
      
      toast({
        title: 'Failed to update reaction',
        description: 'Please try again',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['message-reactions', messageId] });
    },
  });

  // Subscribe to real-time updates
  useEffect(() => {
    if (!messageId || !user) return;

    const subscription = MessageReactionService.subscribeToMessageReactions(
      messageId,
      () => {
        queryClient.invalidateQueries({ queryKey: ['message-reactions', messageId] });
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [messageId, user, queryClient]);

  return {
    reactions: reactions || [],
    isLoading,
    toggleReaction: toggleReaction.mutate,
    isToggling: toggleReaction.isPending,
  };
}

// Hook for batch loading reactions (for message lists)
export function useBatchMessageReactions(messageIds: string[]) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: reactionsByMessage, isLoading } = useQuery({
    queryKey: ['message-reactions-batch', messageIds],
    queryFn: () => MessageReactionService.getBatchMessageReactions(messageIds),
    enabled: messageIds.length > 0 && !!user,
    select: (response) => response.success ? response.data : {},
  });

  return {
    reactionsByMessage: reactionsByMessage || {},
    isLoading,
  };
}