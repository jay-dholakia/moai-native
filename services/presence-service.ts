import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { ServiceResponse } from './types';

export interface UserPresence {
  user_id: string;
  user_name: string;
  first_name?: string;
  last_name?: string;
  profile_image?: string;
  status: 'online' | 'away' | 'offline';
  last_seen: string;
  typing?: boolean;
  activity?: string; // current activity like 'viewing chat', 'composing message', etc.
  device?: 'mobile' | 'web' | 'desktop';
  location?: {
    channel_id?: string;
    channel_name?: string;
    channel_type?: 'moai' | 'buddy' | 'coach';
  };
}

export interface PresenceState {
  [userId: string]: UserPresence[];
}

export interface ActivityEvent {
  user_id: string;
  activity: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export class PresenceService {
  // Track active channels and their presence states
  private static activeChannels = new Map<string, RealtimeChannel>();
  private static presenceStates = new Map<string, PresenceState>();
  private static userActivities = new Map<string, ActivityEvent>();
  
  // Current user's presence info
  private static currentUserPresence: Partial<UserPresence> | null = null;
  
  // Activity tracking
  private static activityTimeouts = new Map<string, NodeJS.Timeout>();
  private static AWAY_TIMEOUT = 5 * 60 * 1000; // 5 minutes
  private static HEARTBEAT_INTERVAL = 30 * 1000; // 30 seconds

  /**
   * Initialize presence service for current user
   */
  static async initialize(): Promise<ServiceResponse<void>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('first_name, last_name, profile_image')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.warn('Could not fetch user profile for presence:', profileError);
      }

      // Set initial presence state
      this.currentUserPresence = {
        user_id: user.id,
        user_name: profile ? `${profile.first_name} ${profile.last_name}`.trim() : 'User',
        first_name: profile?.first_name,
        last_name: profile?.last_name,
        profile_image: profile?.profile_image,
        status: 'online',
        last_seen: new Date().toISOString(),
        device: 'mobile',
      };

      // Start heartbeat for presence updates
      this.startHeartbeat();

      // Setup app lifecycle handlers
      this.setupActivityListeners();

      return { success: true, data: undefined };
    } catch (error) {
      console.error('Error initializing presence service:', error);
      return { success: false, error: 'Failed to initialize presence service' };
    }
  }

  /**
   * Join a channel and track presence
   */
  static async joinChannel(
    channelId: string,
    channelName: string,
    channelType: 'moai' | 'buddy' | 'coach' = 'moai'
  ): Promise<ServiceResponse<void>> {
    try {
      if (!this.currentUserPresence) {
        const initResult = await this.initialize();
        if (!initResult.success) {
          return initResult;
        }
      }

      // Update current user's location
      const updatedPresence = {
        ...this.currentUserPresence!,
        location: {
          channel_id: channelId,
          channel_name: channelName,
          channel_type: channelType,
        },
        activity: `viewing ${channelType} chat`,
        last_seen: new Date().toISOString(),
      };

      this.currentUserPresence = updatedPresence;

      // Track activity
      this.trackActivity('joined_channel', {
        channel_id: channelId,
        channel_name: channelName,
        channel_type: channelType,
      });

      return { success: true, data: undefined };
    } catch (error) {
      console.error('Error joining channel:', error);
      return { success: false, error: 'Failed to join channel' };
    }
  }

  /**
   * Leave a channel
   */
  static async leaveChannel(channelId: string): Promise<ServiceResponse<void>> {
    try {
      if (!this.currentUserPresence) return { success: true, data: undefined };

      // Update current user's location
      const updatedPresence = {
        ...this.currentUserPresence,
        location: undefined,
        activity: 'browsing app',
        last_seen: new Date().toISOString(),
      };

      this.currentUserPresence = updatedPresence;

      // Track activity
      this.trackActivity('left_channel', {
        channel_id: channelId,
      });

      return { success: true, data: undefined };
    } catch (error) {
      console.error('Error leaving channel:', error);
      return { success: false, error: 'Failed to leave channel' };
    }
  }

  /**
   * Update current user's status
   */
  static async updateStatus(
    status: 'online' | 'away' | 'offline',
    activity?: string
  ): Promise<ServiceResponse<void>> {
    try {
      if (!this.currentUserPresence) return { success: false, error: 'Presence not initialized' };

      this.currentUserPresence = {
        ...this.currentUserPresence,
        status,
        activity: activity || this.currentUserPresence.activity,
        last_seen: new Date().toISOString(),
      };

      // Track activity
      this.trackActivity('status_change', {
        status,
        activity,
      });

      return { success: true, data: undefined };
    } catch (error) {
      console.error('Error updating status:', error);
      return { success: false, error: 'Failed to update status' };
    }
  }

  /**
   * Get current user's presence
   */
  static getCurrentUserPresence(): UserPresence | null {
    return this.currentUserPresence as UserPresence | null;
  }

  /**
   * Get online users for a channel
   */
  static getOnlineUsersForChannel(channelId: string): UserPresence[] {
    const presenceState = this.presenceStates.get(channelId);
    if (!presenceState) return [];

    const onlineUsers: UserPresence[] = [];
    for (const userId in presenceState) {
      const userPresences = presenceState[userId];
      if (userPresences && userPresences.length > 0) {
        const latestPresence = userPresences[0];
        
        // Consider user online if they were active in the last 5 minutes
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
        const lastSeenTime = new Date(latestPresence.last_seen).getTime();
        
        if (latestPresence.status === 'online' && lastSeenTime > fiveMinutesAgo) {
          onlineUsers.push(latestPresence);
        }
      }
    }

    return onlineUsers;
  }

  /**
   * Get all online users across all channels
   */
  static getAllOnlineUsers(): UserPresence[] {
    const allOnlineUsers = new Map<string, UserPresence>();

    for (const presenceState of this.presenceStates.values()) {
      for (const userId in presenceState) {
        const userPresences = presenceState[userId];
        if (userPresences && userPresences.length > 0) {
          const latestPresence = userPresences[0];
          
          // Consider user online if they were active in the last 5 minutes
          const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
          const lastSeenTime = new Date(latestPresence.last_seen).getTime();
          
          if (latestPresence.status === 'online' && lastSeenTime > fiveMinutesAgo) {
            // Keep the most recent presence if user appears in multiple channels
            const existing = allOnlineUsers.get(userId);
            if (!existing || new Date(latestPresence.last_seen) > new Date(existing.last_seen)) {
              allOnlineUsers.set(userId, latestPresence);
            }
          }
        }
      }
    }

    return Array.from(allOnlineUsers.values());
  }

  /**
   * Check if a specific user is online
   */
  static isUserOnline(userId: string): boolean {
    for (const presenceState of this.presenceStates.values()) {
      const userPresences = presenceState[userId];
      if (userPresences && userPresences.length > 0) {
        const latestPresence = userPresences[0];
        
        // Consider user online if they were active in the last 5 minutes
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
        const lastSeenTime = new Date(latestPresence.last_seen).getTime();
        
        if (latestPresence.status === 'online' && lastSeenTime > fiveMinutesAgo) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Get user's last seen time
   */
  static getUserLastSeen(userId: string): string | null {
    let lastSeen: string | null = null;
    let latestTime = 0;

    for (const presenceState of this.presenceStates.values()) {
      const userPresences = presenceState[userId];
      if (userPresences && userPresences.length > 0) {
        const presence = userPresences[0];
        const time = new Date(presence.last_seen).getTime();
        if (time > latestTime) {
          latestTime = time;
          lastSeen = presence.last_seen;
        }
      }
    }

    return lastSeen;
  }

  /**
   * Track user activity
   */
  static trackActivity(activity: string, metadata?: Record<string, any>): void {
    if (!this.currentUserPresence) return;

    const activityEvent: ActivityEvent = {
      user_id: this.currentUserPresence.user_id,
      activity,
      timestamp: new Date().toISOString(),
      metadata,
    };

    this.userActivities.set(this.currentUserPresence.user_id!, activityEvent);

    // Update current presence with activity
    this.currentUserPresence = {
      ...this.currentUserPresence,
      activity,
      status: 'online',
      last_seen: activityEvent.timestamp,
    };

    // Reset away timeout
    this.resetAwayTimeout();
  }

  /**
   * Handle presence updates from realtime
   */
  static handlePresenceUpdate(channelId: string, presenceState: PresenceState): void {
    this.presenceStates.set(channelId, presenceState);
  }

  /**
   * Start heartbeat to maintain online status
   */
  private static startHeartbeat(): void {
    setInterval(() => {
      if (this.currentUserPresence && this.currentUserPresence.status === 'online') {
        this.currentUserPresence = {
          ...this.currentUserPresence,
          last_seen: new Date().toISOString(),
        };
      }
    }, this.HEARTBEAT_INTERVAL);
  }

  /**
   * Setup activity listeners for app lifecycle
   */
  private static setupActivityListeners(): void {
    // Reset away timeout on any activity
    this.resetAwayTimeout();
  }

  /**
   * Reset the away timeout
   */
  private static resetAwayTimeout(): void {
    // Clear existing timeout
    const existingTimeout = this.activityTimeouts.get('away');
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set new timeout
    const timeout = setTimeout(() => {
      this.updateStatus('away', 'idle');
    }, this.AWAY_TIMEOUT) as NodeJS.Timeout;

    this.activityTimeouts.set('away', timeout);
  }

  /**
   * Get activity summary for analytics
   */
  static getActivitySummary(): { totalOnlineUsers: number; usersByChannel: Record<string, number> } {
    const allOnlineUsers = this.getAllOnlineUsers();
    const usersByChannel: Record<string, number> = {};

    for (const [channelId, presenceState] of this.presenceStates.entries()) {
      const onlineInChannel = this.getOnlineUsersForChannel(channelId);
      usersByChannel[channelId] = onlineInChannel.length;
    }

    return {
      totalOnlineUsers: allOnlineUsers.length,
      usersByChannel,
    };
  }

  /**
   * Cleanup presence service (call on app cleanup/logout)
   */
  static cleanup(): void {
    // Update status to offline
    if (this.currentUserPresence) {
      this.currentUserPresence = {
        ...this.currentUserPresence,
        status: 'offline',
        last_seen: new Date().toISOString(),
      };
    }

    // Clear all timeouts
    for (const timeout of this.activityTimeouts.values()) {
      clearTimeout(timeout);
    }
    this.activityTimeouts.clear();

    // Clear presence states
    this.presenceStates.clear();
    this.userActivities.clear();
    this.currentUserPresence = null;

    // Cleanup channels
    for (const channel of this.activeChannels.values()) {
      channel.unsubscribe();
    }
    this.activeChannels.clear();
  }

  /**
   * Format last seen time for display
   */
  static formatLastSeen(lastSeen: string): string {
    const lastSeenTime = new Date(lastSeen);
    const now = new Date();
    const diffInMs = now.getTime() - lastSeenTime.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    } else {
      return lastSeenTime.toLocaleDateString();
    }
  }

  /**
   * Get presence indicator color
   */
  static getPresenceColor(status: 'online' | 'away' | 'offline'): string {
    switch (status) {
      case 'online':
        return '#10B981'; // green
      case 'away':
        return '#F59E0B'; // yellow
      case 'offline':
      default:
        return '#6B7280'; // gray
    }
  }
}