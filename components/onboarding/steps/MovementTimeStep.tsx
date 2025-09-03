import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Clock } from 'lucide-react-native';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout, border } from '@/utils/styles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { StepProps, MOVEMENT_TIME } from '@/types/onboarding';

export const MovementTimeStep = ({ 
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
              <Clock size={24} color={colors.primary} />
            </View>
            <View style={tw(layout.flex1)}>
              <CardTitle>When do you prefer to move?</CardTitle>
              <Text style={[tw(text.sm, spacing.mt(1)), { color: colors.mutedForeground }]}>
                Knowing your preferred time helps us match you with compatible partners
              </Text>
            </View>
          </View>
        </CardHeader>

        <CardContent>
          <View style={tw(spacing.gap(3))}>
            {MOVEMENT_TIME.map((timeSlot) => (
              <TouchableOpacity
                key={timeSlot.id}
                onPress={() => onChange('movementTime', timeSlot.id)}
                style={[
                  tw(spacing.p(4), border.rounded, layout.flexRow, layout.itemsCenter),
                  {
                    backgroundColor: formData.movementTime === timeSlot.id 
                      ? colors.primary + '10' 
                      : colors.card,
                    borderWidth: 2,
                    borderColor: formData.movementTime === timeSlot.id 
                      ? colors.primary 
                      : colors.border,
                  }
                ]}
              >
                {/* Emoji Icon */}
                <View style={[
                  tw(spacing.w(12), spacing.h(12), layout.itemsCenter, layout.justifyCenter, spacing.mr(4)),
                  {
                    backgroundColor: formData.movementTime === timeSlot.id 
                      ? colors.primary + '20' 
                      : colors.muted,
                    borderRadius: 24,
                  }
                ]}>
                  <Text style={tw(text.xl)}>
                    {timeSlot.emoji}
                  </Text>
                </View>

                {/* Time Info */}
                <View style={tw(layout.flex1)}>
                  <Text style={[
                    tw(text.base, text.semibold, spacing.mb(1)),
                    { 
                      color: formData.movementTime === timeSlot.id 
                        ? colors.primary 
                        : colors.foreground 
                    }
                  ]}>
                    {timeSlot.title}
                  </Text>
                  <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                    {timeSlot.description}
                  </Text>
                </View>

                {/* Selection Indicator */}
                {formData.movementTime === timeSlot.id && (
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
          {stepValidationAttempted && errors.movementTime && (
            <Text style={[tw(text.sm, spacing.mt(3)), { color: colors.destructive }]}>
              {errors.movementTime}
            </Text>
          )}
        </CardContent>
      </Card>
    </ScrollView>
  );
};