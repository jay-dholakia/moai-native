import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  Linking,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { 
  Users, 
  Settings, 
  UserPlus, 
  Link,
  Share2,
  X
} from 'lucide-react-native';

import { MobileLayout } from '@/components/layouts/MobileLayout';
import { AppHeader } from '@/components/ui/AppHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { MoaiMemberList } from '@/components/moai';
import { useMoaiById, useMoaiMembers, useMoaiActions } from '@/hooks/use-moai';
import { useMoaiRealtimeById } from '@/hooks/use-moai-realtime';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout, border } from '@/utils/styles';
import { MoaiMember } from '@/services/types';
import { InvitationService } from '@/services/invitation-service';

export default function MoaiDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { theme, colors } = useTheme();
  const { joinMoai, leaveMoai, isJoiningMoai, isLeavingMoai } = useMoaiActions();
  
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);

  const { moai, isLoading: moaiLoading, error: moaiError } = useMoaiById(id!);
  const { data: members, isLoading: membersLoading } = useMoaiMembers(id!);
  const { isConnected: isRealtimeConnected } = useMoaiRealtimeById(id!);

  if (!id) {
    return (
      <MobileLayout>
        <Text style={[tw(text.lg), { color: colors.destructive }]}>
          Invalid Moai ID
        </Text>
      </MobileLayout>
    );
  }

  if (moaiLoading || membersLoading) {
    return (
      <MobileLayout>
        <AppHeader title="Loading..." showBackButton />
        <View style={tw(layout.flex1, layout.itemsCenter, layout.justifyCenter)}>
          <Text style={[tw(text.base), { color: colors.mutedForeground }]}>
            Loading Moai details...
          </Text>
        </View>
      </MobileLayout>
    );
  }

  if (moaiError || !moai) {
    return (
      <MobileLayout>
        <AppHeader title="Error" showBackButton />
        <View style={tw(layout.flex1, layout.itemsCenter, layout.justifyCenter)}>
          <Text style={[tw(text.base), { color: colors.destructive }]}>
            Failed to load Moai details
          </Text>
        </View>
      </MobileLayout>
    );
  }

  // Check user's role in this moai
  const currentUserMember = members?.find(m => m.profile_id === user?.id);
  const isAdmin = currentUserMember?.role_in_moai === 'admin';
  const isMember = !!currentUserMember?.is_active;
  const canJoin = !isMember && moai.moai_type === 'public';

  const handleJoinMoai = async () => {
    if (!id) return;
    
    Alert.alert(
      'Join Moai',
      `Are you sure you want to join "${moai.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Join',
          onPress: async () => {
            try {
              joinMoai(id);
              Alert.alert('Success', 'You have successfully joined the Moai!');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to join Moai');
            }
          }
        }
      ]
    );
  };

  const handleLeaveMoai = async () => {
    if (!id) return;
    
    Alert.alert(
      'Leave Moai',
      `Are you sure you want to leave "${moai.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              leaveMoai(id);
              Alert.alert('Left Moai', 'You have left the Moai', [
                { text: 'OK', onPress: () => router.back() }
              ]);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to leave Moai');
            }
          }
        }
      ]
    );
  };

  const handleCreateInvite = async () => {
    if (!isAdmin || !id) return;
    
    setIsCreatingInvite(true);
    try {
      const result = await InvitationService.createMoaiInvitation({
        moaiId: id,
        maxUses: 10,
        expiresHours: 168 // 7 days
      });

      if (result.success && result.data.success && result.data.invite_code) {
        const inviteUrl = InvitationService.generateInviteUrl(result.data.invite_code);
        
        Alert.alert(
          'Invitation Created',
          `Invite code: ${result.data.invite_code}`,
          [
            {
              text: 'Share',
              onPress: () => {
                Share.share({
                  message: `Join our Moai "${moai.name}"! Use code: ${result.data.invite_code} or click: ${inviteUrl}`,
                  url: inviteUrl,
                  title: `Join ${moai.name}`
                });
              }
            },
            { text: 'OK' }
          ]
        );
      } else {
        Alert.alert('Error', result.data?.error || 'Failed to create invitation');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create invitation');
    } finally {
      setIsCreatingInvite(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    // TODO: Implement member removal API call
    Alert.alert('Feature Coming Soon', 'Member removal will be available soon!');
  };

  const handleChangeRole = async (memberId: string, newRole: string) => {
    // TODO: Implement role change API call
    Alert.alert('Feature Coming Soon', 'Role management will be available soon!');
  };

  return (
    <MobileLayout scrollable={false}>
      <AppHeader
        title={
          <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2))}>
            <Text style={[tw(text.lg, text.semibold), { color: colors.foreground }]}>
              {moai.name}
            </Text>
            {isRealtimeConnected && (
              <View
                style={[
                  tw(spacing.w(2), spacing.h(2), border.rounded),
                  { backgroundColor: '#10B981' }
                ]}
              />
            )}
          </View>
        }
        showBackButton
        rightAction={{
          icon: () => <Share2 size={20} color={colors.foreground} />,
          onPress: () => {
            Share.share({
              message: `Check out this Moai: ${moai.name}${moai.description ? ` - ${moai.description}` : ''}`,
              title: moai.name
            });
          },
          label: 'Share'
        }}
      />

      <ScrollView 
        style={tw(layout.flex1)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw(spacing.pb(8))}
        bounces={true}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
      >
        {/* Moai Header */}
        <Card style={tw(spacing.mb(6))}>
          <CardContent style={tw(spacing.p(6))}>
            <View style={tw(layout.itemsCenter, spacing.mb(4))}>
              <Text style={[tw(text.xl, text.bold, text.center, spacing.mb(2)), { color: colors.foreground }]}>
                {moai.name}
              </Text>
              
              {moai.description && (
                <Text style={[tw(text.sm, text.center, spacing.mb(4)), { color: colors.mutedForeground }]}>
                  {moai.description}
                </Text>
              )}

              <View style={tw(layout.flexRow, spacing.gap(4))}>
                <Badge variant="outline">
                  <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(1))}>
                    <Users size={10} color={colors.primary} />
                    <Text style={tw(text.xs)}>
                      {moai.member_count || 0} members
                    </Text>
                  </View>
                </Badge>
                
                {moai.type && (
                  <Badge variant="secondary">
                    <Text style={tw(text.xs)}>
                      {moai.type.charAt(0).toUpperCase() + moai.type.slice(1)}
                    </Text>
                  </Badge>
                )}
              </View>
            </View>

            {/* Action Buttons */}
            <View style={tw(layout.flexRow, spacing.gap(3))}>
              {canJoin && (
                <Button
                  style={tw(layout.flex1)}
                  onPress={handleJoinMoai}
                  loading={isJoiningMoai}
                  disabled={isJoiningMoai}
                >
                  <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2))}>
                    <UserPlus size={16} color={colors.primaryForeground} />
                    <Text style={{ color: colors.primaryForeground, fontWeight: '600' }}>
                      Join Moai
                    </Text>
                  </View>
                </Button>
              )}
              
              {isMember && !isAdmin && (
                <Button
                  variant="destructive"
                  style={tw(layout.flex1)}
                  onPress={handleLeaveMoai}
                  loading={isLeavingMoai}
                  disabled={isLeavingMoai}
                >
                  <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2))}>
                    <X size={16} color={colors.destructiveForeground} />
                    <Text style={{ color: colors.destructiveForeground, fontWeight: '600' }}>
                      Leave Moai
                    </Text>
                  </View>
                </Button>
              )}

              {isAdmin && (
                <>
                  <Button
                    variant="outline"
                    style={tw(layout.flex1)}
                    onPress={handleCreateInvite}
                    loading={isCreatingInvite}
                    disabled={isCreatingInvite}
                  >
                    <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2))}>
                      <Link size={16} color={colors.foreground} />
                      <Text style={{ color: colors.foreground, fontWeight: '600' }}>
                        Invite
                      </Text>
                    </View>
                  </Button>
                  
                  <Button
                    variant="outline"
                    onPress={() => {
                      // TODO: Navigate to settings
                    }}
                  >
                    <Settings size={16} color={colors.foreground} />
                  </Button>
                </>
              )}
            </View>
          </CardContent>
        </Card>

        {/* Moai Goals & Interests */}
        {(moai.goals && moai.goals.length > 0) || (moai.hobbies && moai.hobbies.length > 0) ? (
          <Card style={tw(spacing.mb(6))}>
            <CardHeader>
              <CardTitle>Goals & Interests</CardTitle>
            </CardHeader>
            <CardContent>
              {moai.goals && moai.goals.length > 0 && (
                <View style={tw(spacing.mb(4))}>
                  <Text style={[tw(text.sm, text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
                    Goals
                  </Text>
                  <View style={tw(layout.flexRow, layout.flexWrap, spacing.gap(2))}>
                    {moai.goals.map((goal, index) => (
                      <Badge key={index} variant="outline">
                        <Text style={tw(text.xs)}>
                          {goal.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Text>
                      </Badge>
                    ))}
                  </View>
                </View>
              )}
              
              {moai.hobbies && moai.hobbies.length > 0 && (
                <View>
                  <Text style={[tw(text.sm, text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
                    Interests
                  </Text>
                  <View style={tw(layout.flexRow, layout.flexWrap, spacing.gap(2))}>
                    {moai.hobbies.map((hobby, index) => (
                      <Badge key={index} variant="secondary">
                        <Text style={tw(text.xs)}>
                          {hobby}
                        </Text>
                      </Badge>
                    ))}
                  </View>
                </View>
              )}
            </CardContent>
          </Card>
        ) : null}

        {/* Moai Stats */}
        {isMember && (
          <Card style={tw(spacing.mb(6))}>
            <CardHeader>
              <CardTitle>Moai Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <View style={tw(layout.flexRow, layout.justifyBetween)}>
                <View style={tw(layout.itemsCenter)}>
                  <Text style={[tw(text.xl, text.bold), { color: colors.primary }]}>
                    {moai.weekly_commitment_goal || 0}
                  </Text>
                  <Text style={[tw(text.xs), { color: colors.mutedForeground }]}>
                    Weekly Goal
                  </Text>
                </View>
                
                <View style={tw(layout.itemsCenter)}>
                  <Text style={[tw(text.xl, text.bold), { color: colors.primary }]}>
                    {moai.member_count || 0}
                  </Text>
                  <Text style={[tw(text.xs), { color: colors.mutedForeground }]}>
                    Members
                  </Text>
                </View>
                
                <View style={tw(layout.itemsCenter)}>
                  <Text style={[tw(text.xl, text.bold), { color: colors.primary }]}>
                    {Math.floor(Math.random() * 85) + 15}%
                  </Text>
                  <Text style={[tw(text.xs), { color: colors.mutedForeground }]}>
                    Completion
                  </Text>
                </View>
              </View>
            </CardContent>
          </Card>
        )}

        {/* Members List */}
        <Card>
          <CardHeader>
            <View style={tw(layout.flexRow, layout.justifyBetween, layout.itemsCenter)}>
              <CardTitle>Members ({members?.length || 0})</CardTitle>
              {isAdmin && (
                <TouchableOpacity onPress={handleCreateInvite}>
                  <UserPlus size={16} color={colors.primary} />
                </TouchableOpacity>
              )}
            </View>
          </CardHeader>
          <CardContent>
            <MoaiMemberList
              members={members || []}
              currentUserRole={currentUserMember?.role_in_moai || 'member'}
              currentUserId={user?.id}
              onRemoveMember={handleRemoveMember}
              onChangeRole={handleChangeRole}
              isLoading={membersLoading}
            />
          </CardContent>
        </Card>
      </ScrollView>
    </MobileLayout>
  );
}