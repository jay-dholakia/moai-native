import React from 'react';
import { View, Text } from 'react-native';
import { tw, spacing, layout, text, border } from '@/utils/styles';
import { Colors } from '@/constants/Tokens';
import { useTheme } from '@/providers/theme-provider';

interface WorkoutProgressProps {
  completed: number;
  total: number;
  percentage: number;
}

export function WorkoutProgress({ completed, total, percentage }: WorkoutProgressProps) {
  const { colors: themeColors } = useTheme();

  return (
    <View style={tw(spacing.mt(4))}>
      {/* Progress Text */}
      <View style={tw(layout.flexRow, layout.justifyBetween, layout.itemsCenter, spacing.mb(2))}>
        <Text style={tw(text.sm, text.muted)}>
          Exercise Progress
        </Text>
        <Text style={tw(text.sm, text.semibold)}>
          {completed} / {total} ({percentage}%)
        </Text>
      </View>

      {/* Progress Bar */}
      <View 
        style={[
          tw(spacing.w(32), spacing.h(2), border.rounded),
          { backgroundColor: themeColors.border, width: '100%' }
        ]}
      >
        <View
          style={[
            tw(spacing.h(2), border.rounded),
            {
              backgroundColor: percentage === 100 ? Colors.light.success : themeColors.primary,
              width: `${percentage}%`,
            },
          ]}
        />
      </View>

      {/* Exercise Dots */}
      <View style={tw(layout.flexRow, layout.justifyCenter, spacing.gap(1), spacing.mt(2))}>
        {Array.from({ length: total }).map((_, index) => (
          <View
            key={index}
            style={[
              tw(spacing.w(2), spacing.h(2), border.roundedFull),
              {
                backgroundColor: index < completed 
                  ? Colors.light.success
                  : themeColors.border
              }
            ]}
          />
        ))}
      </View>
    </View>
  );
}