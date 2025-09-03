import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { tw, spacing, layout, text, border } from '@/utils/styles';
import { useTheme } from '@/providers/theme-provider';
import { BuddyPreferences } from '@/services/buddy-service';
import { TouchableOpacity } from 'react-native';

interface BuddyPreferencesFormProps {
  initialPreferences?: BuddyPreferences | null;
  onSubmit: (preferences: BuddyPreferences) => void;
  onNext?: () => void;
  isLoading?: boolean;
}

const WORKOUT_TYPES = [
  'Running', 'CrossFit', 'Yoga', 'Weight Training', 'Swimming', 
  'Cycling', 'Boxing', 'Pilates', 'HIIT', 'Dance', 'Rock Climbing'
];

const FITNESS_GOALS = [
  'Weight Loss', 'Muscle Gain', 'Endurance', 'Strength', 
  'Flexibility', 'General Fitness', 'Stress Relief'
];

const AVAILABILITY_HOURS = [
  'Early Morning (5-8 AM)',
  'Morning (8-11 AM)', 
  'Midday (11 AM-2 PM)',
  'Afternoon (2-5 PM)',
  'Evening (5-8 PM)',
  'Night (8-11 PM)'
];

export function BuddyPreferencesForm({ 
  initialPreferences, 
  onSubmit, 
  onNext,
  isLoading 
}: BuddyPreferencesFormProps) {
  const { colors: themeColors } = useTheme();
  
  const [preferences, setPreferences] = useState<BuddyPreferences>({
    timezone: initialPreferences?.timezone || '',
    workout_types: initialPreferences?.workout_types || [],
    commitment_level: initialPreferences?.commitment_level || 'medium',
    communication_style: initialPreferences?.communication_style || 'weekly',
    availability_hours: initialPreferences?.availability_hours || [],
    fitness_goals: initialPreferences?.fitness_goals || [],
    experience_level: initialPreferences?.experience_level || 'intermediate',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (preferences.workout_types.length === 0) {
      newErrors.workout_types = 'Select at least one workout type';
    }

    if (preferences.availability_hours && preferences.availability_hours.length === 0) {
      newErrors.availability_hours = 'Select at least one availability window';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(preferences);
      onNext?.();
    }
  };

  const toggleSelection = (
    field: 'workout_types' | 'fitness_goals' | 'availability_hours',
    value: string
  ) => {
    setPreferences(prev => {
      const currentArray = prev[field] || [];
      const newArray = currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value];
      
      return {
        ...prev,
        [field]: newArray,
      };
    });

    // Clear errors when user makes a selection
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const renderMultiSelect = (
    title: string,
    field: 'workout_types' | 'fitness_goals' | 'availability_hours',
    options: string[],
    error?: string
  ) => (
    <View style={tw(spacing.mb(6))}>
      <Text style={tw(text.base, text.semibold, spacing.mb(3))}>
        {title}
      </Text>
      
      <View style={tw(layout.flexRow, layout.flexWrap, spacing.gap(2))}>
        {options.map((option) => {
          const isSelected = (preferences[field] || []).includes(option);
          
          return (
            <TouchableOpacity
              key={option}
              onPress={() => toggleSelection(field, option)}
              style={[
                tw(spacing.px(3), spacing.py(2), border.rounded),
                {
                  backgroundColor: isSelected ? themeColors.primary : themeColors.secondary,
                  borderColor: isSelected ? themeColors.primary : themeColors.border,
                  borderWidth: 1,
                }
              ]}
            >
              <Text 
                style={[
                  tw(text.sm),
                  { color: isSelected ? 'white' : themeColors.foreground }
                ]}
              >
                {option}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      
      {error && (
        <Text style={[tw(text.sm, spacing.mt(2)), { color: themeColors.destructive }]}>
          {error}
        </Text>
      )}
    </View>
  );

  const renderRadioGroup = (
    title: string,
    field: keyof BuddyPreferences,
    options: { label: string; value: string; description?: string }[]
  ) => (
    <View style={tw(spacing.mb(6))}>
      <Text style={tw(text.base, text.semibold, spacing.mb(3))}>
        {title}
      </Text>
      
      <View style={tw(spacing.gap(2))}>
        {options.map((option) => {
          const isSelected = preferences[field] === option.value;
          
          return (
            <TouchableOpacity
              key={option.value}
              onPress={() => setPreferences(prev => ({ ...prev, [field]: option.value }))}
              style={[
                tw(spacing.p(3), border.rounded, border.border),
                {
                  backgroundColor: isSelected ? `${themeColors.primary}10` : themeColors.card,
                  borderColor: isSelected ? themeColors.primary : themeColors.border,
                }
              ]}
            >
              <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(3))}>
                <View
                  style={[
                    tw(spacing.w(5), spacing.h(5), border.rounded, border.border),
                    {
                      backgroundColor: isSelected ? themeColors.primary : 'transparent',
                      borderColor: isSelected ? themeColors.primary : themeColors.border,
                    }
                  ]}
                />
                <View style={tw(layout.flex1)}>
                  <Text style={tw(text.sm, text.semibold)}>
                    {option.label}
                  </Text>
                  {option.description && (
                    <Text style={tw(text.xs, text.muted, spacing.mt(1))}>
                      {option.description}
                    </Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Card elevation="sm">
        <View style={tw(spacing.p(4))}>
          {/* Workout Types */}
          {renderMultiSelect(
            'What types of workouts do you enjoy? *',
            'workout_types',
            WORKOUT_TYPES,
            errors.workout_types
          )}

          {/* Commitment Level */}
          {renderRadioGroup(
            'How committed are you to working out?',
            'commitment_level',
            [
              { 
                label: 'Low', 
                value: 'low', 
                description: '1-2 times per week, flexible schedule' 
              },
              { 
                label: 'Medium', 
                value: 'medium', 
                description: '3-4 times per week, regular routine' 
              },
              { 
                label: 'High', 
                value: 'high', 
                description: '5+ times per week, structured plan' 
              },
            ]
          )}

          {/* Experience Level */}
          {renderRadioGroup(
            'What\'s your fitness experience level?',
            'experience_level',
            [
              { 
                label: 'Beginner', 
                value: 'beginner', 
                description: 'New to fitness or getting back into it' 
              },
              { 
                label: 'Intermediate', 
                value: 'intermediate', 
                description: 'Regular workout routine, comfortable with basics' 
              },
              { 
                label: 'Advanced', 
                value: 'advanced', 
                description: 'Experienced, may compete or train intensively' 
              },
            ]
          )}

          {/* Communication Style */}
          {renderRadioGroup(
            'How often would you like to check in?',
            'communication_style',
            [
              { 
                label: 'Daily', 
                value: 'daily', 
                description: 'Daily check-ins and motivation' 
              },
              { 
                label: 'Weekly', 
                value: 'weekly', 
                description: 'Weekly progress reviews' 
              },
              { 
                label: 'As Needed', 
                value: 'as-needed', 
                description: 'Flexible communication when needed' 
              },
            ]
          )}

          {/* Availability */}
          {renderMultiSelect(
            'When are you usually available to work out?',
            'availability_hours',
            AVAILABILITY_HOURS,
            errors.availability_hours
          )}

          {/* Fitness Goals */}
          {renderMultiSelect(
            'What are your main fitness goals?',
            'fitness_goals',
            FITNESS_GOALS
          )}

          {/* Timezone */}
          <View style={tw(spacing.mb(6))}>
            <Text style={tw(text.base, text.semibold, spacing.mb(3))}>
              Timezone (optional)
            </Text>
            <Input
              placeholder="e.g., America/New_York, Europe/London"
              value={preferences.timezone || ''}
              onChangeText={(text) => setPreferences(prev => ({ ...prev, timezone: text }))}
            />
            <Text style={tw(text.xs, text.muted, spacing.mt(2))}>
              Leave blank to match with anyone, or specify to find buddies in your timezone
            </Text>
          </View>

          <Button
            onPress={handleSubmit}
            variant="gradient"
            size="lg"
            loading={isLoading}
            disabled={preferences.workout_types.length === 0}
          >
            Find My Workout Buddy
          </Button>
        </View>
      </Card>
    </ScrollView>
  );
}