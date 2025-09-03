import React, { useEffect, useState } from 'react';
import { View, ScrollView, TouchableOpacity, Alert, Text } from 'react-native';
import { useMachine } from '@xstate/react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { MobileLayout } from '@/components/layouts/MobileLayout';
import { tw, spacing, layout, text, border } from '@/utils/styles';
import { Colors } from '@/constants/Tokens';
import { useTheme } from '@/providers/theme-provider';
import { workoutExecutionMachine, workoutExecutionSelectors } from '@/lib/machines/workout-execution-machine';
import { ExercisePerformanceInput } from './ExercisePerformanceInput';
import { RestTimer } from './RestTimer';
import { WorkoutProgress } from './WorkoutProgress';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useToast } from '@/hooks/use-toast';

interface WorkoutExecutionProps {
  workoutId: string;
  workoutName: string;
  exercises: any[];
}

export function WorkoutExecution({ workoutId, workoutName, exercises }: WorkoutExecutionProps) {
  const { theme, colors: themeColors } = useTheme();
  const router = useRouter();
  const { toast } = useToast();
  const [state, send] = useMachine(workoutExecutionMachine, {
    input: {
      workoutId,
      workoutName,
      exercises,
    },
  });

  const currentExercise = workoutExecutionSelectors.currentExercise(state.context);
  const exerciseProgress = workoutExecutionSelectors.currentExerciseProgress(state.context);
  const overallProgress = workoutExecutionSelectors.overallProgress(state.context);
  const workoutDuration = workoutExecutionSelectors.workoutDuration(state.context);
  const canMoveNext = workoutExecutionSelectors.canMoveNext(state.context);
  const canMovePrevious = workoutExecutionSelectors.canMovePrevious(state.context);

  useEffect(() => {
    if (state.matches('completed')) {
      toast({
        title: 'Workout Completed! 🎉',
        description: `Great job! You finished ${workoutName} in ${workoutDuration} minutes.`,
      });
      router.push('/activities');
    }
  }, [state.value]);

  const handleCompleteSet = (performance: any) => {
    send({ type: 'COMPLETE_SET', performance });
  };

  const handleSkipSet = () => {
    Alert.alert(
      'Skip Set',
      'Are you sure you want to skip this set?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Skip', onPress: () => send({ type: 'SKIP_SET' }) },
      ]
    );
  };

  const handleEndWorkout = () => {
    Alert.alert(
      'End Workout',
      'Are you sure you want to end this workout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'End Workout', 
          onPress: () => send({ type: 'END_WORKOUT' }),
          style: 'destructive'
        },
      ]
    );
  };

  const handleCancelWorkout = () => {
    Alert.alert(
      'Cancel Workout',
      'Are you sure you want to cancel this workout? Your progress will not be saved.',
      [
        { text: 'Continue Workout', style: 'cancel' },
        { 
          text: 'Cancel Workout', 
          onPress: () => {
            send({ type: 'CANCEL_WORKOUT' });
            router.back();
          },
          style: 'destructive'
        },
      ]
    );
  };

  if (state.matches('idle')) {
    return (
      <MobileLayout safeArea padding>
        <View style={tw(layout.flex1, layout.itemsCenter, layout.justifyCenter)}>
          <Text style={tw(text['2xl'], text.center, spacing.mb(4))}>
            Ready to start {workoutName}?
          </Text>
          <Text style={tw(text.base, text.center, spacing.mb(8), text.muted)}>
            {exercises.length} exercises • Estimated {exercises.length * 15} minutes
          </Text>
          <Button
            onPress={() => send({ type: 'START_WORKOUT' })}
            size="lg"
            variant="gradient"
          >
            Start Workout
          </Button>
        </View>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout safeArea padding={false}>
      {/* Header */}
      <View 
        style={[
          tw(spacing.p(4), border.borderB, border.border),
          { backgroundColor: themeColors.card, borderBottomColor: themeColors.border }
        ]}
      >
        <View style={tw(layout.flexRow, layout.justifyBetween, layout.itemsCenter)}>
          <TouchableOpacity onPress={handleCancelWorkout}>
            <Ionicons name="close" size={24} color={themeColors.foreground} />
          </TouchableOpacity>
          
          <View style={tw(layout.flex1, spacing.mx(4))}>
            <Text style={tw(text.sm, text.center, text.muted)}>
              {workoutDuration} min
            </Text>
            <Text style={tw(text.base, text.center, text.semibold)}>
              {workoutName}
            </Text>
          </View>

          <TouchableOpacity onPress={handleEndWorkout}>
            <Text style={[tw(text.sm), { color: Colors.light.destructive }]}>End</Text>
          </TouchableOpacity>
        </View>

        {/* Progress Bar */}
        <WorkoutProgress 
          completed={overallProgress.completed}
          total={overallProgress.total}
          percentage={overallProgress.percentage}
        />
      </View>

      <ScrollView style={tw(layout.flex1)}>
        {/* Rest Timer */}
        {state.matches('exercising.resting') && (
          <RestTimer
            seconds={state.context.restTimerSeconds}
            onSkip={() => send({ type: 'SKIP_REST' })}
          />
        )}

        {/* Current Exercise */}
        {currentExercise && (
          <View style={tw(spacing.p(4))}>
            <Card elevation="sm">
              {/* Exercise Header */}
              <View style={[tw(spacing.p(4), border.borderB, border.border), { borderBottomColor: themeColors.border }]}>
                <View style={tw(layout.flexRow, layout.justifyBetween, layout.itemsCenter)}>
                  <View style={tw(layout.flex1)}>
                    <Text style={tw(text.lg, text.semibold)}>
                      {currentExercise.exercise?.name || 'Exercise'}
                    </Text>
                    <Text style={tw(text.sm, text.muted)}>
                      {currentExercise.exercise?.muscle_groups?.[0] || 'General'}
                    </Text>
                  </View>
                  
                  <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2))}>
                    <TouchableOpacity
                      onPress={() => send({ type: 'PREVIOUS_EXERCISE' })}
                      disabled={!canMovePrevious}
                      style={tw(spacing.p(2))}
                    >
                      <Ionicons 
                        name="chevron-back" 
                        size={24} 
                        color={canMovePrevious ? themeColors.foreground : themeColors.border}
                      />
                    </TouchableOpacity>
                    
                    <Text style={tw(text.sm, text.muted)}>
                      {state.context.currentExerciseIndex + 1} / {exercises.length}
                    </Text>
                    
                    <TouchableOpacity
                      onPress={() => send({ type: 'NEXT_EXERCISE' })}
                      disabled={!canMoveNext}
                      style={tw(spacing.p(2))}
                    >
                      <Ionicons 
                        name="chevron-forward" 
                        size={24} 
                        color={canMoveNext ? themeColors.foreground : themeColors.border}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Set Progress */}
                <View style={tw(spacing.mt(2))}>
                  <Text style={tw(text.sm, text.muted)}>
                    Set {state.context.currentSetIndex + 1} of {currentExercise.sets || 3}
                  </Text>
                  <View style={tw(layout.flexRow, spacing.gap(1), spacing.mt(1))}>
                    {Array.from({ length: currentExercise.sets || 3 }).map((_, index) => {
                      const isCompleted = state.context.completedSets[currentExercise.id]?.[index];
                      const isCurrent = index === state.context.currentSetIndex;
                      
                      return (
                        <View
                          key={index}
                          style={[
                            tw(layout.flex1, spacing.h(1), border.rounded),
                            {
                              backgroundColor: isCompleted 
                                ? themeColors.primary 
                                : isCurrent 
                                ? themeColors.secondary 
                                : themeColors.border
                            }
                          ]}
                        />
                      );
                    })}
                  </View>
                </View>
              </View>

              {/* Exercise Performance Input */}
              {state.matches('exercising.performing') && (
                <ExercisePerformanceInput
                  exercise={currentExercise}
                  setNumber={state.context.currentSetIndex + 1}
                  previousPerformance={
                    state.context.performanceData[currentExercise.id]?.[
                      state.context.currentSetIndex - 1
                    ]
                  }
                  onComplete={handleCompleteSet}
                  onSkip={handleSkipSet}
                />
              )}

              {/* Exercise Instructions */}
              {currentExercise.exercise?.instructions && (
                <View style={[tw(spacing.p(4), border.borderT, border.border), { borderTopColor: themeColors.border }]}>
                  <Text style={tw(text.sm, text.semibold, spacing.mb(2))}>
                    Instructions
                  </Text>
                  <Text style={tw(text.sm, text.muted)}>
                    {currentExercise.exercise.instructions}
                  </Text>
                </View>
              )}
            </Card>
          </View>
        )}

        {/* Completing State */}
        {state.matches('completing') && (
          <View style={tw(spacing.p(4))}>
            <Card elevation="md">
              <View style={tw(spacing.p(6), layout.itemsCenter, layout.justifyCenter)}>
                <Ionicons 
                  name="checkmark-circle" 
                  size={64} 
                  color={themeColors.primary} 
                />
                <Text style={tw(text['2xl'], text.center, spacing.mt(4))}>
                  Workout Complete! 🎉
                </Text>
                <Text style={tw(text.base, text.center, text.muted, spacing.mt(2))}>
                  You completed {overallProgress.completed} of {overallProgress.total} exercises
                  in {workoutDuration} minutes.
                </Text>
                
                <View style={tw(layout.flexRow, spacing.gap(4), spacing.mt(6))}>
                  <Button
                    onPress={() => send({ type: 'SAVE_AND_EXIT' })}
                    variant="gradient"
                    size="lg"
                    loading={state.context.isLoading}
                  >
                    Save Workout
                  </Button>
                </View>

                {state.context.error && (
                  <Text style={[tw(text.sm, spacing.mt(4)), { color: Colors.light.destructive }]}>
                    {state.context.error}
                  </Text>
                )}
              </View>
            </Card>
          </View>
        )}

        {/* Paused State */}
        {state.matches('paused') && (
          <View style={tw(spacing.p(4))}>
            <Card elevation="md">
              <View style={tw(spacing.p(6), layout.itemsCenter, layout.justifyCenter)}>
                <Ionicons 
                  name="pause-circle" 
                  size={64} 
                  color={themeColors.secondary} 
                />
                <Text style={tw(text['2xl'], text.center, spacing.mt(4))}>
                  Workout Paused
                </Text>
                
                <View style={tw(layout.flexRow, spacing.gap(4), spacing.mt(6))}>
                  <Button
                    onPress={() => send({ type: 'RESUME_WORKOUT' })}
                    variant="gradient"
                    size="lg"
                  >
                    Resume
                  </Button>
                  <Button
                    onPress={handleEndWorkout}
                    variant="outline"
                    size="lg"
                  >
                    End Workout
                  </Button>
                </View>
              </View>
            </Card>
          </View>
        )}
      </ScrollView>

      {/* Bottom Actions */}
      {state.matches('exercising.performing') && (
        <View 
          style={[
            tw(spacing.p(4), border.borderT, border.border),
            { backgroundColor: themeColors.card, borderTopColor: themeColors.border }
          ]}
        >
          <Button
            onPress={() => send({ type: 'PAUSE_WORKOUT' })}
            variant="outline"
            size="lg"
          >
            Pause Workout
          </Button>
        </View>
      )}
    </MobileLayout>
  );
}