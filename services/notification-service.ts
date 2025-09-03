import { BaseService } from './base-service';
import { ServiceResponse } from './types';

export type Notification = {
  id: string;
  profile_id: string;
  type: string;
  content: string;
  related_entity_id?: string;
  is_read: boolean;
  created_at: string;
};

export type NotificationWithDetails = Notification & {
  moai?: any;
  activity_log?: any;
  profile?: {
    id: string;
    first_name: string;
    last_name: string;
    profile_image?: string;
  };
};

export type NotificationType = 
  | 'activity_tag'
  | 'moai_invitation'
  | 'moai_join'
  | 'activity_like'
  | 'badge_earned'
  | 'friend_request'
  | 'workout_completed'
  | 'milestone_reached';

export class NotificationService extends BaseService {
  // Fetch user notifications
  static async fetchUserNotifications(userId: string): Promise<ServiceResponse<NotificationWithDetails[]>> {
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .select('*')
        .eq('profile_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error fetching notifications:", error);
        return { success: false, error: error.message };
      }

      // Enhance notifications with related data
      const notificationsWithDetails = await Promise.all(
        (data || []).map(async (notification) => {
          return await this.enhanceNotificationWithDetails(notification);
        })
      );

      return { success: true, data: notificationsWithDetails as NotificationWithDetails[] };
    } catch (error: any) {
      console.error("Error fetching notifications:", error);
      return { success: false, error: 'Failed to fetch notifications' };
    }
  }

  // Enhance notification with related details
  private static async enhanceNotificationWithDetails(notification: Notification): Promise<NotificationWithDetails> {
    try {
      let enhancedNotification: NotificationWithDetails = { ...notification };

      // Fetch activity log details for activity-related notifications
      if (notification.type === 'activity_tag' && notification.related_entity_id) {
        const { data: activityData } = await this.supabase
          .from('activity_logs')
          .select(`
            id,
            activity_type,
            emoji,
            logged_at,
            notes,
            profiles!activity_logs_profile_id_fkey(
              id,
              first_name,
              last_name,
              profile_image
            )
          `)
          .eq('id', notification.related_entity_id)
          .single();
        
        if (activityData) {
          enhancedNotification.activity_log = activityData;
        }
      }

      // Fetch moai details for moai-related notifications
      if ((notification.type === 'moai_invitation' || notification.type === 'moai_join') && 
          notification.related_entity_id) {
        const { data: moaiData } = await this.supabase
          .from('moais')
          .select(`
            id,
            name,
            description,
            creator_id,
            profiles!moais_creator_id_fkey(
              id,
              first_name,
              last_name,
              profile_image
            )
          `)
          .eq('id', notification.related_entity_id)
          .single();
        
        if (moaiData) {
          enhancedNotification.moai = moaiData;
        }
      }

      return enhancedNotification;
    } catch (error) {
      console.error('Error enhancing notification with details:', error);
      return notification;
    }
  }

  // Mark notification as read
  static async markNotificationAsRead(notificationId: string): Promise<ServiceResponse<void>> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
      
      if (error) {
        console.error("Error marking notification as read:", error);
        return { success: false, error: error.message };
      }

      return { success: true, data: undefined };
    } catch (error: any) {
      console.error("Error marking notification as read:", error);
      return { success: false, error: 'Failed to mark notification as read' };
    }
  }

  // Mark all notifications as read
  static async markAllNotificationsAsRead(userId: string): Promise<ServiceResponse<void>> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('profile_id', userId)
        .eq('is_read', false);
      
      if (error) {
        console.error("Error marking all notifications as read:", error);
        return { success: false, error: error.message };
      }

      return { success: true, data: undefined };
    } catch (error: any) {
      console.error("Error marking all notifications as read:", error);
      return { success: false, error: 'Failed to mark all notifications as read' };
    }
  }

  // Create a new notification
  static async createNotification(
    profileId: string,
    type: NotificationType,
    content: string,
    relatedEntityId?: string
  ): Promise<ServiceResponse<Notification>> {
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .insert({
          profile_id: profileId,
          type,
          content,
          related_entity_id: relatedEntityId,
          is_read: false,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating notification:", error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data as Notification };
    } catch (error: any) {
      console.error("Error creating notification:", error);
      return { success: false, error: 'Failed to create notification' };
    }
  }

  // Get unread notification count
  static async getUnreadCount(userId: string): Promise<ServiceResponse<number>> {
    try {
      const { count, error } = await this.supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error("Error getting unread count:", error);
        return { success: false, error: error.message };
      }

      return { success: true, data: count || 0 };
    } catch (error: any) {
      console.error("Error getting unread count:", error);
      return { success: false, error: 'Failed to get unread count' };
    }
  }

  // Delete notification
  static async deleteNotification(notificationId: string): Promise<ServiceResponse<void>> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        console.error("Error deleting notification:", error);
        return { success: false, error: error.message };
      }

      return { success: true, data: undefined };
    } catch (error: any) {
      console.error("Error deleting notification:", error);
      return { success: false, error: 'Failed to delete notification' };
    }
  }

  // Subscribe to real-time notification updates
  static subscribeToNotifications(
    userId: string,
    onNotification: (notification: Notification) => void,
    onError?: (error: any) => void
  ) {
    const channel = this.supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `profile_id=eq.${userId}`,
        },
        (payload) => {
          console.log('New notification received:', payload);
          onNotification(payload.new as Notification);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `profile_id=eq.${userId}`,
        },
        (payload) => {
          console.log('Notification updated:', payload);
          // Handle notification updates if needed
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to notifications');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Failed to subscribe to notifications');
          onError?.(new Error('Failed to subscribe to notifications'));
        }
      });

    return () => {
      this.supabase.removeChannel(channel);
    };
  }
}