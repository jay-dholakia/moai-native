import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout, border } from '@/utils/styles';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { MobileLayout } from '@/components/layouts/MobileLayout';
import { Ionicons } from '@expo/vector-icons';
import { useCreateChallenge } from '@/hooks/use-events-challenges';
import { Challenge } from '@/services/event-service';
import DateTimePicker from '@react-native-community/datetimepicker';

interface ChallengeBuilderProps {
  existingChallenge?: Challenge;
  onSave?: (challenge: Challenge) => void;
  onCancel?: () => void;
}

export const ChallengeBuilder: React.FC<ChallengeBuilderProps> = ({
  existingChallenge,
  onSave,
  onCancel,
}) => {
  const { colors } = useTheme();
  const createChallenge = useCreateChallenge();
  
  const [activeStep, setActiveStep] = useState(0);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  
  const [challengeData, setChallengeData] = useState({
    title: existingChallenge?.title || '',
    description: existingChallenge?.description || '',
    challenge_type: existingChallenge?.challenge_type || 'individual' as Challenge['challenge_type'],
    category: existingChallenge?.category || 'workouts' as Challenge['category'],
    goal_type: existingChallenge?.goal_type || 'target' as Challenge['goal_type'],
    goal_value: existingChallenge?.goal_value || 30,
    goal_unit: existingChallenge?.goal_unit || 'workouts',
    start_date: existingChallenge?.start_date ? new Date(existingChallenge.start_date) : new Date(),
    end_date: existingChallenge?.end_date ? new Date(existingChallenge.end_date) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    max_participants: existingChallenge?.max_participants || undefined,
    is_public: existingChallenge?.is_public ?? true,
    is_featured: existingChallenge?.is_featured ?? false,
    entry_fee: existingChallenge?.entry_fee || 0,
    prize_pool: existingChallenge?.prize_pool || 0,
    prizes: existingChallenge?.prizes || {
      first: '',
      second: '',
      third: '',
      participation: '',
    },
    rules: existingChallenge?.rules || [],
  });

  const [newRule, setNewRule] = useState('');

  const steps = [
    { id: 'basics', title: 'Challenge Info', icon: 'information-circle' },
    { id: 'goals', title: 'Goals & Rules', icon: 'trophy' },
    { id: 'schedule', title: 'Schedule', icon: 'calendar' },
    { id: 'rewards', title: 'Rewards', icon: 'gift' },
  ];

  const challengeTypes = [
    { id: 'individual', name: 'Individual', icon: 'person', description: 'Personal challenge goals' },
    { id: 'team', name: 'Team', icon: 'people', description: 'Form teams and compete together' },
    { id: 'group', name: 'Group', icon: 'globe', description: 'Everyone works toward shared goal' },
  ];

  const categories = [
    { id: 'workouts', name: 'Workouts', icon: 'fitness' },
    { id: 'steps', name: 'Steps', icon: 'walk' },
    { id: 'distance', name: 'Distance', icon: 'speedometer' },
    { id: 'duration', name: 'Duration', icon: 'time' },
    { id: 'calories', name: 'Calories', icon: 'flame' },
    { id: 'custom', name: 'Custom', icon: 'settings' },
  ];

  const goalTypes = [
    { id: 'target', name: 'Reach Target', description: 'Hit a specific number' },
    { id: 'leaderboard', name: 'Leaderboard', description: 'Compete for top positions' },
    { id: 'completion', name: 'Completion', description: 'Complete the challenge' },
  ];

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const handleAddRule = () => {
    if (newRule.trim()) {
      setChallengeData({
        ...challengeData,
        rules: [...challengeData.rules, newRule.trim()],
      });
      setNewRule('');
    }
  };

  const handleRemoveRule = (index: number) => {
    setChallengeData({
      ...challengeData,
      rules: challengeData.rules.filter((_, i) => i !== index),
    });
  };

  const validateChallenge = () => {
    if (!challengeData.title.trim()) {
      Alert.alert('Validation Error', 'Challenge title is required');
      return false;
    }
    if (!challengeData.description.trim()) {
      Alert.alert('Validation Error', 'Challenge description is required');
      return false;
    }
    if (challengeData.start_date <= new Date()) {
      Alert.alert('Validation Error', 'Start date must be in the future');
      return false;
    }
    if (challengeData.end_date <= challengeData.start_date) {
      Alert.alert('Validation Error', 'End date must be after start date');
      return false;
    }
    if (challengeData.goal_type === 'target' && (!challengeData.goal_value || challengeData.goal_value <= 0)) {
      Alert.alert('Validation Error', 'Goal value must be greater than 0');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateChallenge()) return;

    try {
      const result = await createChallenge.mutateAsync({
        ...challengeData,
        start_date: challengeData.start_date.toISOString(),
        end_date: challengeData.end_date.toISOString(),
      });

      if (result.success) {
        Alert.alert('Success', 'Challenge created successfully!');
        onSave?.(result.data);
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create challenge');
    }
  };

  const renderBasicsStep = () => (
    <ScrollView style={tw(layout.flex1)} showsVerticalScrollIndicator={false}>
      <View style={tw(spacing.gap(4))}>
        <View>
          <Text style={[tw(text.sm, text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
            Challenge Title *
          </Text>
          <Input
            value={challengeData.title}
            onChangeText={(text) => setChallengeData({ ...challengeData, title: text })}
            placeholder="e.g., 30-Day Workout Challenge"
            style={tw(spacing.mb(0))}
          />
        </View>

        <View>
          <Text style={[tw(text.sm, text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
            Description *
          </Text>
          <TextInput
            value={challengeData.description}
            onChangeText={(text) => setChallengeData({ ...challengeData, description: text })}
            placeholder="Describe your challenge and what participants need to do..."
            multiline
            numberOfLines={4}
            style={[
              tw(border.border, border.rounded, spacing.p(3)),
              {
                borderColor: colors.border,
                backgroundColor: colors.background,
                color: colors.foreground,
                textAlignVertical: 'top',
                minHeight: 100,
              }
            ]}
            placeholderTextColor={colors.mutedForeground}
          />
        </View>

        <View>
          <Text style={[tw(text.sm, text.semibold, spacing.mb(3)), { color: colors.foreground }]}>
            Challenge Type *
          </Text>
          <View style={tw(spacing.gap(3))}>
            {challengeTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                onPress={() => setChallengeData({ ...challengeData, challenge_type: type.id as Challenge['challenge_type'] })}
                style={[
                  tw(layout.flexRow, layout.itemsCenter, spacing.p(4), border.rounded),
                  {
                    backgroundColor: challengeData.challenge_type === type.id ? colors.primary + '20' : colors.muted,
                    borderWidth: 1,
                    borderColor: challengeData.challenge_type === type.id ? colors.primary : colors.border,
                  }
                ]}
              >
                <Ionicons 
                  name={type.icon as any} 
                  size={24} 
                  color={challengeData.challenge_type === type.id ? colors.primary : colors.foreground} 
                />
                <View style={tw(layout.flex1, spacing.ml(3))}>
                  <Text style={[tw(text.base, text.semibold), { color: colors.foreground }]}>
                    {type.name}
                  </Text>
                  <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                    {type.description}
                  </Text>
                </View>
                {challengeData.challenge_type === type.id && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View>
          <Text style={[tw(text.sm, text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
            Category *
          </Text>
          <View style={tw(layout.flexRow, layout.flexWrap, spacing.gap(2))}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                onPress={() => setChallengeData({ ...challengeData, category: category.id as Challenge['category'] })}
                style={[
                  tw(layout.flexRow, layout.itemsCenter, spacing.gap(2), spacing.px(3), spacing.py(2), border.rounded),
                  {
                    backgroundColor: challengeData.category === category.id ? colors.primary : colors.secondary,
                    minWidth: '30%',
                  }
                ]}
              >
                <Ionicons 
                  name={category.icon as any} 
                  size={16} 
                  color={challengeData.category === category.id ? colors.primaryForeground : colors.foreground} 
                />
                <Text style={[
                  tw(text.sm),
                  { color: challengeData.category === category.id ? colors.primaryForeground : colors.foreground }
                ]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderGoalsStep = () => (
    <ScrollView style={tw(layout.flex1)} showsVerticalScrollIndicator={false}>
      <View style={tw(spacing.gap(4))}>
        <View>
          <Text style={[tw(text.sm, text.semibold, spacing.mb(3)), { color: colors.foreground }]}>
            Goal Type *
          </Text>
          <View style={tw(spacing.gap(3))}>
            {goalTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                onPress={() => setChallengeData({ ...challengeData, goal_type: type.id as Challenge['goal_type'] })}
                style={[
                  tw(layout.flexRow, layout.itemsCenter, spacing.p(4), border.rounded),
                  {
                    backgroundColor: challengeData.goal_type === type.id ? colors.primary + '20' : colors.muted,
                    borderWidth: 1,
                    borderColor: challengeData.goal_type === type.id ? colors.primary : colors.border,
                  }
                ]}
              >
                <View style={tw(layout.flex1)}>
                  <Text style={[tw(text.base, text.semibold), { color: colors.foreground }]}>
                    {type.name}
                  </Text>
                  <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                    {type.description}
                  </Text>
                </View>
                {challengeData.goal_type === type.id && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {challengeData.goal_type === 'target' && (
          <View>
            <Text style={[tw(text.sm, text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
              Goal Target *
            </Text>
            <View style={tw(layout.flexRow, spacing.gap(3))}>
              <Input
                value={challengeData.goal_value?.toString() || ''}
                onChangeText={(text) => setChallengeData({ ...challengeData, goal_value: parseInt(text) || 0 })}
                placeholder="30"
                keyboardType="numeric"
                style={tw(layout.flex1, spacing.mb(0))}
              />
              <Input
                value={challengeData.goal_unit || ''}
                onChangeText={(text) => setChallengeData({ ...challengeData, goal_unit: text })}
                placeholder="workouts"
                style={tw(layout.flex1, spacing.mb(0))}
              />
            </View>
          </View>
        )}

        <View>
          <Text style={[tw(text.sm, text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
            Max Participants (Optional)
          </Text>
          <Input
            value={challengeData.max_participants?.toString() || ''}
            onChangeText={(text) => setChallengeData({ ...challengeData, max_participants: parseInt(text) || undefined })}
            placeholder="Leave empty for unlimited"
            keyboardType="numeric"
            style={tw(spacing.mb(0))}
          />
        </View>

        <View>
          <Text style={[tw(text.sm, text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
            Challenge Rules
          </Text>
          <View style={tw(spacing.gap(2))}>
            <View style={tw(layout.flexRow, spacing.gap(2))}>
              <Input
                value={newRule}
                onChangeText={setNewRule}
                placeholder="Add a rule..."
                style={tw(layout.flex1, spacing.mb(0))}
              />
              <Button
                variant="outline"
                size="sm"
                onPress={handleAddRule}
                disabled={!newRule.trim()}
              >
                Add
              </Button>
            </View>
            
            {challengeData.rules.map((rule, index) => (
              <View
                key={index}
                style={[
                  tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.p(3), border.rounded),
                  { backgroundColor: colors.muted }
                ]}
              >
                <Text style={[tw(text.sm, layout.flex1), { color: colors.foreground }]}>
                  {rule}
                </Text>
                <TouchableOpacity onPress={() => handleRemoveRule(index)}>
                  <Ionicons name="close-circle" size={20} color={colors.destructive} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderScheduleStep = () => (
    <View style={tw(spacing.gap(4))}>
      <View>
        <Text style={[tw(text.sm, text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
          Start Date *
        </Text>
        <TouchableOpacity
          onPress={() => setShowStartDatePicker(true)}
          style={[
            tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.p(4), border.rounded),
            { backgroundColor: colors.muted }
          ]}
        >
          <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(3))}>
            <Ionicons name="calendar" size={20} color={colors.primary} />
            <Text style={[tw(text.base), { color: colors.foreground }]}>
              {challengeData.start_date.toLocaleDateString()}
            </Text>
          </View>
          <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
            Tap to change
          </Text>
        </TouchableOpacity>
      </View>

      <View>
        <Text style={[tw(text.sm, text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
          End Date *
        </Text>
        <TouchableOpacity
          onPress={() => setShowEndDatePicker(true)}
          style={[
            tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.p(4), border.rounded),
            { backgroundColor: colors.muted }
          ]}
        >
          <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(3))}>
            <Ionicons name="calendar-outline" size={20} color={colors.primary} />
            <Text style={[tw(text.base), { color: colors.foreground }]}>
              {challengeData.end_date.toLocaleDateString()}
            </Text>
          </View>
          <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
            Tap to change
          </Text>
        </TouchableOpacity>
      </View>

      <View>
        <Text style={[tw(text.sm, text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
          Duration
        </Text>
        <View style={[
          tw(spacing.p(4), border.rounded),
          { backgroundColor: colors.muted }
        ]}>
          <Text style={[tw(text.lg, text.semibold), { color: colors.primary }]}>
            {Math.ceil((challengeData.end_date.getTime() - challengeData.start_date.getTime()) / (1000 * 60 * 60 * 24))} days
          </Text>
        </View>
      </View>
    </View>
  );

  const renderRewardsStep = () => (
    <ScrollView style={tw(layout.flex1)} showsVerticalScrollIndicator={false}>
      <View style={tw(spacing.gap(4))}>
        <View>
          <Text style={[tw(text.sm, text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
            Entry Fee ($)
          </Text>
          <Input
            value={challengeData.entry_fee?.toString() || '0'}
            onChangeText={(text) => setChallengeData({ ...challengeData, entry_fee: parseInt(text) || 0 })}
            placeholder="0"
            keyboardType="numeric"
            style={tw(spacing.mb(0))}
          />
        </View>

        <View>
          <Text style={[tw(text.sm, text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
            Prize Pool ($)
          </Text>
          <Input
            value={challengeData.prize_pool?.toString() || '0'}
            onChangeText={(text) => setChallengeData({ ...challengeData, prize_pool: parseInt(text) || 0 })}
            placeholder="0"
            keyboardType="numeric"
            style={tw(spacing.mb(0))}
          />
        </View>

        <View>
          <Text style={[tw(text.sm, text.semibold, spacing.mb(3)), { color: colors.foreground }]}>
            Prizes & Rewards
          </Text>
          
          <View style={tw(spacing.gap(3))}>
            <View>
              <Text style={[tw(text.sm, spacing.mb(1)), { color: colors.foreground }]}>
                1st Place
              </Text>
              <Input
                value={challengeData.prizes.first || ''}
                onChangeText={(text) => setChallengeData({
                  ...challengeData,
                  prizes: { ...challengeData.prizes, first: text }
                })}
                placeholder="e.g., $100 gift card"
                style={tw(spacing.mb(0))}
              />
            </View>

            <View>
              <Text style={[tw(text.sm, spacing.mb(1)), { color: colors.foreground }]}>
                2nd Place
              </Text>
              <Input
                value={challengeData.prizes.second || ''}
                onChangeText={(text) => setChallengeData({
                  ...challengeData,
                  prizes: { ...challengeData.prizes, second: text }
                })}
                placeholder="e.g., $50 gift card"
                style={tw(spacing.mb(0))}
              />
            </View>

            <View>
              <Text style={[tw(text.sm, spacing.mb(1)), { color: colors.foreground }]}>
                3rd Place
              </Text>
              <Input
                value={challengeData.prizes.third || ''}
                onChangeText={(text) => setChallengeData({
                  ...challengeData,
                  prizes: { ...challengeData.prizes, third: text }
                })}
                placeholder="e.g., $25 gift card"
                style={tw(spacing.mb(0))}
              />
            </View>

            <View>
              <Text style={[tw(text.sm, spacing.mb(1)), { color: colors.foreground }]}>
                Participation Reward
              </Text>
              <Input
                value={challengeData.prizes.participation || ''}
                onChangeText={(text) => setChallengeData({
                  ...challengeData,
                  prizes: { ...challengeData.prizes, participation: text }
                })}
                placeholder="e.g., MOAI badge"
                style={tw(spacing.mb(0))}
              />
            </View>
          </View>
        </View>

        <View>
          <Text style={[tw(text.sm, text.semibold, spacing.mb(3)), { color: colors.foreground }]}>
            Visibility Settings
          </Text>
          
          <TouchableOpacity
            onPress={() => setChallengeData({ ...challengeData, is_public: !challengeData.is_public })}
            style={[
              tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.p(4), border.rounded, spacing.mb(3)),
              { backgroundColor: colors.muted }
            ]}
          >
            <View style={tw(layout.flex1)}>
              <Text style={[tw(text.sm, text.semibold), { color: colors.foreground }]}>
                Public Challenge
              </Text>
              <Text style={[tw(text.xs, spacing.mt(1)), { color: colors.mutedForeground }]}>
                Allow anyone to discover and join this challenge
              </Text>
            </View>
            <View style={[
              tw(spacing.w(12), spacing.h(6), border.rounded, layout.justifyEnd),
              { 
                backgroundColor: challengeData.is_public ? colors.primary : colors.border,
                padding: 2
              }
            ]}>
              <View style={[
                tw(spacing.w(5), spacing.h(5), border.rounded),
                { 
                  backgroundColor: colors.background,
                  transform: [{ translateX: challengeData.is_public ? 20 : 0 }]
                }
              ]} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setChallengeData({ ...challengeData, is_featured: !challengeData.is_featured })}
            style={[
              tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.p(4), border.rounded),
              { backgroundColor: colors.muted }
            ]}
          >
            <View style={tw(layout.flex1)}>
              <Text style={[tw(text.sm, text.semibold), { color: colors.foreground }]}>
                Featured Challenge
              </Text>
              <Text style={[tw(text.xs, spacing.mt(1)), { color: colors.mutedForeground }]}>
                Highlight this challenge in discovery
              </Text>
            </View>
            <View style={[
              tw(spacing.w(12), spacing.h(6), border.rounded, layout.justifyEnd),
              { 
                backgroundColor: challengeData.is_featured ? colors.primary : colors.border,
                padding: 2
              }
            ]}>
              <View style={[
                tw(spacing.w(5), spacing.h(5), border.rounded),
                { 
                  backgroundColor: colors.background,
                  transform: [{ translateX: challengeData.is_featured ? 20 : 0 }]
                }
              ]} />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return renderBasicsStep();
      case 1:
        return renderGoalsStep();
      case 2:
        return renderScheduleStep();
      case 3:
        return renderRewardsStep();
      default:
        return null;
    }
  };

  const isStepValid = () => {
    switch (activeStep) {
      case 0:
        return challengeData.title.trim() && challengeData.description.trim();
      case 1:
        return challengeData.goal_type !== 'target' || (challengeData.goal_value && challengeData.goal_value > 0);
      case 2:
        return challengeData.start_date > new Date() && challengeData.end_date > challengeData.start_date;
      case 3:
        return true;
      default:
        return false;
    }
  };

  return (
    <MobileLayout safeArea padding={false}>
      {/* Header */}
      <View style={[
        tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.p(4), border.borderB),
        { borderBottomColor: colors.border }
      ]}>
        <Text style={[tw(text.lg, text.semibold), { color: colors.foreground }]}>
          {existingChallenge ? 'Edit Challenge' : 'Create Challenge'}
        </Text>
        
        {onCancel && (
          <TouchableOpacity onPress={onCancel}>
            <Ionicons name="close" size={24} color={colors.foreground} />
          </TouchableOpacity>
        )}
      </View>

      {/* Progress Steps */}
      <View style={tw(spacing.p(4))}>
        <View style={tw(layout.flexRow, layout.justifyBetween)}>
          {steps.map((step, index) => (
            <View key={step.id} style={tw(layout.itemsCenter, layout.flex1)}>
              <View style={[
                tw(spacing.w(10), spacing.h(10), layout.itemsCenter, layout.justifyCenter, border.rounded, spacing.mb(2)),
                {
                  backgroundColor: index <= activeStep ? colors.primary : colors.muted,
                }
              ]}>
                <Ionicons 
                  name={step.icon as any} 
                  size={20} 
                  color={index <= activeStep ? colors.primaryForeground : colors.mutedForeground} 
                />
              </View>
              <Text style={[
                tw(text.xs, text.center),
                { color: index <= activeStep ? colors.foreground : colors.mutedForeground }
              ]}>
                {step.title}
              </Text>
              
              {index < steps.length - 1 && (
                <View style={[
                  tw(layout.absolute, spacing.h(1)),
                  {
                    backgroundColor: index < activeStep ? colors.primary : colors.border,
                    width: '100%',
                    top: 20,
                    left: '50%',
                  }
                ]} />
              )}
            </View>
          ))}
        </View>
      </View>

      {/* Step Content */}
      <View style={tw(layout.flex1, spacing.px(4))}>
        {renderStepContent()}
      </View>

      {/* Navigation Buttons */}
      <View style={[
        tw(layout.flexRow, spacing.gap(3), spacing.p(4), border.borderT),
        { borderTopColor: colors.border }
      ]}>
        {activeStep > 0 && (
          <Button
            variant="outline"
            onPress={handleBack}
            style={tw(layout.flex1)}
          >
            Back
          </Button>
        )}
        
        {activeStep < steps.length - 1 ? (
          <Button
            variant="default"
            onPress={handleNext}
            disabled={!isStepValid()}
            style={tw(layout.flex1)}
          >
            Next
          </Button>
        ) : (
          <Button
            variant="gradient"
            onPress={handleSave}
            loading={createChallenge.isPending}
            disabled={!validateChallenge()}
            style={tw(layout.flex1)}
          >
            {existingChallenge ? 'Update Challenge' : 'Create Challenge'}
          </Button>
        )}
      </View>

      {/* Date Pickers */}
      {showStartDatePicker && (
        <DateTimePicker
          value={challengeData.start_date}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowStartDatePicker(false);
            if (selectedDate) {
              setChallengeData({ ...challengeData, start_date: selectedDate });
            }
          }}
          minimumDate={new Date()}
        />
      )}

      {showEndDatePicker && (
        <DateTimePicker
          value={challengeData.end_date}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowEndDatePicker(false);
            if (selectedDate) {
              setChallengeData({ ...challengeData, end_date: selectedDate });
            }
          }}
          minimumDate={challengeData.start_date}
        />
      )}
    </MobileLayout>
  );
};