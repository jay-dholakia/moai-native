import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout, border } from '@/utils/styles';
import { StepProgressProps } from '@/types/onboarding';

export const StepProgress = ({ 
  currentStep, 
  totalSteps, 
  completedSteps = [] 
}: StepProgressProps) => {
  const { colors } = useTheme();

  const progressPercentage = ((currentStep + 1) / totalSteps) * 100;

  return (
    <View style={tw(spacing.mb(6))}>
      {/* Step counter */}
      <View style={tw(layout.flexRow, layout.justifyBetween, layout.itemsCenter, spacing.mb(2))}>
        <Text style={[tw(text.sm, text.medium), { color: colors.foreground }]}>
          Step {currentStep + 1} of {totalSteps}
        </Text>
        <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
          {Math.round(progressPercentage)}% complete
        </Text>
      </View>

      {/* Progress bar container */}
      <View style={[
        tw(border.rounded),
        { height: 8, backgroundColor: colors.muted }
      ]}>
        {/* Progress bar fill */}
        <View style={[
          tw(border.rounded),
          {
            height: '100%',
            backgroundColor: colors.primary,
            width: `${Math.max(progressPercentage, 5)}%`, // Minimum 5% for visibility
          }
        ]} />
      </View>

      {/* Step indicators */}
      <View style={tw(layout.flexRow, layout.justifyBetween, spacing.mt(3))}>
        {Array.from({ length: totalSteps }, (_, index) => {
          const isCompleted = completedSteps.includes(index) || index < currentStep;
          const isCurrent = index === currentStep;
          const isUpcoming = index > currentStep;

          return (
            <View
              key={index}
              style={[
                tw(border.rounded),
                {
                  width: 24,
                  height: 24,
                  backgroundColor: isCompleted 
                    ? colors.primary 
                    : isCurrent 
                    ? colors.primary + '40'
                    : colors.muted,
                  borderWidth: 2,
                  borderColor: isCurrent ? colors.primary : 'transparent',
                  justifyContent: 'center',
                  alignItems: 'center',
                }
              ]}
            >
              {isCompleted ? (
                <Text style={[tw(text.xs, text.bold), { color: colors.primaryForeground }]}>
                  ✓
                </Text>
              ) : (
                <Text style={[
                  tw(text.xs, text.medium), 
                  { 
                    color: isCurrent 
                      ? colors.primary 
                      : isUpcoming 
                      ? colors.mutedForeground 
                      : colors.foreground 
                  }
                ]}>
                  {index + 1}
                </Text>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
};