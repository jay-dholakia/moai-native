import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Activity } from 'lucide-react-native';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout, border } from '@/utils/styles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { StepProps, PREFERRED_ACTIVITIES } from '@/types/onboarding';

export const MovementPreferencesStep = ({ 
  formData, 
  onChange, 
  errors, 
  stepValidationAttempted 
}: StepProps) => {
  const { colors } = useTheme();

  const toggleActivity = (activityId: string) => {
    const currentActivities = formData.preferredActivities || [];
    const isSelected = currentActivities.includes(activityId);
    
    if (isSelected) {
      onChange('preferredActivities', currentActivities.filter(id => id !== activityId));
    } else {
      onChange('preferredActivities', [...currentActivities, activityId]);
    }
  };

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
              <Activity size={24} color={colors.primary} />
            </View>
            <View style={tw(layout.flex1)}>
              <CardTitle>What activities do you enjoy?</CardTitle>
              <Text style={[tw(text.sm, spacing.mt(1)), { color: colors.mutedForeground }]}>
                Select all that interest you. This helps us recommend the right Moais and activities.
              </Text>
            </View>
          </View>
        </CardHeader>

        <CardContent>
          <View style={tw(layout.flexRow, layout.flexWrap, spacing.gap(3))}>
            {PREFERRED_ACTIVITIES.map((activity) => {
              const isSelected = formData.preferredActivities?.includes(activity.id) || false;
              
              return (
                <TouchableOpacity
                  key={activity.id}
                  onPress={() => toggleActivity(activity.id)}
                  style={[
                    tw(layout.flexRow, layout.itemsCenter, spacing.px(4), spacing.py(3), border.rounded),
                    {
                      backgroundColor: isSelected 
                        ? colors.primary + '20' 
                        : colors.muted,
                      borderWidth: 2,
                      borderColor: isSelected 
                        ? colors.primary 
                        : 'transparent',
                      minWidth: '45%',
                    }
                  ]}
                >
                  <Text style={tw(text.base, spacing.mr(2))}>
                    {activity.emoji}
                  </Text>
                  <Text style={[
                    tw(text.sm, text.medium),
                    { 
                      color: isSelected 
                        ? colors.primary 
                        : colors.foreground 
                    }
                  ]}>
                    {activity.title}
                  </Text>
                  
                  {isSelected && (
                    <View style={[
                      tw(spacing.w(4), spacing.h(4), layout.itemsCenter, layout.justifyCenter, spacing.ml(2)),
                      {
                        backgroundColor: colors.primary,
                        borderRadius: 8,
                      }
                    ]}>
                      <Text style={[tw(text.xs, text.bold), { color: colors.primaryForeground }]}>
                        ✓
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Selection Counter */}
          <View style={tw(spacing.mt(4))}>
            <Text style={[tw(text.sm, text.center), { color: colors.mutedForeground }]}>
              {formData.preferredActivities?.length || 0} activities selected
            </Text>
          </View>

          {/* Validation Error */}
          {stepValidationAttempted && errors.preferredActivities && (
            <Text style={[tw(text.sm, spacing.mt(3)), { color: colors.destructive }]}>
              {errors.preferredActivities}
            </Text>
          )}

          {/* Additional Context */}
          <View style={[
            tw(spacing.p(4), spacing.mt(4), border.rounded),
            { backgroundColor: colors.muted + '50' }
          ]}>
            <Text style={[tw(text.sm, text.center), { color: colors.mutedForeground }]}>
              🏆 Great job! You're almost done setting up your profile. Let's get you connected with your Moai community!
            </Text>
          </View>
        </CardContent>
      </Card>
    </ScrollView>
  );
};