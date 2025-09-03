import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList, RefreshControl, TextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Users, UserPlus, Search, Clock, Check, X } from 'lucide-react-native';

import { useAuth } from '@/hooks/useAuth';
import { useFriends, useFriendSearch } from '@/hooks/use-friends';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, bg, layout, border } from '@/utils/styles';
import { MobileLayout } from '@/components/layouts/MobileLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { AppHeader } from '@/components/ui/AppHeader';
import { FriendProfile } from '@/services/friend-service';

export default function FriendsScreen() {
  const { user } = useAuth();
  const { theme, colors } = useTheme();
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'search'>('friends');
  const [refreshing, setRefreshing] = useState(false);

  const {
    friends,
    incomingRequests,
    outgoingRequests,
    isLoadingFriends,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriend,
    friendsCount,
    pendingIncomingCount,
    isSendingRequest,
    isAcceptingRequest,
    isDecliningRequest,
  } = useFriends();

  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    hasResults,
  } = useFriendSearch();

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    // Refresh will happen automatically via React Query
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const renderFriendItem = ({ item }: { item: any }) => (
    <Card style={tw(spacing.mb(3))}>
      <CardContent style={tw(spacing.p(4))}>
        <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween)}>
          <View style={tw(layout.flexRow, layout.itemsCenter, layout.flex1)}>
            <Avatar
              source={item.friend?.profile_image ? { uri: item.friend.profile_image } : undefined}
              fallback={`${item.friend?.first_name?.[0] || ''}${item.friend?.last_name?.[0] || ''}`}
              size="md"
            />
            
            <View style={tw(spacing.ml(3), layout.flex1)}>
              <Text style={[tw(text.base, text.semibold), { color: colors.foreground }]}>
                {item.friend?.first_name} {item.friend?.last_name}
              </Text>
              
              <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                {item.friend?.total_activities_logged || 0} activities logged
              </Text>
              
              <Text style={[tw(text.xs, spacing.mt(1)), { color: colors.mutedForeground }]}>
                Friends since {new Date(item.created_at).toLocaleDateString()}
              </Text>
            </View>
          </View>
          
          <TouchableOpacity
            onPress={() => removeFriend(item.friend_id)}
            style={[
              tw(spacing.p(2), border.rounded),
              { backgroundColor: colors.muted }
            ]}
          >
            <Users size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      </CardContent>
    </Card>
  );

  const renderRequestItem = ({ item, type }: { item: any; type: 'incoming' | 'outgoing' }) => (
    <Card style={tw(spacing.mb(3))}>
      <CardContent style={tw(spacing.p(4))}>
        <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween)}>
          <View style={tw(layout.flexRow, layout.itemsCenter, layout.flex1)}>
            <Avatar
              source={type === 'incoming' ? item.sender?.profile_image : item.receiver?.profile_image}
              fallback={type === 'incoming' 
                ? `${item.sender?.first_name?.[0] || ''}${item.sender?.last_name?.[0] || ''}`
                : `${item.receiver?.first_name?.[0] || ''}${item.receiver?.last_name?.[0] || ''}`
              }
              size="md"
            />
            
            <View style={tw(spacing.ml(3), layout.flex1)}>
              <Text style={[tw(text.base, text.semibold), { color: colors.foreground }]}>
                {type === 'incoming' 
                  ? `${item.sender?.first_name} ${item.sender?.last_name}`
                  : `${item.receiver?.first_name} ${item.receiver?.last_name}`
                }
              </Text>
              
              {item.message && (
                <Text style={[tw(text.sm, spacing.mt(1)), { color: colors.foreground }]}>
                  "{item.message}"
                </Text>
              )}
              
              <Text style={[tw(text.xs, spacing.mt(1)), { color: colors.mutedForeground }]}>
                {new Date(item.created_at).toLocaleDateString()}
              </Text>
            </View>
          </View>
          
          {type === 'incoming' ? (
            <View style={tw(layout.flexRow, spacing.gap(2))}>
              <TouchableOpacity
                onPress={() => acceptFriendRequest(item.id)}
                disabled={isAcceptingRequest}
                style={[
                  tw(spacing.p(2), border.rounded),
                  { backgroundColor: colors.primary }
                ]}
              >
                <Check size={16} color={colors.primaryForeground} />
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => declineFriendRequest(item.id)}
                disabled={isDecliningRequest}
                style={[
                  tw(spacing.p(2), border.rounded),
                  { backgroundColor: colors.muted }
                ]}
              >
                <X size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          ) : (
            <Badge variant="outline">
              <Clock size={12} color={colors.mutedForeground} />
              <Text style={[tw(text.xs, spacing.ml(1)), { color: colors.mutedForeground }]}>
                Pending
              </Text>
            </Badge>
          )}
        </View>
      </CardContent>
    </Card>
  );

  const renderSearchResult = ({ item }: { item: FriendProfile }) => (
    <Card style={tw(spacing.mb(3))}>
      <CardContent style={tw(spacing.p(4))}>
        <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween)}>
          <View style={tw(layout.flexRow, layout.itemsCenter, layout.flex1)}>
            <Avatar
              source={item.profile_image}
              fallback={`${item.first_name?.[0] || ''}${item.last_name?.[0] || ''}`}
              size="md"
            />
            
            <View style={tw(spacing.ml(3), layout.flex1)}>
              <Text style={[tw(text.base, text.semibold), { color: colors.foreground }]}>
                {item.first_name} {item.last_name}
              </Text>
              
              <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                {item.total_activities_logged || 0} activities logged
              </Text>
              
              {item.mutual_friends_count && item.mutual_friends_count > 0 && (
                <Text style={[tw(text.xs, spacing.mt(1)), { color: colors.primary }]}>
                  {item.mutual_friends_count} mutual friends
                </Text>
              )}
            </View>
          </View>
          
          <FriendActionButton
            profile={item}
            onSendRequest={(id) => sendFriendRequest({ receiverId: id })}
            isSending={isSendingRequest}
          />
        </View>
      </CardContent>
    </Card>
  );

  return (
    <MobileLayout scrollable={false}>
      <AppHeader 
        title="Friends" 
        showProfile={true}
        rightAction={{
          icon: UserPlus,
          onPress: () => setActiveTab('search'),
          label: 'Add friends'
        }}
      />
      
      <ScrollView 
        style={tw(layout.flex1)}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        bounces={true}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled={true}
      >
        {/* Header */}
        <View style={tw(spacing.mb(6))}>
          <Text style={[tw(text['2xl'], text.bold), { color: colors.foreground }]}>
            Your Network
          </Text>
          <Text style={[tw(text.base), { color: colors.mutedForeground }]}>
            Connect with friends to share your fitness journey
          </Text>
        </View>

        {/* Tab Navigation */}
        <View style={tw(layout.flexRow, spacing.mb(6))}>
          <TouchableOpacity
            onPress={() => setActiveTab('friends')}
            style={[
              tw(layout.flex1, spacing.p(3), border.rounded, spacing.mr(2)),
              { backgroundColor: activeTab === 'friends' ? colors.primary : colors.muted }
            ]}
          >
            <Text style={[
              tw(text.sm, text.center, text.semibold),
              { color: activeTab === 'friends' ? colors.primaryForeground : colors.foreground }
            ]}>
              Friends ({friendsCount})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => setActiveTab('requests')}
            style={[
              tw(layout.flex1, spacing.p(3), border.rounded, spacing.mx(1)),
              { backgroundColor: activeTab === 'requests' ? colors.primary : colors.muted }
            ]}
          >
            <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyCenter)}>
              <Text style={[
                tw(text.sm, text.semibold),
                { color: activeTab === 'requests' ? colors.primaryForeground : colors.foreground }
              ]}>
                Requests
              </Text>
              {pendingIncomingCount > 0 && (
                <Badge 
                  variant="destructive" 
                  style={tw(spacing.ml(2))}
                >
                  {pendingIncomingCount}
                </Badge>
              )}
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => setActiveTab('search')}
            style={[
              tw(layout.flex1, spacing.p(3), border.rounded, spacing.ml(2)),
              { backgroundColor: activeTab === 'search' ? colors.primary : colors.muted }
            ]}
          >
            <Text style={[
              tw(text.sm, text.center, text.semibold),
              { color: activeTab === 'search' ? colors.primaryForeground : colors.foreground }
            ]}>
              Discover
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {activeTab === 'friends' && (
          <View>
            {isLoadingFriends ? (
              <Text style={[tw(text.center, spacing.mt(8)), { color: colors.mutedForeground }]}>
                Loading friends...
              </Text>
            ) : friends.length > 0 ? (
              <FlatList
                data={friends}
                renderItem={renderFriendItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                removeClippedSubviews={true}
                maxToRenderPerBatch={8}
                windowSize={10}
                getItemLayout={(_, index) => ({
                  length: 120,
                  offset: 120 * index,
                  index,
                })}
              />
            ) : (
              <Card>
                <CardContent style={tw(spacing.p(6), layout.itemsCenter)}>
                  <Users size={48} color={colors.mutedForeground} />
                  <Text style={[tw(text.lg, text.semibold, spacing.mt(4)), { color: colors.foreground }]}>
                    No friends yet
                  </Text>
                  <Text style={[tw(text.sm, text.center, spacing.mt(2)), { color: colors.mutedForeground }]}>
                    Start building your fitness network by discovering and connecting with others
                  </Text>
                  <Button
                    variant="gradient"
                    style={tw(spacing.mt(4))}
                    onPress={() => setActiveTab('search')}
                  >
                    <UserPlus size={16} color="#FFFFFF" />
                    <Text style={[tw(spacing.ml(2), text.semibold), { color: '#FFFFFF' }]}>
                      Find Friends
                    </Text>
                  </Button>
                </CardContent>
              </Card>
            )}
          </View>
        )}

        {activeTab === 'requests' && (
          <View>
            {/* Incoming Requests */}
            {incomingRequests.length > 0 && (
              <View style={tw(spacing.mb(6))}>
                <Text style={[tw(text.lg, text.semibold, spacing.mb(4)), { color: colors.foreground }]}>
                  Incoming Requests
                </Text>
                <FlatList
                  data={incomingRequests}
                  renderItem={({ item }) => renderRequestItem({ item, type: 'incoming' })}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  removeClippedSubviews={true}
                  maxToRenderPerBatch={5}
                  windowSize={5}
                />
              </View>
            )}

            {/* Outgoing Requests */}
            {outgoingRequests.length > 0 && (
              <View>
                <Text style={[tw(text.lg, text.semibold, spacing.mb(4)), { color: colors.foreground }]}>
                  Sent Requests
                </Text>
                <FlatList
                  data={outgoingRequests}
                  renderItem={({ item }) => renderRequestItem({ item, type: 'outgoing' })}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  removeClippedSubviews={true}
                  maxToRenderPerBatch={5}
                  windowSize={5}
                />
              </View>
            )}

            {incomingRequests.length === 0 && outgoingRequests.length === 0 && (
              <Card>
                <CardContent style={tw(spacing.p(6), layout.itemsCenter)}>
                  <Clock size={48} color={colors.mutedForeground} />
                  <Text style={[tw(text.lg, text.semibold, spacing.mt(4)), { color: colors.foreground }]}>
                    No pending requests
                  </Text>
                  <Text style={[tw(text.sm, text.center, spacing.mt(2)), { color: colors.mutedForeground }]}>
                    Friend requests will appear here
                  </Text>
                </CardContent>
              </Card>
            )}
          </View>
        )}

        {activeTab === 'search' && (
          <View>
            {/* Search Input */}
            <View style={tw(spacing.mb(6))}>
              <View style={tw(layout.flexRow, layout.itemsCenter, layout.relative)}>
                <Search 
                  size={20} 
                  color={colors.mutedForeground}
                  style={[tw(spacing.absolute), { left: 12, zIndex: 1 }]}
                />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search by name..."
                  placeholderTextColor={colors.mutedForeground}
                  style={[
                    tw(layout.flex1, spacing.pl(10), spacing.pr(4), spacing.py(3), border.rounded),
                    {
                      backgroundColor: colors.muted,
                      color: colors.foreground,
                      fontSize: 16,
                    }
                  ]}
                />
              </View>
            </View>

            {/* Search Results */}
            {isSearching ? (
              <Text style={[tw(text.center, spacing.mt(8)), { color: colors.mutedForeground }]}>
                Searching...
              </Text>
            ) : hasResults ? (
              <FlatList
                data={searchResults}
                renderItem={renderSearchResult}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                removeClippedSubviews={true}
                maxToRenderPerBatch={8}
                windowSize={10}
              />
            ) : searchQuery.length >= 2 ? (
              <Card>
                <CardContent style={tw(spacing.p(6), layout.itemsCenter)}>
                  <Search size={48} color={colors.mutedForeground} />
                  <Text style={[tw(text.lg, text.semibold, spacing.mt(4)), { color: colors.foreground }]}>
                    No results found
                  </Text>
                  <Text style={[tw(text.sm, text.center, spacing.mt(2)), { color: colors.mutedForeground }]}>
                    Try searching with a different name
                  </Text>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent style={tw(spacing.p(6), layout.itemsCenter)}>
                  <Search size={48} color={colors.mutedForeground} />
                  <Text style={[tw(text.lg, text.semibold, spacing.mt(4)), { color: colors.foreground }]}>
                    Discover Friends
                  </Text>
                  <Text style={[tw(text.sm, text.center, spacing.mt(2)), { color: colors.mutedForeground }]}>
                    Search for people by name to send friend requests
                  </Text>
                </CardContent>
              </Card>
            )}
          </View>
        )}

        {/* Bottom spacing for navigation */}
        <View style={tw(spacing.h(8))} />
      </ScrollView>
    </MobileLayout>
  );
}

// Helper component for friend action buttons
function FriendActionButton({ 
  profile, 
  onSendRequest, 
  isSending 
}: { 
  profile: FriendProfile; 
  onSendRequest: (id: string) => void;
  isSending: boolean;
}) {
  const { colors } = useTheme();

  switch (profile.friendship_status) {
    case 'friends':
      return (
        <Badge variant="success">
          <Check size={12} color={colors.foreground} />
          <Text style={[tw(text.xs, spacing.ml(1)), { color: colors.foreground }]}>
            Friends
          </Text>
        </Badge>
      );
    
    case 'pending_sent':
      return (
        <Badge variant="outline">
          <Clock size={12} color={colors.mutedForeground} />
          <Text style={[tw(text.xs, spacing.ml(1)), { color: colors.mutedForeground }]}>
            Sent
          </Text>
        </Badge>
      );
    
    case 'pending_received':
      return (
        <Badge variant="secondary">
          <Text style={[tw(text.xs), { color: colors.foreground }]}>
            Respond
          </Text>
        </Badge>
      );
    
    default:
      return (
        <TouchableOpacity
          onPress={() => onSendRequest(profile.id)}
          disabled={isSending}
          style={[
            tw(spacing.px(3), spacing.py(2), border.rounded),
            { backgroundColor: colors.primary, opacity: isSending ? 0.7 : 1 }
          ]}
        >
          <Text style={[tw(text.xs, text.semibold), { color: colors.primaryForeground }]}>
            Add Friend
          </Text>
        </TouchableOpacity>
      );
  }
}