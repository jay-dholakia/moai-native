import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout, border } from '@/utils/styles';
import { Ionicons } from '@expo/vector-icons';
import { useTokenBalance } from '@/hooks/use-token-system';

export interface TokenBalanceProps {
  size?: 'sm' | 'default' | 'lg';
  showLabel?: boolean;
  onPress?: () => void;
  style?: any;
}

export const TokenBalance: React.FC<TokenBalanceProps> = ({
  size = 'default',
  showLabel = true,
  onPress,
  style,
}) => {
  const { colors } = useTheme();
  const { data: balanceResponse, isLoading, error } = useTokenBalance();

  const balance = balanceResponse?.success ? balanceResponse.data.balance : 0;

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          containerPadding: spacing.px(2),
          iconSize: 16,
          textStyle: text.sm,
          labelStyle: text.xs,
        };
      case 'lg':
        return {
          containerPadding: spacing.px(4),
          iconSize: 24,
          textStyle: text.lg,
          labelStyle: text.sm,
        };
      default:
        return {
          containerPadding: spacing.px(3),
          iconSize: 20,
          textStyle: text.base,
          labelStyle: text.sm,
        };
    }
  };

  const { containerPadding, iconSize, textStyle, labelStyle } = getSizeStyles();

  if (isLoading) {
    return (
      <View style={[
        tw(layout.flexRow, layout.itemsCenter, spacing.gap(2), containerPadding, border.rounded),
        { backgroundColor: colors.muted },
        style
      ]}>
        <Ionicons name="hourglass" size={iconSize} color={colors.mutedForeground} />
        <Text style={[tw(textStyle), { color: colors.mutedForeground }]}>
          Loading...
        </Text>
      </View>
    );
  }

  if (error || !balanceResponse?.success) {
    return (
      <View style={[
        tw(layout.flexRow, layout.itemsCenter, spacing.gap(2), containerPadding, border.rounded),
        { backgroundColor: colors.destructive + '20' },
        style
      ]}>
        <Ionicons name="alert-circle" size={iconSize} color={colors.destructive} />
        <Text style={[tw(textStyle), { color: colors.destructive }]}>
          Error
        </Text>
      </View>
    );
  }

  const formatBalance = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K`;
    }
    return amount.toString();
  };

  const Component = onPress ? TouchableOpacity : View;

  return (
    <Component
      onPress={onPress}
      style={[
        tw(layout.flexRow, layout.itemsCenter, spacing.gap(2), containerPadding, border.rounded),
        { 
          backgroundColor: colors.primary + '20',
          borderWidth: 1,
          borderColor: colors.primary + '40',
        },
        style
      ]}
    >
      <Ionicons name="diamond" size={iconSize} color={colors.primary} />
      
      <View style={tw(layout.itemsCenter)}>
        <Text style={[tw(textStyle, text.semibold), { color: colors.primary }]}>
          {formatBalance(balance)}
        </Text>
        {showLabel && (
          <Text style={[tw(labelStyle), { color: colors.primary, opacity: 0.8 }]}>
            Tokens
          </Text>
        )}
      </View>
      
      {onPress && (
        <Ionicons name="chevron-forward" size={iconSize * 0.8} color={colors.primary} />
      )}
    </Component>
  );
};