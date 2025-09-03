import { useMachine } from '@xstate/react';
import { useCallback } from 'react';
import { workoutLoggingMachine, workoutSelectors, WorkoutExercise } from '@/lib/machines/workout-logging-machine';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'expo-router';

export function useWorkoutLogging() {
  const [state, send] = useMachine(workoutLoggingMachine);
  const { toast } = useToast();
  const router = useRouter();

  // Event handlers
  const selectWorkoutType = useCallback((workoutType: 'strength' | 'cardio' | 'mixed') => {
    send({ type: 'SELECT_TYPE', workoutType });
  }, [send]);

  const addExercise = useCallback((exercise: WorkoutExercise) => {
    send({ type: 'ADD_EXERCISE', exercise });
  }, [send]);

  const removeExercise = useCallback((exerciseId: string) => {
    send({ type: 'REMOVE_EXERCISE', exerciseId });
  }, [send]);

  const updateExercise = useCallback((exerciseId: string, data: Partial<WorkoutExercise>) => {
    send({ type: 'UPDATE_EXERCISE', exerciseId, data });
  }, [send]);

  const startWorkout = useCallback(() => {
    if (workoutSelectors.canStartWorkout(state.context)) {
      send({ type: 'START_WORKOUT' });
    } else {
      toast({
        title: 'Add exercises first',
        description: 'Please add at least one exercise to start your workout',
        variant: 'warning',
      });
    }
  }, [send, state.context, toast]);

  const pauseWorkout = useCallback(() => {
    send({ type: 'PAUSE_WORKOUT' });
  }, [send]);

  const resumeWorkout = useCallback(() => {
    send({ type: 'RESUME_WORKOUT' });
  }, [send]);

  const finishWorkout = useCallback(() => {
    send({ type: 'FINISH_WORKOUT' });
  }, [send]);

  const saveWorkout = useCallback(async () => {
    send({ type: 'SAVE' });
  }, [send]);

  const cancelWorkout = useCallback(() => {
    send({ type: 'CANCEL' });
  }, [send]);

  const nextExercise = useCallback(() => {
    if (!workoutSelectors.isLastExercise(state.context)) {
      send({ type: 'NEXT_EXERCISE' });
    }
  }, [send, state.context]);

  const prevExercise = useCallback(() => {
    if (!workoutSelectors.isFirstExercise(state.context)) {
      send({ type: 'PREV_EXERCISE' });
    }
  }, [send, state.context]);

  // Handle completion
  if (state.matches('completed')) {
    toast({
      title: 'Workout saved!',
      description: 'Great job completing your workout!',
      variant: 'success',
    });
    router.push('/activities');
  }

  return {
    // State
    state: state.value,
    context: state.context,
    isSelectingType: state.matches('selectingType'),
    isPlanning: state.matches('planning'),
    isActive: state.matches('active'),
    isPaused: state.matches('active.paused'),
    isExercising: state.matches('active.exercising'),
    isReviewing: state.matches('reviewing'),
    isSaving: state.matches('saving'),
    hasError: state.matches('error'),
    
    // Selectors
    canStartWorkout: workoutSelectors.canStartWorkout(state.context),
    isLastExercise: workoutSelectors.isLastExercise(state.context),
    isFirstExercise: workoutSelectors.isFirstExercise(state.context),
    currentExercise: workoutSelectors.currentExercise(state.context),
    workoutDuration: workoutSelectors.workoutDuration(state.context),
    
    // Actions
    selectWorkoutType,
    addExercise,
    removeExercise,
    updateExercise,
    startWorkout,
    pauseWorkout,
    resumeWorkout,
    finishWorkout,
    saveWorkout,
    cancelWorkout,
    nextExercise,
    prevExercise,
  };
}

// Example usage in a component:
/*
function WorkoutLogger() {
  const workout = useWorkoutLogging();

  if (workout.isSelectingType) {
    return <WorkoutTypeSelector onSelect={workout.selectWorkoutType} />;
  }

  if (workout.isPlanning) {
    return (
      <WorkoutPlanner
        exercises={workout.context.exercises}
        onAddExercise={workout.addExercise}
        onRemoveExercise={workout.removeExercise}
        onStart={workout.startWorkout}
      />
    );
  }

  if (workout.isActive) {
    return (
      <ActiveWorkout
        exercise={workout.currentExercise}
        isPaused={workout.isPaused}
        duration={workout.workoutDuration}
        onPause={workout.pauseWorkout}
        onResume={workout.resumeWorkout}
        onNext={workout.nextExercise}
        onPrev={workout.prevExercise}
        onFinish={workout.finishWorkout}
        onUpdate={(data) => workout.updateExercise(workout.currentExercise.id, data)}
      />
    );
  }

  // ... handle other states
}
*/