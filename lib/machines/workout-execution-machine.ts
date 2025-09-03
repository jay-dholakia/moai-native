import { createMachine, assign, fromPromise } from 'xstate';
import { WorkoutExercise } from '@/services/exercise-service';
import { ActivityLogService } from '@/services/activity-log-service';

export interface WorkoutExecutionContext {
  // Workout info
  workoutId: string;
  workoutName: string;
  exercises: WorkoutExercise[];
  
  // Progress tracking
  currentExerciseIndex: number;
  currentSetIndex: number;
  completedSets: Record<string, boolean[]>; // exerciseId -> completed sets array
  
  // Timer state
  restTimerSeconds: number;
  isRestTimerActive: boolean;
  workoutStartTime: Date | null;
  workoutEndTime: Date | null;
  
  // Exercise performance data
  performanceData: Record<string, ExercisePerformance[]>; // exerciseId -> performance array
  
  // UI state
  error: string | null;
  isLoading: boolean;
}

export interface ExercisePerformance {
  setNumber: number;
  reps?: number;
  weight?: number;
  duration?: number;
  distance?: number;
  completedAt: Date;
  notes?: string;
}

export type WorkoutExecutionEvent =
  | { type: 'START_WORKOUT' }
  | { type: 'COMPLETE_SET'; performance: ExercisePerformance }
  | { type: 'SKIP_SET' }
  | { type: 'START_REST_TIMER' }
  | { type: 'SKIP_REST' }
  | { type: 'TIMER_TICK' }
  | { type: 'NEXT_EXERCISE' }
  | { type: 'PREVIOUS_EXERCISE' }
  | { type: 'JUMP_TO_EXERCISE'; index: number }
  | { type: 'UPDATE_PERFORMANCE'; exerciseId: string; setIndex: number; data: Partial<ExercisePerformance> }
  | { type: 'PAUSE_WORKOUT' }
  | { type: 'RESUME_WORKOUT' }
  | { type: 'END_WORKOUT' }
  | { type: 'SAVE_AND_EXIT' }
  | { type: 'CANCEL_WORKOUT' };

// Actor for saving workout to activity log
const saveWorkoutActor = fromPromise(async ({ input }: { input: WorkoutExecutionContext }) => {
  const { workoutId, workoutName, exercises, performanceData, workoutStartTime, workoutEndTime } = input;
  
  // Calculate total duration
  const durationMinutes = workoutStartTime && workoutEndTime
    ? Math.round((workoutEndTime.getTime() - workoutStartTime.getTime()) / 1000 / 60)
    : 0;
  
  // Prepare activity log data
  const activityData = {
    activity_type: 'workout',
    emoji: '💪',
    duration_minutes: durationMinutes,
    notes: `Completed workout: ${workoutName}`,
    muscle_groups: exercises.reduce((acc, ex) => {
      if (ex.exercise?.muscle_groups) {
        acc.push(...ex.exercise.muscle_groups);
      }
      return acc;
    }, [] as string[]),
    // Store detailed workout data in JSON array format
    activity_partners: [{
      workout_id: workoutId,
      exercises_completed: Object.keys(performanceData).length,
      total_exercises: exercises.length,
      performance_data: performanceData,
    }],
  };
  
  // Save to activity log
  const result = await ActivityLogService.logActivity(activityData);
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to save workout');
  }
  
  return result.data;
});

export const workoutExecutionMachine = createMachine({
  types: {} as {
    context: WorkoutExecutionContext;
    events: WorkoutExecutionEvent;
  },
  id: 'workoutExecution',
  initial: 'idle',
  context: ({ input }: { input: Partial<WorkoutExecutionContext> }) => ({
    workoutId: input.workoutId || '',
    workoutName: input.workoutName || '',
    exercises: input.exercises || [],
    currentExerciseIndex: 0,
    currentSetIndex: 0,
    completedSets: {},
    restTimerSeconds: 0,
    isRestTimerActive: false,
    workoutStartTime: null,
    workoutEndTime: null,
    performanceData: {},
    error: null,
    isLoading: false,
  }),
  states: {
    idle: {
      on: {
        START_WORKOUT: {
          target: 'exercising',
          actions: assign({
            workoutStartTime: () => new Date(),
            completedSets: ({ context }) => {
              // Initialize completed sets for each exercise
              const sets: Record<string, boolean[]> = {};
              context.exercises.forEach(ex => {
                sets[ex.id] = new Array(ex.sets || 3).fill(false);
              });
              return sets;
            },
          }),
        },
      },
    },
    
    exercising: {
      initial: 'performing',
      states: {
        performing: {
          on: {
            COMPLETE_SET: {
              actions: [
                assign(({ context, event }) => {
                  const currentExercise = context.exercises[context.currentExerciseIndex];
                  const exerciseId = currentExercise.id;
                  
                  // Mark set as completed
                  const updatedSets = { ...context.completedSets };
                  if (updatedSets[exerciseId]) {
                    updatedSets[exerciseId][context.currentSetIndex] = true;
                  }
                  
                  // Store performance data
                  const updatedPerformance = { ...context.performanceData };
                  if (!updatedPerformance[exerciseId]) {
                    updatedPerformance[exerciseId] = [];
                  }
                  updatedPerformance[exerciseId].push({
                    ...event.performance,
                    setNumber: context.currentSetIndex + 1,
                    completedAt: new Date(),
                  });
                  
                  return {
                    completedSets: updatedSets,
                    performanceData: updatedPerformance,
                  };
                }),
              ],
              target: 'checkingProgress',
            },
            
            SKIP_SET: {
              actions: assign(({ context }) => ({
                currentSetIndex: context.currentSetIndex + 1,
              })),
              target: 'checkingProgress',
            },
            
            JUMP_TO_EXERCISE: {
              actions: assign(({ event }) => ({
                currentExerciseIndex: event.index,
                currentSetIndex: 0,
              })),
            },
            
            UPDATE_PERFORMANCE: {
              actions: assign(({ context, event }) => {
                const updatedPerformance = { ...context.performanceData };
                if (updatedPerformance[event.exerciseId] && updatedPerformance[event.exerciseId][event.setIndex]) {
                  updatedPerformance[event.exerciseId][event.setIndex] = {
                    ...updatedPerformance[event.exerciseId][event.setIndex],
                    ...event.data,
                  };
                }
                return { performanceData: updatedPerformance };
              }),
            },
          },
        },
        
        resting: {
          entry: assign({
            isRestTimerActive: true,
            restTimerSeconds: ({ context }) => {
              const currentExercise = context.exercises[context.currentExerciseIndex];
              return currentExercise?.rest_seconds || 60;
            },
          }),
          
          invoke: {
            id: 'restTimer',
            src: fromPromise(async ({ input }: { input: number }) => {
              return new Promise((resolve) => {
                setTimeout(resolve, input * 1000);
              });
            }),
            input: ({ context }) => context.restTimerSeconds,
          },
          
          on: {
            TIMER_TICK: {
              actions: assign(({ context }) => ({
                restTimerSeconds: Math.max(0, context.restTimerSeconds - 1),
              })),
              guard: ({ context }) => context.restTimerSeconds > 0,
            },
            
            SKIP_REST: {
              target: 'performing',
              actions: assign({
                isRestTimerActive: false,
                currentSetIndex: ({ context }) => context.currentSetIndex + 1,
              }),
            },
          },
          
          after: {
            REST_COMPLETE: {
              target: 'performing',
              actions: assign({
                isRestTimerActive: false,
                currentSetIndex: ({ context }) => context.currentSetIndex + 1,
              }),
            },
          },
        },
        
        checkingProgress: {
          always: [
            {
              // Check if all sets for current exercise are complete
              guard: ({ context }) => {
                const currentExercise = context.exercises[context.currentExerciseIndex];
                const exerciseSets = context.completedSets[currentExercise.id];
                const totalSets = currentExercise.sets || 3;
                
                return context.currentSetIndex >= totalSets - 1;
              },
              target: 'exerciseComplete',
            },
            {
              // More sets to go, start rest timer
              target: 'resting',
            },
          ],
        },
        
        exerciseComplete: {
          always: [
            {
              // Check if all exercises are complete
              guard: ({ context }) => {
                return context.currentExerciseIndex >= context.exercises.length - 1;
              },
              target: '#workoutExecution.completing',
            },
            {
              // Move to next exercise
              actions: assign({
                currentExerciseIndex: ({ context }) => context.currentExerciseIndex + 1,
                currentSetIndex: 0,
              }),
              target: 'performing',
            },
          ],
        },
      },
      
      on: {
        PAUSE_WORKOUT: 'paused',
        END_WORKOUT: 'completing',
        CANCEL_WORKOUT: 'cancelled',
        
        NEXT_EXERCISE: {
          actions: assign(({ context }) => ({
            currentExerciseIndex: Math.min(context.exercises.length - 1, context.currentExerciseIndex + 1),
            currentSetIndex: 0,
          })),
        },
        
        PREVIOUS_EXERCISE: {
          actions: assign(({ context }) => ({
            currentExerciseIndex: Math.max(0, context.currentExerciseIndex - 1),
            currentSetIndex: 0,
          })),
        },
      },
    },
    
    paused: {
      on: {
        RESUME_WORKOUT: 'exercising',
        END_WORKOUT: 'completing',
        CANCEL_WORKOUT: 'cancelled',
      },
    },
    
    completing: {
      entry: assign({
        workoutEndTime: () => new Date(),
      }),
      
      on: {
        SAVE_AND_EXIT: 'saving',
        CANCEL_WORKOUT: 'cancelled',
      },
    },
    
    saving: {
      entry: assign({ isLoading: true }),
      
      invoke: {
        id: 'saveWorkout',
        src: saveWorkoutActor,
        input: ({ context }) => context,
        onDone: {
          target: 'completed',
          actions: assign({
            isLoading: false,
            error: null,
          }),
        },
        onError: {
          target: 'completing',
          actions: assign({
            isLoading: false,
            error: 'Failed to save workout. Please try again.',
          }),
        },
      },
    },
    
    completed: {
      type: 'final',
    },
    
    cancelled: {
      type: 'final',
    },
  },
});

// Helper selectors
export const workoutExecutionSelectors = {
  currentExercise: (context: WorkoutExecutionContext) => 
    context.exercises[context.currentExerciseIndex],
    
  currentExerciseProgress: (context: WorkoutExecutionContext) => {
    const currentExercise = context.exercises[context.currentExerciseIndex];
    if (!currentExercise) return { completed: 0, total: 0 };
    
    const completedSets = context.completedSets[currentExercise.id]?.filter(Boolean).length || 0;
    const totalSets = currentExercise.sets || 3;
    
    return { completed: completedSets, total: totalSets };
  },
  
  overallProgress: (context: WorkoutExecutionContext) => {
    const totalExercises = context.exercises.length;
    const completedExercises = Object.entries(context.completedSets).filter(([_, sets]) => 
      sets.every(Boolean)
    ).length;
    
    return {
      completed: completedExercises,
      total: totalExercises,
      percentage: totalExercises > 0 ? Math.round((completedExercises / totalExercises) * 100) : 0,
    };
  },
  
  workoutDuration: (context: WorkoutExecutionContext) => {
    if (!context.workoutStartTime) return 0;
    
    const endTime = context.workoutEndTime || new Date();
    return Math.round((endTime.getTime() - context.workoutStartTime.getTime()) / 1000 / 60);
  },
  
  canMoveNext: (context: WorkoutExecutionContext) => 
    context.currentExerciseIndex < context.exercises.length - 1,
    
  canMovePrevious: (context: WorkoutExecutionContext) => 
    context.currentExerciseIndex > 0,
};