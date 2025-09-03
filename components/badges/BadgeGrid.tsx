import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout } from '@/utils/styles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { BadgeCard } from './BadgeCard';
import { useBadges } from '@/hooks/use-badges';

interface BadgeGridProps {
  totalActivities: number;
  onBadgePress?: (badge: any) => void;
}

export const BadgeGrid: React.FC<BadgeGridProps> = ({
  totalActivities,
  onBadgePress,
}) => {
  const { colors } = useTheme();
  const { userBadges, milestoneBadges, moaiMoverWeeks, isLoading } = useBadges(totalActivities);
  
  if (isLoading) {
    return (
      <Card>
        <CardContent style={tw(spacing.p(6))}>
          <View style={tw(layout.itemsCenter)}>
            <Text style={[tw(text.base), { color: colors.mutedForeground }]}>
              Loading badges...
            </Text>
          </View>
        </CardContent>
      </Card>
    );
  }
  
  const earnedCount = milestoneBadges.filter(badge => badge.unlocked).length;
  const totalCount = milestoneBadges.length;
  
  return (
    <Card>
      <CardHeader>
        <View style={tw(layout.flexRow, layout.itemsBetween)}>
          <CardTitle>Milestone Badges</CardTitle>
          <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
            {earnedCount}/{totalCount}
          </Text>
        </View>
        {moaiMoverWeeks > 0 && (
          <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
            🏃‍♀️ {moaiMoverWeeks} week{moaiMoverWeeks !== 1 ? 's' : ''} as Moai Mover
          </Text>
        )}
      </CardHeader>
      
      <CardContent>
        <ScrollView 
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={tw(spacing.gap(3), spacing.pb(2))}
        >
          {milestoneBadges.map((badge, index) => (
            <View key={badge.key} style={tw(spacing.w(32))}>
              <BadgeCard
                badge={badge}
                size="small"
                onPress={() => onBadgePress?.(badge)}
                showProgress={!badge.unlocked && index === earnedCount}
                progress={index === earnedCount ? 
                  ((totalActivities - (milestoneBadges[earnedCount - 1]?.level || 0)) / 
                   (badge.level - (milestoneBadges[earnedCount - 1]?.level || 0))) * 100 : 0
                }
              />
            </View>
          ))}
        </ScrollView>
        
        {earnedCount === 0 && (
          <View style={tw(layout.itemsCenter, spacing.py(6))}>
            <Text style={[tw(text.base, text.center), { color: colors.mutedForeground }]}>
              Complete activities to earn badges!
            </Text>
            <Text style={[tw(text.sm, text.center, spacing.mt(2)), { color: colors.mutedForeground }]}>
              Your first badge awaits at 10 activities 🎯
            </Text>
          </View>
        )}
        
        {earnedCount === totalCount && (
          <View style={tw(layout.itemsCenter, spacing.py(4))}>
            <Text style={[tw(text.base, text.center), { color: colors.primary }]}>
              🏆 Badge Master! You've earned them all!
            </Text>
          </View>
        )}
      </CardContent>
    </Card>
  );
};