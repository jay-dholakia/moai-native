import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, Pressable } from 'react-native';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout, border } from '@/utils/styles';
import { useMessageReactions } from '@/hooks/use-message-reactions';
import { MessageReactionCount } from '@/services/message-reaction-service';
import { Avatar } from '@/components/ui/Avatar';

interface MessageReactionsProps {
  messageId: string;
  onAddReaction?: () => void;
}

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

export function MessageReactions({ messageId, onAddReaction }: MessageReactionsProps) {
  const { colors } = useTheme();
  const { reactions, toggleReaction, isToggling } = useMessageReactions(messageId);
  const [showReactors, setShowReactors] = useState<string | null>(null);

  if (reactions.length === 0) return null;

  return (
    <>
      <View style={tw(layout.flexRow, layout.flexWrap, spacing.gap(1), spacing.mt(1))}>
        {reactions.map((reaction) => (
          <TouchableOpacity
            key={reaction.emoji}
            onPress={() => toggleReaction(reaction.emoji)}
            onLongPress={() => setShowReactors(reaction.emoji)}
            disabled={isToggling}
            style={[
              tw(
                layout.flexRow,
                layout.itemsCenter,
                spacing.px(2),
                spacing.py(1),
                border.rounded
              ),
              {
                backgroundColor: reaction.hasReacted 
                  ? colors.primary + '20' 
                  : colors.muted,
                borderWidth: reaction.hasReacted ? 1 : 0,
                borderColor: colors.primary,
              },
            ]}
          >
            <Text style={tw(text.sm)}>{reaction.emoji}</Text>
            <Text 
              style={[
                tw(text.xs, spacing.ml(1)),
                { color: reaction.hasReacted ? colors.primary : colors.foreground }
              ]}
            >
              {reaction.count}
            </Text>
          </TouchableOpacity>
        ))}
        
        {onAddReaction && (
          <TouchableOpacity
            onPress={onAddReaction}
            style={[
              tw(
                layout.flexRow,
                layout.itemsCenter,
                spacing.px(2),
                spacing.py(1),
                border.rounded
              ),
              { backgroundColor: colors.muted },
            ]}
          >
            <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>+</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Reactors Modal */}
      {showReactors && (
        <ReactorsModal
          reaction={reactions.find((r) => r.emoji === showReactors)!}
          onClose={() => setShowReactors(null)}
        />
      )}
    </>
  );
}

interface ReactorsModalProps {
  reaction: MessageReactionCount;
  onClose: () => void;
}

function ReactorsModal({ reaction, onClose }: ReactorsModalProps) {
  const { colors } = useTheme();

  return (
    <Modal
      visible={true}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable 
        style={[
          tw(layout.flex1, layout.justifyCenter, layout.itemsCenter),
          { backgroundColor: 'rgba(0,0,0,0.5)' }
        ]}
        onPress={onClose}
      >
        <View 
          style={[
            tw(spacing.p(4), border.rounded, layout.w(80)),
            { backgroundColor: colors.background, maxHeight: '50%' }
          ]}
        >
          <Text style={[tw(text.lg, text.semibold, spacing.mb(3)), { color: colors.foreground }]}>
            {reaction.emoji} {reaction.count}
          </Text>
          
          <ScrollView showsVerticalScrollIndicator={false}>
            {reaction.reactors.map((reactor) => (
              <View
                key={reactor.id}
                style={tw(layout.flexRow, layout.itemsCenter, spacing.py(2))}
              >
                <Avatar
                  source={reactor.profile_image}
                  fallback={`${reactor.first_name?.[0] || ''}${reactor.last_name?.[0] || ''}`}
                  size="sm"
                />
                <Text 
                  style={[tw(text.sm, spacing.ml(2)), { color: colors.foreground }]}
                >
                  {reactor.first_name} {reactor.last_name}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </Pressable>
    </Modal>
  );
}

interface ReactionPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export function ReactionPicker({ onSelect, onClose }: ReactionPickerProps) {
  const { colors } = useTheme();

  return (
    <Modal
      visible={true}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable 
        style={[
          tw(layout.flex1, layout.justifyEnd),
          { backgroundColor: 'rgba(0,0,0,0.5)' }
        ]}
        onPress={onClose}
      >
        <View 
          style={[
            tw(spacing.p(4), border.roundedTop),
            { backgroundColor: colors.background }
          ]}
        >
          <Text style={[tw(text.lg, text.semibold, spacing.mb(3)), { color: colors.foreground }]}>
            React to this message
          </Text>
          
          <View style={tw(layout.flexRow, layout.flexWrap, spacing.gap(3))}>
            {QUICK_REACTIONS.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                onPress={() => {
                  onSelect(emoji);
                  onClose();
                }}
                style={[
                  tw(spacing.p(3), border.rounded),
                  { backgroundColor: colors.muted }
                ]}
              >
                <Text style={tw(text['2xl'])}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}