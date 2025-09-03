import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout, border } from '@/utils/styles';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { MobileLayout } from '@/components/layouts/MobileLayout';
import { Ionicons } from '@expo/vector-icons';
import { useCreateProgram, useUpdateProgram } from '@/hooks/use-program-management';
import { ProgramTemplate } from '@/services/program-service';

interface ProgramBuilderProps {
  existingProgram?: ProgramTemplate;
  onSave?: (program: ProgramTemplate) => void;
  onCancel?: () => void;
}

export const ProgramBuilder: React.FC<ProgramBuilderProps> = ({
  existingProgram,
  onSave,
  onCancel,
}) => {
  const { colors } = useTheme();
  const createProgram = useCreateProgram();
  const updateProgram = useUpdateProgram();

  const [activeStep, setActiveStep] = useState(0);
  const [programData, setProgramData] = useState({
    name: existingProgram?.name || '',
    description: existingProgram?.description || '',
    duration_weeks: existingProgram?.duration_weeks || 4,
    difficulty_level: existingProgram?.difficulty_level || 'intermediate' as 'beginner' | 'intermediate' | 'advanced',
    program_type: existingProgram?.program_type || 'hybrid' as 'strength' | 'cardio' | 'hybrid' | 'flexibility' | 'sport_specific',
    goals: existingProgram?.goals || [],
    equipment_needed: existingProgram?.equipment_needed || [],
    price: existingProgram?.price || 0,
    is_public: existingProgram?.is_public ?? true,
    is_featured: existingProgram?.is_featured ?? false,
  });

  const [newGoal, setNewGoal] = useState('');
  const [newEquipment, setNewEquipment] = useState('');

  const steps = [
    { id: 'basics', title: 'Basic Info', icon: 'information-circle' },
    { id: 'details', title: 'Program Details', icon: 'list' },
    { id: 'pricing', title: 'Pricing & Visibility', icon: 'pricetag' },
    { id: 'review', title: 'Review', icon: 'checkmark-circle' },
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

  const handleAddGoal = () => {
    if (newGoal.trim()) {
      setProgramData({
        ...programData,
        goals: [...programData.goals, newGoal.trim()],
      });
      setNewGoal('');
    }
  };

  const handleRemoveGoal = (index: number) => {
    setProgramData({
      ...programData,
      goals: programData.goals.filter((_, i) => i !== index),
    });
  };

  const handleAddEquipment = () => {
    if (newEquipment.trim()) {
      setProgramData({
        ...programData,
        equipment_needed: [...programData.equipment_needed, newEquipment.trim()],
      });
      setNewEquipment('');
    }
  };

  const handleRemoveEquipment = (index: number) => {
    setProgramData({
      ...programData,
      equipment_needed: programData.equipment_needed.filter((_, i) => i !== index),
    });
  };

  const validateProgram = () => {
    if (!programData.name.trim()) {
      Alert.alert('Validation Error', 'Program name is required');
      return false;
    }
    if (!programData.description.trim()) {
      Alert.alert('Validation Error', 'Program description is required');
      return false;
    }
    if (programData.duration_weeks < 1 || programData.duration_weeks > 52) {
      Alert.alert('Validation Error', 'Program duration must be between 1 and 52 weeks');
      return false;
    }
    if (programData.goals.length === 0) {
      Alert.alert('Validation Error', 'At least one program goal is required');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateProgram()) return;

    try {
      let result;
      if (existingProgram) {
        result = await updateProgram.mutateAsync({
          programId: existingProgram.id,
          updates: programData,
        });
      } else {
        result = await createProgram.mutateAsync(programData);
      }

      if (result.success) {
        Alert.alert('Success', 'Program saved successfully!');
        onSave?.(result.data);
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save program');
    }
  };

  const renderBasicsStep = () => (
    <View style={tw(spacing.gap(4))}>
      <View>
        <Text style={[tw(text.sm, text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
          Program Name *
        </Text>
        <Input
          value={programData.name}
          onChangeText={(text) => setProgramData({ ...programData, name: text })}
          placeholder="e.g., 12-Week Strength Building Program"
          style={tw(spacing.mb(0))}
        />
      </View>

      <View>
        <Text style={[tw(text.sm, text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
          Description *
        </Text>
        <TextInput
          value={programData.description}
          onChangeText={(text) => setProgramData({ ...programData, description: text })}
          placeholder="Describe what this program offers and who it's for..."
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
        <Text style={[tw(text.sm, text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
          Duration (Weeks) *
        </Text>
        <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(3))}>
          <TouchableOpacity
            onPress={() => setProgramData({ ...programData, duration_weeks: Math.max(1, programData.duration_weeks - 1) })}
            style={[
              tw(spacing.w(10), spacing.h(10), layout.itemsCenter, layout.justifyCenter, border.rounded),
              { backgroundColor: colors.secondary }
            ]}
          >
            <Ionicons name="remove" size={20} color={colors.foreground} />
          </TouchableOpacity>
          
          <View style={[
            tw(spacing.px(6), spacing.py(2), border.rounded),
            { backgroundColor: colors.muted }
          ]}>
            <Text style={[tw(text.lg, text.semibold), { color: colors.foreground }]}>
              {programData.duration_weeks}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => setProgramData({ ...programData, duration_weeks: Math.min(52, programData.duration_weeks + 1) })}
            style={[
              tw(spacing.w(10), spacing.h(10), layout.itemsCenter, layout.justifyCenter, border.rounded),
              { backgroundColor: colors.secondary }
            ]}
          >
            <Ionicons name="add" size={20} color={colors.foreground} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderDetailsStep = () => (
    <ScrollView style={tw(layout.flex1)} showsVerticalScrollIndicator={false}>
      <View style={tw(spacing.gap(4))}>
        <View>
          <Text style={[tw(text.sm, text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
            Difficulty Level *
          </Text>
          <View style={tw(layout.flexRow, spacing.gap(2))}>
            {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
              <TouchableOpacity
                key={level}
                onPress={() => setProgramData({ ...programData, difficulty_level: level })}
                style={[
                  tw(layout.flex1, spacing.py(3), border.rounded, layout.itemsCenter),
                  {
                    backgroundColor: programData.difficulty_level === level ? colors.primary : colors.secondary,
                  }
                ]}
              >
                <Text style={[
                  tw(text.sm, text.semibold),
                  { color: programData.difficulty_level === level ? colors.primaryForeground : colors.foreground }
                ]}>
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View>
          <Text style={[tw(text.sm, text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
            Program Type *
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={tw(layout.flexRow, spacing.gap(2))}>
              {(['strength', 'cardio', 'hybrid', 'flexibility', 'sport_specific'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => setProgramData({ ...programData, program_type: type })}
                  style={[
                    tw(spacing.px(4), spacing.py(2), border.rounded),
                    {
                      backgroundColor: programData.program_type === type ? colors.primary : colors.secondary,
                    }
                  ]}
                >
                  <Text style={[
                    tw(text.sm, text.semibold),
                    { color: programData.program_type === type ? colors.primaryForeground : colors.foreground }
                  ]}>
                    {type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        <View>
          <Text style={[tw(text.sm, text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
            Program Goals *
          </Text>
          <View style={tw(spacing.gap(2))}>
            <View style={tw(layout.flexRow, spacing.gap(2))}>
              <Input
                value={newGoal}
                onChangeText={setNewGoal}
                placeholder="Add a goal..."
                style={tw(layout.flex1, spacing.mb(0))}
              />
              <Button
                variant="outline"
                size="sm"
                onPress={handleAddGoal}
                disabled={!newGoal.trim()}
              >
                Add
              </Button>
            </View>
            
            {programData.goals.map((goal, index) => (
              <View
                key={index}
                style={[
                  tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.p(3), border.rounded),
                  { backgroundColor: colors.muted }
                ]}
              >
                <Text style={[tw(text.sm, layout.flex1), { color: colors.foreground }]}>
                  {goal}
                </Text>
                <TouchableOpacity onPress={() => handleRemoveGoal(index)}>
                  <Ionicons name="close-circle" size={20} color={colors.destructive} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        <View>
          <Text style={[tw(text.sm, text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
            Equipment Needed
          </Text>
          <View style={tw(spacing.gap(2))}>
            <View style={tw(layout.flexRow, spacing.gap(2))}>
              <Input
                value={newEquipment}
                onChangeText={setNewEquipment}
                placeholder="Add equipment..."
                style={tw(layout.flex1, spacing.mb(0))}
              />
              <Button
                variant="outline"
                size="sm"
                onPress={handleAddEquipment}
                disabled={!newEquipment.trim()}
              >
                Add
              </Button>
            </View>
            
            {programData.equipment_needed.map((equipment, index) => (
              <View
                key={index}
                style={[
                  tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.p(3), border.rounded),
                  { backgroundColor: colors.muted }
                ]}
              >
                <Text style={[tw(text.sm, layout.flex1), { color: colors.foreground }]}>
                  {equipment}
                </Text>
                <TouchableOpacity onPress={() => handleRemoveEquipment(index)}>
                  <Ionicons name="close-circle" size={20} color={colors.destructive} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderPricingStep = () => (
    <View style={tw(spacing.gap(4))}>
      <View>
        <Text style={[tw(text.sm, text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
          Monthly Price ($)
        </Text>
        <Input
          value={programData.price.toString()}
          onChangeText={(text) => setProgramData({ ...programData, price: parseInt(text) || 0 })}
          placeholder="0"
          keyboardType="numeric"
          style={tw(spacing.mb(0))}
        />
        <Text style={[tw(text.xs, spacing.mt(1)), { color: colors.mutedForeground }]}>
          Set to 0 for free programs
        </Text>
      </View>

      <View>
        <Text style={[tw(text.sm, text.semibold, spacing.mb(3)), { color: colors.foreground }]}>
          Visibility Settings
        </Text>
        
        <TouchableOpacity
          onPress={() => setProgramData({ ...programData, is_public: !programData.is_public })}
          style={[
            tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.p(4), border.rounded, spacing.mb(3)),
            { backgroundColor: colors.muted }
          ]}
        >
          <View style={tw(layout.flex1)}>
            <Text style={[tw(text.sm, text.semibold), { color: colors.foreground }]}>
              Public Program
            </Text>
            <Text style={[tw(text.xs, spacing.mt(1)), { color: colors.mutedForeground }]}>
              Allow anyone to view and enroll in this program
            </Text>
          </View>
          <View style={[
            tw(spacing.w(12), spacing.h(6), border.rounded, layout.justifyEnd),
            { 
              backgroundColor: programData.is_public ? colors.primary : colors.border,
              padding: 2
            }
          ]}>
            <View style={[
              tw(spacing.w(5), spacing.h(5), border.rounded),
              { 
                backgroundColor: colors.background,
                transform: [{ translateX: programData.is_public ? 20 : 0 }]
              }
            ]} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setProgramData({ ...programData, is_featured: !programData.is_featured })}
          style={[
            tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.p(4), border.rounded),
            { backgroundColor: colors.muted }
          ]}
        >
          <View style={tw(layout.flex1)}>
            <Text style={[tw(text.sm, text.semibold), { color: colors.foreground }]}>
              Featured Program
            </Text>
            <Text style={[tw(text.xs, spacing.mt(1)), { color: colors.mutedForeground }]}>
              Highlight this program in the marketplace
            </Text>
          </View>
          <View style={[
            tw(spacing.w(12), spacing.h(6), border.rounded, layout.justifyEnd),
            { 
              backgroundColor: programData.is_featured ? colors.primary : colors.border,
              padding: 2
            }
          ]}>
            <View style={[
              tw(spacing.w(5), spacing.h(5), border.rounded),
              { 
                backgroundColor: colors.background,
                transform: [{ translateX: programData.is_featured ? 20 : 0 }]
              }
            ]} />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderReviewStep = () => (
    <ScrollView style={tw(layout.flex1)} showsVerticalScrollIndicator={false}>
      <Card elevation="sm">
        <View style={tw(spacing.p(4))}>
          <Text style={[tw(text.lg, text.semibold, spacing.mb(4)), { color: colors.foreground }]}>
            Program Summary
          </Text>

          <View style={tw(spacing.gap(3))}>
            <View>
              <Text style={[tw(text.xs, text.uppercase), { color: colors.mutedForeground }]}>
                Name
              </Text>
              <Text style={[tw(text.base), { color: colors.foreground }]}>
                {programData.name || 'Not set'}
              </Text>
            </View>

            <View>
              <Text style={[tw(text.xs, text.uppercase), { color: colors.mutedForeground }]}>
                Description
              </Text>
              <Text style={[tw(text.sm), { color: colors.foreground }]}>
                {programData.description || 'Not set'}
              </Text>
            </View>

            <View style={tw(layout.flexRow, spacing.gap(4))}>
              <View style={tw(layout.flex1)}>
                <Text style={[tw(text.xs, text.uppercase), { color: colors.mutedForeground }]}>
                  Duration
                </Text>
                <Text style={[tw(text.base), { color: colors.foreground }]}>
                  {programData.duration_weeks} weeks
                </Text>
              </View>
              
              <View style={tw(layout.flex1)}>
                <Text style={[tw(text.xs, text.uppercase), { color: colors.mutedForeground }]}>
                  Difficulty
                </Text>
                <Text style={[tw(text.base), { color: colors.foreground }]}>
                  {programData.difficulty_level.charAt(0).toUpperCase() + programData.difficulty_level.slice(1)}
                </Text>
              </View>
            </View>

            <View style={tw(layout.flexRow, spacing.gap(4))}>
              <View style={tw(layout.flex1)}>
                <Text style={[tw(text.xs, text.uppercase), { color: colors.mutedForeground }]}>
                  Type
                </Text>
                <Text style={[tw(text.base), { color: colors.foreground }]}>
                  {programData.program_type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </Text>
              </View>
              
              <View style={tw(layout.flex1)}>
                <Text style={[tw(text.xs, text.uppercase), { color: colors.mutedForeground }]}>
                  Price
                </Text>
                <Text style={[tw(text.base), { color: colors.foreground }]}>
                  {programData.price === 0 ? 'Free' : `$${programData.price}/month`}
                </Text>
              </View>
            </View>

            <View>
              <Text style={[tw(text.xs, text.uppercase, spacing.mb(1)), { color: colors.mutedForeground }]}>
                Goals
              </Text>
              {programData.goals.length > 0 ? (
                programData.goals.map((goal, index) => (
                  <Text key={index} style={[tw(text.sm), { color: colors.foreground }]}>
                    • {goal}
                  </Text>
                ))
              ) : (
                <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                  No goals added
                </Text>
              )}
            </View>

            <View>
              <Text style={[tw(text.xs, text.uppercase, spacing.mb(1)), { color: colors.mutedForeground }]}>
                Equipment
              </Text>
              {programData.equipment_needed.length > 0 ? (
                programData.equipment_needed.map((equipment, index) => (
                  <Text key={index} style={[tw(text.sm), { color: colors.foreground }]}>
                    • {equipment}
                  </Text>
                ))
              ) : (
                <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                  No equipment required
                </Text>
              )}
            </View>

            <View style={tw(layout.flexRow, spacing.gap(4))}>
              <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2))}>
                <Ionicons 
                  name={programData.is_public ? "checkmark-circle" : "close-circle"} 
                  size={16} 
                  color={programData.is_public ? colors.primary : colors.mutedForeground} 
                />
                <Text style={[tw(text.sm), { color: colors.foreground }]}>
                  {programData.is_public ? 'Public' : 'Private'}
                </Text>
              </View>

              <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2))}>
                <Ionicons 
                  name={programData.is_featured ? "star" : "star-outline"} 
                  size={16} 
                  color={programData.is_featured ? colors.primary : colors.mutedForeground} 
                />
                <Text style={[tw(text.sm), { color: colors.foreground }]}>
                  {programData.is_featured ? 'Featured' : 'Not Featured'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Card>
    </ScrollView>
  );

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return renderBasicsStep();
      case 1:
        return renderDetailsStep();
      case 2:
        return renderPricingStep();
      case 3:
        return renderReviewStep();
      default:
        return null;
    }
  };

  const isStepValid = () => {
    switch (activeStep) {
      case 0:
        return programData.name.trim() && programData.description.trim() && programData.duration_weeks > 0;
      case 1:
        return programData.goals.length > 0;
      case 2:
        return true;
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
          {existingProgram ? 'Edit Program' : 'Create Program'}
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
            loading={createProgram.isPending || updateProgram.isPending}
            disabled={!validateProgram()}
            style={tw(layout.flex1)}
          >
            {existingProgram ? 'Update Program' : 'Create Program'}
          </Button>
        )}
      </View>
    </MobileLayout>
  );
};