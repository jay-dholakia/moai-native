import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { tw, spacing, layout, text, border } from '@/utils/styles';
import { useTheme } from '@/providers/theme-provider';

interface ProfileTokenBalanceProps {
  balance: number;
  onPress?: () => void;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  clickable?: boolean;
}

export const ProfileTokenBalance: React.FC<ProfileTokenBalanceProps> = ({
  balance,
  onPress,
  showLabel = true,
  size = 'md',
  clickable = true
}) => {
  const { theme, colors } = useTheme();

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          tokenText: text.sm,
          balanceText: text.base,
          labelText: text.xs,
          padding: spacing.p(2),
          gap: spacing.gap(1),
        };
      case 'md':
        return {
          tokenText: text.base,
          balanceText: text.lg,
          labelText: text.sm,
          padding: spacing.p(3),
          gap: spacing.gap(2),
        };
      case 'lg':
        return {
          tokenText: text.lg,
          balanceText: text.xl,
          labelText: text.base,
          padding: spacing.p(4),
          gap: spacing.gap(2),
        };
      default:
        return {
          tokenText: text.base,
          balanceText: text.lg,
          labelText: text.sm,
          padding: spacing.p(3),
          gap: spacing.gap(2),
        };
    }
  };

  const sizeStyles = getSizeStyles();

  const content = (
    <View style={tw(layout.flexRow, layout.itemsCenter, sizeStyles.gap)}>
      <Text style={tw(sizeStyles.tokenText)}>🏅</Text>
      <View>
        <Text 
          style={[
            tw(sizeStyles.balanceText, text.bold, text.foreground(theme))
          ]}
        >
          {balance.toLocaleString()}
        </Text>
        {showLabel && (
          <Text 
            style={tw(sizeStyles.labelText, text.muted(theme))}
          >
            {size === 'sm' ? 'tokens' : 'Moai Tokens'}
          </Text>
        )}
      </View>
    </View>
  );

  if (clickable) {
    return (
      <TouchableOpacity
        style={[
          tw(border.rounded, sizeStyles.padding),
          { 
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
          }
        ]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {content}
        <Text 
          style={tw(text.xs, text.muted(theme), spacing.mt(1))}
        >
          Tap to manage tokens
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={[
        tw(border.rounded, sizeStyles.padding),
        { 
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
        }
      ]}
    >
      {content}
    </View>
  );
};