import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Heart } from 'lucide-react-native';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout, border } from '@/utils/styles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { StepProps, ACCOUNTABILITY_STYLES } from '@/types/onboarding';

export const AccountabilityStyleStep = ({ 
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
              <Heart size={24} color={colors.primary} />
            </View>
            <View style={tw(layout.flex1)}>
              <CardTitle>How do you like to be supported?</CardTitle>
              <Text style={[tw(text.sm, spacing.mt(1)), { color: colors.mutedForeground }]}>
                This helps us match you with people who will motivate you in the way that works best
              </Text>
            </View>
          </View>
        </CardHeader>

        <CardContent>
          <View style={tw(spacing.gap(3))}>
            {ACCOUNTABILITY_STYLES.map((style) => (
              <TouchableOpacity
                key={style.id}
                onPress={() => onChange('accountabilityStyle', style.id)}
                style={[
                  tw(spacing.p(4), border.rounded, layout.flexRow, layout.itemsCenter),
                  {
                    backgroundColor: formData.accountabilityStyle === style.id 
                      ? colors.primary + '10' 
                      : colors.card,
                    borderWidth: 2,
                    borderColor: formData.accountabilityStyle === style.id 
                      ? colors.primary 
                      : colors.border,
                  }
                ]}
              >
                <View style={[
                  tw(spacing.w(12), spacing.h(12), layout.itemsCenter, layout.justifyCenter, spacing.mr(4)),
                  {
                    backgroundColor: formData.accountabilityStyle === style.id 
                      ? colors.primary + '20' 
                      : colors.muted,
                    borderRadius: 24,
                  }
                ]}>
                  <Text style={tw(text.xl)}>
                    {style.emoji}
                  </Text>
                </View>

                <View style={tw(layout.flex1)}>
                  <Text style={[
                    tw(text.base, text.semibold, spacing.mb(1)),
                    { 
                      color: formData.accountabilityStyle === style.id 
                        ? colors.primary 
                        : colors.foreground 
                    }
                  ]}>
                    {style.title}
                  </Text>
                  <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                    {style.description}
                  </Text>
                </View>

                {formData.accountabilityStyle === style.id && (
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

          {stepValidationAttempted && errors.accountabilityStyle && (
            <Text style={[tw(text.sm, spacing.mt(3)), { color: colors.destructive }]}>
              {errors.accountabilityStyle}
            </Text>
          )}
        </CardContent>
      </Card>
    </ScrollView>
  );
};