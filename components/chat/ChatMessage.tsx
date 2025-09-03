import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { tw, spacing, text, bg, border, layout } from '@/utils/styles';
import { useTheme } from '@/providers/theme-provider';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { MessageReactions, ReactionPicker } from './MessageReactions';
import { ReadReceiptIndicator } from './ReadReceiptIndicator';
import { MoreHorizontal } from 'lucide-react-native';

export interface Message {
  id: string;
  content: string;
  created_at: string;
  profile_id: string;
  message_type: 'text' | 'image' | 'voice' | 'system';
  metadata?: Record<string, any>;
  moai_id?: string;
  is_buddy_chat?: boolean;
  buddy_chat_week_start?: string;
  chat_type?: string;
  coach_private_chat_id?: string;
  moai_coaching_chat_id?: string;
  sender?: {
    id: string;
    first_name?: string;
    last_name?: string;
    profile_image?: string;
    total_activities_logged?: number;
  };
  profile?: {
    id: string;
    first_name?: string;
    last_name?: string;
    profile_image?: string;
    total_activities_logged?: number;
  };
  reactions?: MessageReaction[];
}

export interface MessageReaction {
  id: string;
  emoji: string;
  count: number;
  users: string[];
}

export interface ChatMessageProps {
  message: Message;
  previousMessage?: Message;
  nextMessage?: Message;
  currentUserId?: string;
  onAddReaction?: (messageId: string, emoji: string) => void;
  onRemoveReaction?: (messageId: string, emoji: string) => void;
}

export const ChatMessage = ({ 
  message, 
  previousMessage, 
  nextMessage, 
  currentUserId,
  onAddReaction,
  onRemoveReaction
}: ChatMessageProps) => {
  const { theme, colors } = useTheme();
  const [showTimestamp, setShowTimestamp] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const translateX = useRef(new Animated.Value(0)).current;
  const isCurrentUser = message.profile_id === currentUserId;
  const isSameUser = previousMessage?.profile_id === message.profile_id;
  const isNextSameUser = nextMessage?.profile_id === message.profile_id;

  // Format time from timestamp
  const formatMessageTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Check if messages were sent within 10 minutes of each other
  const isCloseTimeGap = () => {
    if (!previousMessage) return false;
    
    const prevTime = new Date(previousMessage.created_at).getTime();
    const currentTime = new Date(message.created_at).getTime();
    const tenMinutesInMs = 10 * 60 * 1000;
    
    return (currentTime - prevTime) < tenMinutesInMs;
  };
  
  // Determine if we should show the sender name
  const shouldShowSenderName = () => {
    return !isSameUser || !isCloseTimeGap();
  };

  // Determine if we should show avatar
  const shouldShowAvatar = () => {
    return !isNextSameUser || !nextMessage;
  };

  // Handle swipe gesture to reveal timestamp
  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX } = event.nativeEvent;
      
      if (Math.abs(translationX) > 15) {
        setShowTimestamp(true);
        setTimeout(() => setShowTimestamp(false), 3000);
      }
      
      // Reset animation
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleLongPress = () => {
    setShowTimestamp(true);
    setTimeout(() => setShowTimestamp(false), 3000);
  };

  return (
    <View>
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
      >
        <Animated.View
          style={[
            tw(spacing.mb(1), layout.flexRow),
            { 
              justifyContent: isCurrentUser ? 'flex-end' : 'flex-start',
              transform: [{ translateX }]
            }
          ]}
        >
          <View style={[
            tw(layout.flexRow, spacing.gap(2)),
            { 
              flexDirection: isCurrentUser ? 'row-reverse' : 'row',
              maxWidth: '70%'
            }
          ]}>
            
            {/* Avatar - for other users, shown on the left */}
            {!isCurrentUser && (
              <View style={[
                tw(layout.selfEnd, spacing.mb(1)),
                { 
                  width: 32, 
                  height: 32,
                  opacity: shouldShowAvatar() ? 1 : 0
                }
              ]}>
                {shouldShowAvatar() && (
                  <View style={tw(layout.relative)}>
                    <Avatar
                      size="sm"
                      source={message.profile?.profile_image ? { uri: message.profile.profile_image } : undefined}
                      fallback={message.profile?.first_name?.[0] || 'U'}
                    />
                    
                    {/* Activity Badge */}
                    <View style={[
                      tw(spacing.absolute),
                      {
                        bottom: -2,
                        right: -2,
                        width: 12,
                        height: 12,
                        borderRadius: 6,
                        backgroundColor: colors.primary,
                        borderWidth: 1,
                        borderColor: colors.card
                      }
                    ]}>
                      <Text style={[tw(text.xs), { color: colors.primaryForeground, fontSize: 8 }]}>
                        {Math.min(message.profile?.total_activities_logged || 0, 99)}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}
            
            <View style={[
              tw(layout.flexCol),
              { alignItems: isCurrentUser ? 'flex-end' : 'flex-start' }
            ]}>
              
              {/* Sender name - conditionally shown */}
              {!isCurrentUser && shouldShowSenderName() && (
                <Text style={[
                  tw(text.xs, text.semibold, spacing.ml(2), spacing.mb(1)),
                  { color: colors.mutedForeground }
                ]}>
                  {message.profile?.first_name || 'User'}
                </Text>
              )}
              
              <View style={tw(layout.flexRow, layout.itemsEnd, spacing.gap(2))}>
                {/* Timestamp - shown on swipe (left side for current user) */}
                {isCurrentUser && showTimestamp && (
                  <Text style={[
                    tw(text.xs),
                    { 
                      color: colors.mutedForeground,
                      opacity: showTimestamp ? 1 : 0
                    }
                  ]}>
                    {formatMessageTime(message.created_at)}
                  </Text>
                )}
                
                {/* Message bubble */}
                <TouchableOpacity
                  onLongPress={handleLongPress}
                  activeOpacity={0.8}
                  style={[
                    tw(spacing.p(3), border.rounded),
                    {
                      backgroundColor: isCurrentUser ? colors.primary : colors.muted,
                      borderTopRightRadius: isCurrentUser ? 4 : 16,
                      borderTopLeftRadius: isCurrentUser ? 16 : 4,
                      marginTop: !isSameUser ? 8 : 2
                    }
                  ]}
                >
                  <Text style={[
                    tw(text.base),
                    { 
                      color: isCurrentUser ? colors.primaryForeground : colors.foreground 
                    }
                  ]}>
                    {message.content}
                  </Text>
                </TouchableOpacity>
                
                {/* Timestamp - shown on swipe (right side for others' messages) */}
                {!isCurrentUser && showTimestamp && (
                  <Text style={[
                    tw(text.xs),
                    { 
                      color: colors.mutedForeground,
                      opacity: showTimestamp ? 1 : 0
                    }
                  ]}>
                    {formatMessageTime(message.created_at)}
                  </Text>
                )}
              </View>
              
              {/* Message actions (on long press) */}
              {showTimestamp && (
                <View style={tw(layout.flexRow, spacing.gap(2), spacing.mt(1))}>
                  <TouchableOpacity
                    onPress={() => setShowReactionPicker(true)}
                    style={[
                      tw(spacing.p(2), border.rounded),
                      { backgroundColor: colors.muted }
                    ]}
                  >
                    <Text style={tw(text.xs)}>😀</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      tw(spacing.p(2), border.rounded),
                      { backgroundColor: colors.muted }
                    ]}
                  >
                    <MoreHorizontal size={12} color={colors.mutedForeground} />
                  </TouchableOpacity>
                </View>
              )}
              
              {/* Message reactions using new component */}
              <MessageReactions
                messageId={message.id}
                onAddReaction={() => setShowReactionPicker(true)}
              />
              
              {/* Read receipt indicator */}
              {isCurrentUser && (
                <ReadReceiptIndicator
                  messageId={message.id}
                  messageUserId={message.profile_id}
                  currentUserId={currentUserId}
                />
              )}
            </View>
            
            {/* Avatar - for current user, shown on the right */}
            {isCurrentUser && (
              <View style={[
                tw(layout.selfEnd, spacing.mb(1)),
                { 
                  width: 32, 
                  height: 32,
                  opacity: shouldShowAvatar() ? 1 : 0
                }
              ]}>
                {shouldShowAvatar() && (
                  <Avatar
                    size="sm"
                    source={message.profile?.profile_image ? { uri: message.profile.profile_image } : undefined}
                    fallback={message.profile?.first_name?.[0] || 'U'}
                  />
                )}
              </View>
            )}
          </View>
        </Animated.View>
      </PanGestureHandler>
      
      {/* Reaction Picker Modal - Outside gesture handler */}
      {showReactionPicker && (
        <ReactionPicker
          onSelect={() => {}} // This will be handled by MessageReactions component
          onClose={() => setShowReactionPicker(false)}
        />
      )}
    </View>
  );
};

export default ChatMessage;