import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { MessageCircle, Users, Clock, Info, ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout, border } from '@/utils/styles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/hooks/useAuth';
// import { useBuddyAssignments } from '@/hooks/use-buddies';

interface BuddyProfile {
  id: string;
  first_name: string;
  last_name?: string;
  avatar_url?: string;
  planned_activities?: string[];
}

interface BuddyAssignment {
  id: string;
  moai_id: string;
  buddy_group: string[];
  cycle_start_date: string;
  cycle_end_date: string;
  status: 'active' | 'pending' | 'completed';
}

interface BuddyCardProps {
  assignment: BuddyAssignment;
  buddyProfiles: BuddyProfile[];
  onMessageBuddy: (moaiId: string) => void;
}

const BuddyCard: React.FC<BuddyCardProps> = ({ assignment, buddyProfiles, onMessageBuddy }) => {
  const { colors } = useTheme();
  const { user } = useAuth();

  const daysRemaining = Math.ceil(
    (new Date(assignment.cycle_end_date).getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000)
  );

  const buddyNames = buddyProfiles.map(p => 
    p.first_name ? `${p.first_name} ${p.last_name || ''}`.trim() : 'Unknown'
  );

  const getBuddyText = () => {
    if (buddyNames.length === 1) {
      return `You and ${buddyNames[0]} are holding each other accountable this cycle.`;
    } else if (buddyNames.length === 2) {
      return `You, ${buddyNames[0]}, and ${buddyNames[1]} are all supporting each other this cycle.`;
    } else {
      return "You have accountability buddies for this cycle.";
    }
  };

  return (
    <Card style={tw(spacing.mb(4))}>
      <View 
        style={[
          tw(spacing.p(4)),
          { backgroundColor: '#EFF6FF' } // blue-50 equivalent
        ]}
      >
        <View style={tw(layout.flexRow, layout.justifyBetween, layout.itemsCenter, spacing.mb(3))}>
          <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2))}>
            <Users size={18} color="#3B82F6" />
            <Text style={[tw(text.base, text.semibold), { color: colors.foreground }]}>
              Accountability Buddies
            </Text>
          </View>
          
          <Badge variant="secondary" style={{ backgroundColor: '#DBEAFE' }}>
            <Text style={[tw(text.xs), { color: '#1D4ED8' }]}>
              {daysRemaining}d left
            </Text>
          </Badge>
        </View>

        <Text style={[tw(text.sm, spacing.mb(4)), { color: colors.foreground }]}>
          {getBuddyText()}
        </Text>

        {/* Buddy Avatars */}
        <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(3), spacing.mb(4))}>
          {buddyProfiles.slice(0, 3).map((buddy, index) => (
            <View key={buddy.id} style={tw(layout.itemsCenter, spacing.gap(1))}>
              <Avatar
                source={buddy.avatar_url ? { uri: buddy.avatar_url } : undefined}
                fallback={buddy.first_name?.charAt(0) || '?'}
                size="md"
              />
              <Text style={[tw(text.xs), { color: colors.mutedForeground }]}>
                {buddy.first_name || 'Unknown'}
              </Text>
              
              {/* Activity indicators for buddies */}
              {buddy.planned_activities && buddy.planned_activities.length > 0 && (
                <View style={tw(layout.flexRow, spacing.gap(1))}>
                  {buddy.planned_activities.slice(0, 3).map((activity, actIndex) => (
                    <View
                      key={actIndex}
                      style={[
                        tw(spacing.w(2), spacing.h(2), border.rounded),
                        { backgroundColor: '#10B981' } // green-500
                      ]}
                    />
                  ))}
                </View>
              )}
            </View>
          ))}
          
          {buddyProfiles.length > 3 && (
            <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
              +{buddyProfiles.length - 3} more
            </Text>
          )}
        </View>

        {/* Action Buttons */}
        <View style={tw(layout.flexRow, spacing.gap(2))}>
          <Button
            variant="outline"
            size="sm"
            onPress={() => onMessageBuddy(assignment.moai_id)}
            style={tw(layout.flex1)}
          >
            <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2))}>
              <MessageCircle size={14} color={colors.primary} />
              <Text style={[tw(text.sm), { color: colors.primary }]}>
                Message Group
              </Text>
            </View>
          </Button>
          
          <TouchableOpacity
            onPress={() => {
              // Navigate to buddy dashboard or more details
              // router.push('/buddies'); // Commented out until route exists
              console.log('Navigate to buddies');
            }}
            style={[
              tw(spacing.px(3), spacing.py(2), border.rounded, layout.itemsCenter),
              { backgroundColor: colors.muted }
            ]}
          >
            <ChevronRight size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );
};

interface AccountabilityBuddyInfoModalProps {
  isVisible: boolean;
  onClose: () => void;
}

const AccountabilityBuddyInfoModal: React.FC<AccountabilityBuddyInfoModalProps> = ({
  isVisible,
  onClose
}) => {
  const { colors } = useTheme();

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[tw(layout.flex1), { backgroundColor: colors.background }]}>
        <View style={tw(spacing.p(4), layout.flexRow, layout.justifyBetween, layout.itemsCenter)}>
          <Text style={[tw(text.lg, text.semibold), { color: colors.foreground }]}>
            Accountability Buddies
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={[tw(text.base), { color: colors.primary }]}>Done</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={tw(layout.flex1, spacing.px(4))}>
          <Text style={[tw(text.base, spacing.mb(4)), { color: colors.foreground }]}>
            How Accountability Buddies Work
          </Text>
          
          <View style={tw(spacing.gap(4))}>
            <View>
              <Text style={[tw(text.sm, text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
                🤝 Buddy Assignment
              </Text>
              <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                You're automatically paired with other members from your MOAI for weekly accountability cycles.
              </Text>
            </View>
            
            <View>
              <Text style={[tw(text.sm, text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
                📅 Weekly Cycles
              </Text>
              <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                Each accountability cycle lasts one week. You can check in with your buddies and see their planned activities.
              </Text>
            </View>
            
            <View>
              <Text style={[tw(text.sm, text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
                💬 Stay Connected
              </Text>
              <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                Use the message feature to encourage each other, share progress, and stay motivated throughout the week.
              </Text>
            </View>
            
            <View>
              <Text style={[tw(text.sm, text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
                🎯 Shared Goals
              </Text>
              <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                See each other's planned activities and help hold each other accountable to your fitness goals.
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

export const AccountabilityBuddyCard: React.FC = () => {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [showInfoModal, setShowInfoModal] = useState(false);
  
  // Mock buddy assignments data - replace with real hook when available
  const assignments: any[] = [];
  const isLoading = false;

  const handleMessageBuddy = (moaiId: string) => {
    // Navigate to chat with buddy group
    router.push(`/chat?moai=${moaiId}&type=buddy`);
  };

  if (isLoading) {
    return (
      <Card style={tw(spacing.mb(4))}>
        <CardContent style={tw(spacing.p(4))}>
          <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
            Loading buddy assignments...
          </Text>
        </CardContent>
      </Card>
    );
  }

  if (!assignments || assignments.length === 0) {
    return (
      <Card style={tw(spacing.mb(4))}>
        <View 
          style={[
            tw(spacing.p(4)),
            { backgroundColor: '#F3F4F6' } // gray-100 equivalent
          ]}
        >
          <View style={tw(layout.flexRow, layout.justifyBetween, layout.itemsCenter, spacing.mb(3))}>
            <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2))}>
              <Users size={18} color={colors.mutedForeground} />
              <Text style={[tw(text.base, text.semibold), { color: colors.foreground }]}>
                Accountability Buddies
              </Text>
            </View>
            
            <TouchableOpacity onPress={() => setShowInfoModal(true)}>
              <Info size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          <Text style={[tw(text.sm, spacing.mb(3)), { color: colors.mutedForeground }]}>
            Join a MOAI to get paired with accountability buddies who will help keep you motivated!
          </Text>

          <Button
            variant="outline"
            size="sm"
            onPress={() => router.push('/moais')}
          >
            <Text style={tw(text.sm)}>Find a MOAI</Text>
          </Button>
        </View>
        
        <AccountabilityBuddyInfoModal
          isVisible={showInfoModal}
          onClose={() => setShowInfoModal(false)}
        />
      </Card>
    );
  }

  return (
    <>
      <View>
        {assignments.map((assignment: any) => (
          <BuddyCard
            key={assignment.id}
            assignment={assignment}
            buddyProfiles={[]} // Would be populated by actual buddy data
            onMessageBuddy={handleMessageBuddy}
          />
        ))}
      </View>
      
      <AccountabilityBuddyInfoModal
        isVisible={showInfoModal}
        onClose={() => setShowInfoModal(false)}
      />
    </>
  );
};

export default AccountabilityBuddyCard;