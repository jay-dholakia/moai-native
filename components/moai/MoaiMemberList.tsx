import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import {
  Users,
  Crown,
  Shield,
  User,
  MoreVertical,
  X,
  UserX,
  Settings,
  Ban,
} from 'lucide-react-native';

import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { useTheme } from '@/providers/theme-provider';
import { useAuth } from '@/hooks/useAuth';
import { tw, spacing, text, layout, border } from '@/utils/styles';
import { MoaiMember } from '@/services/types';

interface MoaiMemberListProps {
  members: MoaiMember[];
  currentUserRole?: string;
  currentUserId?: string;
  onRemoveMember?: (memberId: string) => void;
  onChangeRole?: (memberId: string, newRole: string) => void;
  isLoading?: boolean;
}

interface MemberActionModalProps {
  visible: boolean;
  member: MoaiMember | null;
  currentUserRole: string;
  currentUserId: string;
  onClose: () => void;
  onRemove: (memberId: string) => void;
  onChangeRole: (memberId: string, newRole: string) => void;
}

function MemberActionModal({
  visible,
  member,
  currentUserRole,
  currentUserId,
  onClose,
  onRemove,
  onChangeRole,
}: MemberActionModalProps) {
  const { colors } = useTheme();

  if (!member || !member.profile) return null;

  const isCurrentUser = member.profile_id === currentUserId;
  const canManage = currentUserRole === 'admin' && !isCurrentUser;
  const canPromote = canManage && member.role_in_moai === 'member';
  const canDemote = canManage && member.role_in_moai === 'moderator';

  const handleRemoveMember = () => {
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${member.profile?.full_name || member.profile?.username} from this Moai?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            onRemove(member.id);
            onClose();
          }
        }
      ]
    );
  };

  const handleChangeRole = (newRole: string) => {
    const roleName = newRole === 'admin' ? 'Admin' : newRole === 'moderator' ? 'Moderator' : 'Member';
    
    Alert.alert(
      `Change Role to ${roleName}`,
      `Are you sure you want to change ${member.profile?.full_name || member.profile?.username}'s role to ${roleName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Change',
          onPress: () => {
            onChangeRole(member.id, newRole);
            onClose();
          }
        }
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={[
        tw(layout.flex1, layout.justifyEnd),
        { backgroundColor: 'rgba(0,0,0,0.5)' }
      ]}>
        <Card style={[
          tw(border.roundedT, spacing.p(0)),
          { backgroundColor: colors.card }
        ]}>
          <CardContent style={tw(spacing.p(6))}>
            {/* Header */}
            <View style={tw(layout.flexRow, layout.justifyBetween, layout.itemsCenter, spacing.mb(6))}>
              <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(3))}>
                <Avatar
                  size="md"
                  source={member.profile.profile_image ? { uri: member.profile.profile_image } : undefined}
                  fallback={member.profile.first_name?.[0] || member.profile.username?.[0] || 'U'}
                />
                <View>
                  <Text style={[tw(text.base, text.semibold), { color: colors.foreground }]}>
                    {member.profile.full_name || member.profile.username || 'Unknown User'}
                  </Text>
                  <Badge variant="outline" size="sm">
                    <Text style={tw(text.xs)}>{member.role_in_moai}</Text>
                  </Badge>
                </View>
              </View>
              
              <TouchableOpacity onPress={onClose}>
                <X size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            {/* Actions */}
            <View style={tw(spacing.gap(3))}>
              {canPromote && (
                <Button
                  variant="outline"
                  onPress={() => handleChangeRole('moderator')}
                  style={tw(layout.justifyStart)}
                >
                  <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(3))}>
                    <Shield size={16} color={colors.primary} />
                    <Text style={[tw(text.sm), { color: colors.foreground }]}>
                      Promote to Moderator
                    </Text>
                  </View>
                </Button>
              )}

              {canDemote && (
                <Button
                  variant="outline"
                  onPress={() => handleChangeRole('member')}
                  style={tw(layout.justifyStart)}
                >
                  <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(3))}>
                    <User size={16} color={colors.mutedForeground} />
                    <Text style={[tw(text.sm), { color: colors.foreground }]}>
                      Demote to Member
                    </Text>
                  </View>
                </Button>
              )}

              {canManage && (
                <Button
                  variant="destructive"
                  onPress={handleRemoveMember}
                  style={tw(layout.justifyStart)}
                >
                  <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(3))}>
                    <UserX size={16} color={colors.destructiveForeground} />
                    <Text style={[tw(text.sm), { color: colors.destructiveForeground }]}>
                      Remove from Moai
                    </Text>
                  </View>
                </Button>
              )}

              {!canManage && (
                <View style={tw(layout.itemsCenter, spacing.py(4))}>
                  <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                    No actions available
                  </Text>
                </View>
              )}
            </View>
          </CardContent>
        </Card>
      </View>
    </Modal>
  );
}

export function MoaiMemberList({
  members,
  currentUserRole = 'member',
  currentUserId,
  onRemoveMember,
  onChangeRole,
  isLoading = false,
}: MoaiMemberListProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [selectedMember, setSelectedMember] = useState<MoaiMember | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown size={12} color={colors.warning} />;
      case 'moderator':
        return <Shield size={12} color={colors.primary} />;
      default:
        return <User size={12} color={colors.mutedForeground} />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return colors.warning;
      case 'moderator':
        return colors.primary;
      default:
        return colors.mutedForeground;
    }
  };

  const handleMemberPress = (member: MoaiMember) => {
    const canManage = currentUserRole === 'admin' && member.profile_id !== currentUserId;
    
    if (canManage) {
      setSelectedMember(member);
      setShowActionModal(true);
    }
  };

  const renderMember = ({ item: member }: { item: MoaiMember }) => {
    const profile = member.profile;
    if (!profile) return null;

    const canManage = currentUserRole === 'admin' && member.profile_id !== currentUserId;

    return (
      <TouchableOpacity
        onPress={() => handleMemberPress(member)}
        disabled={!canManage}
        activeOpacity={canManage ? 0.7 : 1}
      >
        <View
          style={[
            tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.p(3), border.rounded, spacing.mb(2)),
            { backgroundColor: colors.muted }
          ]}
        >
          <View style={tw(layout.flexRow, layout.itemsCenter, layout.flex1)}>
            <Avatar
              size="md"
              source={profile.profile_image ? { uri: profile.profile_image } : undefined}
              fallback={profile.first_name?.[0] || profile.username?.[0] || 'U'}
            />
            
            <View style={tw(spacing.ml(3), layout.flex1)}>
              <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2))}>
                <Text 
                  style={[tw(text.sm, text.semibold), { color: colors.foreground }]}
                  numberOfLines={1}
                >
                  {profile.full_name || profile.username || 'Unknown User'}
                </Text>
                {getRoleIcon(member.role_in_moai || 'member')}
              </View>
              
              <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2), spacing.mt(1))}>
                <Badge variant="outline" size="sm">
                  <Text 
                    style={[tw(text.xs), { color: getRoleColor(member.role_in_moai || 'member') }]}
                  >
                    {member.role_in_moai}
                  </Text>
                </Badge>
                
                {member.joined_at && (
                  <Text style={[tw(text.xs), { color: colors.mutedForeground }]}>
                    Joined {new Date(member.joined_at).toLocaleDateString()}
                  </Text>
                )}
                
                {member.profile_id === currentUserId && (
                  <Badge variant="secondary" size="sm">
                    <Text style={tw(text.xs)}>You</Text>
                  </Badge>
                )}
              </View>
            </View>
          </View>

          {canManage && (
            <TouchableOpacity
              onPress={() => handleMemberPress(member)}
              style={tw(spacing.p(1))}
            >
              <MoreVertical size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={tw(layout.itemsCenter, spacing.py(8))}>
        <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
          Loading members...
        </Text>
      </View>
    );
  }

  if (!members || members.length === 0) {
    return (
      <View style={tw(layout.itemsCenter, spacing.py(8))}>
        <Users size={48} color={colors.mutedForeground} style={tw(spacing.mb(3))} />
        <Text style={[tw(text.base, text.semibold, spacing.mb(1)), { color: colors.foreground }]}>
          No Members Yet
        </Text>
        <Text style={[tw(text.sm, text.center), { color: colors.mutedForeground }]}>
          Be the first to join this Moai!
        </Text>
      </View>
    );
  }

  return (
    <>
      <FlatList
        data={members}
        renderItem={renderMember}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={8}
        windowSize={10}
        getItemLayout={(_, index) => ({
          length: 70, // Estimated member item height
          offset: 70 * index,
          index,
        })}
      />

      <MemberActionModal
        visible={showActionModal}
        member={selectedMember}
        currentUserRole={currentUserRole}
        currentUserId={currentUserId || ''}
        onClose={() => {
          setShowActionModal(false);
          setSelectedMember(null);
        }}
        onRemove={onRemoveMember || (() => {})}
        onChangeRole={onChangeRole || (() => {})}
      />
    </>
  );
}