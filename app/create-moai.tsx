import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { X, MapPin, Users, Target, Clock, Plus, Minus } from 'lucide-react-native';

import { MobileLayout } from '@/components/layouts/MobileLayout';
import { AppHeader } from '@/components/ui/AppHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useMoaiActions } from '@/hooks/use-moai';
import { useTheme } from '@/providers/theme-provider';
import { useAuth } from '@/hooks/useAuth';
import { tw, spacing, text, layout, border } from '@/utils/styles';
import { CreateMoaiData } from '@/services/types';

const MOAI_TYPES = [
  { id: 'fitness', label: 'Fitness', icon: '💪' },
  { id: 'running', label: 'Running', icon: '🏃' },
  { id: 'cycling', label: 'Cycling', icon: '🚴' },
  { id: 'yoga', label: 'Yoga', icon: '🧘' },
  { id: 'weightlifting', label: 'Weight Lifting', icon: '🏋️' },
  { id: 'hiking', label: 'Hiking', icon: '🥾' },
  { id: 'swimming', label: 'Swimming', icon: '🏊' },
  { id: 'sports', label: 'Sports', icon: '⚽' },
  { id: 'dance', label: 'Dance', icon: '💃' },
  { id: 'martial-arts', label: 'Martial Arts', icon: '🥋' },
  { id: 'other', label: 'Other', icon: '🎯' },
];

const COMMITMENT_TYPES = [
  { id: 'daily', label: 'Daily', description: 'Every day commitment' },
  { id: 'weekdays', label: 'Weekdays', description: 'Monday to Friday' },
  { id: 'weekly', label: 'Weekly', description: 'Flexible weekly schedule' },
  { id: 'custom', label: 'Custom', description: 'Set your own schedule' },
];

export default function CreateMoaiScreen() {
  const { user } = useAuth();
  const { theme, colors } = useTheme();
  const { createMoaiAsync, isCreatingMoai, createMoaiError } = useMoaiActions();

  const [formData, setFormData] = useState<Partial<CreateMoaiData>>({
    name: '',
    description: '',
    moai_type: 'public',
    type: '',
    max_members: 8,
    weekly_commitment_goal: 3,
    commitment_type: 'weekly',
    hobbies: [],
    goals: [],
    allow_member_invites: true,
  });

  const [newHobby, setNewHobby] = useState('');
  const [newGoal, setNewGoal] = useState('');

  const handleInputChange = (field: keyof CreateMoaiData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addHobby = () => {
    if (newHobby.trim() && formData.hobbies && !formData.hobbies.includes(newHobby.trim())) {
      setFormData(prev => ({
        ...prev,
        hobbies: [...(prev.hobbies || []), newHobby.trim()]
      }));
      setNewHobby('');
    }
  };

  const removeHobby = (hobby: string) => {
    setFormData(prev => ({
      ...prev,
      hobbies: prev.hobbies?.filter(h => h !== hobby) || []
    }));
  };

  const addGoal = () => {
    if (newGoal.trim() && formData.goals && !formData.goals.includes(newGoal.trim())) {
      setFormData(prev => ({
        ...prev,
        goals: [...(prev.goals || []), newGoal.trim()]
      }));
      setNewGoal('');
    }
  };

  const removeGoal = (goal: string) => {
    setFormData(prev => ({
      ...prev,
      goals: prev.goals?.filter(g => g !== goal) || []
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name?.trim()) {
      Alert.alert('Required Field', 'Please enter a name for your Moai');
      return;
    }

    if (!formData.type?.trim()) {
      Alert.alert('Required Field', 'Please select a Moai type');
      return;
    }

    try {
      const moaiData: CreateMoaiData = {
        name: formData.name.trim(),
        description: formData.description?.trim(),
        moai_type: formData.moai_type!,
        type: formData.type!,
        max_members: formData.max_members || 8,
        weekly_commitment_goal: formData.weekly_commitment_goal!,
        commitment_type: formData.commitment_type,
        hobbies: formData.hobbies || [],
        goals: formData.goals || [],
        allow_member_invites: formData.allow_member_invites,
      };

      await createMoaiAsync(moaiData);
      
      Alert.alert(
        'Success!', 
        'Your Moai has been created successfully!',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create Moai');
    }
  };

  return (
    <MobileLayout scrollable={false}>
      <AppHeader 
        title="Create Moai" 
        showBackButton={true}
        rightAction={{
          icon: () => <X size={20} color={colors.foreground} />,
          onPress: () => router.back(),
          label: 'Close'
        }}
      />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={tw(layout.flex1)}
      >
        <ScrollView 
          style={tw(layout.flex1)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={tw(spacing.pb(8))}
          bounces={true}
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          {/* Basic Information */}
          <Card style={tw(spacing.mb(6))}>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent style={tw(spacing.gap(4))}>
              <View>
                <Text style={[tw(text.sm, text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
                  Moai Name *
                </Text>
                <Input
                  placeholder="Enter your Moai name"
                  value={formData.name || ''}
                  onChangeText={(value) => handleInputChange('name', value)}
                  maxLength={50}
                />
              </View>

              <View>
                <Text style={[tw(text.sm, text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
                  Description
                </Text>
                <TextInput
                  placeholder="Tell people what your Moai is about..."
                  value={formData.description || ''}
                  onChangeText={(value) => handleInputChange('description', value)}
                  multiline
                  numberOfLines={4}
                  maxLength={500}
                  style={[
                    tw(border.rounded, spacing.p(3), text.sm),
                    {
                      borderWidth: 1,
                      borderColor: colors.border,
                      backgroundColor: colors.background,
                      color: colors.foreground,
                      textAlignVertical: 'top',
                      minHeight: 100,
                    }
                  ]}
                />
              </View>
            </CardContent>
          </Card>

          {/* Moai Type */}
          <Card style={tw(spacing.mb(6))}>
            <CardHeader>
              <CardTitle>Activity Type *</CardTitle>
            </CardHeader>
            <CardContent>
              <View style={tw(layout.flexRow, layout.flexWrap, spacing.gap(2))}>
                {MOAI_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    onPress={() => handleInputChange('type', type.id)}
                    style={[
                      tw(spacing.p(3), border.rounded),
                      {
                        backgroundColor: formData.type === type.id ? colors.primary : colors.muted,
                        borderWidth: 1,
                        borderColor: formData.type === type.id ? colors.primary : colors.border,
                      }
                    ]}
                  >
                    <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2))}>
                      <Text style={{ fontSize: 16 }}>{type.icon}</Text>
                      <Text 
                        style={[
                          tw(text.sm, text.semibold),
                          { 
                            color: formData.type === type.id ? colors.primaryForeground : colors.foreground 
                          }
                        ]}
                      >
                        {type.label}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </CardContent>
          </Card>

          {/* Group Settings */}
          <Card style={tw(spacing.mb(6))}>
            <CardHeader>
              <CardTitle>Group Settings</CardTitle>
            </CardHeader>
            <CardContent style={tw(spacing.gap(4))}>
              <View>
                <Text style={[tw(text.sm, text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
                  Maximum Members
                </Text>
                <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(4))}>
                  <TouchableOpacity
                    onPress={() => handleInputChange('max_members', Math.max(2, (formData.max_members || 8) - 1))}
                    style={[
                      tw(spacing.p(2), border.rounded),
                      { backgroundColor: colors.muted }
                    ]}
                  >
                    <Minus size={16} color={colors.foreground} />
                  </TouchableOpacity>
                  
                  <Text style={[tw(text.lg, text.semibold), { color: colors.foreground, minWidth: 40, textAlign: 'center' }]}>
                    {formData.max_members || 8}
                  </Text>
                  
                  <TouchableOpacity
                    onPress={() => handleInputChange('max_members', Math.min(20, (formData.max_members || 8) + 1))}
                    style={[
                      tw(spacing.p(2), border.rounded),
                      { backgroundColor: colors.muted }
                    ]}
                  >
                    <Plus size={16} color={colors.foreground} />
                  </TouchableOpacity>
                </View>
              </View>

              <View>
                <Text style={[tw(text.sm, text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
                  Weekly Commitment Goal
                </Text>
                <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(4))}>
                  <TouchableOpacity
                    onPress={() => handleInputChange('weekly_commitment_goal', Math.max(1, (formData.weekly_commitment_goal || 3) - 1))}
                    style={[
                      tw(spacing.p(2), border.rounded),
                      { backgroundColor: colors.muted }
                    ]}
                  >
                    <Minus size={16} color={colors.foreground} />
                  </TouchableOpacity>
                  
                  <Text style={[tw(text.lg, text.semibold), { color: colors.foreground, minWidth: 40, textAlign: 'center' }]}>
                    {formData.weekly_commitment_goal || 3}
                  </Text>
                  
                  <TouchableOpacity
                    onPress={() => handleInputChange('weekly_commitment_goal', Math.min(7, (formData.weekly_commitment_goal || 3) + 1))}
                    style={[
                      tw(spacing.p(2), border.rounded),
                      { backgroundColor: colors.muted }
                    ]}
                  >
                    <Plus size={16} color={colors.foreground} />
                  </TouchableOpacity>
                  
                  <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                    times per week
                  </Text>
                </View>
              </View>

              <View>
                <Text style={[tw(text.sm, text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
                  Commitment Type
                </Text>
                <View style={tw(spacing.gap(2))}>
                  {COMMITMENT_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type.id}
                      onPress={() => handleInputChange('commitment_type', type.id)}
                      style={[
                        tw(spacing.p(3), border.rounded, layout.flexRow, layout.justifyBetween, layout.itemsCenter),
                        {
                          backgroundColor: formData.commitment_type === type.id ? colors.primary + '20' : colors.background,
                          borderWidth: 1,
                          borderColor: formData.commitment_type === type.id ? colors.primary : colors.border,
                        }
                      ]}
                    >
                      <View>
                        <Text 
                          style={[
                            tw(text.sm, text.semibold),
                            { color: formData.commitment_type === type.id ? colors.primary : colors.foreground }
                          ]}
                        >
                          {type.label}
                        </Text>
                        <Text style={[tw(text.xs), { color: colors.mutedForeground }]}>
                          {type.description}
                        </Text>
                      </View>
                      <View
                        style={[
                          tw(border.rounded),
                          {
                            width: 20,
                            height: 20,
                            backgroundColor: formData.commitment_type === type.id ? colors.primary : 'transparent',
                            borderWidth: 2,
                            borderColor: formData.commitment_type === type.id ? colors.primary : colors.border,
                          }
                        ]}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </CardContent>
          </Card>

          {/* Interests & Goals */}
          <Card style={tw(spacing.mb(6))}>
            <CardHeader>
              <CardTitle>Interests & Goals</CardTitle>
            </CardHeader>
            <CardContent style={tw(spacing.gap(4))}>
              <View>
                <Text style={[tw(text.sm, text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
                  Related Interests
                </Text>
                <View style={tw(layout.flexRow, spacing.gap(2), spacing.mb(2))}>
                  <Input
                    placeholder="Add an interest..."
                    value={newHobby}
                    onChangeText={setNewHobby}
                    style={tw(layout.flex1)}
                    onSubmitEditing={addHobby}
                  />
                  <Button onPress={addHobby} size="sm">
                    <Plus size={16} color={colors.primaryForeground} />
                  </Button>
                </View>
                {formData.hobbies && formData.hobbies.length > 0 && (
                  <View style={tw(layout.flexRow, layout.flexWrap, spacing.gap(2))}>
                    {formData.hobbies.map((hobby, index) => (
                      <Badge key={index} variant="secondary">
                        <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(1))}>
                          <Text style={tw(text.xs)}>{hobby}</Text>
                          <TouchableOpacity onPress={() => removeHobby(hobby)}>
                            <X size={12} color={colors.mutedForeground} />
                          </TouchableOpacity>
                        </View>
                      </Badge>
                    ))}
                  </View>
                )}
              </View>

              <View>
                <Text style={[tw(text.sm, text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
                  Group Goals
                </Text>
                <View style={tw(layout.flexRow, spacing.gap(2), spacing.mb(2))}>
                  <Input
                    placeholder="Add a goal..."
                    value={newGoal}
                    onChangeText={setNewGoal}
                    style={tw(layout.flex1)}
                    onSubmitEditing={addGoal}
                  />
                  <Button onPress={addGoal} size="sm">
                    <Plus size={16} color={colors.primaryForeground} />
                  </Button>
                </View>
                {formData.goals && formData.goals.length > 0 && (
                  <View style={tw(layout.flexRow, layout.flexWrap, spacing.gap(2))}>
                    {formData.goals.map((goal, index) => (
                      <Badge key={index} variant="outline">
                        <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(1))}>
                          <Target size={10} color={colors.primary} />
                          <Text style={tw(text.xs)}>{goal}</Text>
                          <TouchableOpacity onPress={() => removeGoal(goal)}>
                            <X size={12} color={colors.mutedForeground} />
                          </TouchableOpacity>
                        </View>
                      </Badge>
                    ))}
                  </View>
                )}
              </View>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card style={tw(spacing.mb(6))}>
            <CardHeader>
              <CardTitle>Privacy & Permissions</CardTitle>
            </CardHeader>
            <CardContent style={tw(spacing.gap(4))}>
              <TouchableOpacity
                onPress={() => handleInputChange('allow_member_invites', !formData.allow_member_invites)}
                style={tw(layout.flexRow, layout.justifyBetween, layout.itemsCenter)}
              >
                <View style={tw(layout.flex1, spacing.mr(4))}>
                  <Text style={[tw(text.sm, text.semibold), { color: colors.foreground }]}>
                    Allow Member Invitations
                  </Text>
                  <Text style={[tw(text.xs), { color: colors.mutedForeground }]}>
                    Let members invite their friends to join the Moai
                  </Text>
                </View>
                <View
                  style={[
                    tw(border.rounded),
                    {
                      width: 20,
                      height: 20,
                      backgroundColor: formData.allow_member_invites ? colors.primary : 'transparent',
                      borderWidth: 2,
                      borderColor: formData.allow_member_invites ? colors.primary : colors.border,
                    }
                  ]}
                />
              </TouchableOpacity>
            </CardContent>
          </Card>

          {/* Create Button */}
          <Button
            onPress={handleSubmit}
            disabled={isCreatingMoai || !formData.name?.trim() || !formData.type?.trim()}
            loading={isCreatingMoai}
            size="lg"
          >
            Create Moai
          </Button>

          {createMoaiError && (
            <Card style={[tw(spacing.mt(4)), { backgroundColor: colors.destructive + '20' }]}>
              <CardContent style={tw(spacing.p(4))}>
                <Text style={[tw(text.sm), { color: colors.destructive }]}>
                  Error: {createMoaiError.message}
                </Text>
              </CardContent>
            </Card>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </MobileLayout>
  );
}