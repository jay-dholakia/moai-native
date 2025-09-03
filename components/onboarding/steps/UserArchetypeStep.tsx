import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Users } from 'lucide-react-native';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout, border } from '@/utils/styles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { StepProps, USER_ARCHETYPES } from '@/types/onboarding';

export const UserArchetypeStep = ({ 
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
              <Users size={24} color={colors.primary} />
            </View>
            <View style={tw(layout.flex1)}>
              <CardTitle>What motivates you most?</CardTitle>
              <Text style={[tw(text.sm, spacing.mt(1)), { color: colors.mutedForeground }]}>
                Understanding your personality helps us create the perfect accountability environment
              </Text>
            </View>
          </View>
        </CardHeader>

        <CardContent>
          <View style={tw(spacing.gap(3))}>
            {USER_ARCHETYPES.map((archetype) => (
              <TouchableOpacity
                key={archetype.id}
                onPress={() => onChange('userArchetype', archetype.id)}
                style={[
                  tw(spacing.p(4), border.rounded, layout.flexRow, layout.itemsCenter),
                  {
                    backgroundColor: formData.userArchetype === archetype.id 
                      ? colors.primary + '10' 
                      : colors.card,
                    borderWidth: 2,
                    borderColor: formData.userArchetype === archetype.id 
                      ? colors.primary 
                      : colors.border,
                  }
                ]}
              >
                <View style={[
                  tw(spacing.w(12), spacing.h(12), layout.itemsCenter, layout.justifyCenter, spacing.mr(4)),
                  {
                    backgroundColor: formData.userArchetype === archetype.id 
                      ? colors.primary + '20' 
                      : colors.muted,
                    borderRadius: 24,
                  }
                ]}>
                  <Text style={tw(text.xl)}>
                    {archetype.emoji}
                  </Text>
                </View>

                <View style={tw(layout.flex1)}>
                  <Text style={[
                    tw(text.base, text.semibold, spacing.mb(1)),
                    { 
                      color: formData.userArchetype === archetype.id 
                        ? colors.primary 
                        : colors.foreground 
                    }
                  ]}>
                    {archetype.title}
                  </Text>
                  <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                    {archetype.description}
                  </Text>
                </View>

                {formData.userArchetype === archetype.id && (
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

          {stepValidationAttempted && errors.userArchetype && (
            <Text style={[tw(text.sm, spacing.mt(3)), { color: colors.destructive }]}>
              {errors.userArchetype}
            </Text>
          )}
        </CardContent>
      </Card>
    </ScrollView>
  );
};