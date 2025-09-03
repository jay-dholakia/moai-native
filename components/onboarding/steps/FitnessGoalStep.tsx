import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Target } from 'lucide-react-native';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout, border } from '@/utils/styles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { StepProps, FITNESS_GOALS } from '@/types/onboarding';

export const FitnessGoalStep = ({ 
  formData, 
  onChange, 
  errors, 
  stepValidationAttempted 
}: StepProps) => {
  const { colors } = useTheme();

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Card>
        <CardHeader>
          <View style={tw(layout.flexRow, layout.itemsCenter, spacing.mb(2))}>
            <View style={[
              tw(spacing.p(2), spacing.mr(3)),
              {
                backgroundColor: colors.primary + '20',
                borderRadius: 8,
              }
            ]}>
              <Target size={24} color={colors.primary} />
            </View>
            <View style={tw(layout.flex1)}>
              <CardTitle>What's your primary fitness goal?</CardTitle>
              <Text style={[tw(text.sm, spacing.mt(1)), { color: colors.mutedForeground }]}>
                This helps us personalize your experience and connect you with like-minded people
              </Text>
            </View>
          </View>
        </CardHeader>

        <CardContent>
          <View style={tw(spacing.gap(3))}>
            {FITNESS_GOALS.map((goal) => (
              <TouchableOpacity
                key={goal.id}
                onPress={() => onChange('primaryGoal', goal.id)}
                style={[
                  tw(spacing.p(4), border.rounded, layout.flexRow, layout.itemsCenter),
                  {
                    backgroundColor: formData.primaryGoal === goal.id 
                      ? colors.primary + '10' 
                      : colors.card,
                    borderWidth: 2,
                    borderColor: formData.primaryGoal === goal.id 
                      ? colors.primary 
                      : colors.border,
                  }
                ]}
              >
                {/* Emoji Icon */}
                <View style={[
                  tw(spacing.w(12), spacing.h(12), layout.itemsCenter, layout.justifyCenter, spacing.mr(4)),
                  {
                    backgroundColor: formData.primaryGoal === goal.id 
                      ? colors.primary + '20' 
                      : colors.muted,
                    borderRadius: 24,
                  }
                ]}>
                  <Text style={tw(text.xl)}>
                    {goal.emoji}
                  </Text>
                </View>

                {/* Goal Info */}
                <View style={tw(layout.flex1)}>
                  <Text style={[
                    tw(text.base, text.semibold, spacing.mb(1)),
                    { 
                      color: formData.primaryGoal === goal.id 
                        ? colors.primary 
                        : colors.foreground 
                    }
                  ]}>
                    {goal.title}
                  </Text>
                  <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                    {goal.description}
                  </Text>
                </View>

                {/* Selection Indicator */}
                {formData.primaryGoal === goal.id && (
                  <View style={[
                    tw(spacing.w(6), spacing.h(6), layout.itemsCenter, layout.justifyCenter),
                    {
                      backgroundColor: colors.primary,
                      borderRadius: 12,
                    }
                  ]}>
                    <Text style={[tw(text.xs, text.bold), { color: colors.primaryForeground }]}>
                      ✓
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Validation Error */}
          {stepValidationAttempted && errors.primaryGoal && (
            <Text style={[tw(text.sm, spacing.mt(3)), { color: colors.destructive }]}>
              {errors.primaryGoal}
            </Text>
          )}

          {/* Additional Context */}
          <View style={[
            tw(spacing.p(4), spacing.mt(4), border.rounded),
            { backgroundColor: colors.muted + '50' }
          ]}>
            <Text style={[tw(text.sm, text.center), { color: colors.mutedForeground }]}>
              💡 Don't worry - you can work on multiple goals! This just helps us understand your main focus.
            </Text>
          </View>
        </CardContent>
      </Card>
    </ScrollView>
  );
};