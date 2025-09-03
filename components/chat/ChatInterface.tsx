import { StatusBar } from 'expo-status-bar';
import {
    ArrowLeft,
    Camera,
    Image as ImageIcon,
    Mic,
    MoreVertical,
    Paperclip,
    Phone,
    Video
} from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/Avatar';
import { useChat } from '@/hooks/use-chat';
import { useChatReadReceipts } from '@/hooks/use-read-receipts';
import { useMessageComposition } from '@/hooks/use-typing-indicators';
import { useTheme } from '@/providers/theme-provider';
import { border, layout, spacing, text, tw } from '@/utils/styles';
import { ChatMessage, Message } from './ChatMessage';
import { EnhancedChatInput } from './EnhancedChatInput';
import { CompactTypingIndicator, TypingIndicator } from './TypingIndicator';

export interface ChatParticipant {
  id: string;
  first_name: string;
  last_name: string;
  profile_image?: string;
}

export interface ChatInterfaceProps {
  channelId: string;
  channelName: string;
  channelType: 'moai' | 'dm' | 'global';
  onBack: () => void;
  participants?: ChatParticipant[];
}

export const ChatInterface = ({
  channelId,
  channelName,
  channelType,
  onBack,
  participants = []
}: ChatInterfaceProps) => {
  const { theme, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMediaOptions, setShowMediaOptions] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  const {
    messages,
    isLoadingMessages,
    messagesError,
    sendMessage,
    addReaction,
    removeReaction,
    currentUser,
    isSendingMessage
  } = useChat(channelId);

  // Debug logging
  useEffect(() => {
    console.log('ChatInterface Debug:', {
      channelId,
      messagesCount: messages?.length,
      isLoadingMessages,
      messagesError,
      hasCurrentUser: !!currentUser
    });
  }, [channelId, messages, isLoadingMessages, messagesError, currentUser]);

  // Use typing indicators with message composition
  const {
    message: messageText,
    setMessage: setMessageText,
    handleSendMessage: handleSendWithTyping,
    typingUsers,
  } = useMessageComposition(channelId);

  // Use read receipts for auto-marking messages as read
  const { handleMessageVisible } = useChatReadReceipts(channelId, participants.map(p => p.id));

  // Auto-scroll to bottom when new messages arrive (improved)
  useEffect(() => {
    if (messages.length > 0) {
      // Use requestAnimationFrame for better performance
      requestAnimationFrame(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      });
    }
  }, [messages]);

  // Fade in animation
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Mark messages as read when they are loaded
  useEffect(() => {
    if (messages.length > 0 && currentUser?.id) {
      const unreadMessages = messages.filter(msg => msg.profile_id !== currentUser.id);
      unreadMessages.forEach(msg => {
        handleMessageVisible(msg.id, msg.profile_id);
      });
    }
  }, [messages, currentUser?.id, handleMessageVisible]);



  const handleSendMessage = async () => {
    if (!messageText.trim()) return;
    
    await handleSendWithTyping(async (message) => {
      await sendMessage(message);
    });
  };

  const handleEmojiPress = (emoji: string) => {
    setMessageText(messageText + emoji);
    setShowEmojiPicker(false);
  };

  const toggleMediaOptions = () => {
    setShowMediaOptions(!showMediaOptions);
    setShowEmojiPicker(false);
  };

  const toggleEmojiPicker = () => {
    setShowEmojiPicker(!showEmojiPicker);
    setShowMediaOptions(false);
  };

  const commonEmojis = ['😊', '👍', '❤️', '😂', '🔥', '💪', '🎯', '⭐', '🙏', '👏', '🎉', '🚀'];

  const mediaOptions = [
    { icon: Camera, label: 'Camera', onPress: () => Alert.alert('Camera', 'Camera feature coming soon!') },
    { icon: ImageIcon, label: 'Gallery', onPress: () => Alert.alert('Gallery', 'Image picker coming soon!') },
    { icon: Paperclip, label: 'Document', onPress: () => Alert.alert('Document', 'Document picker coming soon!') },
    { icon: Mic, label: 'Voice', onPress: () => Alert.alert('Voice Message', 'Voice messages coming soon!') },
  ];

  // Memoized message renderer for better performance
  const renderMessage = React.useCallback(({ item, index }: { item: any; index: number }) => {
    const previousMessage = index > 0 ? messages[index - 1] : undefined;
    const nextMessage = index < messages.length - 1 ? messages[index + 1] : undefined;

    // Map reactions to include count and users
    const mapReactions = (reactions?: any[]) => {
      if (!reactions || reactions.length === 0) return undefined;
      
      // Group reactions by emoji
      const reactionGroups: { [emoji: string]: string[] } = {};
      reactions.forEach(r => {
        if (!reactionGroups[r.emoji]) {
          reactionGroups[r.emoji] = [];
        }
        reactionGroups[r.emoji].push(r.user_id);
      });
      
      // Convert to expected format
      return Object.entries(reactionGroups).map(([emoji, users]) => ({
        id: `${emoji}-group`,
        emoji,
        count: users.length,
        users
      }));
    };

    // Map ChatMessage to Message type expected by component
    const mappedMessage: Message = {
      ...item,
      profile_id: item.profile_id,
      profile: item.sender,
      reactions: mapReactions(item.reactions)
    } as Message;
    
    const mappedPreviousMessage: Message | undefined = previousMessage ? {
      ...previousMessage,
      profile_id: previousMessage.profile_id,
      profile: previousMessage.sender,
      reactions: mapReactions(previousMessage.reactions)
    } as Message : undefined;
    
    const mappedNextMessage: Message | undefined = nextMessage ? {
      ...nextMessage,
      profile_id: nextMessage.profile_id,
      profile: nextMessage.sender,
      reactions: mapReactions(nextMessage.reactions)
    } as Message : undefined;

    return (
      <ChatMessage
        message={mappedMessage}
        previousMessage={mappedPreviousMessage}
        nextMessage={mappedNextMessage}
        currentUserId={currentUser?.id}
        onAddReaction={(messageId: string, emoji: string) => addReaction({ messageId, emoji })}
        onRemoveReaction={(messageId: string, emoji: string) => removeReaction({ messageId, emoji })}
      />
    );
  }, [messages, currentUser?.id, addReaction, removeReaction]);

  const renderEmptyState = () => (
    <View style={tw(layout.flex1, layout.itemsCenter, layout.justifyCenter, spacing.p(8))}>
      <Text style={[tw(text.lg, text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
        Start the conversation
      </Text>
      <Text style={[tw(text.sm, text.center), { color: colors.mutedForeground }]}>
        {channelType === 'dm' 
          ? 'Send a message to start chatting'
          : 'Be the first to share something with the group'
        }
      </Text>
    </View>
  );

  const getHeaderTitle = () => {
    if (channelType === 'dm' && participants.length > 0) {
      const otherParticipant = participants.find(p => p.id !== currentUser?.id);
      return otherParticipant ? `${otherParticipant.first_name} ${otherParticipant.last_name}` : channelName;
    }
    return channelName;
  };

  const getHeaderSubtitle = () => {
    // Show typing indicator in header for DM
    if (channelType === 'dm' && typingUsers.length > 0) {
      return `${typingUsers[0].first_name} is typing...`;
    }
    
    if (channelType === 'moai') {
      return `${participants.length} members`;
    }
    if (channelType === 'dm') {
      // Show online status for DM
      return 'Active now'; // TODO: Implement real online status
    }
    return 'Global community';
  };

  return (
    <View style={tw(layout.flex1)}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <KeyboardAvoidingView 
        style={tw(layout.flex1)}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0} // No offset in modal
      >
        <Animated.View style={[tw(layout.flex1), { opacity: fadeAnim }]}>
        
          {/* Header - Fixed for modal usage */}
          <View style={[
            tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.px(4), spacing.py(3)),
            { 
              backgroundColor: colors.background,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
              paddingTop: Math.max(insets.top + 8, 16), // Smaller padding for modal
              shadowColor: colors.foreground,
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 3,
              elevation: 3,
            }
          ]}>
          <View style={tw(layout.flexRow, layout.itemsCenter, layout.flex1)}>
            <TouchableOpacity 
              onPress={onBack}
              style={tw(spacing.mr(3), spacing.p(1))}
            >
              <ArrowLeft size={24} color={colors.foreground} />
            </TouchableOpacity>
            
            {channelType === 'dm' && participants.length > 0 && (
              <Avatar
                size="sm"
                source={participants[0]?.profile_image ? { uri: participants[0].profile_image } : undefined}
                fallback={participants[0]?.first_name?.[0] || 'U'}
                style={tw(spacing.mr(3))}
              />
            )}
            
            <View style={tw(layout.flex1)}>
              <Text style={[tw(text.lg, text.semibold), { color: colors.foreground }]}>
                {getHeaderTitle()}
              </Text>
              <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                {getHeaderSubtitle()}
              </Text>
            </View>
          </View>
          
          {channelType === 'dm' && (
            <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2))}>
              <TouchableOpacity 
                style={tw(spacing.p(2))}
                onPress={() => Alert.alert('Voice Call', 'Voice calling feature coming soon!')}
              >
                <Phone size={20} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={tw(spacing.p(2))}
                onPress={() => Alert.alert('Video Call', 'Video calling feature coming soon!')}
              >
                <Video size={20} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={tw(spacing.p(2))}>
                <MoreVertical size={20} color={colors.foreground} />
              </TouchableOpacity>
            </View>
          )}
        </View>

          {/* Messages Container - Fixed flex */}
          <View style={tw(layout.flex1)}>
          {isLoadingMessages ? (
            <View style={tw(layout.flex1, layout.itemsCenter, layout.justifyCenter)}>
              <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                Loading messages...
              </Text>
            </View>
          ) : messagesError ? (
            <View style={tw(layout.flex1, layout.itemsCenter, layout.justifyCenter, spacing.p(4))}>
              <Text style={[tw(text.sm, text.center, spacing.mb(2)), { color: colors.destructive }]}>
                Error loading messages
              </Text>
              <Text style={[tw(text.xs, text.center), { color: colors.mutedForeground }]}>
                {messagesError}
              </Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id}
              contentContainerStyle={[
                tw(spacing.px(4), spacing.pt(4)),
                { 
                  paddingBottom: 80, // Reduced for WhatsApp-style input
                  flexGrow: messages.length === 0 ? 1 : undefined
                }
              ]}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={renderEmptyState}
              ListFooterComponent={() => (
                <View style={tw(spacing.pb(4))}>
                  <TypingIndicator typingUsers={typingUsers} />
                </View>
              )}
              onContentSizeChange={() => {
                // Improved auto-scroll with better timing
                requestAnimationFrame(() => {
                  flatListRef.current?.scrollToEnd({ animated: true });
                });
              }}
              onLayout={() => {
                // Scroll to bottom when layout changes
                if (messages.length > 0) {
                  requestAnimationFrame(() => {
                    flatListRef.current?.scrollToEnd({ animated: false });
                  });
                }
              }}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              removeClippedSubviews={true}
              maxToRenderPerBatch={10}
              windowSize={10}
              getItemLayout={(_, index) => ({
                length: 80, // Average message height estimation
                offset: 80 * index,
                index,
              })}
              scrollEventThrottle={16}
              bounces={true}
              bouncesZoom={false}
            />
          )}
          </View>

          {/* Compact typing indicator above input for group chats */}
          {typingUsers.length > 0 && channelType !== 'dm' && (
            <CompactTypingIndicator typingUsers={typingUsers} />
          )}

          {/* WhatsApp-style Chat Input Container */}
          <View style={[
            {
              paddingBottom: Math.max(insets.bottom + 4, 12),
              paddingTop: 8,
              paddingHorizontal: 12,
              backgroundColor: colors.background,
            }
          ]}>
          <EnhancedChatInput
            value={messageText}
            onChangeText={setMessageText}
            onSend={handleSendMessage}
            placeholder="Type a message..."
            maxLength={1000}
            disabled={false}
            isSending={isSendingMessage}
            showMediaOptions={showMediaOptions}
            showEmojiPicker={showEmojiPicker}
            onMediaOptionPress={(option) => {
              switch (option) {
                case 'camera':
                  Alert.alert('Camera', 'Camera feature coming soon!');
                  break;
                case 'gallery':
                  Alert.alert('Gallery', 'Image picker coming soon!');
                  break;
                case 'document':
                  Alert.alert('Document', 'Document picker coming soon!');
                  break;
                case 'voice':
                  Alert.alert('Voice Message', 'Voice messages coming soon!');
                  break;
              }
            }}
            onEmojiPress={handleEmojiPress}
          />
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default ChatInterface;