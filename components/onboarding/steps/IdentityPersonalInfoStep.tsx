import { Avatar } from '@/components/ui/Avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useTheme } from '@/providers/theme-provider';
import { StepProps } from '@/types/onboarding';
import { border, layout, spacing, text, tw } from '@/utils/styles';
import { User, Video } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';

const GENDER_OPTIONS = [
  { id: 'male', title: 'Male' },
  { id: 'female', title: 'Female' },
  { id: 'non-binary', title: 'Non-binary' },
  { id: 'prefer-not-to-say', title: 'Prefer not to say' },
];

const months = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' }
];

export const IdentityPersonalInfoStep = ({ 
  formData, 
  onChange, 
  errors, 
  stepValidationAttempted 
}: StepProps) => {
  const { colors } = useTheme();
  const [showBirthDatePicker, setShowBirthDatePicker] = useState<'month' | 'day' | 'year' | null>(null);

  const userInitials = `${formData.firstName?.[0] || ''}${formData.lastName?.[0] || ''}`;

  // Calculate age from birth date parts
  const calculateAge = (year: string, month: string, day: string) => {
    if (!year || !month || !day) return null;
    
    const birthDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const today = new Date();
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age > 0 ? age.toString() : null;
  };

  const handleBirthDateChange = (type: 'month' | 'day' | 'year', value: string) => {
    // Store individual parts separately
    if (type === 'year') onChange('birthYear', value);
    if (type === 'month') onChange('birthMonth', value);
    if (type === 'day') onChange('birthDay', value);
    
    // Get the updated parts
    const currentYear = type === 'year' ? value : (formData.birthYear || '');
    const currentMonth = type === 'month' ? value : (formData.birthMonth || '');
    const currentDay = type === 'day' ? value : (formData.birthDay || '');
    
    // Save birthDate if all three parts are provided
    if (currentYear && currentMonth && currentDay) {
      const dateString = `${currentYear}-${currentMonth.padStart(2, '0')}-${currentDay.padStart(2, '0')}`;
      
      // Validate that it's a real date
      const testDate = new Date(dateString);
      if (!isNaN(testDate.getTime())) {
        onChange('birthDate', dateString);
        
        // Calculate and set age
        const calculatedAge = calculateAge(currentYear, currentMonth, currentDay);
        if (calculatedAge) {
          onChange('age', calculatedAge);
        }
      } else {
        onChange('birthDate', null);
        onChange('age', '');
      }
    } else {
      onChange('birthDate', null);
      onChange('age', '');
    }
  };

  const handleProfileImagePress = () => {
    Alert.alert(
      'Profile Photo',
      'Choose an option',
      [
        { text: 'Camera', onPress: () => console.log('Camera selected') },
        { text: 'Photo Library', onPress: () => console.log('Library selected') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const getBirthDateDisplay = () => {
    const month = formData.birthMonth ? months.find(m => m.value === formData.birthMonth)?.label : 'Month';
    const day = formData.birthDay || 'Day';
    const year = formData.birthYear || 'Year';
    return `${month} ${day}, ${year}`;
  };

  // Generate years (last 100 years)
  const years = Array.from({ length: 100 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return { value: year.toString(), label: year.toString() };
  });

  // Generate days (1-31)
  const days = Array.from({ length: 31 }, (_, i) => ({ 
    value: (i + 1).toString(), 
    label: (i + 1).toString() 
  }));

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
              <CardTitle>Let's get to know you</CardTitle>
              <Text style={[tw(text.sm, spacing.mt(1)), { color: colors.mutedForeground }]}>
                Tell us a bit about yourself to get started
              </Text>
            </View>
          </View>
        </CardHeader>

        <CardContent>
          <View style={tw(spacing.gap(6))}>
            {/* Profile Picture */}
            <View style={tw(layout.itemsCenter, spacing.gap(4))}>
              <TouchableOpacity onPress={handleProfileImagePress}>
                <View style={tw(layout.relative)}>
                  <Avatar 
                    size="xl"
                    source={formData.profileImage ? { uri: formData.profileImage } : undefined}
                    fallback={userInitials}
                  />
                  <View style={[
                    tw(layout.absolute, layout.itemsCenter, layout.justifyCenter),
                    {
                      bottom: -4,
                      right: -4,
                      width: 32,
                      height: 32,
                      backgroundColor: colors.primary,
                      borderRadius: 16,
                      borderWidth: 2,
                      borderColor: colors.background,
                    }
                  ]}>
                    <Video size={16} color={colors.background} />
                  </View>
                </View>
              </TouchableOpacity>
              <Text style={[tw(text.sm, text.center), { color: colors.mutedForeground }]}>
                Profile picture (optional)
              </Text>
            </View>

            {/* Name Fields */}
            <View style={tw(layout.flexRow, spacing.gap(3))}>
              <View style={tw(layout.flex1)}>
                <Text style={[tw(text.sm, text.medium, spacing.mb(2)), { color: colors.foreground }]}>
                  First name *
                </Text>
                <Input
                  value={formData.firstName || ''}
                  onChangeText={(value) => onChange('firstName', value)}
                  placeholder="Enter first name"
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
                  Last name *
                </Text>
                <Input
                  value={formData.lastName || ''}
                  onChangeText={(value) => onChange('lastName', value)}
                  placeholder="Enter last name"
                  autoCapitalize="words"
                />
                {stepValidationAttempted && errors.lastName && (
                  <Text style={[tw(text.xs, spacing.mt(1)), { color: colors.destructive }]}>
                    {errors.lastName}
                  </Text>
                )}
              </View>
            </View>

            {/* Birth Date */}
            <View>
              <Text style={[tw(text.sm, text.medium, spacing.mb(2)), { color: colors.foreground }]}>
                Birth date
              </Text>
              <TouchableOpacity
                onPress={() => {
                  Alert.alert(
                    'Birth Date',
                    'Select your birth date',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'OK', onPress: () => console.log('Date picker implementation needed') }
                    ]
                  );
                }}
                style={[
                  tw(spacing.p(3), border.rounded),
                  {
                    backgroundColor: colors.background,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }
                ]}
              >
                <Text style={[tw(text.base), { color: colors.foreground }]}>
                  {getBirthDateDisplay()}
                </Text>
              </TouchableOpacity>
              {stepValidationAttempted && errors.birthDate && (
                <Text style={[tw(text.xs, spacing.mt(1)), { color: colors.destructive }]}>
                  {errors.birthDate}
                </Text>
              )}
            </View>

            {/* Gender */}
            <View>
              <Text style={[tw(text.sm, text.medium, spacing.mb(2)), { color: colors.foreground }]}>
                Gender
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

            {/* Height and Weight */}
            <View style={tw(layout.flexRow, spacing.gap(3))}>
              <View style={tw(layout.flex1)}>
                <Text style={[tw(text.sm, text.medium, spacing.mb(2)), { color: colors.foreground }]}>
                  Height
                </Text>
                <View style={tw(layout.flexRow, spacing.gap(2))}>
                  <View style={tw(layout.flex1)}>
                    <Input
                      value={formData.heightFeet || ''}
                      onChangeText={(value) => onChange('heightFeet', value)}
                      placeholder="Ft"
                      keyboardType="numeric"
                      maxLength={1}
                    />
                  </View>
                  <View style={tw(layout.flex1)}>
                    <Input
                      value={formData.heightInches || ''}
                      onChangeText={(value) => onChange('heightInches', value)}
                      placeholder="In"
                      keyboardType="numeric"
                      maxLength={2}
                    />
                  </View>
                </View>
                {stepValidationAttempted && errors.height && (
                  <Text style={[tw(text.xs, spacing.mt(1)), { color: colors.destructive }]}>
                    {errors.height}
                  </Text>
                )}
              </View>

              <View style={tw(layout.flex1)}>
                <Text style={[tw(text.sm, text.medium, spacing.mb(2)), { color: colors.foreground }]}>
                  Weight (lbs)
                </Text>
                <Input
                  value={formData.weight?.toString() || ''}
                  onChangeText={(value) => {
                    const numValue = parseFloat(value);
                    onChange('weight', isNaN(numValue) ? null : numValue.toString());
                  }}
                  placeholder="170"
                  keyboardType="numeric"
                />
                {stepValidationAttempted && errors.weight && (
                  <Text style={[tw(text.xs, spacing.mt(1)), { color: colors.destructive }]}>
                    {errors.weight}
                  </Text>
                )}
              </View>
            </View>
          </View>
        </CardContent>
      </Card>
    </ScrollView>
  );
};