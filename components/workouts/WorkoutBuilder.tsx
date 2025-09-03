import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal } from 'react-native';
import { useMachine } from '@xstate/react';
import { Plus, Edit, Trash2, Copy, Save, Play, ArrowLeft, Settings } from 'lucide-react-native';

import { workoutBuilderMachine, workoutBuilderSelectors } from '@/lib/machines/workout-builder-machine';
import { Exercise } from '@/services/exercise-service';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout, border } from '@/utils/styles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { ExerciseLibrary } from '@/components/exercises/ExerciseLibrary';

interface WorkoutBuilderProps {
  onSave?: (workout: any) => void;
  onCancel?: () => void;
  initialWorkout?: any;
}

export function WorkoutBuilder({ onSave, onCancel, initialWorkout }: WorkoutBuilderProps) {
  const { colors } = useTheme();
  const [showExerciseLibrary, setShowExerciseLibrary] = useState(false);
  const [showWorkoutSettings, setShowWorkoutSettings] = useState(false);

  const [current, send] = useMachine(workoutBuilderMachine, {
    input: initialWorkout ? {
      workoutName: initialWorkout.name || '',
      workoutDescription: initialWorkout.description || '',
      workoutType: initialWorkout.workout_type || 'mixed',
      difficultyLevel: initialWorkout.difficulty_level || 'beginner',
      exercises: initialWorkout.exercises || [],
      tags: initialWorkout.tags || [],
      estimatedDuration: initialWorkout.estimated_duration_minutes || 0,
      totalExercises: initialWorkout.exercises?.length || 0,
      currentExerciseIndex: -1,
      selectedExercise: null,
      sets: 3,
      reps: 10,
      weight: 0,
      duration_seconds: 0,
      distance: 0,
      rest_seconds: 60,
      notes: '',
      error: null,
      lastSavedAt: null,
    } : undefined,
  });

  const canAddExercise = workoutBuilderSelectors.canAddExercise(current.context);
  const hasExercises = workoutBuilderSelectors.hasExercises(current.context);
  const canSave = workoutBuilderSelectors.canSave(current.context);
  const totalDuration = workoutBuilderSelectors.totalDuration(current.context);
  const exerciseCount = workoutBuilderSelectors.exerciseCount(current.context);

  const handleSelectExercise = (exercise: Exercise) => {
    send({ type: 'SELECT_EXERCISE', exercise });
    setShowExerciseLibrary(false);
  };

  const handleAddExercise = () => {
    if (canAddExercise) {
      send({ type: 'ADD_EXERCISE' });
    }
  };

  const handleRemoveExercise = (index: number) => {
    send({ type: 'REMOVE_EXERCISE', index });
  };

  const handleDuplicateExercise = (index: number) => {
    send({ type: 'DUPLICATE_EXERCISE', index });
  };

  const handleEditExercise = (index: number) => {
    send({ type: 'EDIT_EXERCISE', index });
  };

  const handleSaveWorkout = () => {
    if (canSave) {
      send({ type: 'SAVE_TEMPLATE' });
      if (onSave) {
        onSave(current.context);
      }
    }
  };

  const handleSaveAndStart = () => {
    if (canSave) {
      send({ type: 'SAVE_AND_START' });
      if (onSave) {
        onSave(current.context);
      }
    }
  };

  const handleCancel = () => {
    send({ type: 'CANCEL' });
    if (onCancel) {
      onCancel();
    }
  };

  // Render different states
  if (current.matches('setup') || current.matches('editing')) {
    return (
      <View style={tw(layout.flex1)}>
        {/* Header */}
        <View style={[
          tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.p(4)),
          { borderBottomWidth: 1, borderBottomColor: colors.border }
        ]}>
          <TouchableOpacity onPress={handleCancel}>
            <ArrowLeft size={24} color={colors.foreground} />
          </TouchableOpacity>
          
          <Text style={[tw(text.lg, text.semibold), { color: colors.foreground }]}>
            {current.matches('setup') ? 'Create Workout' : 'Edit Workout'}
          </Text>
          
          <TouchableOpacity onPress={() => setShowWorkoutSettings(true)}>
            <Settings size={24} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        <ScrollView style={tw(layout.flex1)} showsVerticalScrollIndicator={false}>
          <View style={tw(spacing.p(4))}>
            {/* Workout Info */}
            <Card style={tw(spacing.mb(6))}>
              <CardHeader>
                <CardTitle>Workout Details</CardTitle>
              </CardHeader>
              <CardContent>
                <View style={tw(spacing.gap(4))}>
                  <Input
                    placeholder="Workout name"
                    value={current.context.workoutName}
                    onChangeText={(text) => send({ 
                      type: 'SET_WORKOUT_DETAILS', 
                      name: text,
                      description: current.context.workoutDescription,
                      workoutType: current.context.workoutType
                    })}
                  />
                  
                  <Input
                    placeholder="Description (optional)"
                    value={current.context.workoutDescription}
                    onChangeText={(text) => send({ 
                      type: 'SET_WORKOUT_DETAILS', 
                      name: current.context.workoutName,
                      description: text,
                      workoutType: current.context.workoutType
                    })}
                    multiline
                    numberOfLines={3}
                  />
                </View>
              </CardContent>
            </Card>

            {/* Workout Stats */}
            <Card style={tw(spacing.mb(6))}>
              <CardContent style={tw(spacing.p(4))}>
                <View style={tw(layout.flexRow, layout.justifyAround)}>
                  <View style={tw(layout.itemsCenter)}>
                    <Text style={[tw(text['2xl'], text.bold), { color: colors.primary }]}>
                      {exerciseCount}
                    </Text>
                    <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                      Exercises
                    </Text>
                  </View>
                  
                  <View style={tw(layout.itemsCenter)}>
                    <Text style={[tw(text['2xl'], text.bold), { color: colors.primary }]}>
                      {totalDuration}
                    </Text>
                    <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                      Minutes
                    </Text>
                  </View>
                  
                  <View style={tw(layout.itemsCenter)}>
                    <Badge variant="outline">
                      <Text style={[tw(text.sm), { color: colors.foreground }]}>
                        {current.context.difficultyLevel}
                      </Text>
                    </Badge>
                  </View>
                </View>
              </CardContent>
            </Card>

            {/* Exercises List */}
            <Card style={tw(spacing.mb(6))}>
              <CardHeader>
                <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween)}>
                  <CardTitle>Exercises</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onPress={() => setShowExerciseLibrary(true)}
                  >
                    <Plus size={16} color={colors.foreground} />
                    <Text style={[tw(spacing.ml(1)), { color: colors.foreground }]}>
                      Add Exercise
                    </Text>
                  </Button>
                </View>
              </CardHeader>
              
              <CardContent>
                {hasExercises ? (
                  <View style={tw(spacing.gap(3))}>
                    {current.context.exercises.map((workoutExercise, index) => (
                      <ExerciseItem
                        key={workoutExercise.id}
                        workoutExercise={workoutExercise}
                        index={index}
                        onEdit={() => handleEditExercise(index)}
                        onRemove={() => handleRemoveExercise(index)}
                        onDuplicate={() => handleDuplicateExercise(index)}
                      />
                    ))}
                  </View>
                ) : (
                  <View style={tw(layout.itemsCenter, spacing.py(8))}>
                    <Text style={[tw(text.base), { color: colors.mutedForeground }]}>
                      No exercises added yet
                    </Text>
                    <Text style={[tw(text.sm, spacing.mt(2)), { color: colors.mutedForeground }]}>
                      Tap "Add Exercise" to get started
                    </Text>
                  </View>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <View style={tw(spacing.gap(3), spacing.mb(8))}>
              <Button
                variant="outline"
                onPress={() => send({ type: 'PREVIEW_WORKOUT' })}
                disabled={!hasExercises}
                style={tw(layout.w('full'))}
              >
                <Text style={[tw(text.base), { color: colors.foreground }]}>
                  Preview Workout
                </Text>
              </Button>
              
              <Button
                variant="secondary"
                onPress={handleSaveWorkout}
                disabled={!canSave}
                style={tw(layout.w('full'))}
              >
                <Save size={16} color={colors.foreground} />
                <Text style={[tw(text.base, spacing.ml(2)), { color: colors.foreground }]}>
                  Save Template
                </Text>
              </Button>
              
              <Button
                variant="gradient"
                onPress={handleSaveAndStart}
                disabled={!canSave}
                style={tw(layout.w('full'))}
              >
                <Play size={16} color="#FFFFFF" />
                <Text style={[tw(text.base, spacing.ml(2), text.semibold), { color: '#FFFFFF' }]}>
                  Save & Start Workout
                </Text>
              </Button>
            </View>
          </View>
        </ScrollView>

        {/* Exercise Library Modal */}
        <Modal
          visible={showExerciseLibrary}
          animationType="slide"
          presentationStyle="fullScreen"
        >
          <View style={[tw(layout.flex1), { backgroundColor: colors.background }]}>
            <View style={[
              tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.p(4)),
              { borderBottomWidth: 1, borderBottomColor: colors.border }
            ]}>
              <Text style={[tw(text.lg, text.semibold), { color: colors.foreground }]}>
                Choose Exercise
              </Text>
              
              <TouchableOpacity onPress={() => setShowExerciseLibrary(false)}>
                <Text style={[tw(text.base), { color: colors.primary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
            
            <View style={tw(layout.flex1, spacing.p(4))}>
              <ExerciseLibrary
                onSelectExercise={handleSelectExercise}
                showSelectButton={true}
                selectedExerciseIds={[]}
              />
            </View>
          </View>
        </Modal>

        {/* Workout Settings Modal */}
        <WorkoutSettingsModal
          isVisible={showWorkoutSettings}
          onClose={() => setShowWorkoutSettings(false)}
          workoutType={current.context.workoutType}
          difficultyLevel={current.context.difficultyLevel}
          tags={current.context.tags}
          onUpdateType={(workoutType: string) => send({ 
            type: 'SET_WORKOUT_DETAILS',
            name: current.context.workoutName,
            description: current.context.workoutDescription,
            workoutType: workoutType as 'strength' | 'cardio' | 'mixed' | 'flexibility'
          })}
          onUpdateDifficulty={(level: string) => send({ type: 'SET_DIFFICULTY', level: level as 'beginner' | 'intermediate' | 'advanced' })}
          onAddTag={(tag: string) => send({ type: 'ADD_TAG', tag })}
          onRemoveTag={(tag: string) => send({ type: 'REMOVE_TAG', tag })}
        />
      </View>
    );
  }

  // Handle configure exercise state
  if (current.matches('configuringExercise')) {
    return (
      <ExerciseConfigurationScreen
        exercise={current.context.selectedExercise}
        configuration={{
          sets: current.context.sets,
          reps: current.context.reps,
          weight: current.context.weight,
          duration_seconds: current.context.duration_seconds,
          distance: current.context.distance,
          rest_seconds: current.context.rest_seconds,
          notes: current.context.notes,
        }}
        onConfigurationChange={(config: any) => send({ type: 'CONFIGURE_EXERCISE', config })}
        onAdd={handleAddExercise}
        onCancel={() => send({ type: 'CANCEL' })}
        canAdd={canAddExercise}
      />
    );
  }

  // Handle saving states
  if (current.matches('saving') || current.matches('savingAndStarting')) {
    return (
      <View style={tw(layout.flex1, layout.itemsCenter, layout.justifyCenter)}>
        <Text style={[tw(text.lg), { color: colors.foreground }]}>
          Saving workout...
        </Text>
      </View>
    );
  }

  // Handle saved state
  if (current.matches('saved')) {
    return (
      <View style={tw(layout.flex1, layout.itemsCenter, layout.justifyCenter, spacing.p(4))}>
        <Text style={[tw(text['2xl'], text.bold, spacing.mb(4)), { color: colors.primary }]}>
          ✅ Workout Saved!
        </Text>
        <Text style={[tw(text.base, text.center), { color: colors.foreground }]}>
          Your workout template has been saved successfully.
        </Text>
      </View>
    );
  }

  return null;
}

// Helper components would be defined here
function ExerciseItem({ workoutExercise, index, onEdit, onRemove, onDuplicate }: any) {
  const { colors } = useTheme();
  
  return (
    <Card>
      <CardContent style={tw(spacing.p(3))}>
        <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween)}>
          <View style={tw(layout.flex1)}>
            <Text style={[tw(text.base, text.semibold), { color: colors.foreground }]}>
              {workoutExercise.exercise?.name || 'Unknown Exercise'}
            </Text>
            <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
              {workoutExercise.sets && `${workoutExercise.sets} sets`}
              {workoutExercise.reps && ` × ${workoutExercise.reps} reps`}
              {workoutExercise.weight && ` @ ${workoutExercise.weight}lbs`}
              {workoutExercise.duration_seconds && `${Math.round(workoutExercise.duration_seconds / 60)} min`}
            </Text>
          </View>
          
          <View style={tw(layout.flexRow, spacing.gap(1))}>
            <TouchableOpacity onPress={onEdit} style={tw(spacing.p(1))}>
              <Edit size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
            <TouchableOpacity onPress={onDuplicate} style={tw(spacing.p(1))}>
              <Copy size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
            <TouchableOpacity onPress={onRemove} style={tw(spacing.p(1))}>
              <Trash2 size={16} color={colors.destructive} />
            </TouchableOpacity>
          </View>
        </View>
      </CardContent>
    </Card>
  );
}

function ExerciseConfigurationScreen({ exercise, configuration, onConfigurationChange, onAdd, onCancel, canAdd }: any) {
  const { colors } = useTheme();
  
  if (!exercise) return null;
  
  return (
    <View style={tw(layout.flex1)}>
      <View style={[
        tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.p(4)),
        { borderBottomWidth: 1, borderBottomColor: colors.border }
      ]}>
        <TouchableOpacity onPress={onCancel}>
          <ArrowLeft size={24} color={colors.foreground} />
        </TouchableOpacity>
        
        <Text style={[tw(text.lg, text.semibold), { color: colors.foreground }]}>
          Configure Exercise
        </Text>
        
        <TouchableOpacity onPress={onAdd} disabled={!canAdd}>
          <Text style={[
            tw(text.base, text.semibold),
            { color: canAdd ? colors.primary : colors.mutedForeground }
          ]}>
            Add
          </Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={tw(layout.flex1, spacing.p(4))}>
        <Card style={tw(spacing.mb(6))}>
          <CardContent style={tw(spacing.p(4))}>
            <Text style={[tw(text.xl, text.semibold), { color: colors.foreground }]}>
              {exercise.name}
            </Text>
            <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
              {exercise.exercise_type} • {exercise.difficulty_level}
            </Text>
          </CardContent>
        </Card>
        
        {/* Configuration inputs based on exercise type would go here */}
        <View style={tw(spacing.gap(4))}>
          {exercise.exercise_type === 'strength' && (
            <>
              <Input
                label="Sets"
                value={configuration.sets?.toString() || ''}
                onChangeText={(text) => onConfigurationChange({ sets: parseInt(text) || 0 })}
                keyboardType="numeric"
              />
              <Input
                label="Reps"
                value={configuration.reps?.toString() || ''}
                onChangeText={(text) => onConfigurationChange({ reps: parseInt(text) || 0 })}
                keyboardType="numeric"
              />
              <Input
                label="Weight (lbs)"
                value={configuration.weight?.toString() || ''}
                onChangeText={(text) => onConfigurationChange({ weight: parseInt(text) || 0 })}
                keyboardType="numeric"
              />
            </>
          )}
          
          {exercise.exercise_type === 'cardio' && (
            <>
              <Input
                label="Duration (seconds)"
                value={configuration.duration_seconds?.toString() || ''}
                onChangeText={(text) => onConfigurationChange({ duration_seconds: parseInt(text) || 0 })}
                keyboardType="numeric"
              />
              <Input
                label="Distance (optional)"
                value={configuration.distance?.toString() || ''}
                onChangeText={(text) => onConfigurationChange({ distance: parseInt(text) || 0 })}
                keyboardType="numeric"
              />
            </>
          )}
          
          <Input
            label="Rest between sets (seconds)"
            value={configuration.rest_seconds?.toString() || ''}
            onChangeText={(text) => onConfigurationChange({ rest_seconds: parseInt(text) || 60 })}
            keyboardType="numeric"
          />
          
          <Input
            label="Notes (optional)"
            value={configuration.notes || ''}
            onChangeText={(text) => onConfigurationChange({ notes: text })}
            multiline
            numberOfLines={3}
          />
        </View>
      </ScrollView>
    </View>
  );
}

function WorkoutSettingsModal({ isVisible, onClose, workoutType, difficultyLevel, tags, onUpdateType, onUpdateDifficulty, onAddTag, onRemoveTag }: any) {
  const { colors } = useTheme();
  
  return (
    <Modal visible={isVisible} animationType="slide" presentationStyle="pageSheet">
      <View style={[tw(layout.flex1), { backgroundColor: colors.background }]}>
        <View style={[
          tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.p(4)),
          { borderBottomWidth: 1, borderBottomColor: colors.border }
        ]}>
          <Text style={[tw(text.lg, text.semibold), { color: colors.foreground }]}>
            Workout Settings
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={[tw(text.base), { color: colors.primary }]}>Done</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={tw(spacing.p(4))}>
          {/* Settings content would go here */}
        </ScrollView>
      </View>
    </Modal>
  );
}