import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback } from 'react';
import { NotificationService, NotificationWithDetails, Notification, NotificationType } from '@/services/notification-service';
import { useAuth } from './useAuth';

export function useNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const response = await NotificationService.fetchUserNotifications(user.id);
      return response.success ? response.data : [];
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = NotificationService.subscribeToNotifications(
      user.id,
      (newNotification: Notification) => {
        // Add new notification to the cache
        queryClient.setQueryData(['notifications', user.id], (oldData: NotificationWithDetails[] = []) => {
          return [newNotification as NotificationWithDetails, ...oldData];
        });
        
        // Invalidate unread count
        queryClient.invalidateQueries({ queryKey: ['unread-count', user.id] });
      },
      (error) => {
        console.error('Notification subscription error:', error);
      }
    );

    return unsubscribe;
  }, [user?.id, queryClient]);

  return query;
}

export function useUnreadCount() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['unread-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const response = await NotificationService.getUnreadCount(user.id);
      return response.success ? response.data : 0;
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await NotificationService.markNotificationAsRead(notificationId);
      if (!response.success) {
        throw new Error(response.error);
      }
      return response;
    },
    onSuccess: () => {
      // Update the notification in cache
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['unread-count', user?.id] });
    },
  });
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      const response = await NotificationService.markAllNotificationsAsRead(user.id);
      if (!response.success) {
        throw new Error(response.error);
      }
      return response;
    },
    onSuccess: () => {
      // Update all notifications as read in cache
      queryClient.setQueryData(['notifications', user?.id], (oldData: NotificationWithDetails[] = []) => {
        return oldData.map(notification => ({ ...notification, is_read: true }));
      });
      
      // Reset unread count
      queryClient.setQueryData(['unread-count', user?.id], 0);
    },
  });
}

export function useCreateNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      profileId: string;
      type: NotificationType;
      content: string;
      relatedEntityId?: string;
    }) => {
      const response = await NotificationService.createNotification(
        params.profileId,
        params.type,
        params.content,
        params.relatedEntityId
      );
      if (!response.success) {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: (newNotification, variables) => {
      // Update notifications for the target user
      queryClient.invalidateQueries({ queryKey: ['notifications', variables.profileId] });
      queryClient.invalidateQueries({ queryKey: ['unread-count', variables.profileId] });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await NotificationService.deleteNotification(notificationId);
      if (!response.success) {
        throw new Error(response.error);
      }
      return response;
    },
    onSuccess: () => {
      // Remove notification from cache
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['unread-count', user?.id] });
    },
  });
}

// Combined hook for notification management
export function useNotificationManager() {
  const notifications = useNotifications();
  const unreadCount = useUnreadCount();
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();
  const createNotification = useCreateNotification();
  const deleteNotification = useDeleteNotification();

  const handleNotificationPress = useCallback((notification: NotificationWithDetails) => {
    if (!notification.is_read) {
      markAsRead.mutate(notification.id);
    }
    
    // Handle navigation based on notification type
    switch (notification.type) {
      case 'activity_tag':
        // Navigate to activity detail
        break;
      case 'moai_invitation':
        // Navigate to moai invitation
        break;
      case 'friend_request':
        // Navigate to friends/profile
        break;
      default:
        // Default handling
        break;
    }
  }, [markAsRead]);

  return {
    // Data
    notifications: notifications.data ?? [],
    unreadCount: unreadCount.data ?? 0,
    
    // Loading states
    isLoading: notifications.isLoading || unreadCount.isLoading,
    isMarkingAsRead: markAsRead.isPending,
    isMarkingAllAsRead: markAllAsRead.isPending,
    isCreating: createNotification.isPending,
    isDeleting: deleteNotification.isPending,
    
    // Actions
    markAsRead: markAsRead.mutate,
    markAllAsRead: markAllAsRead.mutate,
    createNotification: createNotification.mutate,
    deleteNotification: deleteNotification.mutate,
    handleNotificationPress,
    
    // Refetch
    refetch: () => {
      notifications.refetch();
      unreadCount.refetch();
    },
  };
}