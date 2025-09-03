import { createMachine, assign, fromPromise } from 'xstate';
import { ActivityService } from '@/services/activity-service';

// Types for the workout logging flow
export interface WorkoutExercise {
  id: string;
  name: string;
  sets: Array<{
    reps: number;
    weight?: number;
    distance?: number;
    duration?: number;
  }>;
}

export interface WorkoutContext {
  workoutType: 'strength' | 'cardio' | 'mixed' | null;
  exercises: WorkoutExercise[];
  currentExerciseIndex: number;
  notes: string;
  moaiId?: string;
  startTime: Date | null;
  endTime: Date | null;
  error: string | null;
}

export type WorkoutEvent =
  | { type: 'SELECT_TYPE'; workoutType: 'strength' | 'cardio' | 'mixed' }
  | { type: 'ADD_EXERCISE'; exercise: WorkoutExercise }
  | { type: 'REMOVE_EXERCISE'; exerciseId: string }
  | { type: 'UPDATE_EXERCISE'; exerciseId: string; data: Partial<WorkoutExercise> }
  | { type: 'NEXT_EXERCISE' }
  | { type: 'PREV_EXERCISE' }
  | { type: 'START_WORKOUT' }
  | { type: 'PAUSE_WORKOUT' }
  | { type: 'RESUME_WORKOUT' }
  | { type: 'FINISH_WORKOUT' }
  | { type: 'SAVE' }
  | { type: 'CANCEL' }
  | { type: 'RETRY' };

// Define the save workout actor outside the machine
const saveWorkoutActor = fromPromise(async ({ input }: { input: WorkoutContext }) => {
  // Calculate workout duration
  const duration = input.startTime && input.endTime
    ? Math.floor((input.endTime.getTime() - input.startTime.getTime()) / 60000)
    : 0;
  
  // Create activity log entry
  const activityData = {
    activity_type: input.workoutType || 'mixed',
    name: `${input.workoutType} workout`,
    description: input.notes,
    duration_minutes: duration,
    moai_id: input.moaiId,
    // Store detailed exercise data in notes or metadata
    notes: JSON.stringify({
      exercises: input.exercises,
      userNotes: input.notes,
    }),
  };
  
  const result = await ActivityService.createActivity(activityData);
  
  if (!result.success) {
    throw new Error(result.error);
  }
  
  return result.data;
});

export const workoutLoggingMachine = createMachine({
  types: {} as {
    context: WorkoutContext;
    events: WorkoutEvent;
  },
  id: 'workoutLogging',
  initial: 'selectingType',
  context: {
    workoutType: null,
    exercises: [],
    currentExerciseIndex: 0,
    notes: '',
    moaiId: undefined,
    startTime: null,
    endTime: null,
    error: null,
  },
  states: {
    selectingType: {
      on: {
        SELECT_TYPE: {
          target: 'planning',
          actions: assign(({ event }) => {
            if (event.type !== 'SELECT_TYPE') return {};
            return {
              workoutType: event.workoutType,
            };
          }),
        },
        CANCEL: 'cancelled',
      },
    },
    
    planning: {
      on: {
        ADD_EXERCISE: {
          actions: assign(({ context, event }) => {
            if (event.type !== 'ADD_EXERCISE') return {};
            return {
              exercises: [...context.exercises, event.exercise],
            };
          }),
        },
        REMOVE_EXERCISE: {
          actions: assign(({ context, event }) => {
            if (event.type !== 'REMOVE_EXERCISE') return {};
            return {
              exercises: context.exercises.filter((ex: any) => ex.id !== event.exerciseId),
            };
          }),
        },
        START_WORKOUT: {
          target: 'active',
          guard: ({ context }: { context: WorkoutContext }) => context.exercises.length > 0,
          actions: assign(() => ({
            startTime: new Date(),
          })),
        },
        CANCEL: 'cancelled',
      },
    },
    
    active: {
      initial: 'exercising',
      states: {
        exercising: {
          on: {
            UPDATE_EXERCISE: {
              actions: assign(({ context, event }) => {
                if (event.type !== 'UPDATE_EXERCISE') return {};
                return {
                  exercises: context.exercises.map((ex: any) =>
                    ex.id === event.exerciseId
                      ? { ...ex, ...event.data }
                      : ex
                  ),
                };
              }),
            },
            NEXT_EXERCISE: {
              actions: assign(({ context }) => ({
                currentExerciseIndex: Math.min(
                  context.currentExerciseIndex + 1,
                  context.exercises.length - 1
                ),
              })),
            },
            PREV_EXERCISE: {
              actions: assign(({ context }) => ({
                currentExerciseIndex: Math.max(context.currentExerciseIndex - 1, 0),
              })),
            },
            PAUSE_WORKOUT: 'paused',
            FINISH_WORKOUT: {
              target: '#workoutLogging.reviewing',
              actions: assign(() => ({
                endTime: new Date(),
              })),
            },
          },
        },
        paused: {
          on: {
            RESUME_WORKOUT: 'exercising',
            FINISH_WORKOUT: {
              target: '#workoutLogging.reviewing',
              actions: assign(() => ({
                endTime: new Date(),
              })),
            },
            CANCEL: '#workoutLogging.cancelled',
          },
        },
      },
    },
    
    reviewing: {
      on: {
        UPDATE_EXERCISE: {
          actions: assign(({ context, event }) => {
            if (event.type !== 'UPDATE_EXERCISE') return {};
            return {
              exercises: context.exercises.map((ex: any) =>
                ex.id === event.exerciseId
                  ? { ...ex, ...event.data }
                  : ex
              ),
            };
          }),
        },
        SAVE: 'saving',
        CANCEL: 'cancelled',
      },
    },
    
    saving: {
      invoke: {
        id: 'saveWorkout',
        src: saveWorkoutActor,
        input: ({ context }: { context: WorkoutContext }) => context,
        onDone: {
          target: 'completed',
        },
        onError: {
          target: 'error',
          actions: assign(() => ({
            error: 'Failed to save workout',
          })),
        },
      },
    },
    
    completed: {
      type: 'final',
    },
    
    cancelled: {
      type: 'final',
    },
    
    error: {
      on: {
        RETRY: 'saving',
        CANCEL: 'cancelled',
      },
    },
  },
});

// Helper selectors
export const workoutSelectors = {
  canStartWorkout: (context: WorkoutContext) => context.exercises.length > 0,
  isLastExercise: (context: WorkoutContext) =>
    context.currentExerciseIndex === context.exercises.length - 1,
  isFirstExercise: (context: WorkoutContext) => context.currentExerciseIndex === 0,
  currentExercise: (context: WorkoutContext) =>
    context.exercises[context.currentExerciseIndex],
  workoutDuration: (context: WorkoutContext) => {
    if (!context.startTime) return 0;
    const end = context.endTime || new Date();
    return Math.floor((end.getTime() - context.startTime.getTime()) / 60000);
  },
};