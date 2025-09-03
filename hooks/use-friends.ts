import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState, useEffect } from 'react';
import { FriendService, FriendProfile } from '@/services/friend-service';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export function useFriends() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  // Get friends list
  const { data: friends, isLoading: isLoadingFriends } = useQuery({
    queryKey: ['friends', user?.id],
    queryFn: () => FriendService.getFriends(),
    enabled: !!user,
    select: (response) => response.success ? response.data : [],
  });

  // Get incoming friend requests
  const { data: incomingRequests, isLoading: isLoadingIncoming } = useQuery({
    queryKey: ['friend-requests', 'incoming', user?.id],
    queryFn: () => FriendService.getIncomingFriendRequests(),
    enabled: !!user,
    select: (response) => response.success ? response.data : [],
  });

  // Get outgoing friend requests
  const { data: outgoingRequests, isLoading: isLoadingOutgoing } = useQuery({
    queryKey: ['friend-requests', 'outgoing', user?.id],
    queryFn: () => FriendService.getOutgoingFriendRequests(),
    enabled: !!user,
    select: (response) => response.success ? response.data : [],
  });

  // Send friend request mutation
  const sendRequest = useMutation({
    mutationFn: ({ receiverId }: { receiverId: string }) =>
      FriendService.sendFriendRequest(receiverId),
    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: ['friend-requests', 'outgoing'] });
        toast({
          title: 'Friend request sent!',
          description: 'Your friend request has been sent successfully.',
        });
      } else {
        toast({
          title: 'Failed to send request',
          description: response.error,
          variant: 'destructive',
        });
      }
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to send friend request. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Accept friend request mutation
  const acceptRequest = useMutation({
    mutationFn: (requestId: string) => FriendService.acceptFriendRequest(requestId),
    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: ['friends'] });
        queryClient.invalidateQueries({ queryKey: ['friend-requests', 'incoming'] });
        toast({
          title: 'Friend request accepted!',
          description: 'You are now friends.',
        });
      } else {
        toast({
          title: 'Failed to accept request',
          description: response.error,
          variant: 'destructive',
        });
      }
    },
  });

  // Decline friend request mutation
  const declineRequest = useMutation({
    mutationFn: (requestId: string) => FriendService.declineFriendRequest(requestId),
    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: ['friend-requests', 'incoming'] });
        toast({
          title: 'Friend request declined',
          description: 'The friend request has been declined.',
        });
      }
    },
  });

  // Remove friend mutation
  const removeFriend = useMutation({
    mutationFn: (friendId: string) => FriendService.removeFriend(friendId),
    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: ['friends'] });
        toast({
          title: 'Friend removed',
          description: 'This person has been removed from your friends list.',
        });
      }
    },
  });

  return {
    // Data
    friends: friends || [],
    incomingRequests: incomingRequests || [],
    outgoingRequests: outgoingRequests || [],
    
    // Loading states
    isLoadingFriends,
    isLoadingIncoming,
    isLoadingOutgoing,
    
    // Actions
    sendFriendRequest: sendRequest.mutate,
    acceptFriendRequest: acceptRequest.mutate,
    declineFriendRequest: declineRequest.mutate,
    removeFriend: removeFriend.mutate,
    
    // Action states
    isSendingRequest: sendRequest.isPending,
    isAcceptingRequest: acceptRequest.isPending,
    isDecliningRequest: declineRequest.isPending,
    isRemovingFriend: removeFriend.isPending,
    
    // Counts
    friendsCount: friends?.length || 0,
    pendingIncomingCount: incomingRequests?.length || 0,
    pendingOutgoingCount: outgoingRequests?.length || 0,
  };
}

export function useFriendSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const { user } = useAuth();

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Search users
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['friend-search', debouncedQuery],
    queryFn: () => FriendService.searchUsers(debouncedQuery),
    enabled: !!user && debouncedQuery.length >= 2,
    select: (response) => response.success ? response.data : [],
  });

  return {
    searchQuery,
    setSearchQuery,
    searchResults: searchResults || [],
    isSearching,
    hasResults: (searchResults?.length || 0) > 0,
  };
}

// Hook for getting mutual friends count
export function useMutualFriends(userId: string | undefined) {
  const { user } = useAuth();

  const { data: mutualCount } = useQuery({
    queryKey: ['mutual-friends', user?.id, userId],
    queryFn: () => FriendService.getMutualFriendsCount(userId!),
    enabled: !!user && !!userId,
    select: (response) => response.success ? response.data : 0,
  });

  return {
    mutualFriendsCount: mutualCount || 0,
  };
}