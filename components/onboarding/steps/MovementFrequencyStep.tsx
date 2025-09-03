import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Calendar } from 'lucide-react-native';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout, border } from '@/utils/styles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { StepProps, MOVEMENT_FREQUENCY } from '@/types/onboarding';

export const MovementFrequencyStep = ({ 
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
              <Calendar size={24} color={colors.primary} />
            </View>
            <View style={tw(layout.flex1)}>
              <CardTitle>How often do you want to move?</CardTitle>
              <Text style={[tw(text.sm, spacing.mt(1)), { color: colors.mutedForeground }]}>
                This helps us understand your commitment level and find the right accountability partner
              </Text>
            </View>
          </View>
        </CardHeader>

        <CardContent>
          <View style={tw(spacing.gap(3))}>
            {MOVEMENT_FREQUENCY.map((frequency) => (
              <TouchableOpacity
                key={frequency.id}
                onPress={() => onChange('movementFrequency', frequency.id)}
                style={[
                  tw(spacing.p(4), border.rounded, layout.flexRow, layout.itemsCenter),
                  {
                    backgroundColor: formData.movementFrequency === frequency.id 
                      ? colors.primary + '10' 
                      : colors.card,
                    borderWidth: 2,
                    borderColor: formData.movementFrequency === frequency.id 
                      ? colors.primary 
                      : colors.border,
                  }
                ]}
              >
                {/* Emoji Icon */}
                <View style={[
                  tw(spacing.w(12), spacing.h(12), layout.itemsCenter, layout.justifyCenter, spacing.mr(4)),
                  {
                    backgroundColor: formData.movementFrequency === frequency.id 
                      ? colors.primary + '20' 
                      : colors.muted,
                    borderRadius: 24,
                  }
                ]}>
                  <Text style={tw(text.xl)}>
                    {frequency.emoji}
                  </Text>
                </View>

                {/* Frequency Info */}
                <View style={tw(layout.flex1)}>
                  <Text style={[
                    tw(text.base, text.semibold, spacing.mb(1)),
                    { 
                      color: formData.movementFrequency === frequency.id 
                        ? colors.primary 
                        : colors.foreground 
                    }
                  ]}>
                    {frequency.title}
                  </Text>
                  <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                    {frequency.description}
                  </Text>
                </View>

                {/* Selection Indicator */}
                {formData.movementFrequency === frequency.id && (
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
          {stepValidationAttempted && errors.movementFrequency && (
            <Text style={[tw(text.sm, spacing.mt(3)), { color: colors.destructive }]}>
              {errors.movementFrequency}
            </Text>
          )}

          {/* Additional Context */}
          <View style={[
            tw(spacing.p(4), spacing.mt(4), border.rounded),
            { backgroundColor: colors.muted + '50' }
          ]}>
            <Text style={[tw(text.sm, text.center), { color: colors.mutedForeground }]}>
              🎯 Remember: consistency beats perfection! Start where you are, and we'll help you grow.
            </Text>
          </View>
        </CardContent>
      </Card>
    </ScrollView>
  );
};