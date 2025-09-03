import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface TypingUser {
  user_id: string;
  first_name: string;
  last_name: string;
  profile_image?: string;
  timestamp: number;
}

export interface TypingIndicatorData {
  channel_id: string;
  user_id: string;
  user_name: string;
  profile_image?: string;
  is_typing: boolean;
  timestamp: number;
}

export class TypingIndicatorService {
  private static channels: Map<string, RealtimeChannel> = new Map();
  private static typingTimeouts: Map<string, number> = new Map();
  private static presenceStates: Map<string, Map<string, TypingUser>> = new Map();
  private static TYPING_TIMEOUT = 3000; // 3 seconds
  
  /**
   * Get typing users from cache for a channel
   */
  static getTypingUsers(channelId: string): TypingUser[] {
    const channelTypingUsers = this.presenceStates.get(channelId);
    if (!channelTypingUsers) return [];
    
    // Clean up old typing indicators (older than 5 seconds)
    const now = Date.now();
    for (const [userId, typingUser] of channelTypingUsers.entries()) {
      if (now - typingUser.timestamp > 5000) {
        channelTypingUsers.delete(userId);
      }
    }
    
    return Array.from(channelTypingUsers.values());
  }
  
  /**
   * Add typing user to cache
   */
  static addTypingUser(channelId: string, user: TypingUser) {
    if (!this.presenceStates.has(channelId)) {
      this.presenceStates.set(channelId, new Map());
    }
    const channelTypingUsers = this.presenceStates.get(channelId)!;
    channelTypingUsers.set(user.user_id, user);
  }
  
  /**
   * Remove typing user from cache
   */
  static removeTypingUser(channelId: string, userId: string) {
    const channelTypingUsers = this.presenceStates.get(channelId);
    if (channelTypingUsers) {
      channelTypingUsers.delete(userId);
    }
  }

  /**
   * Start typing indicator for a channel with presence integration
   */
  static async startTyping(channelId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user profile for display info
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, profile_image')
        .eq('id', user.id)
        .single();

      const userName = profile ? `${profile.first_name} ${profile.last_name}`.trim() : 'User';
      
      // Use the shared channel from ChatService if available
      // This is more efficient as it reuses the existing connection
      const ChatService = await import('./chat-service');
      await ChatService.ChatService.broadcastTyping(channelId, true);
      
      // Also update local presence state
      const typingUser: TypingUser = {
        user_id: user.id,
        first_name: profile?.first_name || '',
        last_name: profile?.last_name || '',
        profile_image: profile?.profile_image,
        timestamp: Date.now(),
      };
      this.addTypingUser(channelId, typingUser);

      // Clear any existing timeout
      const timeoutKey = `${channelId}-${user.id}`;
      const existingTimeout = this.typingTimeouts.get(timeoutKey);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      // Auto-stop typing after timeout
      const timeout = setTimeout(() => {
        this.stopTyping(channelId);
      }, this.TYPING_TIMEOUT);

      this.typingTimeouts.set(timeoutKey, timeout);
    } catch (error) {
      console.error('Error starting typing indicator:', error);
    }
  }

  /**
   * Stop typing indicator for a channel with presence integration
   */
  static async stopTyping(channelId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Use the shared channel from ChatService if available
      const ChatService = await import('./chat-service');
      await ChatService.ChatService.broadcastTyping(channelId, false);
      
      // Remove from local presence state
      this.removeTypingUser(channelId, user.id);

      // Clear timeout
      const timeoutKey = `${channelId}-${user.id}`;
      const existingTimeout = this.typingTimeouts.get(timeoutKey);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
        this.typingTimeouts.delete(timeoutKey);
      }
    } catch (error) {
      console.error('Error stopping typing indicator:', error);
    }
  }

  /**
   * Handle typing update from realtime event (called by ChatService)
   */
  static handleTypingUpdate(
    channelId: string,
    userId: string,
    userName: string,
    isTyping: boolean,
    profileImage?: string
  ) {
    if (isTyping) {
      const typingUser: TypingUser = {
        user_id: userId,
        first_name: userName.split(' ')[0] || '',
        last_name: userName.split(' ')[1] || '',
        profile_image: profileImage,
        timestamp: Date.now(),
      };
      this.addTypingUser(channelId, typingUser);
    } else {
      this.removeTypingUser(channelId, userId);
    }
  }
  
  /**
   * Subscribe to typing indicators for a channel (deprecated - use ChatService instead)
   * @deprecated Use ChatService.subscribeToChannelMessages with onTyping callback
   */
  static subscribeToTyping(
    channelId: string,
    onTypingUpdate: (typingUsers: TypingUser[]) => void
  ): RealtimeChannel {
    console.warn('TypingIndicatorService.subscribeToTyping is deprecated. Use ChatService.subscribeToChannelMessages instead.');
    
    const channel = this.getOrCreateChannel(channelId);
    const typingUsers = new Map<string, TypingUser>();

    // Listen for typing events
    channel.on('broadcast', { event: 'typing' }, async (payload) => {
      const data = payload.payload as TypingIndicatorData;
      
      // Don't show current user's typing indicator
      const { data: { user } } = await supabase.auth.getUser();
      if (data.user_id === user?.id) return;

      if (data.is_typing) {
        // Add or update typing user
        typingUsers.set(data.user_id, {
          user_id: data.user_id,
          first_name: data.user_name.split(' ')[0] || '',
          last_name: data.user_name.split(' ')[1] || '',
          profile_image: data.profile_image,
          timestamp: data.timestamp,
        });
        this.addTypingUser(channelId, {
          user_id: data.user_id,
          first_name: data.user_name.split(' ')[0] || '',
          last_name: data.user_name.split(' ')[1] || '',
          profile_image: data.profile_image,
          timestamp: data.timestamp,
        });
      } else {
        // Remove typing user
        typingUsers.delete(data.user_id);
        this.removeTypingUser(channelId, data.user_id);
      }

      // Clean up old typing indicators (older than 5 seconds)
      const now = Date.now();
      for (const [userId, typingUser] of typingUsers.entries()) {
        if (now - typingUser.timestamp > 5000) {
          typingUsers.delete(userId);
          this.removeTypingUser(channelId, userId);
        }
      }

      // Notify subscribers
      onTypingUpdate(Array.from(typingUsers.values()));
    });

    return channel;
  }

  /**
   * Get or create a realtime channel for typing indicators (legacy support)
   */
  private static getOrCreateChannel(channelId: string): RealtimeChannel {
    const channelKey = `typing-${channelId}`;
    
    if (!this.channels.has(channelKey)) {
      const channel = supabase.channel(channelKey, {
        config: {
          broadcast: { self: true },
          presence: {
            key: channelId,
          },
        },
      });
      
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Typing indicator channel ${channelKey} subscribed`);
        }
      });

      this.channels.set(channelKey, channel);
    }

    return this.channels.get(channelKey)!;
  }

  /**
   * Cleanup typing indicator channel
   */
  static async cleanup(channelId: string): Promise<void> {
    const channelKey = `typing-${channelId}`;
    const channel = this.channels.get(channelKey);
    
    if (channel) {
      channel.unsubscribe();
      this.channels.delete(channelKey);
    }

    // Clear presence state for this channel
    this.presenceStates.delete(channelId);

    // Clear any timeouts for this channel
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const timeoutKey = `${channelId}-${user.id}`;
      const timeout = this.typingTimeouts.get(timeoutKey);
      if (timeout) {
        clearTimeout(timeout);
        this.typingTimeouts.delete(timeoutKey);
      }
    }
  }

  /**
   * Cleanup all typing indicators (call on app cleanup)
   */
  static cleanupAll(): void {
    // Unsubscribe from all channels
    for (const channel of this.channels.values()) {
      channel.unsubscribe();
    }
    this.channels.clear();

    // Clear all presence states
    this.presenceStates.clear();

    // Clear all timeouts
    for (const timeout of this.typingTimeouts.values()) {
      clearTimeout(timeout);
    }
    this.typingTimeouts.clear();
  }
  
  /**
   * Debounced typing indicator for better UX
   */
  static debouncedStartTyping = (() => {
    let timeout: NodeJS.Timeout;
    return (channelId: string, delay: number = 300) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        this.startTyping(channelId);
      }, delay) as NodeJS.Timeout;
    };
  })();
  
  /**
   * Get typing indicator display text
   */
  static getTypingText(channelId: string): string {
    const typingUsers = this.getTypingUsers(channelId);
    if (typingUsers.length === 0) return '';
    
    if (typingUsers.length === 1) {
      const user = typingUsers[0];
      const name = user.first_name || 'Someone';
      return `${name} is typing...`;
    } else if (typingUsers.length === 2) {
      const names = typingUsers.map(u => u.first_name || 'Someone');
      return `${names[0]} and ${names[1]} are typing...`;
    } else {
      return `${typingUsers.length} people are typing...`;
    }
  }
}