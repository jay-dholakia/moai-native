import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout, border } from '@/utils/styles';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { StepProps } from '@/types/onboarding';

export const LocationStep = ({ 
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
              <MapPin size={24} color={colors.primary} />
            </View>
            <View style={tw(layout.flex1)}>
              <CardTitle>Where are you located?</CardTitle>
              <Text style={[tw(text.sm, spacing.mt(1)), { color: colors.mutedForeground }]}>
                This helps us connect you with people in your area for local activities
              </Text>
            </View>
          </View>
        </CardHeader>

        <CardContent>
          <View style={tw(spacing.gap(4))}>
            {/* City and State */}
            <View style={tw(layout.flexRow, spacing.gap(3))}>
              <View style={tw(layout.flex2)}>
                <Text style={[tw(text.sm, text.medium, spacing.mb(2)), { color: colors.foreground }]}>
                  City *
                </Text>
                <Input
                  value={formData.city}
                  onChangeText={(value) => onChange('city', value)}
                  placeholder="Enter your city"
                  autoCapitalize="words"
                />
                {stepValidationAttempted && errors.city && (
                  <Text style={[tw(text.xs, spacing.mt(1)), { color: colors.destructive }]}>
                    {errors.city}
                  </Text>
                )}
              </View>

              <View style={tw(layout.flex1)}>
                <Text style={[tw(text.sm, text.medium, spacing.mb(2)), { color: colors.foreground }]}>
                  State *
                </Text>
                <Input
                  value={formData.state}
                  onChangeText={(value) => onChange('state', value)}
                  placeholder="State"
                  autoCapitalize="words"
                />
                {stepValidationAttempted && errors.state && (
                  <Text style={[tw(text.xs, spacing.mt(1)), { color: colors.destructive }]}>
                    {errors.state}
                  </Text>
                )}
              </View>
            </View>

            {/* Zip Code */}
            <View style={tw(layout.w('50%'))}>
              <Text style={[tw(text.sm, text.medium, spacing.mb(2)), { color: colors.foreground }]}>
                Zip Code (Optional)
              </Text>
              <Input
                value={formData.zipCode || ''}
                onChangeText={(value) => onChange('zipCode', value)}
                placeholder="12345"
                keyboardType="numeric"
                maxLength={5}
              />
            </View>

            {/* Privacy Notice */}
            <View style={[
              tw(spacing.p(4), spacing.mt(4), border.rounded),
              { backgroundColor: colors.muted + '50' }
            ]}>
              <Text style={[tw(text.sm, text.center), { color: colors.mutedForeground }]}>
                🔒 Your exact location is private. We only use this to suggest local Moais and activities in your area.
              </Text>
            </View>
          </View>
        </CardContent>
      </Card>
    </ScrollView>
  );
};