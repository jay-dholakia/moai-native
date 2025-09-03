import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, TextInput, ActivityIndicator, Alert, Share } from 'react-native';
import { Share2, Copy, Check, Users, Clock, X } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';

import { useTheme } from '@/providers/theme-provider';
import { tw, layout, text, spacing, border } from '@/utils/styles';
import { Moai } from '@/services/types';

// Mock services for now
const createMoaiInvitation = async (params: any) => {
  console.log('Creating invitation with params:', params);
  await new Promise(res => setTimeout(res, 1000));
  return { success: true, invite_code: `mock_invite_${Date.now()}` };
};

const generateInviteUrl = (code: string) => `https://moai.com/join/${code}`;

interface InviteMembersModalProps {
  moai: Moai;
  onClose: () => void;
}

export function InviteMembersModal({ moai, onClose }: InviteMembersModalProps) {
  const { colors } = useTheme();
  const [isCreating, setIsCreating] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const handleCreateInvite = useCallback(async () => {
    setIsCreating(true);
    try {
      const result = await createMoaiInvitation({ moaiId: moai.id });
      if (result.success && result.invite_code) {
        setInviteUrl(generateInviteUrl(result.invite_code));
      } else {
        Alert.alert('Error', 'Failed to create invite link');
      }
    } catch {
      Alert.alert('Error', 'Failed to create invite link');
    } finally {
      setIsCreating(false);
    }
  }, [moai.id]);

  useEffect(() => {
    if (!inviteUrl) {
      handleCreateInvite();
    }
  }, [handleCreateInvite, inviteUrl]);

  const handleCopyLink = async () => {
    await Clipboard.setStringAsync(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        title: `Join ${moai.name} on Moai`,
        message: `You're invited to join our wellness community! ${inviteUrl}`,
        url: inviteUrl, // for iOS
      });
    } catch {
      // Handle share error
    }
  };

  return (
    <View style={tw(layout.flex1, `bg-black/60`, layout.justifyEnd)}>
      <View style={[{ backgroundColor: colors.background }, tw(`h-auto`, border.roundedLg)]}>
        {/* Header */}
        <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.p(4), { borderBottomWidth: 1, borderColor: colors.border })}>
          <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2))}>
            <Users size={20} color={colors.primary} />
            <Text style={[tw(text.lg, text.semibold), { color: colors.foreground }]}>
              Invite to {moai.name}
            </Text>
          </View>
          <Pressable onPress={onClose} style={tw(spacing.p(2))}>
            <X size={24} color={colors.foreground} />
          </Pressable>
        </View>

        <View style={tw(spacing.p(4), spacing.gap(4))}>
          {isCreating ? (
            <View style={tw(layout.flexCol, layout.itemsCenter, layout.justifyCenter, spacing.py(8))}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[tw(text.sm, spacing.mt(4)), { color: colors.mutedForeground }]}>
                Creating your invite link...
              </Text>
            </View>
          ) : inviteUrl ? (
            <>
              <View style={tw(spacing.gap(2))}>
                <Text style={[tw(text.sm, text.medium), { color: colors.foreground }]}>Your invite link:</Text>
                <View style={tw(layout.flexRow, spacing.gap(2))}>
                  <TextInput
                    value={inviteUrl}
                    readOnly
                    style={[
                      tw(layout.flex1, spacing.p(2), border.rounded, text.sm),
                      { backgroundColor: colors.input, color: colors.foreground, borderWidth: 1, borderColor: colors.border },
                    ]}
                  />
                  <Pressable
                    onPress={handleCopyLink}
                    style={tw(spacing.p(2), border.rounded, { backgroundColor: colors.secondary })}
                  >
                    {copied ? <Check size={20} color={colors.secondaryForeground} /> : <Copy size={20} color={colors.secondaryForeground} />}
                  </Pressable>
                </View>
              </View>

              <Pressable
                onPress={handleShare}
                style={tw(layout.flexRow, layout.itemsCenter, layout.justifyCenter, spacing.p(3), border.rounded, { backgroundColor: colors.primary })}
              >
                <Share2 size={20} color={colors.primaryForeground} style={tw(spacing.mr(2))} />
                <Text style={[tw(text.base, text.medium), { color: colors.primaryForeground }]}>Share Invite</Text>
              </Pressable>

              <View style={tw(spacing.gap(1), `bg-gray-100/10`, spacing.p(2), border.roundedLg)}>
                <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2))}>
                  <Users size={14} color={colors.mutedForeground} />
                  <Text style={[tw(text.xs), { color: colors.mutedForeground }]}>
                    Valid until Moai reaches capacity ({moai.max_members} members)
                  </Text>
                </View>
                <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2))}>
                  <Clock size={14} color={colors.mutedForeground} />
                  <Text style={[tw(text.xs), { color: colors.mutedForeground }]}>Expires in 7 days</Text>
                </View>
              </View>
            </>
          ) : (
            <View style={tw(layout.flexCol, layout.itemsCenter, layout.justifyCenter, spacing.py(8))}>
              <Text style={[tw(text.sm, spacing.mb(4)), { color: colors.mutedForeground }]}>
                Failed to create invite link
              </Text>
              <Pressable
                onPress={handleCreateInvite}
                style={tw(spacing.px(4), spacing.py(2), border.rounded, { backgroundColor: colors.primary })}
              >
                <Text style={{ color: colors.primaryForeground }}>Try Again</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}