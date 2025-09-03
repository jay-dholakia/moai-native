import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout, border } from '@/utils/styles';
import { Card, CardContent } from '@/components/ui/Card';
import { UserBadge, MilestoneBadge } from '@/services/badge-service';

interface BadgeCardProps {
  badge: UserBadge | MilestoneBadge;
  size?: 'small' | 'medium' | 'large';
  onPress?: () => void;
  showProgress?: boolean;
  progress?: number;
}

export const BadgeCard: React.FC<BadgeCardProps> = ({
  badge,
  size = 'medium',
  onPress,
  showProgress = false,
  progress = 0,
}) => {
  const { colors } = useTheme();
  
  const isUnlocked = 'unlocked' in badge ? badge.unlocked : true;
  const isUserBadge = 'earned_at' in badge;
  
  const sizeStyles = {
    small: {
      container: tw(spacing.p(3)),
      icon: tw(text.xl),
      title: tw(text.sm, text.medium),
      description: tw(text.xs),
      badge: { width: 48, height: 48 },
    },
    medium: {
      container: tw(spacing.p(4)),
      icon: tw(text.xl),
      title: tw(text.base, text.semibold),
      description: tw(text.sm),
      badge: { width: 64, height: 64 },
    },
    large: {
      container: tw(spacing.p(6)),
      icon: tw(text.xl),
      title: tw(text.lg, text.bold),
      description: tw(text.base),
      badge: { width: 80, height: 80 },
    },
  };
  
  const styles = sizeStyles[size];
  
  const CardComponent = onPress ? TouchableOpacity : View;
  
  return (
    <CardComponent
      onPress={onPress}
      style={[
        styles.container,
        { opacity: isUnlocked ? 1 : 0.6 }
      ]}
    >
      <Card>
        <CardContent style={tw(spacing.p(4))}>
          <View style={tw(layout.itemsCenter, spacing.gap(3))}>
            {/* Badge Icon */}
            <View style={[
              styles.badge,
              tw(layout.itemsCenter, layout.justifyCenter, border.rounded),
              {
                backgroundColor: isUnlocked 
                  ? colors.primary + '20' 
                  : colors.muted,
                borderWidth: 2,
                borderColor: isUnlocked 
                  ? colors.primary 
                  : colors.border,
              }
            ]}>
              <Text style={[
                styles.icon,
                { 
                  color: isUnlocked ? colors.primary : colors.mutedForeground,
                  opacity: isUnlocked ? 1 : 0.5 
                }
              ]}>
                {'badge_icon' in badge ? badge.badge_icon : badge.icon}
              </Text>
            </View>
            
            {/* Badge Info */}
            <View style={tw(layout.itemsCenter, spacing.gap(1))}>
              <Text style={[
                styles.title,
                { color: isUnlocked ? colors.foreground : colors.mutedForeground }
              ]}>
                {'badge_name' in badge ? badge.badge_name : badge.name}
              </Text>
              
              <Text style={[
                styles.description,
                tw(text.center),
                { color: colors.mutedForeground }
              ]}>
                {'badge_description' in badge ? badge.badge_description : badge.description}
              </Text>
              
              {/* Milestone Level */}
              {'level' in badge && (
                <Text style={[
                  tw(text.xs, text.medium),
                  { color: colors.mutedForeground }
                ]}>
                  {badge.level} activities
                </Text>
              )}
              
              {/* Earned Date */}
              {isUserBadge && (
                <Text style={[
                  tw(text.xs),
                  { color: colors.mutedForeground }
                ]}>
                  Earned {new Date(badge.earned_at).toLocaleDateString()}
                </Text>
              )}
            </View>
            
            {/* Progress Bar */}
            {showProgress && progress > 0 && !isUnlocked && (
              <View style={[tw(spacing.mt(2)), { width: '100%' }]}>
                <View style={[
                  tw(border.rounded),
                  { height: 8, backgroundColor: colors.muted }
                ]}>
                  <View style={[
                    tw(border.rounded),
                    {
                      height: '100%',
                      backgroundColor: colors.primary,
                      width: `${Math.min(progress, 100)}%`,
                    }
                  ]} />
                </View>
                <Text style={[
                  tw(text.xs, text.center, spacing.mt(1)),
                  { color: colors.mutedForeground }
                ]}>
                  {Math.round(progress)}% complete
                </Text>
              </View>
            )}
          </View>
        </CardContent>
      </Card>
    </CardComponent>
  );
};