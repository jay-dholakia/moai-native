import { Hash, MessageCircle, Phone, Plus, Search, Users, Video } from 'lucide-react-native';
import React, { useState } from 'react';
import { FlatList, Modal, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { ChatInterface } from '@/components/chat/ChatInterface';
import { MobileLayout } from '@/components/layouts/MobileLayout';
import { AppHeader } from '@/components/ui/AppHeader';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useChat } from '@/hooks/use-chat';
import { useUserMoais } from '@/hooks/use-moai';
import { useProfile } from '@/hooks/use-profile';
import { useAuth } from '@/hooks/useAuth';
import { useChatParticipants } from '@/hooks/use-chat-participants';
import { useTheme } from '@/providers/theme-provider';
import { border, layout, spacing, text, tw } from '@/utils/styles';

interface ChatChannel {
  id: string;
  name: string;
  type: 'moai' | 'dm' | 'global';
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline?: boolean;
  avatar?: string;
  memberCount?: number;
}

export default function ChatScreen() {
  const { user } = useAuth();
  const { userProfile } = useProfile();
  const { userMoais } = useUserMoais();
  const { theme, colors } = useTheme();
  
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [selectedChatData, setSelectedChatData] = useState<any>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showChatInterface, setShowChatInterface] = useState(false);
  
  // Use the real chat hook
  const { 
    channels: realChannels, 
    isLoadingChannels, 
    channelsError,
    createChannel,
    startDirectMessage 
  } = useChat();

  // Get real channels from the chat service
  const chatChannels = React.useMemo(() => {
    const channels: ChatChannel[] = [];

    // Add real channels from the service
    if (realChannels && realChannels.length > 0) {
      const realChannelItems: ChatChannel[] = realChannels.map((channel: any) => ({
        id: channel.id,
        name: channel.name,
        type: channel.type === 'moai' ? 'moai' : channel.type === 'buddy' ? 'moai' : 'dm',
        lastMessage: channel.last_message?.content || 'No messages yet',
        lastMessageTime: channel.last_message ? new Date(channel.last_message.created_at).toLocaleTimeString() : 'never',
        unreadCount: channel.unread_count || 0,
        isOnline: true,
        avatar: undefined,
        memberCount: channel.buddy_group?.length || 0
      }));
      
      channels.push(...realChannelItems);
    }
    
    // Add moai channels from userMoais if not already present from real channels
    if (userMoais?.pages?.[0]?.data) {
      const existingIds = new Set(channels.map(c => c.id));
      
      const moaiChannels: ChatChannel[] = userMoais.pages[0].data
        .filter((moai: any) => !existingIds.has(`moai-${moai.id}`))
        .map((moai: any) => ({
          id: `moai-${moai.id}`,
          name: moai.name,
          type: 'moai' as const,
          lastMessage: 'No messages yet',
          lastMessageTime: 'never',
          unreadCount: 0,
          isOnline: true,
          avatar: moai.image_url,
          memberCount: moai.member_count || 0
        }));
      
      channels.push(...moaiChannels);
    }
    
    return channels;
  }, [realChannels, userMoais]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // TODO: Implement refresh logic for chats
    setTimeout(() => setRefreshing(false), 2000);
  }, []);

  const filteredChannels = chatChannels.filter(channel =>
    channel.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const moaiChannels = filteredChannels.filter(c => c.type === 'moai' || c.type === 'global');
  const directMessages = filteredChannels.filter(c => c.type === 'dm');

  const handleChatPress = (item: ChatChannel) => {
    setSelectedChat(item.id);
    setSelectedChatData(item);
    setShowChatInterface(true);
  };

  const renderChatItem = ({ item }: { item: ChatChannel }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => handleChatPress(item)}
    >
      <Card style={tw(spacing.mb(2))}>
        <CardContent style={tw(spacing.p(4))}>
          <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween)}>
            {/* Avatar and Chat Info */}
            <View style={tw(layout.flexRow, layout.itemsCenter, layout.flex1)}>
              <View style={tw(spacing.mr(3))}>
                <Avatar
                  size="md"
                  source={item.avatar ? { uri: item.avatar } : undefined}
                  fallback={
                    item.type === 'global' ? '🌍' :
                    item.type === 'moai' ? '🎯' :
                    item.name.split(' ').map(n => n[0]).join('')
                  }
                />
                
                {/* Online indicator */}
                {item.isOnline && item.type === 'dm' && (
                  <View style={[
                    tw(spacing.absolute),
                    {
                      bottom: 0,
                      right: 0,
                      width: 12,
                      height: 12,
                      borderRadius: 6,
                      backgroundColor: '#10B981',
                      borderWidth: 2,
                      borderColor: colors.card
                    }
                  ]} />
                )}
              </View>
              
              <View style={tw(layout.flex1)}>
                <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.mb(1))}>
                  <Text 
                    style={[
                      tw(text.base, text.semibold), 
                      { color: colors.foreground }
                    ]}
                    numberOfLines={1}
                  >
                    {item.type === 'moai' || item.type === 'global' ? `# ${item.name.toLowerCase().replace(/\s+/g, '-')}` : item.name}
                  </Text>
                  
                  <Text style={[tw(text.xs), { color: colors.mutedForeground }]}>
                    {item.lastMessageTime}
                  </Text>
                </View>
                
                <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween)}>
                  <Text 
                    style={[tw(text.sm), { color: colors.mutedForeground }]}
                    numberOfLines={1}
                  >
                    {item.lastMessage}
                  </Text>
                  
                  {(item.unreadCount || 0) > 0 && (
                    <Badge 
                      variant="destructive" 
                      style={[
                        tw(spacing.ml(2)),
                        { minWidth: 20, height: 20 }
                      ]}
                    >
                      {item.unreadCount || 0}
                    </Badge>
                  )}
                </View>
                
                {/* Member count for channels */}
                {(item.type === 'moai' || item.type === 'global') && item.memberCount && (
                  <View style={tw(layout.flexRow, layout.itemsCenter, spacing.mt(1))}>
                    <Users size={12} color={colors.mutedForeground} />
                    <Text style={[tw(text.xs, spacing.ml(1)), { color: colors.mutedForeground }]}>
                      {item.memberCount} members
                    </Text>
                  </View>
                )}
              </View>
            </View>
            
            {/* Action buttons for DMs */}
            {item.type === 'dm' && (
              <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2), spacing.ml(3))}>
                <TouchableOpacity style={[
                  tw(spacing.p(2), border.rounded),
                  { backgroundColor: colors.primary + '20' }
                ]}>
                  <Phone size={16} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity style={[
                  tw(spacing.p(2), border.rounded),
                  { backgroundColor: colors.primary + '20' }
                ]}>
                  <Video size={16} color={colors.primary} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </CardContent>
      </Card>
    </TouchableOpacity>
  );

  // ChatInterfaceModal component to handle participants fetching
  const ChatInterfaceModal = ({ visible, selectedChat, selectedChatData, onClose }: {
    visible: boolean;
    selectedChat: string | null;
    selectedChatData: any;
    onClose: () => void;
  }) => {
    const { participants, isLoading: isLoadingParticipants } = useChatParticipants(
      selectedChat, 
      selectedChatData?.type || 'moai'
    );

    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        {selectedChatData && (
          <ChatInterface
            channelId={selectedChat!}
            channelName={selectedChatData.name}
            channelType={selectedChatData.type}
            onBack={onClose}
            participants={participants}
          />
        )}
      </Modal>
    );
  };

  return (
    <MobileLayout scrollable={false}>
      <AppHeader 
        title="Chat" 
        showProfile={true}
        rightAction={{
          icon: () => <Search size={20} color={colors.foreground} />,
          onPress: () => {/* TODO: Implement search */},
          label: 'Search chats'
        }}
      />
      <ScrollView 
        style={tw(layout.flex1)}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={tw(layout.flexRow, layout.justifyBetween, layout.itemsCenter, spacing.mb(6))}>
          <View>
            <Text style={[tw(text['2xl'], text.bold), { color: colors.foreground }]}>
              Messages
            </Text>
            <Text style={[tw(text.base), { color: colors.mutedForeground }]}>
              Connect with your Moai community
            </Text>
          </View>
          
          <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2))}>
            <TouchableOpacity onPress={() => setShowSearch(!showSearch)}>
              <Search size={20} color={colors.foreground} />
            </TouchableOpacity>
            <TouchableOpacity>
              <Plus size={20} color={colors.foreground} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        {showSearch && (
          <View style={tw(spacing.mb(6))}>
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={[
                tw(spacing.pl(12)),
                { backgroundColor: colors.muted }
              ]}
            />
            <Search 
              size={16} 
              color={colors.mutedForeground} 
              style={[tw(spacing.absolute), { left: 12, top: 14 }]} 
            />
          </View>
        )}

        {/* Quick Actions */}
        <View style={tw(spacing.mb(6))}>
          <View style={tw(layout.flexRow, spacing.gap(3))}>
            <Button
              style={tw(layout.flex1)}
              onPress={() => {
                // TODO: Navigate to new chat
              }}
            >
              <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2))}>
                <MessageCircle size={16} color={colors.primaryForeground} />
                <Text style={{ color: colors.primaryForeground, fontWeight: '600' }}>
                  New Chat
                </Text>
              </View>
            </Button>
            
            <Button
              variant="outline"
              style={tw(layout.flex1)}
              onPress={() => {
                // TODO: Navigate to create group
              }}
            >
              <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2))}>
                <Users size={16} color={colors.foreground} />
                <Text style={{ color: colors.foreground, fontWeight: '600' }}>
                  New Group
                </Text>
              </View>
            </Button>
          </View>
        </View>

        {/* Channels Section */}
        {moaiChannels.length > 0 && (
          <View style={tw(spacing.mb(6))}>
            <View style={tw(layout.flexRow, layout.itemsCenter, spacing.mb(4))}>
              <Hash size={16} color={colors.mutedForeground} />
              <Text style={[tw(text.lg, text.semibold, spacing.ml(2)), { color: colors.foreground }]}>
                Channels
              </Text>
            </View>
            
            <FlatList
              data={moaiChannels}
              renderItem={renderChatItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}

        {/* Direct Messages Section */}
        {directMessages.length > 0 && (
          <View style={tw(spacing.mb(6))}>
            <View style={tw(layout.flexRow, layout.itemsCenter, spacing.mb(4))}>
              <MessageCircle size={16} color={colors.mutedForeground} />
              <Text style={[tw(text.lg, text.semibold, spacing.ml(2)), { color: colors.foreground }]}>
                Direct Messages
              </Text>
            </View>
            
            <FlatList
              data={directMessages}
              renderItem={renderChatItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}

        {/* Empty State */}
        {filteredChannels.length === 0 && (
          <Card style={tw(spacing.mt(8))}>
            <CardContent style={tw(spacing.p(8), layout.itemsCenter)}>
              <MessageCircle size={48} color={colors.mutedForeground} style={tw(spacing.mb(4))} />
              <Text style={[tw(text.lg, text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
                {searchQuery ? 'No conversations found' : 'No messages yet'}
              </Text>
              <Text style={[tw(text.sm, text.center, spacing.mb(6)), { color: colors.mutedForeground }]}>
                {searchQuery 
                  ? `No conversations match "${searchQuery}"`
                  : 'Start a conversation with your Moai members or create a new group'
                }
              </Text>
              {!searchQuery && (
                <Button>
                  <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2))}>
                    <Plus size={16} color={colors.primaryForeground} />
                    <Text style={{ color: colors.primaryForeground, fontWeight: '600' }}>
                      Start Chatting
                    </Text>
                  </View>
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Bottom spacing for navigation */}
        <View style={tw(spacing.h(8))} />
      </ScrollView>

      {/* Chat Interface Modal */}
      <ChatInterfaceModal
        visible={showChatInterface}
        selectedChat={selectedChat}
        selectedChatData={selectedChatData}
        onClose={() => {
          setShowChatInterface(false);
          setSelectedChat(null);
          setSelectedChatData(null);
        }}
      />
    </MobileLayout>
  );
}