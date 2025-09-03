import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { User } from 'lucide-react-native';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout, border } from '@/utils/styles';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { StepProps, GENDER_OPTIONS, RELATIONSHIP_STATUS_OPTIONS } from '@/types/onboarding';

export const PersonalInfoStep = ({ 
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
              <User size={24} color={colors.primary} />
            </View>
            <View style={tw(layout.flex1)}>
              <CardTitle>Personal Information</CardTitle>
              <Text style={[tw(text.sm, spacing.mt(1)), { color: colors.mutedForeground }]}>
                Tell us a bit about yourself to get started
              </Text>
            </View>
          </View>
        </CardHeader>

        <CardContent>
          <View style={tw(spacing.gap(4))}>
            {/* Name Fields */}
            <View style={tw(layout.flexRow, spacing.gap(3))}>
              <View style={tw(layout.flex1)}>
                <Text style={[tw(text.sm, text.medium, spacing.mb(2)), { color: colors.foreground }]}>
                  First Name *
                </Text>
                <Input
                  value={formData.firstName}
                  onChangeText={(value) => onChange('firstName', value)}
                  placeholder="Enter your first name"
                  autoCapitalize="words"
                />
                {stepValidationAttempted && errors.firstName && (
                  <Text style={[tw(text.xs, spacing.mt(1)), { color: colors.destructive }]}>
                    {errors.firstName}
                  </Text>
                )}
              </View>

              <View style={tw(layout.flex1)}>
                <Text style={[tw(text.sm, text.medium, spacing.mb(2)), { color: colors.foreground }]}>
                  Last Name *
                </Text>
                <Input
                  value={formData.lastName}
                  onChangeText={(value) => onChange('lastName', value)}
                  placeholder="Enter your last name"
                  autoCapitalize="words"
                />
                {stepValidationAttempted && errors.lastName && (
                  <Text style={[tw(text.xs, spacing.mt(1)), { color: colors.destructive }]}>
                    {errors.lastName}
                  </Text>
                )}
              </View>
            </View>

            {/* Age and Gender */}
            <View style={tw(layout.flexRow, spacing.gap(3))}>
              <View style={tw(layout.flex1)}>
                <Text style={[tw(text.sm, text.medium, spacing.mb(2)), { color: colors.foreground }]}>
                  Age *
                </Text>
                <Input
                  value={formData.age}
                  onChangeText={(value) => onChange('age', value)}
                  placeholder="Enter your age"
                  keyboardType="numeric"
                  maxLength={3}
                />
                {stepValidationAttempted && errors.age && (
                  <Text style={[tw(text.xs, spacing.mt(1)), { color: colors.destructive }]}>
                    {errors.age}
                  </Text>
                )}
              </View>

              <View style={tw(layout.flex1)}>
                <Text style={[tw(text.sm, text.medium, spacing.mb(2)), { color: colors.foreground }]}>
                  Gender *
                </Text>
                <View style={tw(layout.flexRow, layout.flexWrap, spacing.gap(2))}>
                  {GENDER_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.id}
                      onPress={() => onChange('gender', option.id)}
                      style={[
                        tw(spacing.px(3), spacing.py(2), border.rounded),
                        {
                          backgroundColor: formData.gender === option.id 
                            ? colors.primary + '20' 
                            : colors.muted,
                          borderWidth: 1,
                          borderColor: formData.gender === option.id 
                            ? colors.primary 
                            : 'transparent',
                        }
                      ]}
                    >
                      <Text style={[
                        tw(text.sm),
                        { 
                          color: formData.gender === option.id 
                            ? colors.primary 
                            : colors.foreground 
                        }
                      ]}>
                        {option.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {stepValidationAttempted && errors.gender && (
                  <Text style={[tw(text.xs, spacing.mt(1)), { color: colors.destructive }]}>
                    {errors.gender}
                  </Text>
                )}
              </View>
            </View>

            {/* Phone Number */}
            <View>
              <Text style={[tw(text.sm, text.medium, spacing.mb(2)), { color: colors.foreground }]}>
                Phone Number
              </Text>
              <Input
                value={formData.phoneNumber}
                onChangeText={(value) => onChange('phoneNumber', value)}
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
              />
            </View>

            {/* Relationship Status */}
            <View>
              <Text style={[tw(text.sm, text.medium, spacing.mb(2)), { color: colors.foreground }]}>
                Relationship Status
              </Text>
              <View style={tw(layout.flexRow, layout.flexWrap, spacing.gap(2))}>
                {RELATIONSHIP_STATUS_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    onPress={() => onChange('relationshipStatus', option.id)}
                    style={[
                      tw(spacing.px(3), spacing.py(2), border.rounded),
                      {
                        backgroundColor: formData.relationshipStatus === option.id 
                          ? colors.primary + '20' 
                          : colors.muted,
                        borderWidth: 1,
                        borderColor: formData.relationshipStatus === option.id 
                          ? colors.primary 
                          : 'transparent',
                      }
                    ]}
                  >
                    <Text style={[
                      tw(text.sm),
                      { 
                        color: formData.relationshipStatus === option.id 
                          ? colors.primary 
                          : colors.foreground 
                      }
                    ]}>
                      {option.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Bio */}
            <View>
              <Text style={[tw(text.sm, text.medium, spacing.mb(2)), { color: colors.foreground }]}>
                Bio (Optional)
              </Text>
              <Input
                value={formData.bio}
                onChangeText={(value) => onChange('bio', value)}
                placeholder="Tell us a bit about yourself..."
                multiline
                numberOfLines={3}
                maxLength={200}
              />
              <Text style={[tw(text.xs, spacing.mt(1)), { color: colors.mutedForeground }]}>
                {(formData.bio || '').length}/200 characters
              </Text>
            </View>
          </View>
        </CardContent>
      </Card>
    </ScrollView>
  );
};