import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Bell, QrCode } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Modal, ScrollView, Text, View } from 'react-native';

import { FriendsSection } from '@/components/friends/FriendsSection';
import { MobileLayout } from '@/components/layouts/MobileLayout';
import { MoaiCreationModal } from '@/components/moai/MoaiCreationModal';
import { MoaiDetailCard } from '@/components/moai/MoaiDetailCard';
import { MoaiJourneyCard } from '@/components/moai/MoaiJourneyCard';
import { MoaiMomentsModal } from '@/components/moai/MoaiMomentsModal';
import { MoaiSelector } from '@/components/moai/MoaiSelector';
import { MoaiTabContent } from '@/components/moai/MoaiTabContent';
import { MemberActivityModal } from '@/components/modals/MemberActivityModal';
import { TokenBalance } from '@/components/tokens/TokenBalance';
import { AppHeader } from '@/components/ui/AppHeader';

import { InviteMembersModal } from '@/components/moai/InviteMembersModal';

import {
  useCreateMoaiPost,
  useMoaiActions,
  useMoaiMembers,
  useMoaiMoments,
  useMoaiPosts,
  useMomentsStatus,
  usePinMoaiPost,
  useUserMoais
} from '@/hooks/use-moai';
import { MemberWeeklyProgressData, useMoaiAllMembersWeeklyProgress, useMoaiJourney, useMoaiWeeklyProgress } from '@/hooks/use-moai-progress';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/providers/theme-provider';
import { Moai } from '@/services/types';
import { border, layout, spacing, text, tw } from '@/utils/styles';

export default function YourMoaiScreen() {
  const { moaiId } = useLocalSearchParams<{ moaiId?: string }>();
  const { user } = useAuth();
  const { theme, colors } = useTheme();
  
  // State management
  const [selectedMoai, setSelectedMoai] = useState<Moai | null>(null);
  const [showFriendsView, setShowFriendsView] = useState(false);
  const [showCreateMoaiModal, setShowCreateMoaiModal] = useState(false);
  const [showCapacityModal, setShowCapacityModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showMomentsModal, setShowMomentsModal] = useState(false);
  const [selectedMoaiForMoments, setSelectedMoaiForMoments] = useState<Moai | null>(null);
  
  // Member activity modal state
  const [showMemberActivityModal, setShowMemberActivityModal] = useState(false);
  const [selectedMemberForActivity, setSelectedMemberForActivity] = useState<MemberWeeklyProgressData | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Data hooks
  const { userMoais, isLoading: isLoadingMoais } = useUserMoais();
  const { joinMoai } = useMoaiActions();
  
  // Get flat array of moais from paginated data
  const moais = useMemo(() => {
    return userMoais?.pages?.flatMap(page => page.data) || [];
  }, [userMoais]);

  // Sort moais by urgency status (matching web implementation)
  const sortedMoais = useMemo(() => {
    return [...moais].sort((a, b) => {
      const getUrgencyPriority = (moai: Moai) => {
        const consecutiveMissed = moai.consecutive_missed_weeks || 0;
        const currentStreak = moai.current_streak_weeks || 0;
        
        if (consecutiveMissed >= 1) return 3; // Critical
        if (currentStreak === 0) return 2; // At Risk
        return 1; // On Track
      };
      
      return getUrgencyPriority(b) - getUrgencyPriority(a);
    });
  }, [moais]);

  // Get moai IDs for moments status
  const moaiIds = useMemo(() => sortedMoais.map(moai => moai.id), [sortedMoais]);
  const { data: momentsStatus } = useMomentsStatus(moaiIds);

  const { data: moments } = useMoaiMoments(selectedMoaiForMoments?.id || '');

  // Selected moai data
  const { data: members } = useMoaiMembers(selectedMoai?.id || '');
  const { data: posts } = useMoaiPosts(selectedMoai?.id || '');
  const createPostMutation = useCreateMoaiPost();
  const pinPostMutation = usePinMoaiPost();

  // Progress data for selected moai
  useMoaiWeeklyProgress(selectedMoai?.id || '');
  const { data: journeyData } = useMoaiJourney(selectedMoai?.id || '');
  const { data: allMembersProgress, isLoading: membersProgressLoading } = useMoaiAllMembersWeeklyProgress(selectedMoai?.id || '');

  // Check if user has no moais
  const hasNoMoais = !isLoadingMoais && moais.length === 0;

  // Auto-select first moai when moais are loaded, or specific moai from URL
  useEffect(() => {
    if (sortedMoais && sortedMoais.length > 0) {
      if (moaiId) {
        // Try to find the moai from URL parameter
        const targetMoai = sortedMoais.find(m => m.id === moaiId);
        if (targetMoai) {
          setSelectedMoai(targetMoai);
        } else {
          // Moai not found, select first one and update URL
          setSelectedMoai(sortedMoais[0]);
          router.replace('/your-moai');
        }
      } else if (!selectedMoai) {
        // No URL parameter, select first moai
        setSelectedMoai(sortedMoais[0]);
      }
    }
  }, [sortedMoais, selectedMoai, moaiId]);

  // Redirect to create-moai if user has no moais
  useEffect(() => {
    if (hasNoMoais) {
      router.replace('/create-moai');
    }
  }, [hasNoMoais]);

  const handleMoaiSelect = useCallback((moai: Moai) => {
    // When friends view is active, selecting a moai should close friends view
    if (showFriendsView) {
      setShowFriendsView(false);
    }
    
    // Check if this moai is already selected
    const isAlreadySelected = selectedMoai?.id === moai.id;
    
    if (isAlreadySelected && !showFriendsView) {
      // Already selected - check for stories
      const storyStatus = momentsStatus?.[moai.id];
      if (storyStatus?.hasStories && !storyStatus.hasViewedStories) {
        // Open moments modal
        setSelectedMoaiForMoments(moai);
        setShowMomentsModal(true);
      } else {
        // No new stories, deselect
        setSelectedMoai(null);
      }
    } else {
      // Select this moai
      setSelectedMoai(moai);
      // Update URL to reflect selection
      router.setParams({ moaiId: moai.id });
    }
  }, [selectedMoai?.id, momentsStatus, showFriendsView]);

  const handleToggleFriendsView = useCallback(() => {
    setShowFriendsView(!showFriendsView);
  }, [showFriendsView]);

  const handleCreateMoai = useCallback(() => {
    // Check if user already has 3 moais
    if (sortedMoais.length >= 3) {
      setShowCapacityModal(true);
      return;
    }
    setShowCreateMoaiModal(true);
  }, [sortedMoais.length]);

  const handleCreatePost = useCallback(async (content: string) => {
    if (!selectedMoai?.id) return;
    
    await createPostMutation.mutateAsync({
      moaiId: selectedMoai.id,
      content,
    });
  }, [selectedMoai?.id, createPostMutation]);

  const handlePinPost = useCallback(async (postId: string) => {
    if (!selectedMoai?.id) return;
    
    await pinPostMutation.mutateAsync({
      moaiId: selectedMoai.id,
      postId,
    });
  }, [selectedMoai?.id, pinPostMutation]);

  const handleJoinMoai = useCallback(async (moaiId: string) => {
    try {
      await joinMoai(moaiId);
      Alert.alert('Success', 'You have successfully joined the Moai!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to join Moai');
    }
  }, [joinMoai]);

  const handleMemberDayPress = useCallback(async (memberId: string, day: Date) => {
    // Find the member data
    const member = members?.find(m => m.profile_id === memberId);
    if (!member?.profile) return;

    // Convert member to MemberWeeklyProgressData format
    const memberData: MemberWeeklyProgressData = {
      id: member.profile.id,
      first_name: member.profile.first_name ?? '',
      last_name: member.profile.last_name ?? '',
      profile_image: member.profile.profile_image ?? undefined,
      username: member.profile.username ?? undefined,
      total_activities_logged: member.profile.total_activities_logged ?? 0,
      activitiesThisWeek: 0, // TODO: Get real data
      metCommitment: false, // TODO: Get real data
      hasActivity: false, // TODO: Get real data
      movementDaysGoal: 0, // TODO: Get real data
      daysCompleted: 0, // TODO: Get real data
    };

    setSelectedMemberForActivity(memberData);
    setSelectedDate(day);
    setShowMemberActivityModal(true);
  }, [members]);

  // Get current user's membership info
  const currentUserMember = members?.find(member => member.profile_id === user?.id);
  const isAdmin = currentUserMember?.role_in_moai === 'admin' || selectedMoai?.creator_id === user?.id;
  const isMember = !!currentUserMember;

  // Show loading state
  if (isLoadingMoais) {
    return (
      <MobileLayout>
        <AppHeader title="Your Moai" showProfile={true} />
        <View style={tw(layout.flex1, layout.itemsCenter, layout.justifyCenter)}>
          <Text style={[tw(text.base), { color: colors.mutedForeground }]}>
            Loading your Moais...
          </Text>
        </View>
      </MobileLayout>
    );
  }

  // Don't render if being redirected
  if (hasNoMoais) {
    return null;
  }

  return (
    <>
      <MobileLayout scrollable={false}>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
        
        {/* Header */}
        <AppHeader
          title="Your Moai"
          showProfile={true}
          rightAction={{
            icon: () => (
              <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(3))}>
                <TokenBalance size="sm" showLabel={false} />
                <QrCode size={20} color={colors.foreground} />
                <Bell size={20} color={colors.foreground} />
              </View>
            ),
            onPress: () => {
              // Handle notifications or QR code
              Alert.alert('Feature Coming Soon', 'Notifications and QR code features will be available soon!');
            },
            label: 'Notifications and tools'
          }}
        />

        <ScrollView 
          style={tw(layout.flex1)}
          showsVerticalScrollIndicator={false}
          bounces={true}
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="handled"
        >
          <View style={tw(spacing.p(4))}>
            {/* Moai Selector */}
            <MoaiSelector
              moais={sortedMoais}
              selectedMoai={selectedMoai}
              onMoaiSelect={handleMoaiSelect}
              onFriendsToggle={handleToggleFriendsView}
              onCreateMoai={handleCreateMoai}
              showFriendsView={showFriendsView}
              storyStatus={momentsStatus}
              isLoading={isLoadingMoais}
            />

            {/* Conditional Content */}
            {showFriendsView ? (
              <FriendsSection />
            ) : (
              <>
                {/* Selected Moai Detail View */}
                {selectedMoai && (
                  <MoaiDetailCard 
                    moai={selectedMoai}
                    isAdmin={isAdmin}
                    isMember={isMember}
                    memberCount={members?.length}
                    onInvitePress={() => setShowInviteModal(true)}
                    onJoinPress={() => handleJoinMoai(selectedMoai.id)}
                    onSharePress={() => {
                      // TODO: Implement share functionality
                      Alert.alert('Share Moai', `Share "${selectedMoai.name}" with friends!`);
                    }}
                    onSettingsPress={() => {
                      // TODO: Navigate to settings
                      Alert.alert('Settings', 'Moai settings coming soon!');
                    }}
                  />
                )}
                {/* Moai Tab Content */}
                {selectedMoai && (
                  <MoaiTabContent
                    moai={selectedMoai}
                    isCreator={isAdmin}
                    members={members || []}
                    posts={posts || []}
                    onCreatePost={handleCreatePost}
                    onPinPost={handlePinPost}
                    onInviteMembers={() => setShowInviteModal(true)}
                    isCreatingPost={createPostMutation.isPending}
                    isPinningPost={pinPostMutation.isPending}
                  />
                )}
                {/* Weekly Progress & Journey Section */}
                {selectedMoai && (
                  <>
 

                    <MoaiJourneyCard
                      moaiId={selectedMoai.id}
                      milestones={journeyData?.milestones || []}
                      currentTier={journeyData?.currentTier || 'bronze'}
                      currentStreak={journeyData?.currentStreak || 0}
                      totalWeeks={journeyData?.totalWeeks || 0}
                      joinDate={journeyData?.joinDate || selectedMoai.created_at}
                      showFullTimeline={false}
                      compact={true}
                      onPress={() => {
                        // TODO: Navigate to full journey timeline
                        Alert.alert('Journey Timeline', 'Full journey view coming soon!');
                      }}
                    />
                  </>
                )}



                {/* No Moai Selected State */}
                {!selectedMoai && !showFriendsView && (
                  <View style={tw(spacing.mt(8), layout.itemsCenter)}>
                    <Text style={[tw(text.lg, text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
                      Select a Moai
                    </Text>
                    <Text style={[tw(text.sm, text.center), { color: colors.mutedForeground }]}>
                      Choose a Moai from above to view its details and activity feed
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
        </ScrollView>
      </MobileLayout>

      {/* Modals */}
      
      {/* Create Moai Modal */}
      <Modal
        visible={showCreateMoaiModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateMoaiModal(false)}
      >
        <MoaiCreationModal onClose={() => setShowCreateMoaiModal(false)} />
      </Modal>

      {/* Capacity Modal */}
      <Modal
        visible={showCapacityModal}
        animationType="fade"
        transparent={true}
      >
        <View style={tw(layout.flex1, layout.itemsCenter, layout.justifyCenter, spacing.p(4))}>
          <View 
            style={[
              tw(spacing.p(6), border.rounded),
              { backgroundColor: colors.card, maxWidth: 320 }
            ]}
          >
            <Text style={[tw(text.lg, text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
              Moai Limit Reached
            </Text>
            <Text style={[tw(text.sm, spacing.mb(4)), { color: colors.mutedForeground }]}>
              You can only be a member of up to 3 Moais at a time. Leave a Moai to create a new one.
            </Text>
            <Text 
              style={[tw(text.sm, text.center), { color: colors.primary }]}
              onPress={() => setShowCapacityModal(false)}
            >
              OK
            </Text>
          </View>
        </View>
      </Modal>

      
      {/* MoaiMomentsModal */}
      {selectedMoaiForMoments && (
        <MoaiMomentsModal
          isOpen={showMomentsModal}
          onClose={() => setShowMomentsModal(false)}
          moments={moments || []}
          moaiName={selectedMoaiForMoments.name}
          moaiId={selectedMoaiForMoments.id}
        />
      )}

      {/* InviteMembersModal */}
      {selectedMoai && (
        <Modal
          visible={showInviteModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowInviteModal(false)}
        >
          <InviteMembersModal moai={selectedMoai} onClose={() => setShowInviteModal(false)} />
        </Modal>
      )}

      {/* MemberActivityModal */}
      <MemberActivityModal
        isOpen={showMemberActivityModal}
        onClose={() => {
          setShowMemberActivityModal(false);
          setSelectedMemberForActivity(null);
          setSelectedDate(null);
        }}
        member={selectedMemberForActivity}
        selectedDate={selectedDate}
        activities={[]} // TODO: Fetch real activity data for selected member and date
      />
    </>
  );
}