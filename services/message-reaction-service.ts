import { supabase } from '@/lib/supabase';
import { ServiceResponse } from './types';

export interface MessageReaction {
  id: string;
  message_id: string;
  profile_id: string;
  emoji: string;
  created_at: string;
  profile?: {
    id: string;
    first_name: string;
    last_name: string;
    profile_image?: string;
  };
}

export interface MessageReactionCount {
  emoji: string;
  count: number;
  hasReacted: boolean;
  reactors: Array<{
    id: string;
    first_name: string;
    last_name: string;
    profile_image?: string;
  }>;
}

export class MessageReactionService {
  // Cache for optimistic updates
  private static optimisticReactions = new Map<string, MessageReaction[]>();
  
  /**
   * Get cached reactions for a message (includes optimistic updates)
   */
  static getCachedReactions(messageId: string): MessageReaction[] {
    return this.optimisticReactions.get(messageId) || [];
  }
  
  /**
   * Set cached reactions for a message
   */
  static setCachedReactions(messageId: string, reactions: MessageReaction[]) {
    this.optimisticReactions.set(messageId, reactions);
  }
  
  /**
   * Clear cached reactions for a message
   */
  static clearCachedReactions(messageId: string) {
    this.optimisticReactions.delete(messageId);
  }
  /**
   * Add a reaction to a message with optimistic updates
   */
  static async addReaction(
    messageId: string,
    emoji: string,
    optimistic: boolean = true
  ): Promise<ServiceResponse<MessageReaction>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Get user profile for optimistic update
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, profile_image')
        .eq('id', user.id)
        .single();

      // Create optimistic reaction
      const optimisticReaction: MessageReaction = {
        id: `temp-${Date.now()}`, // Temporary ID for optimistic update
        message_id: messageId,
        profile_id: user.id,
        emoji,
        created_at: new Date().toISOString(),
        profile: profile ? {
          id: user.id,
          first_name: profile.first_name,
          last_name: profile.last_name,
          profile_image: profile.profile_image,
        } : undefined,
      };

      // Apply optimistic update
      if (optimistic) {
        const currentReactions = this.getCachedReactions(messageId);
        // Check if user already reacted with this emoji
        const existingReaction = currentReactions.find(
          r => r.profile_id === user.id && r.emoji === emoji
        );
        
        if (existingReaction) {
          return { success: false, error: 'You have already reacted with this emoji' };
        }
        
        this.setCachedReactions(messageId, [...currentReactions, optimisticReaction]);
      }

      // Make the actual API call
      const { data, error } = await supabase
        .from('message_reactions')
        .insert({
          message_id: messageId,
          profile_id: user.id,
          emoji,
        })
        .select(`
          *,
          profile:profile_id (
            id,
            first_name,
            last_name,
            profile_image
          )
        `)
        .single();

      if (error) {
        // Rollback optimistic update on error
        if (optimistic) {
          const currentReactions = this.getCachedReactions(messageId);
          const rolledBackReactions = currentReactions.filter(r => r.id !== optimisticReaction.id);
          this.setCachedReactions(messageId, rolledBackReactions);
        }
        
        // Check if it's a unique constraint violation (user already reacted with this emoji)
        if (error.code === '23505') {
          return { success: false, error: 'You have already reacted with this emoji' };
        }
        console.error('Error adding reaction:', error);
        return { success: false, error: error.message };
      }

      // Update cache with real data
      if (optimistic && data) {
        const currentReactions = this.getCachedReactions(messageId);
        const updatedReactions = currentReactions.map(r => 
          r.id === optimisticReaction.id ? data : r
        );
        this.setCachedReactions(messageId, updatedReactions);
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error adding reaction:', error);
      return { success: false, error: 'Failed to add reaction' };
    }
  }

  /**
   * Remove a reaction from a message with optimistic updates
   */
  static async removeReaction(
    messageId: string,
    emoji: string,
    optimistic: boolean = true
  ): Promise<ServiceResponse<void>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      let removedReaction: MessageReaction | undefined;

      // Apply optimistic update
      if (optimistic) {
        const currentReactions = this.getCachedReactions(messageId);
        removedReaction = currentReactions.find(
          r => r.profile_id === user.id && r.emoji === emoji
        );
        
        if (removedReaction) {
          const updatedReactions = currentReactions.filter(
            r => !(r.profile_id === user.id && r.emoji === emoji)
          );
          this.setCachedReactions(messageId, updatedReactions);
        }
      }

      const { error } = await supabase
        .from('message_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('profile_id', user.id)
        .eq('emoji', emoji);

      if (error) {
        // Rollback optimistic update on error
        if (optimistic && removedReaction) {
          const currentReactions = this.getCachedReactions(messageId);
          this.setCachedReactions(messageId, [...currentReactions, removedReaction]);
        }
        
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
   * Toggle a reaction (add if not exists, remove if exists) with optimistic updates
   */
  static async toggleReaction(
    messageId: string,
    emoji: string
  ): Promise<ServiceResponse<{ added: boolean; reaction?: MessageReaction }>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Check if reaction exists in cache first (for better UX)
      const cachedReactions = this.getCachedReactions(messageId);
      const existingReaction = cachedReactions.find(
        r => r.profile_id === user.id && r.emoji === emoji
      );

      if (existingReaction) {
        // Remove reaction
        const removeResult = await this.removeReaction(messageId, emoji, true);
        if (!removeResult.success) {
          return { success: false, error: removeResult.error };
        }
        return { success: true, data: { added: false } };
      } else {
        // Add reaction
        const addResult = await this.addReaction(messageId, emoji, true);
        if (!addResult.success) {
          return { success: false, error: addResult.error };
        }
        return { success: true, data: { added: true, reaction: addResult.data } };
      }
    } catch (error) {
      console.error('Error toggling reaction:', error);
      return { success: false, error: 'Failed to toggle reaction' };
    }
  }

  /**
   * Get all reactions for a message (with cache integration)
   */
  static async getMessageReactions(
    messageId: string,
    useCache: boolean = true
  ): Promise<ServiceResponse<MessageReaction[]>> {
    try {
      // Return cached reactions if available and requested
      if (useCache) {
        const cachedReactions = this.getCachedReactions(messageId);
        if (cachedReactions.length > 0) {
          return { success: true, data: cachedReactions };
        }
      }
      
      const { data, error } = await supabase
        .from('message_reactions')
        .select(`
          *,
          profile:profile_id (
            id,
            first_name,
            last_name,
            profile_image
          )
        `)
        .eq('message_id', messageId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching reactions:', error);
        return { success: false, error: error.message };
      }

      // Update cache with fresh data
      const reactions = data || [];
      this.setCachedReactions(messageId, reactions);
      
      return { success: true, data: reactions };
    } catch (error) {
      console.error('Error fetching reactions:', error);
      return { success: false, error: 'Failed to fetch reactions' };
    }
  }

  /**
   * Get reaction counts for a message grouped by emoji (with cache integration)
   */
  static async getMessageReactionCounts(
    messageId: string,
    useCache: boolean = true
  ): Promise<ServiceResponse<MessageReactionCount[]>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Get all reactions for the message (using cache if available)
      const reactionsResult = await this.getMessageReactions(messageId, useCache);
      if (!reactionsResult.success) {
        return { success: false, error: reactionsResult.error };
      }

      // Group reactions by emoji
      const reactionMap = new Map<string, MessageReactionCount>();
      
      reactionsResult.data.forEach((reaction) => {
        if (!reactionMap.has(reaction.emoji)) {
          reactionMap.set(reaction.emoji, {
            emoji: reaction.emoji,
            count: 0,
            hasReacted: false,
            reactors: [],
          });
        }

        const reactionCount = reactionMap.get(reaction.emoji)!;
        reactionCount.count++;
        
        if (reaction.profile_id === user.id) {
          reactionCount.hasReacted = true;
        }

        if (reaction.profile) {
          reactionCount.reactors.push(reaction.profile);
        }
      });

      return { success: true, data: Array.from(reactionMap.values()) };
    } catch (error) {
      console.error('Error fetching reaction counts:', error);
      return { success: false, error: 'Failed to fetch reaction counts' };
    }
  }

  /**
   * Get reactions for multiple messages (optimized for chat lists)
   */
  static async getBatchMessageReactions(
    messageIds: string[]
  ): Promise<ServiceResponse<Record<string, MessageReactionCount[]>>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      if (messageIds.length === 0) {
        return { success: true, data: {} };
      }

      const { data, error } = await supabase
        .from('message_reactions')
        .select(`
          *,
          profile:profile_id (
            id,
            first_name,
            last_name,
            profile_image
          )
        `)
        .in('message_id', messageIds);

      if (error) {
        console.error('Error fetching batch reactions:', error);
        return { success: false, error: error.message };
      }

      // Group reactions by message_id and then by emoji
      const reactionsByMessage: Record<string, Map<string, MessageReactionCount>> = {};

      (data || []).forEach((reaction) => {
        if (!reactionsByMessage[reaction.message_id]) {
          reactionsByMessage[reaction.message_id] = new Map();
        }

        const messageReactions = reactionsByMessage[reaction.message_id];
        
        if (!messageReactions.has(reaction.emoji)) {
          messageReactions.set(reaction.emoji, {
            emoji: reaction.emoji,
            count: 0,
            hasReacted: false,
            reactors: [],
          });
        }

        const reactionCount = messageReactions.get(reaction.emoji)!;
        reactionCount.count++;
        
        if (reaction.profile_id === user.id) {
          reactionCount.hasReacted = true;
        }

        if (reaction.profile) {
          reactionCount.reactors.push(reaction.profile);
        }
      });

      // Convert maps to arrays
      const result: Record<string, MessageReactionCount[]> = {};
      Object.entries(reactionsByMessage).forEach(([messageId, reactions]) => {
        result[messageId] = Array.from(reactions.values());
      });

      return { success: true, data: result };
    } catch (error) {
      console.error('Error fetching batch reactions:', error);
      return { success: false, error: 'Failed to fetch batch reactions' };
    }
  }

  /**
   * Update reactions from realtime event (called by ChatService)
   */
  static handleReactionUpdate(
    messageId: string,
    reactionUpdate: { eventType: 'INSERT' | 'DELETE'; [key: string]: any }
  ) {
    const currentReactions = this.getCachedReactions(messageId);
    
    if (reactionUpdate.eventType === 'INSERT') {
      // Add new reaction (avoid duplicates)
      const existingIndex = currentReactions.findIndex(
        r => r.profile_id === reactionUpdate.profile_id && r.emoji === reactionUpdate.emoji
      );
      
      if (existingIndex === -1) {
        const newReaction: MessageReaction = {
          id: reactionUpdate.id,
          message_id: reactionUpdate.message_id,
          profile_id: reactionUpdate.profile_id,
          emoji: reactionUpdate.emoji,
          created_at: reactionUpdate.created_at,
          profile: reactionUpdate.profile,
        };
        this.setCachedReactions(messageId, [...currentReactions, newReaction]);
      }
    } else if (reactionUpdate.eventType === 'DELETE') {
      // Remove reaction
      const updatedReactions = currentReactions.filter(
        r => !(r.profile_id === reactionUpdate.profile_id && 
               r.emoji === reactionUpdate.emoji && 
               r.message_id === reactionUpdate.message_id)
      );
      this.setCachedReactions(messageId, updatedReactions);
    }
  }
  
  /**
   * Subscribe to reaction changes for a message (deprecated - use ChatService instead)
   * @deprecated Use ChatService.subscribeToChannelMessages with onReaction callback
   */
  static subscribeToMessageReactions(
    messageId: string,
    onUpdate: (reactions: MessageReaction[]) => void
  ) {
    console.warn('MessageReactionService.subscribeToMessageReactions is deprecated. Use ChatService.subscribeToChannelMessages instead.');
    
    const subscription = supabase
      .channel(`message_reactions:${messageId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_reactions',
          filter: `message_id=eq.${messageId}`,
        },
        async () => {
          // Fetch updated reactions
          const result = await this.getMessageReactions(messageId);
          if (result.success) {
            this.setCachedReactions(messageId, result.data);
            onUpdate(result.data);
          }
        }
      )
      .subscribe();

    return subscription;
  }
  
  /**
   * Sync cached reactions with database (useful for reconciliation)
   */
  static async syncReactions(messageIds: string[]): Promise<void> {
    try {
      const batchResult = await this.getBatchMessageReactions(messageIds);
      if (batchResult.success) {
        // Clear cache and rebuild from fresh data
        messageIds.forEach(messageId => {
          this.clearCachedReactions(messageId);
        });
        
        // This would need to be implemented to convert reaction counts back to reactions
        // For now, we'll rely on the realtime updates
      }
    } catch (error) {
      console.error('Error syncing reactions:', error);
    }
  }
}