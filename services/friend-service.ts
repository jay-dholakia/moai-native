import { supabase } from '@/lib/supabase';
import { ServiceResponse } from './types';

export interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  updated_at: string;
  sender?: {
    id: string;
    first_name: string;
    last_name: string;
    profile_image?: string;
    total_activities_logged?: number;
  };
  receiver?: {
    id: string;
    first_name: string;
    last_name: string;
    profile_image?: string;
    total_activities_logged?: number;
  };
}

export interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  created_at: string;
  friend?: {
    id: string;
    first_name: string;
    last_name: string;
    profile_image?: string;
    total_activities_logged?: number;
  };
}

export interface FriendProfile {
  id: string;
  first_name: string;
  last_name: string;
  profile_image?: string;
  total_activities_logged?: number;
  mutual_friends_count?: number;
  friendship_status?: 'friends' | 'pending_sent' | 'pending_received' | 'not_friends';
  last_activity_at?: string;
}

export class FriendService {
  /**
   * Send a friend request
   */
  static async sendFriendRequest(
    receiverId: string
  ): Promise<ServiceResponse<FriendRequest>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      if (user.id === receiverId) {
        return { success: false, error: 'Cannot send friend request to yourself' };
      }

      // Check if request already exists
      const { data: existing } = await supabase
        .from('friend_requests')
        .select('id, status')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${user.id})`)
        .single();

      if (existing) {
        if (existing.status === 'pending') {
          return { success: false, error: 'Friend request already sent' };
        }
        if (existing.status === 'accepted') {
          return { success: false, error: 'Already friends' };
        }
      }

      // Check if they're already friends
      const { data: friendship } = await supabase
        .from('friendships')
        .select('id')
        .or(`and(user_id.eq.${user.id},friend_id.eq.${receiverId}),and(user_id.eq.${receiverId},friend_id.eq.${user.id})`)
        .single();

      if (friendship) {
        return { success: false, error: 'Already friends' };
      }

      const { data, error } = await supabase
        .from('friend_requests')
        .insert({
          sender_id: user.id,
          receiver_id: receiverId,
          status: 'pending',
        })
        .select(`
          *,
          sender:sender_id (
            id,
            first_name,
            last_name,
            profile_image,
            total_activities_logged
          ),
          receiver:receiver_id (
            id,
            first_name,
            last_name,
            profile_image,
            total_activities_logged
          )
        `)
        .single();

      if (error) {
        console.error('Error sending friend request:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error sending friend request:', error);
      return { success: false, error: 'Failed to send friend request' };
    }
  }

  /**
   * Accept a friend request
   */
  static async acceptFriendRequest(requestId: string): Promise<ServiceResponse<Friendship[]>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Get the friend request
      const { data: request, error: requestError } = await supabase
        .from('friend_requests')
        .select('*')
        .eq('id', requestId)
        .eq('receiver_id', user.id)
        .eq('status', 'pending')
        .single();

      if (requestError) {
        console.error('Error fetching friend request:', requestError);
        return { success: false, error: 'Friend request not found' };
      }

      // Update request status
      const { error: updateError } = await supabase
        .from('friend_requests')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', requestId);

      if (updateError) {
        console.error('Error updating friend request:', updateError);
        return { success: false, error: updateError.message };
      }

      // Create friendship records (bidirectional)
      const { data: friendships, error: friendshipError } = await supabase
        .from('friendships')
        .insert([
          {
            user_id: request.sender_id,
            friend_id: request.receiver_id,
          },
          {
            user_id: request.receiver_id,
            friend_id: request.sender_id,
          },
        ])
        .select(`
          *,
          friend:friend_id (
            id,
            first_name,
            last_name,
            profile_image,
            total_activities_logged
          )
        `);

      if (friendshipError) {
        console.error('Error creating friendship:', friendshipError);
        return { success: false, error: friendshipError.message };
      }

      return { success: true, data: friendships || [] };
    } catch (error) {
      console.error('Error accepting friend request:', error);
      return { success: false, error: 'Failed to accept friend request' };
    }
  }

  /**
   * Decline a friend request
   */
  static async declineFriendRequest(requestId: string): Promise<ServiceResponse<void>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { error } = await supabase
        .from('friend_requests')
        .update({ status: 'declined', updated_at: new Date().toISOString() })
        .eq('id', requestId)
        .eq('receiver_id', user.id);

      if (error) {
        console.error('Error declining friend request:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: undefined };
    } catch (error) {
      console.error('Error declining friend request:', error);
      return { success: false, error: 'Failed to decline friend request' };
    }
  }

  /**
   * Get incoming friend requests
   */
  static async getIncomingFriendRequests(): Promise<ServiceResponse<FriendRequest[]>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data, error } = await supabase
        .from('friend_requests')
        .select(`
          *,
          sender:sender_id (
            id,
            first_name,
            last_name,
            profile_image,
            total_activities_logged
          )
        `)
        .eq('receiver_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching friend requests:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching friend requests:', error);
      return { success: false, error: 'Failed to fetch friend requests' };
    }
  }

  /**
   * Get outgoing friend requests
   */
  static async getOutgoingFriendRequests(): Promise<ServiceResponse<FriendRequest[]>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data, error } = await supabase
        .from('friend_requests')
        .select(`
          *,
          receiver:receiver_id (
            id,
            first_name,
            last_name,
            profile_image,
            total_activities_logged
          )
        `)
        .eq('sender_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching outgoing requests:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching outgoing requests:', error);
      return { success: false, error: 'Failed to fetch outgoing requests' };
    }
  }

  /**
   * Get user's friends list
   */
  static async getFriends(): Promise<ServiceResponse<Friendship[]>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data, error } = await supabase
        .from('friendships')
        .select(`
          *,
          friend:friend_id (
            id,
            first_name,
            last_name,
            profile_image,
            total_activities_logged
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching friends:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching friends:', error);
      return { success: false, error: 'Failed to fetch friends' };
    }
  }

  /**
   * Remove a friend
   */
  static async removeFriend(friendId: string): Promise<ServiceResponse<void>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Remove both friendship records
      const { error } = await supabase
        .from('friendships')
        .delete()
        .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`);

      if (error) {
        console.error('Error removing friend:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: undefined };
    } catch (error) {
      console.error('Error removing friend:', error);
      return { success: false, error: 'Failed to remove friend' };
    }
  }

  /**
   * Search for potential friends
   */
  static async searchUsers(query: string): Promise<ServiceResponse<FriendProfile[]>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      if (query.length < 2) {
        return { success: true, data: [] };
      }

      // Search by name
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, profile_image, total_activities_logged')
        .neq('id', user.id)
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
        .limit(20);

      if (error) {
        console.error('Error searching users:', error);
        return { success: false, error: error.message };
      }

      if (!profiles || profiles.length === 0) {
        return { success: true, data: [] };
      }

      // Get friendship status for each profile
      const profileIds = profiles.map(p => p.id);
      
      // Get existing friendships
      const { data: friendships } = await supabase
        .from('friendships')
        .select('friend_id')
        .eq('user_id', user.id)
        .in('friend_id', profileIds);

      // Get pending requests
      const { data: sentRequests } = await supabase
        .from('friend_requests')
        .select('receiver_id')
        .eq('sender_id', user.id)
        .eq('status', 'pending')
        .in('receiver_id', profileIds);

      const { data: receivedRequests } = await supabase
        .from('friend_requests')
        .select('sender_id')
        .eq('receiver_id', user.id)
        .eq('status', 'pending')
        .in('sender_id', profileIds);

      const friendIds = new Set(friendships?.map(f => f.friend_id) || []);
      const sentRequestIds = new Set(sentRequests?.map(r => r.receiver_id) || []);
      const receivedRequestIds = new Set(receivedRequests?.map(r => r.sender_id) || []);

      // Map profiles with friendship status
      const result: FriendProfile[] = profiles.map(profile => ({
        ...profile,
        friendship_status: friendIds.has(profile.id) 
          ? 'friends' 
          : sentRequestIds.has(profile.id)
          ? 'pending_sent'
          : receivedRequestIds.has(profile.id)
          ? 'pending_received'
          : 'not_friends'
      }));

      return { success: true, data: result };
    } catch (error) {
      console.error('Error searching users:', error);
      return { success: false, error: 'Failed to search users' };
    }
  }

  /**
   * Get mutual friends count
   */
  static async getMutualFriendsCount(userId: string): Promise<ServiceResponse<number>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Get current user's friends
      const { data: myFriends } = await supabase
        .from('friendships')
        .select('friend_id')
        .eq('user_id', user.id);

      // Get target user's friends
      const { data: theirFriends } = await supabase
        .from('friendships')
        .select('friend_id')
        .eq('user_id', userId);

      if (!myFriends || !theirFriends) {
        return { success: true, data: 0 };
      }

      const myFriendIds = new Set(myFriends.map(f => f.friend_id));
      const mutualCount = theirFriends.filter(f => myFriendIds.has(f.friend_id)).length;

      return { success: true, data: mutualCount };
    } catch (error) {
      console.error('Error getting mutual friends count:', error);
      return { success: false, error: 'Failed to get mutual friends count' };
    }
  }
}