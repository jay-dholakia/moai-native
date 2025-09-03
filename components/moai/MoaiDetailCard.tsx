import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Users, Settings, Share2, Calendar, TrendingUp, AlertTriangle } from 'lucide-react-native';
import { Moai } from '@/services/types';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout, border } from '@/utils/styles';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LinearGradient } from 'expo-linear-gradient';

interface MoaiDetailCardProps {
  moai: Moai;
  isAdmin?: boolean;
  isMember?: boolean;
  memberCount?: number;
  onSettingsPress?: () => void;
  onSharePress?: () => void;
  onInvitePress?: () => void;
  onJoinPress?: () => void;
  isLoading?: boolean;
}

export const MoaiDetailCard: React.FC<MoaiDetailCardProps> = ({
  moai,
  isAdmin = false,
  isMember = true,
  memberCount,
  onSettingsPress,
  onSharePress,
  onInvitePress,
  onJoinPress,
  isLoading = false,
}) => {
  const { colors } = useTheme();

  const getUrgencyInfo = () => {
    const consecutiveMissed = moai.consecutive_missed_weeks || 0;
    const currentStreak = moai.current_streak_weeks || 0;
    
    if (consecutiveMissed >= 1) {
      return {
        status: 'critical',
        color: '#EF4444',
        label: `${consecutiveMissed} weeks missed`,
        icon: AlertTriangle,
        bgColor: '#FEF2F2',
        textColor: '#DC2626'
      };
    }
    
    if (currentStreak === 0) {
      return {
        status: 'at-risk',
        color: '#F59E0B',
        label: 'At risk - no recent activity',
        icon: TrendingUp,
        bgColor: '#FFFBEB',
        textColor: '#D97706'
      };
    }
    
    return {
      status: 'on-track',
      color: '#10B981',
      label: `${currentStreak} week streak`,
      icon: TrendingUp,
      bgColor: '#F0FDF4',
      textColor: '#059669'
    };
  };

  const urgencyInfo = getUrgencyInfo();
  const displayMemberCount = memberCount || moai.member_count || 0;

  return (
    <Card elevation="md" style={tw(spacing.mb(4))}>
      <CardContent style={tw(spacing.p(0))}>
        {/* Cover Image or Gradient Header */}
        {moai.image_url ? (
          <View style={tw(layout.relative)}>
            <Image
              source={{ uri: moai.image_url }}
              style={[
                {
                  height: 120,
                  width: '100%',
                },
                tw(border.roundedT),
              ]}
              resizeMode="cover"
            />
            {/* Overlay gradient for better text readability */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.3)']}
              style={[
                tw(spacing.absolute, layout.absoluteFill),
                { borderTopLeftRadius: 12, borderTopRightRadius: 12 }
              ]}
            />
          </View>
        ) : (
          <LinearGradient
            colors={['#06B6D4', '#3B82F6'] as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              { height: 80 },
              tw(border.roundedT),
            ]}
          />
        )}

        <View style={tw(spacing.p(4))}>
          {/* Header Row */}
          <View style={tw(layout.flexRow, layout.justifyBetween, layout.itemsStart, spacing.mb(3))}>
            <View style={tw(layout.flex1, spacing.pr(3))}>
              <Text 
                style={[tw(text.xl, text.bold, spacing.mb(1)), { color: colors.foreground }]}
                numberOfLines={2}
              >
                {moai.name}
              </Text>
              
              {moai.description && (
                <Text 
                  style={[tw(text.sm, spacing.mb(2)), { color: colors.mutedForeground }]}
                  numberOfLines={2}
                >
                  {moai.description}
                </Text>
              )}
            </View>

            {/* Action Buttons */}
            <View style={tw(layout.flexRow, spacing.gap(2))}>
              {isAdmin && (
                <TouchableOpacity 
                  onPress={onSettingsPress}
                  style={[
                    tw(spacing.p(2), border.rounded),
                    { backgroundColor: colors.muted }
                  ]}
                >
                  <Settings size={16} color={colors.foreground} />
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                onPress={onSharePress}
                style={[
                  tw(spacing.p(2), border.rounded),
                  { backgroundColor: colors.muted }
                ]}
              >
                <Share2 size={16} color={colors.foreground} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Status and Stats Row */}
          <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.mb(4))}>
            {/* Urgency Status */}
            <View
              style={[
                tw(layout.flexRow, layout.itemsCenter, spacing.px(3), spacing.py(2), border.rounded),
                { backgroundColor: urgencyInfo.bgColor }
              ]}
            >
              <urgencyInfo.icon size={14} color={urgencyInfo.textColor} />
              <Text 
                style={[tw(text.xs, text.semibold, spacing.ml(1)), { color: urgencyInfo.textColor }]}
              >
                {urgencyInfo.label}
              </Text>
            </View>

            {/* Member Count */}
            <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(4))}>
              <View style={tw(layout.flexRow, layout.itemsCenter)}>
                <Users size={14} color={colors.mutedForeground} />
                <Text style={[tw(text.sm, spacing.ml(1)), { color: colors.mutedForeground }]}>
                  {displayMemberCount} member{displayMemberCount !== 1 ? 's' : ''}
                </Text>
              </View>
              
              {moai.weekly_commitment_goal && (
                <View style={tw(layout.flexRow, layout.itemsCenter)}>
                  <Calendar size={14} color={colors.mutedForeground} />
                  <Text style={[tw(text.sm, spacing.ml(1)), { color: colors.mutedForeground }]}>
                    {moai.weekly_commitment_goal}/week
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Goals/Tags */}
          {(moai.goals && moai.goals.length > 0) && (
            <View style={tw(layout.flexRow, layout.flexWrap, spacing.gap(2), spacing.mb(4))}>
              {moai.goals.slice(0, 4).map((goal, index) => (
                <Badge key={index} variant="secondary" size="sm">
                  <Text style={tw(text.xs)}>
                    {goal.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Text>
                </Badge>
              ))}
              {moai.goals.length > 4 && (
                <Badge variant="outline" size="sm">
                  <Text style={tw(text.xs)}>+{moai.goals.length - 4}</Text>
                </Badge>
              )}
            </View>
          )}

          {/* Action Buttons */}
          {!isMember ? (
            <Button onPress={onJoinPress} disabled={isLoading}>
              <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2))}>
                <Users size={16} color={colors.primaryForeground} />
                <Text style={{ color: colors.primaryForeground, fontWeight: '600' }}>
                  Join Moai
                </Text>
              </View>
            </Button>
          ) : isAdmin && (
            <Button variant="outline" onPress={onInvitePress}>
              <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2))}>
                <Users size={16} color={colors.foreground} />
                <Text style={{ color: colors.foreground, fontWeight: '600' }}>
                  Invite Members
                </Text>
              </View>
            </Button>
          )}
        </View>
      </CardContent>
    </Card>
  );
};

export default MoaiDetailCard;