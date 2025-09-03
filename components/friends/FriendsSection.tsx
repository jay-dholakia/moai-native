import React from 'react';
import { View, Text, FlatList } from 'react-native';
import { Users, UserPlus, Activity } from 'lucide-react-native';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout } from '@/utils/styles';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';

interface Friend {
  id: string;
  first_name: string;
  last_name: string;
  profile_image?: string;
  last_activity?: string;
  activity_count?: number;
  is_online?: boolean;
}

interface FriendsSectionProps {
  onFindFriends?: () => void;
  onViewActivity?: (friendId: string) => void;
}

export const FriendsSection: React.FC<FriendsSectionProps> = ({
  onFindFriends,
  onViewActivity,
}) => {
  const { colors } = useTheme();

  // Mock friends data - TODO: Replace with actual hook
  const friends: Friend[] = [
    {
      id: '1',
      first_name: 'Alex',
      last_name: 'Johnson',
      last_activity: '2 hours ago',
      activity_count: 5,
      is_online: true,
    },
    {
      id: '2',
      first_name: 'Sarah',
      last_name: 'Williams',
      last_activity: '1 day ago',
      activity_count: 3,
      is_online: false,
    },
    {
      id: '3',
      first_name: 'Mike',
      last_name: 'Chen',
      last_activity: '3 hours ago',
      activity_count: 7,
      is_online: true,
    },
  ];

  const renderFriendItem = ({ item }: { item: Friend }) => (
    <Card style={tw(spacing.mb(3))}>
      <CardContent style={tw(spacing.p(4))}>
        <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween)}>
          <View style={tw(layout.flexRow, layout.itemsCenter, layout.flex1)}>
            <View style={tw(layout.relative)}>
              <Avatar
                size="md"
                source={item.profile_image ? { uri: item.profile_image } : undefined}
                fallback={`${item.first_name[0]}${item.last_name[0]}`}
                style={tw(spacing.mr(3))}
              />
              {item.is_online && (
                <View
                  style={[
                    tw(spacing.absolute),
                    {
                      bottom: 2,
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
              <Text style={[tw(text.base, text.semibold), { color: colors.foreground }]}>
                {item.first_name} {item.last_name}
              </Text>
              <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2), spacing.mt(1))}>
                {item.is_online && (
                  <Badge variant="secondary" size="sm">
                    <Text style={[tw(text.xs), { color: '#10B981' }]}>Online</Text>
                  </Badge>
                )}
                <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                  {item.activity_count} activities this week
                </Text>
              </View>
              {item.last_activity && (
                <Text style={[tw(text.xs, spacing.mt(1)), { color: colors.mutedForeground }]}>
                  Last active {item.last_activity}
                </Text>
              )}
            </View>
          </View>

          <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2))}>
            <Button
              size="sm"
              variant="outline"
              onPress={() => onViewActivity?.(item.id)}
            >
              <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(1))}>
                <Activity size={14} color={colors.foreground} />
                <Text style={{ color: colors.foreground, fontWeight: '600', fontSize: 12 }}>
                  View
                </Text>
              </View>
            </Button>
          </View>
        </View>
      </CardContent>
    </Card>
  );

  return (
    <View style={tw(layout.flex1)}>
      {/* Header */}
      <View style={tw(layout.flexRow, layout.justifyBetween, layout.itemsCenter, spacing.mb(6))}>
        <View>
          <Text style={[tw(text.xl, text.bold), { color: colors.foreground }]}>
            Your Friends
          </Text>
          <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
            Stay connected with your fitness community
          </Text>
        </View>
        
        <Button size="sm" onPress={onFindFriends}>
          <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(1))}>
            <UserPlus size={14} color={colors.primaryForeground} />
            <Text style={{ color: colors.primaryForeground, fontWeight: '600' }}>
              Find Friends
            </Text>
          </View>
        </Button>
      </View>

      {/* Friends List */}
      {friends.length > 0 ? (
        <View style={tw(spacing.mb(4))}>
          <FlatList
            data={friends}
            renderItem={renderFriendItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            scrollEnabled={false}
          />
        </View>
      ) : (
        <Card>
          <CardContent style={tw(spacing.p(8), layout.itemsCenter)}>
            <Users size={48} color={colors.mutedForeground} style={tw(spacing.mb(3))} />
            <Text style={[tw(text.base, text.semibold, spacing.mb(1)), { color: colors.foreground }]}>
              No friends yet
            </Text>
            <Text style={[tw(text.sm, text.center, spacing.mb(6)), { color: colors.mutedForeground }]}>
              Connect with friends to share your fitness journey and stay motivated together.
            </Text>
            <Button onPress={onFindFriends}>
              <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2))}>
                <UserPlus size={16} color={colors.primaryForeground} />
                <Text style={{ color: colors.primaryForeground, fontWeight: '600' }}>
                  Find Friends
                </Text>
              </View>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity Section */}
      <Card>
        <CardContent style={tw(spacing.p(4))}>
          <View style={tw(layout.flexRow, layout.itemsCenter, spacing.mb(4))}>
            <Activity size={16} color={colors.primary} />
            <Text style={[tw(text.base, text.semibold, spacing.ml(2)), { color: colors.foreground }]}>
              Recent Friend Activity
            </Text>
          </View>
          
          <View style={tw(spacing.gap(3))}>
            <View style={tw(layout.flexRow, layout.itemsCenter)}>
              <Avatar size="sm" fallback="AJ" style={tw(spacing.mr(3))} />
              <View style={tw(layout.flex1)}>
                <Text style={[tw(text.sm), { color: colors.foreground }]}>
                  <Text style={tw(text.semibold)}>Alex Johnson</Text> completed a 5k run
                </Text>
                <Text style={[tw(text.xs), { color: colors.mutedForeground }]}>
                  2 hours ago
                </Text>
              </View>
            </View>
            
            <View style={tw(layout.flexRow, layout.itemsCenter)}>
              <Avatar size="sm" fallback="SW" style={tw(spacing.mr(3))} />
              <View style={tw(layout.flex1)}>
                <Text style={[tw(text.sm), { color: colors.foreground }]}>
                  <Text style={tw(text.semibold)}>Sarah Williams</Text> earned a new badge
                </Text>
                <Text style={[tw(text.xs), { color: colors.mutedForeground }]}>
                  1 day ago
                </Text>
              </View>
            </View>
            
            <View style={tw(layout.flexRow, layout.itemsCenter)}>
              <Avatar size="sm" fallback="MC" style={tw(spacing.mr(3))} />
              <View style={tw(layout.flex1)}>
                <Text style={[tw(text.sm), { color: colors.foreground }]}>
                  <Text style={tw(text.semibold)}>Mike Chen</Text> joined a new Moai
                </Text>
                <Text style={[tw(text.xs), { color: colors.mutedForeground }]}>
                  3 hours ago
                </Text>
              </View>
            </View>
          </View>
        </CardContent>
      </Card>
    </View>
  );
};

export default FriendsSection;