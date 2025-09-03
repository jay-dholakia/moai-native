import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Check } from 'lucide-react-native';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout, border } from '@/utils/styles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

interface GoalSettingStepProps {
  formData: {
    fitnessGoals?: string[];
  };
  onChange: (field: keyof any, value: any) => void;
  errors?: Record<string, string>;
}

const goalOptions = [
  {
    id: 'feel_more_in_control',
    title: 'Feel more in control',
    description: 'I want movement to help me manage stress, anxiety, or overwhelm.',
    icon: '🧠'
  },
  {
    id: 'improve_energy_sleep',
    title: 'Improve energy & sleep',
    description: 'I\'m often tired and want to feel more refreshed and energized.',
    icon: '😴'
  },
  {
    id: 'get_stronger',
    title: 'Get stronger',
    description: 'I want to build strength, muscle, or tone my body.',
    icon: '💪'
  },
  {
    id: 'lose_weight',
    title: 'Lose weight or body fat',
    description: 'I want to slim down or feel more confident in my body.',
    icon: '⚖️'
  },
  {
    id: 'build_momentum',
    title: 'Build momentum',
    description: 'I\'ve struggled with staying consistent and want to stick to a routine.',
    icon: '📈'
  },
  {
    id: 'get_back_on_track',
    title: 'Get back on track',
    description: 'I used to be more active and want to find my groove again.',
    icon: '🏃'
  },
  {
    id: 'train_for_something',
    title: 'Train for something',
    description: 'I\'m working toward a race, event, or goal and want a plan.',
    icon: '🏅'
  },
  {
    id: 'have_fun_socialize',
    title: 'Have fun & socialize',
    description: 'I want movement to be enjoyable and help me connect with others.',
    icon: '🎉'
  }
];

export const GoalSettingStep = ({ formData, onChange, errors }: GoalSettingStepProps) => {
  const { colors } = useTheme();
  const selectedGoals = formData.fitnessGoals || [];

  const toggleGoal = (goalId: string) => {
    const currentGoals = selectedGoals || [];
    const isSelected = currentGoals.includes(goalId);
    
    let newGoals;
    if (isSelected) {
      newGoals = currentGoals.filter(id => id !== goalId);
    } else {
      newGoals = [...currentGoals, goalId];
    }
    
    onChange('fitnessGoals', newGoals);
  };

  return (
    <ScrollView style={tw(layout.flex1)} showsVerticalScrollIndicator={false}>
      <View style={tw(spacing.px(4), spacing.py(6))}>
        <Card>
          <CardHeader>
            <CardTitle>What are your fitness goals?</CardTitle>
            <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
              Select all that apply. We'll use this to personalize your experience.
            </Text>
          </CardHeader>
          
          <CardContent>
            <View style={tw(spacing.gap(3))}>
              {goalOptions.map((goal) => {
                const isSelected = selectedGoals.includes(goal.id);
                
                return (
                  <TouchableOpacity
                    key={goal.id}
                    onPress={() => toggleGoal(goal.id)}
                    style={[
                      tw(
                        spacing.p(4),
                        border.rounded,
                        layout.flexRow,
                        layout.itemsCenter,
                        spacing.gap(3)
                      ),
                      {
                        backgroundColor: isSelected ? colors.primary + '10' : colors.card,
                        borderWidth: 1,
                        borderColor: isSelected ? colors.primary : colors.border,
                        minHeight: 80,
                      }
                    ]}
                  >
                    {/* Icon */}
                    <View style={[
                      tw(spacing.w(12), spacing.h(12), layout.itemsCenter, layout.justifyCenter, border.rounded),
                      { backgroundColor: colors.muted }
                    ]}>
                      <Text style={tw(text.xl)}>{goal.icon}</Text>
                    </View>
                    
                    {/* Content */}
                    <View style={tw(layout.flex1, spacing.gap(1))}>
                      <Text style={[
                        tw(text.base, text.medium),
                        { color: colors.foreground }
                      ]}>
                        {goal.title}
                      </Text>
                      <Text style={[
                        tw(text.sm),
                        { color: colors.mutedForeground }
                      ]}>
                        {goal.description}
                      </Text>
                    </View>
                    
                    {/* Selection indicator */}
                    <View style={[
                      tw(spacing.w(6), spacing.h(6), layout.itemsCenter, layout.justifyCenter, border.rounded),
                      {
                        backgroundColor: isSelected ? colors.primary : 'transparent',
                        borderWidth: 1,
                        borderColor: isSelected ? colors.primary : colors.border,
                      }
                    ]}>
                      {isSelected && (
                        <Check size={16} color="#FFFFFF" />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
            
            {errors?.fitnessGoals && (
              <Text style={[tw(text.sm, spacing.mt(2)), { color: colors.destructive }]}>
                {errors.fitnessGoals}
              </Text>
            )}
            
            {selectedGoals.length > 0 && (
              <View style={[
                tw(spacing.mt(4), spacing.p(3), border.rounded),
                { backgroundColor: colors.muted }
              ]}>
                <Text style={[tw(text.sm, text.medium), { color: colors.foreground }]}>
                  Selected goals: {selectedGoals.length}
                </Text>
                <Text style={[tw(text.xs, spacing.mt(1)), { color: colors.mutedForeground }]}>
                  Great! We'll help you work toward these goals.
                </Text>
              </View>
            )}
          </CardContent>
        </Card>
      </View>
    </ScrollView>
  );
};