import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface MoaiRealtimeEvent {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: any;
  old: any;
  table: string;
}

export function useMoaiRealtime() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { showToast } = useToast();
  const subscriptionsRef = useRef<{ [key: string]: any }>({});

  useEffect(() => {
    if (!user?.id) return;

    // Subscribe to MOAI member changes
    const moaiMemberSubscription = supabase
      .channel('moai-members-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'moai_members',
        },
        (payload) => {
          console.log('📡 [REALTIME] MOAI member change:', payload);
          
          // Show toast notification for relevant events
          if (payload.eventType === 'INSERT' && payload.new?.profile_id !== user.id) {
            // Someone joined a moai
            showToast({
              type: 'info',
              title: 'New Member',
              description: 'Someone joined your Moai!',
            });
          } else if (payload.eventType === 'UPDATE' && payload.new?.is_active === false && payload.old?.is_active === true) {
            // Someone left a moai
            if (payload.old?.profile_id !== user.id) {
              showToast({
                type: 'info',
                title: 'Member Left',
                description: 'A member left the Moai.',
              });
            }
          }
          
          // Invalidate affected queries
          if (payload.new?.moai_id) {
            queryClient.invalidateQueries({ queryKey: ['moaiMembers', payload.new.moai_id] });
            queryClient.invalidateQueries({ queryKey: ['moai', payload.new.moai_id] });
          }
          
          if (payload.old?.moai_id) {
            queryClient.invalidateQueries({ queryKey: ['moaiMembers', payload.old.moai_id] });
            queryClient.invalidateQueries({ queryKey: ['moai', payload.old.moai_id] });
          }

          // Invalidate user's moais list if it affects the current user
          if (payload.new?.profile_id === user.id || payload.old?.profile_id === user.id) {
            queryClient.invalidateQueries({ queryKey: ['userMoais', user.id] });
          }
        }
      )
      .subscribe();

    // Subscribe to MOAI updates
    const moaiSubscription = supabase
      .channel('moais-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'moais',
        },
        (payload) => {
          console.log('📡 [REALTIME] MOAI change:', payload);
          
          // Update specific moai cache
          if (payload.new?.id) {
            queryClient.invalidateQueries({ queryKey: ['moai', payload.new.id] });
          }
          
          if (payload.old?.id) {
            queryClient.invalidateQueries({ queryKey: ['moai', payload.old.id] });
          }

          // Invalidate moais list
          queryClient.invalidateQueries({ queryKey: ['moais'] });
          
          // If it's a moai the user is part of, invalidate user moais
          queryClient.invalidateQueries({ queryKey: ['userMoais'] });
        }
      )
      .subscribe();

    // Subscribe to invitation changes
    const invitationSubscription = supabase
      .channel('invitations-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'moai_invitations',
        },
        (payload) => {
          console.log('📡 [REALTIME] Invitation change:', payload);
          
          // Invalidate invitation queries for the affected moai
          if (payload.new?.moai_id) {
            queryClient.invalidateQueries({ queryKey: ['moaiInvitations', payload.new.moai_id] });
          }
          
          if (payload.old?.moai_id) {
            queryClient.invalidateQueries({ queryKey: ['moaiInvitations', payload.old.moai_id] });
          }
        }
      )
      .subscribe();

    subscriptionsRef.current = {
      moaiMemberSubscription,
      moaiSubscription,
      invitationSubscription,
    };

    return () => {
      // Cleanup subscriptions
      Object.values(subscriptionsRef.current).forEach((subscription) => {
        if (subscription?.unsubscribe) {
          subscription.unsubscribe();
        }
      });
      subscriptionsRef.current = {};
    };
  }, [user?.id, queryClient]);

  return {
    isConnected: Object.keys(subscriptionsRef.current).length > 0,
  };
}

// Hook for subscribing to a specific MOAI's real-time updates
export function useMoaiRealtimeById(moaiId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const subscriptionRef = useRef<any>(null);

  useEffect(() => {
    if (!moaiId || !user?.id) return;

    // Subscribe to changes for this specific MOAI
    const subscription = supabase
      .channel(`moai-${moaiId}-realtime`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'moai_members',
          filter: `moai_id=eq.${moaiId}`,
        },
        (payload) => {
          console.log(`📡 [REALTIME] MOAI ${moaiId} member change:`, payload);
          
          // Invalidate this moai's data
          queryClient.invalidateQueries({ queryKey: ['moai', moaiId] });
          queryClient.invalidateQueries({ queryKey: ['moaiMembers', moaiId] });
          queryClient.invalidateQueries({ queryKey: ['canJoinMoai', moaiId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'moais',
          filter: `id=eq.${moaiId}`,
        },
        (payload) => {
          console.log(`📡 [REALTIME] MOAI ${moaiId} update:`, payload);
          
          // Update the moai cache directly if possible
          queryClient.setQueryData(['moai', moaiId], (oldData: any) => {
            if (oldData) {
              return { ...oldData, ...payload.new };
            }
            return oldData;
          });
          
          // Also invalidate to ensure fresh data
          queryClient.invalidateQueries({ queryKey: ['moai', moaiId] });
        }
      )
      .subscribe();

    subscriptionRef.current = subscription;

    return () => {
      if (subscriptionRef.current?.unsubscribe) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [moaiId, user?.id, queryClient]);

  return {
    isConnected: !!subscriptionRef.current,
  };
}