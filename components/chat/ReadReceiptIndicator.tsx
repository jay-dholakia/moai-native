import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, Pressable } from 'react-native';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout, border } from '@/utils/styles';
import { useMessageReadReceipts } from '@/hooks/use-read-receipts';
import { ReadReceipt } from '@/services/read-receipts-service';
import { Avatar } from '@/components/ui/Avatar';
import { Check, CheckCheck } from 'lucide-react-native';

interface ReadReceiptIndicatorProps {
  messageId: string;
  messageUserId: string;
  currentUserId?: string;
  showDetails?: boolean;
}

export function ReadReceiptIndicator({ 
  messageId, 
  messageUserId, 
  currentUserId,
  showDetails = true 
}: ReadReceiptIndicatorProps) {
  const { colors } = useTheme();
  const { readReceipts } = useMessageReadReceipts(messageId);
  const [showModal, setShowModal] = useState(false);

  // Don't show read receipts for messages from other users to current user
  const isCurrentUserMessage = messageUserId === currentUserId;
  if (!isCurrentUserMessage) return null;

  // Don't show if no receipts
  if (readReceipts.length === 0) {
    return (
      <View style={tw(layout.flexRow, layout.itemsCenter, spacing.mt(1))}>
        <Check size={12} color={colors.mutedForeground} />
      </View>
    );
  }

  const handlePress = () => {
    if (showDetails && readReceipts.length > 0) {
      setShowModal(true);
    }
  };

  return (
    <>
      <TouchableOpacity 
        onPress={handlePress}
        style={tw(layout.flexRow, layout.itemsCenter, spacing.mt(1))}
        disabled={!showDetails}
      >
        <CheckCheck size={12} color={colors.primary} />
        {readReceipts.length > 1 && (
          <Text style={[tw(text.xs, spacing.ml(1)), { color: colors.mutedForeground }]}>
            {readReceipts.length}
          </Text>
        )}
      </TouchableOpacity>

      {/* Read Receipts Modal */}
      {showModal && (
        <ReadReceiptsModal
          receipts={readReceipts}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

interface ReadReceiptsModalProps {
  receipts: ReadReceipt[];
  onClose: () => void;
}

function ReadReceiptsModal({ receipts, onClose }: ReadReceiptsModalProps) {
  const { colors } = useTheme();

  const formatReadTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
    
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

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
            { backgroundColor: colors.background, maxHeight: '60%' }
          ]}
        >
          <Text style={[tw(text.lg, text.semibold, spacing.mb(3)), { color: colors.foreground }]}>
            Read by {receipts.length}
          </Text>
          
          <ScrollView showsVerticalScrollIndicator={false}>
            {receipts.map((receipt) => (
              <View
                key={receipt.id}
                style={tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.py(3))}
              >
                <View style={tw(layout.flexRow, layout.itemsCenter, layout.flex1)}>
                  <Avatar
                    source={receipt.profiles?.profile_image}
                    fallback={`${receipt.profiles?.first_name?.[0] || ''}${receipt.profiles?.last_name?.[0] || ''}`}
                    size="sm"
                  />
                  <Text 
                    style={[tw(text.sm, spacing.ml(3)), { color: colors.foreground }]}
                  >
                    {receipt.profiles?.first_name} {receipt.profiles?.last_name}
                  </Text>
                </View>
                
                <Text 
                  style={[tw(text.xs), { color: colors.mutedForeground }]}
                >
                  {formatReadTime(receipt.read_at)}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </Pressable>
    </Modal>
  );
}

// Compact version for message lists
export function CompactReadIndicator({ 
  messageId, 
  messageUserId, 
  currentUserId 
}: ReadReceiptIndicatorProps) {
  const { colors } = useTheme();
  const { readReceipts } = useMessageReadReceipts(messageId);

  const isCurrentUserMessage = messageUserId === currentUserId;
  if (!isCurrentUserMessage) return null;

  if (readReceipts.length === 0) {
    return <Check size={10} color={colors.mutedForeground} />;
  }

  return (
    <View style={tw(layout.flexRow, layout.itemsCenter)}>
      <CheckCheck size={10} color={colors.primary} />
      {readReceipts.length > 1 && (
        <Text style={[tw(text.xs, spacing.ml(1)), { color: colors.primary, fontSize: 10 }]}>
          {readReceipts.length}
        </Text>
      )}
    </View>
  );
}

// Read status badge for chat list items
export function UnreadBadge({ count }: { count: number }) {
  const { colors } = useTheme();

  if (count === 0) return null;

  return (
    <View
      style={[
        tw(spacing.px(2), spacing.py(1), border.rounded),
        {
          backgroundColor: colors.primary,
          minWidth: 20,
          height: 20,
          justifyContent: 'center',
          alignItems: 'center',
        },
      ]}
    >
      <Text
        style={[
          tw(text.xs, text.semibold),
          {
            color: colors.primaryForeground,
            fontSize: 11,
          },
        ]}
      >
        {count > 99 ? '99+' : count.toString()}
      </Text>
    </View>
  );
}