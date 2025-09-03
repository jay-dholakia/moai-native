import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout, border } from '@/utils/styles';
import { TierLevel } from '@/services/tier-system-service';
import { useTierRequirements } from '@/hooks/use-tier-system';

export interface TierBadgeProps {
  tier: TierLevel;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  interactive?: boolean;
  consecutiveWeeks?: number;
  onPress?: () => void;
  style?: any;
}

export const TierBadge: React.FC<TierBadgeProps> = ({
  tier,
  size = 'md',
  showLabel = true,
  interactive = false,
  consecutiveWeeks,
  onPress,
  style,
}) => {
  const { colors } = useTheme();
  const { getTierColor, getTierIcon, getTierDescription } = useTierRequirements();

  const tierColor = getTierColor(tier);
  const tierIcon = getTierIcon(tier);
  const tierDescription = getTierDescription(tier);

  // Size configurations
  const sizeConfigs = {
    sm: {
      container: tw(spacing.w(12), spacing.h(12)),
      icon: tw(text.lg),
      label: tw(text.xs),
      weeks: tw(text.xs),
    },
    md: {
      container: tw(spacing.w(16), spacing.h(16)),
      icon: tw(text.xl),
      label: tw(text.sm),
      weeks: tw(text.xs),
    },
    lg: {
      container: tw(spacing.w(20), spacing.h(20)),
      icon: tw(text['2xl']),
      label: tw(text.base),
      weeks: tw(text.sm),
    },
    xl: {
      container: tw(spacing.w(24), spacing.h(24)),
      icon: tw(text['3xl']),
      label: tw(text.lg),
      weeks: tw(text.base),
    },
  };

  const config = sizeConfigs[size];

  const BadgeContent = () => (
    <View style={tw(layout.itemsCenter, spacing.gap(2))}>
      {/* Tier Badge Circle */}
      <LinearGradient
        colors={[tierColor + '20', tierColor + '40'] as [string, string, ...string[]]}
        style={[
          config.container,
          tw(layout.itemsCenter, layout.justifyCenter, border.rounded),
          {
            borderWidth: 2,
            borderColor: tierColor,
          },
        ]}
      >
        <Text style={config.icon}>{tierIcon}</Text>
      </LinearGradient>

      {/* Tier Label */}
      {showLabel && (
        <View style={tw(layout.itemsCenter)}>
          <Text 
            style={[
              config.label, 
              tw(text.semibold, text.center), 
              { color: colors.foreground }
            ]}
          >
            {tier.toUpperCase()}
          </Text>
          
          {consecutiveWeeks !== undefined && (
            <Text 
              style={[
                config.weeks, 
                tw(text.center), 
                { color: colors.mutedForeground }
              ]}
            >
              {consecutiveWeeks} week{consecutiveWeeks !== 1 ? 's' : ''}
            </Text>
          )}
        </View>
      )}
    </View>
  );

  if (interactive && onPress) {
    return (
      <TouchableOpacity onPress={onPress} style={style}>
        <BadgeContent />
      </TouchableOpacity>
    );
  }

  return (
    <View style={style}>
      <BadgeContent />
    </View>
  );
};

export default TierBadge;