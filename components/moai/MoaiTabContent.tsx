import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { useMoaiJourney, useMoaiWeeklyProgress, useMoaiAllMembersWeeklyProgress } from '@/hooks/use-moai-progress';
import { useTheme } from '@/providers/theme-provider';
import { Moai, MoaiMember } from '@/services/types';
import { border, layout, spacing, text, tw } from '@/utils/styles';
import { MessageSquare, MoreVertical, Pin, Send, TrendingUp, Users } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, FlatList, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MoaiJourneyCard } from './MoaiJourneyCard';
import { MoaiWeeklyProgress } from './MoaiWeeklyProgress';

interface MoaiPost {
  id: string;
  content: string;
  image_url?: string;
  created_at: string;
  profile_id: string;
  profile: {
    first_name: string;
    last_name: string;
    profile_image?: string;
  };
  is_pinned?: boolean;
}

interface MoaiTabContentProps {
  moai: Moai;
  isCreator?: boolean;
  members?: MoaiMember[];
  posts?: MoaiPost[];
  onlineUsers?: string[];
  onCreatePost?: (content: string) => Promise<void>;
  onPinPost?: (postId: string) => Promise<void>;
  onInviteMembers?: () => void;
  isCreatingPost?: boolean;
  isPinningPost?: boolean;
}

export const MoaiTabContent: React.FC<MoaiTabContentProps> = ({
  moai,
  isCreator = false,
  members = [],
  posts = [],
  onlineUsers = [],
  onCreatePost,
  onPinPost,
  onInviteMembers,
  isCreatingPost = false,
  isPinningPost = false,
}) => {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<'feed' | 'members' | 'progress'>('progress');
  const [newPostContent, setNewPostContent] = useState('');
  const [showPostInput, setShowPostInput] = useState(false);
  const [progressSubTab, setProgressSubTab] = useState<'weekly' | 'journey'>('weekly');

  // Progress data hooks
  const { data: weeklyProgress } = useMoaiWeeklyProgress(moai.id);
  const { data: journeyData } = useMoaiJourney(moai.id);
  const { data: allMembersProgress, isLoading: membersLoading } = useMoaiAllMembersWeeklyProgress(moai.id);

  const tabs = [
    { key: 'feed', title: 'Feed', icon: MessageSquare },
    { key: 'members', title: 'Members', icon: Users },
    { key: 'progress', title: 'Progress', icon: TrendingUp },
  ];

  const handleCreatePost = async () => {
    if (!newPostContent.trim() || !onCreatePost) return;
    
    try {
      await onCreatePost(newPostContent.trim());
      setNewPostContent('');
      setShowPostInput(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to create post');
    }
  };

  const handlePinPost = async (postId: string) => {
    if (!onPinPost) return;
    
    try {
      await onPinPost(postId);
    } catch (error) {
      Alert.alert('Error', 'Failed to pin post');
    }
  };

  const renderPostItem = ({ item }: { item: MoaiPost }) => (
    <Card style={tw(spacing.mb(3))} elevation="sm">
      <CardContent style={tw(spacing.p(4))}>
        {/* Post Header */}
        <View style={tw(layout.flexRow, layout.justifyBetween, layout.itemsStart, spacing.mb(3))}>
          <View style={tw(layout.flexRow, layout.itemsCenter, layout.flex1)}>
            <Avatar
              size="sm"
              source={item.profile.profile_image ? { uri: item.profile.profile_image } : undefined}
              fallback={`${item.profile.first_name[0]}${item.profile.last_name[0]}`}
              style={tw(spacing.mr(3))}
            />
            <View style={tw(layout.flex1)}>
              <Text style={[tw(text.sm, text.semibold), { color: colors.foreground }]}>
                {item.profile.first_name} {item.profile.last_name}
              </Text>
              <Text style={[tw(text.xs), { color: colors.mutedForeground }]}>
                {new Date(item.created_at).toLocaleDateString()}
              </Text>
            </View>
          </View>

          <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2))}>
            {item.is_pinned && (
              <Pin size={14} color={colors.primary} />
            )}
            {isCreator && (
              <TouchableOpacity onPress={() => handlePinPost(item.id)}>
                <MoreVertical size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Post Content */}
        <Text style={[tw(text.sm), { color: colors.foreground, lineHeight: 20 }]}>
          {item.content}
        </Text>

        {/* TODO: Add image support */}
        {/* {item.image_url && (
          <Image
            source={{ uri: item.image_url }}
            style={[tw(spacing.mt(3), border.rounded), { height: 200 }]}
            resizeMode="cover"
          />
        )} */}
      </CardContent>
    </Card>
  );

  const renderMemberItem = ({ item }: { item: MoaiMember }) => {
    const isOnline = onlineUsers.includes(item.profile_id);
    
    return (
      <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.py(3))}>
        <View style={tw(layout.flexRow, layout.itemsCenter, layout.flex1)}>
          <View style={tw(layout.relative)}>
            <Avatar
              size="sm"
              source={item.profile?.profile_image ? { uri: item.profile.profile_image } : undefined}
              fallback={`${item.profile?.first_name?.[0] || ''}${item.profile?.last_name?.[0] || ''}`}
              style={tw(spacing.mr(3))}
            />
            {isOnline && (
              <View
                style={[
                  tw(spacing.absolute),
                  {
                    bottom: 0,
                    right: 8,
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: '#10B981',
                    borderWidth: 2,
                    borderColor: colors.background,
                  }
                ]}
              />
            )}
          </View>
          
          <View style={tw(layout.flex1)}>
            <Text style={[tw(text.sm, text.semibold), { color: colors.foreground }]}>
              {item.profile?.first_name} {item.profile?.last_name}
            </Text>
            <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2), spacing.mt(1))}>
              <Badge variant={item.role_in_moai === 'admin' ? 'default' : 'secondary'} size="sm">
                <Text style={tw(text.xs)}>
                  {item.role_in_moai === 'admin' ? 'Admin' : 'Member'}
                </Text>
              </Badge>
              {isOnline && (
                <Text style={[tw(text.xs), { color: '#10B981' }]}>
                  Online
                </Text>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderFeedTab = () => (
    <View style={tw(layout.flex1)}>
      {/* Post Creation */}
      {!showPostInput ? (
        <TouchableOpacity
          onPress={() => setShowPostInput(true)}
          style={[
            tw(spacing.mb(4), spacing.p(4), border.rounded),
            { backgroundColor: colors.muted }
          ]}
        >
          <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
            Share something with your Moai...
          </Text>
        </TouchableOpacity>
      ) : (
        <Card style={tw(spacing.mb(4))} elevation="sm">
          <CardContent style={tw(spacing.p(4))}>
            <TextInput
              style={[
                tw(border.rounded, spacing.p(3), spacing.mb(3)),
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  borderWidth: 1,
                  color: colors.foreground,
                  minHeight: 80,
                  textAlignVertical: 'top',
                }
              ]}
              placeholder="Share something with your Moai..."
              placeholderTextColor={colors.mutedForeground}
              value={newPostContent}
              onChangeText={setNewPostContent}
              multiline
              maxLength={500}
            />
            <View style={tw(layout.flexRow, layout.justifyEnd, spacing.gap(2))}>
              <Button 
                variant="outline" 
                size="sm"
                onPress={() => {
                  setShowPostInput(false);
                  setNewPostContent('');
                }}
              >
                Cancel
              </Button>
              <Button 
                size="sm"
                onPress={handleCreatePost}
                disabled={!newPostContent.trim() || isCreatingPost}
                loading={isCreatingPost}
              >
                <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(1))}>
                  <Send size={14} color={colors.primaryForeground} />
                  <Text style={{ color: colors.primaryForeground, fontWeight: '600' }}>
                    Post
                  </Text>
                </View>
              </Button>
            </View>
          </CardContent>
        </Card>
      )}

      {/* Posts Feed */}
      {posts.length > 0 ? (
        <FlatList
          data={posts}
          renderItem={renderPostItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false} // Let parent ScrollView handle scrolling
        />
      ) : (
        <Card>
          <CardContent style={tw(spacing.p(8), layout.itemsCenter)}>
            <MessageSquare size={48} color={colors.mutedForeground} style={tw(spacing.mb(3))} />
            <Text style={[tw(text.base, text.semibold, spacing.mb(1)), { color: colors.foreground }]}>
              No posts yet
            </Text>
            <Text style={[tw(text.sm, text.center), { color: colors.mutedForeground }]}>
              Be the first to share something with your Moai!
            </Text>
          </CardContent>
        </Card>
      )}
    </View>
  );

  const renderMembersTab = () => (
    <View style={tw(layout.flex1)}>
      {/* Members Header */}
      <View style={tw(layout.flexRow, layout.justifyBetween, layout.itemsCenter, spacing.mb(4))}>
        <Text style={[tw(text.lg, text.semibold), { color: colors.foreground }]}>
          Members ({members.length})
        </Text>
        {isCreator && onInviteMembers && (
          <Button size="sm" onPress={onInviteMembers}>
            <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(1))}>
              <Users size={14} color={colors.primaryForeground} />
              <Text style={{ color: colors.primaryForeground, fontWeight: '600' }}>
                Invite
              </Text>
            </View>
          </Button>
        )}
      </View>

      {/* Members List */}
      {members.length > 0 ? (
        <Card>
          <CardContent style={tw(spacing.p(4))}>
            <FlatList
              data={members}
              renderItem={renderMemberItem}
              keyExtractor={(item) => item.profile_id}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
              ItemSeparatorComponent={() => (
                <View style={[tw(spacing.my(2)), { height: 0.5, backgroundColor: colors.border }]} />
              )}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent style={tw(spacing.p(8), layout.itemsCenter)}>
            <Users size={48} color={colors.mutedForeground} style={tw(spacing.mb(3))} />
            <Text style={[tw(text.base, text.semibold, spacing.mb(1)), { color: colors.foreground }]}>
              No members yet
            </Text>
            <Text style={[tw(text.sm, text.center), { color: colors.mutedForeground }]}>
              Invite friends to join your Moai!
            </Text>
          </CardContent>
        </Card>
      )}
    </View>
  );

  const renderProgressTab = () => {
    const progressTabs = [
      { key: 'weekly', title: 'Weekly', icon: Users },
      { key: 'journey', title: 'Journey', icon: TrendingUp },
    ];

    return (
      <View style={tw(layout.flex1)}>
        {/* Progress Sub-tabs (matching web app) */}
        <View style={tw(layout.flexRow, spacing.mb(4))}>
          {progressTabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setProgressSubTab(tab.key as 'weekly' | 'journey')}
              style={[
                tw(layout.flex1, layout.flexRow, layout.itemsCenter, layout.justifyCenter, spacing.py(2), border.rounded),
                progressSubTab === tab.key
                  ? { backgroundColor: colors.primary + '20', borderWidth: 1, borderColor: colors.primary }
                  : { backgroundColor: 'transparent' }
              ]}
            >
              <tab.icon 
                size={14} 
                color={progressSubTab === tab.key ? colors.primary : colors.mutedForeground} 
              />
              <Text 
                style={[
                  tw(text.xs, text.semibold, spacing.ml(1)),
                  { color: progressSubTab === tab.key ? colors.primary : colors.mutedForeground }
                ]}
              >
                {tab.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Progress Sub-tab Content */}
        {progressSubTab === 'weekly' ? (
          <View style={tw(spacing.gap(4))}>
            {/* Weekly Progress Section - Enhanced to show all members like web app */}
            <MoaiWeeklyProgress
              moaiId={moai.id}
              showAllMembers={true} // Show consolidated view like web
              allMembersProgress={allMembersProgress}
              membersProgressLoading={membersLoading}
              onPress={() => {
                // TODO: Navigate to detailed progress view
                Alert.alert('Progress Details', 'Detailed progress view coming soon!');
              }}
              onInfoPress={() => {
                // TODO: Show commitment info modal
                Alert.alert('Commitment Info', 'Learn more about commitments coming soon!');
              }}
              onMemberDayPress={(memberId, day) => {
                // TODO: Open member activity modal
                console.log('Member day pressed:', memberId, day);
              }}
            />

            {/* Weekly Stats Card */}
            <Card>
              <CardContent style={tw(spacing.p(4))}>
                <Text style={[tw(text.base, text.semibold, spacing.mb(3)), { color: colors.foreground }]}>
                  This Week's Stats
                </Text>
                
                <View style={tw(spacing.gap(3))}>
                  <View style={tw(layout.flexRow, layout.justifyBetween, layout.itemsCenter)}>
                    <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                      Active Members
                    </Text>
                    <Text style={[tw(text.sm, text.semibold), { color: colors.primary }]}>
                      {members.filter(m => m.is_active).length} / {members.length}
                    </Text>
                  </View>
                  
                  <View style={tw(layout.flexRow, layout.justifyBetween, layout.itemsCenter)}>
                    <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                      Weekly Goal
                    </Text>
                    <Text style={[tw(text.sm, text.semibold), { color: colors.foreground }]}>
                      {moai.weekly_commitment_goal} days
                    </Text>
                  </View>
                  
                  <View style={tw(layout.flexRow, layout.justifyBetween, layout.itemsCenter)}>
                    <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                      Completion Rate
                    </Text>
                    <Text style={[tw(text.sm, text.semibold), { color: colors.primary }]}>
                      {weeklyProgress?.legacy?.weekProgressPercentage || 0}%
                    </Text>
                  </View>
                </View>
              </CardContent>
            </Card>
          </View>
        ) : (
          <View style={tw(spacing.gap(4))}>
            {/* Journey Timeline Section */}
            <MoaiJourneyCard
              moaiId={moai.id}
              milestones={journeyData?.milestones || []}
              currentTier={journeyData?.currentTier || 'bronze'}
              currentStreak={journeyData?.currentStreak || 0}
              totalWeeks={journeyData?.totalWeeks || 0}
              joinDate={journeyData?.joinDate || moai.created_at}
              showFullTimeline={true} // Full timeline view
              compact={false} // Full detailed view
            />

            {/* Journey Insights */}
            <Card>
              <CardContent style={tw(spacing.p(4))}>
                <Text style={[tw(text.base, text.semibold, spacing.mb(3)), { color: colors.foreground }]}>
                  Journey Insights
                </Text>
                
                <View style={tw(spacing.gap(3))}>
                  <View style={tw(layout.flexRow, layout.justifyBetween, layout.itemsCenter)}>
                    <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                      Current Tier
                    </Text>
                    <Text style={[tw(text.sm, text.semibold), { color: colors.foreground }]}>
                      {journeyData?.currentTier?.charAt(0).toUpperCase() + (journeyData?.currentTier?.slice(1) || 'Bronze')}
                    </Text>
                  </View>
                  
                  <View style={tw(layout.flexRow, layout.justifyBetween, layout.itemsCenter)}>
                    <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                      Current Streak
                    </Text>
                    <Text style={[tw(text.sm, text.semibold), { color: colors.primary }]}>
                      {journeyData?.currentStreak || 0} weeks
                    </Text>
                  </View>
                  
                  <View style={tw(layout.flexRow, layout.justifyBetween, layout.itemsCenter)}>
                    <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                      Total Journey
                    </Text>
                    <Text style={[tw(text.sm, text.semibold), { color: colors.foreground }]}>
                      {journeyData?.totalWeeks || 0} weeks
                    </Text>
                  </View>
                  
                  <View style={tw(layout.flexRow, layout.justifyBetween, layout.itemsCenter)}>
                    <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                      Milestones Reached
                    </Text>
                    <Text style={[tw(text.sm, text.semibold), { color: colors.foreground }]}>
                      {journeyData?.milestones?.filter(m => m.isCompleted).length || 0}
                    </Text>
                  </View>
                </View>

                {weeklyProgress?.legacy?.canPromote && (
                  <View style={[tw(spacing.mt(4), spacing.p(3), border.rounded), { backgroundColor: colors.primary + '20' }]}>
                    <Text style={[tw(text.sm, text.semibold), { color: colors.primary }]}>
                      🏆 Congratulations! You're ready for tier promotion!
                    </Text>
                    <Text style={[tw(text.xs, spacing.mt(1)), { color: colors.mutedForeground }]}>
                      Keep up your consistent activity to advance to the next tier.
                    </Text>
                  </View>
                )}
              </CardContent>
            </Card>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={tw(layout.flex1)}>
      {/* Tab Headers */}
      <View style={tw(layout.flexRow, spacing.mb(4))}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key as 'feed' | 'members' | 'progress')}
            style={[
              tw(layout.flex1, layout.flexRow, layout.itemsCenter, layout.justifyCenter, spacing.py(3), border.rounded),
              activeTab === tab.key
                ? { backgroundColor: colors.primary }
                : { backgroundColor: colors.muted }
            ]}
          >
            <tab.icon 
              size={16} 
              color={activeTab === tab.key ? colors.primaryForeground : colors.mutedForeground} 
            />
            <Text 
              style={[
                tw(text.sm, text.semibold, spacing.ml(2)),
                { color: activeTab === tab.key ? colors.primaryForeground : colors.mutedForeground }
              ]}
            >
              {tab.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      <ScrollView 
        style={tw(layout.flex1)}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
        {activeTab === 'feed' ? renderFeedTab() : 
         activeTab === 'members' ? renderMembersTab() : 
         renderProgressTab()}
      </ScrollView>
    </View>
  );
};

export default MoaiTabContent;