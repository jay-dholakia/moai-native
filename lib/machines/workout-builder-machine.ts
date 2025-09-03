import { createMachine, assign, fromPromise } from 'xstate';
import { Exercise, WorkoutExercise } from '@/services/exercise-service';

export interface WorkoutTemplate {
  id?: string;
  name: string;
  description?: string;
  exercises: WorkoutExercise[];
  estimated_duration_minutes?: number;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  workout_type: 'strength' | 'cardio' | 'mixed' | 'flexibility';
  tags?: string[];
}

export interface WorkoutBuilderContext {
  // Workout details
  workoutName: string;
  workoutDescription: string;
  workoutType: 'strength' | 'cardio' | 'mixed' | 'flexibility';
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  
  // Exercises
  exercises: WorkoutExercise[];
  currentExerciseIndex: number;
  selectedExercise: Exercise | null;
  
  // Exercise configuration
  sets: number;
  reps: number;
  weight: number;
  duration_seconds: number;
  distance: number;
  rest_seconds: number;
  notes: string;
  
  // Metadata
  estimatedDuration: number;
  totalExercises: number;
  
  // State management
  error: string | null;
  lastSavedAt: Date | null;
}

export type WorkoutBuilderEvent =
  | { type: 'SET_WORKOUT_DETAILS'; name: string; description?: string; workoutType: 'strength' | 'cardio' | 'mixed' | 'flexibility' }
  | { type: 'SET_DIFFICULTY'; level: 'beginner' | 'intermediate' | 'advanced' }
  | { type: 'ADD_TAG'; tag: string }
  | { type: 'REMOVE_TAG'; tag: string }
  | { type: 'SELECT_EXERCISE'; exercise: Exercise }
  | { type: 'CONFIGURE_EXERCISE'; config: Partial<WorkoutExercise> }
  | { type: 'ADD_EXERCISE' }
  | { type: 'REMOVE_EXERCISE'; index: number }
  | { type: 'REORDER_EXERCISES'; fromIndex: number; toIndex: number }
  | { type: 'EDIT_EXERCISE'; index: number }
  | { type: 'UPDATE_EXERCISE'; index: number; updates: Partial<WorkoutExercise> }
  | { type: 'DUPLICATE_EXERCISE'; index: number }
  | { type: 'PREVIEW_WORKOUT' }
  | { type: 'SAVE_TEMPLATE' }
  | { type: 'SAVE_AND_START' }
  | { type: 'LOAD_TEMPLATE'; template: WorkoutTemplate }
  | { type: 'RESET' }
  | { type: 'CANCEL' }
  | { type: 'RETRY' };

// Define actor logic outside the machine
const saveWorkoutTemplateActor = fromPromise(async ({ input }: { input: WorkoutBuilderContext }) => {
  // This would save to the workout templates database
  const template: WorkoutTemplate = {
    name: input.workoutName,
    description: input.workoutDescription,
    exercises: input.exercises,
    estimated_duration_minutes: input.estimatedDuration,
    difficulty_level: input.difficultyLevel,
    workout_type: input.workoutType,
    tags: input.tags,
  };
  
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  return template;
});

const saveAndStartWorkoutActor = fromPromise(async ({ input }: { input: WorkoutBuilderContext }) => {
  // Save template and start workout
  const template: WorkoutTemplate = {
    name: input.workoutName,
    description: input.workoutDescription,
    exercises: input.exercises,
    estimated_duration_minutes: input.estimatedDuration,
    difficulty_level: input.difficultyLevel,
    workout_type: input.workoutType,
    tags: input.tags,
  };
  
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  return template;
});

export const workoutBuilderMachine = createMachine({
  types: {} as {
    context: WorkoutBuilderContext;
    events: WorkoutBuilderEvent;
  },
  id: 'workoutBuilder',
  initial: 'setup',
  context: {
    // Workout details
    workoutName: '',
    workoutDescription: '',
    workoutType: 'mixed',
    difficultyLevel: 'beginner',
    tags: [],
    
    // Exercises
    exercises: [],
    currentExerciseIndex: -1,
    selectedExercise: null,
    
    // Exercise configuration
    sets: 3,
    reps: 10,
    weight: 0,
    duration_seconds: 0,
    distance: 0,
    rest_seconds: 60,
    notes: '',
    
    // Metadata
    estimatedDuration: 0,
    totalExercises: 0,
    
    // State management
    error: null,
    lastSavedAt: null,
  },
  states: {
    setup: {
      on: {
        SET_WORKOUT_DETAILS: {
          actions: assign(({ event }) => {
            if (event.type !== 'SET_WORKOUT_DETAILS') return {};
            return {
              workoutName: event.name,
              workoutDescription: event.description || '',
              workoutType: event.workoutType,
            };
          }),
        },
        SET_DIFFICULTY: {
          actions: assign(({ event }) => {
            if (event.type !== 'SET_DIFFICULTY') return {};
            return {
              difficultyLevel: event.level,
            };
          }),
        },
        ADD_TAG: {
          actions: assign(({ context, event }) => {
            if (event.type !== 'ADD_TAG') return {};
            return {
              tags: [...context.tags, event.tag],
            };
          }),
        },
        REMOVE_TAG: {
          actions: assign(({ context, event }) => {
            if (event.type !== 'REMOVE_TAG') return {};
            return {
              tags: context.tags.filter(tag => tag !== event.tag),
            };
          }),
        },
        SELECT_EXERCISE: {
          target: 'configuringExercise',
          actions: assign(({ event }) => {
            if (event.type !== 'SELECT_EXERCISE') return {};
            return {
              selectedExercise: event.exercise,
              // Reset configuration
              sets: 3,
              reps: 10,
              weight: 0,
              duration_seconds: 0,
              distance: 0,
              rest_seconds: 60,
              notes: '',
            };
          }),
        },
        LOAD_TEMPLATE: {
          target: 'editing',
          actions: assign(({ event }) => {
            if (event.type !== 'LOAD_TEMPLATE') return {};
            return {
              workoutName: event.template.name,
              workoutDescription: event.template.description || '',
              workoutType: event.template.workout_type,
              difficultyLevel: event.template.difficulty_level,
              exercises: event.template.exercises,
              tags: event.template.tags || [],
              totalExercises: event.template.exercises.length,
              estimatedDuration: event.template.estimated_duration_minutes || 0,
            };
          }),
        },
        CANCEL: 'cancelled',
      },
    },
    
    configuringExercise: {
      on: {
        CONFIGURE_EXERCISE: {
          actions: assign(({ event }) => {
            if (event.type !== 'CONFIGURE_EXERCISE') return {};
            return {
              ...event.config,
            };
          }),
        },
        ADD_EXERCISE: {
          target: 'editing',
          actions: assign(({ context }) => {
            if (!context.selectedExercise) return {};
            
            const newExercise: WorkoutExercise = {
              id: `${Date.now()}`, // Temporary ID
              exercise_id: context.selectedExercise.id,
              sets: context.selectedExercise.exercise_type === 'strength' ? context.sets : undefined,
              reps: context.selectedExercise.exercise_type === 'strength' ? context.reps : undefined,
              weight: context.selectedExercise.exercise_type === 'strength' ? context.weight : undefined,
              duration_seconds: context.selectedExercise.exercise_type === 'cardio' ? context.duration_seconds : undefined,
              distance: context.selectedExercise.exercise_type === 'cardio' ? context.distance : undefined,
              rest_seconds: context.rest_seconds,
              notes: context.notes,
              exercise: context.selectedExercise,
            };
            
            const newExercises = [...context.exercises, newExercise];
            
            // Calculate estimated duration based on exercise type
            let duration = context.estimatedDuration;
            if (context.selectedExercise?.exercise_type === 'strength') {
              // Estimate: sets * reps * 3 seconds + rest time
              duration += (context.sets * context.reps * 3 + context.rest_seconds * context.sets) / 60;
            } else if (context.selectedExercise?.exercise_type === 'cardio') {
              duration += context.duration_seconds / 60;
            }
            
            return {
              exercises: newExercises,
              totalExercises: newExercises.length,
              selectedExercise: null,
              estimatedDuration: Math.round(duration),
            };
          }),
        },
        SELECT_EXERCISE: {
          actions: assign(({ event }) => {
            if (event.type !== 'SELECT_EXERCISE') return {};
            return {
              selectedExercise: event.exercise,
              // Reset configuration for new exercise
              sets: 3,
              reps: 10,
              weight: 0,
              duration_seconds: 0,
              distance: 0,
              rest_seconds: 60,
              notes: '',
            };
          }),
        },
        CANCEL: 'setup',
      },
    },
    
    editing: {
      on: {
        SELECT_EXERCISE: {
          target: 'configuringExercise',
          actions: assign(({ event }) => {
            if (event.type !== 'SELECT_EXERCISE') return {};
            return {
              selectedExercise: event.exercise,
              sets: 3,
              reps: 10,
              weight: 0,
              duration_seconds: 0,
              distance: 0,
              rest_seconds: 60,
              notes: '',
            };
          }),
        },
        EDIT_EXERCISE: {
          target: 'configuringExercise',
          actions: assign(({ context, event }) => {
            if (event.type !== 'EDIT_EXERCISE') return {};
            const exercise = context.exercises[event.index];
            return {
              currentExerciseIndex: event.index,
              selectedExercise: exercise?.exercise || null,
              // Load existing values
              sets: exercise?.sets || 3,
              reps: exercise?.reps || 10,
              weight: exercise?.weight || 0,
              duration_seconds: exercise?.duration_seconds || 0,
              distance: exercise?.distance || 0,
              rest_seconds: exercise?.rest_seconds || 60,
              notes: exercise?.notes || '',
            };
          }),
        },
        UPDATE_EXERCISE: {
          actions: assign(({ context, event }) => {
            if (event.type !== 'UPDATE_EXERCISE') return {};
            return {
              exercises: context.exercises.map((ex, index) =>
                index === event.index ? { ...ex, ...event.updates } : ex
              ),
            };
          }),
        },
        REMOVE_EXERCISE: {
          actions: assign(({ context, event }) => {
            if (event.type !== 'REMOVE_EXERCISE') return {};
            const newExercises = context.exercises.filter((_, index) => index !== event.index);
            return {
              exercises: newExercises,
              totalExercises: newExercises.length,
            };
          }),
        },
        DUPLICATE_EXERCISE: {
          actions: assign(({ context, event }) => {
            if (event.type !== 'DUPLICATE_EXERCISE') return {};
            const exerciseToDuplicate = context.exercises[event.index];
            const duplicated = {
              ...exerciseToDuplicate,
              id: `${Date.now()}`, // New temporary ID
            };
            const newExercises = [...context.exercises, duplicated];
            return {
              exercises: newExercises,
              totalExercises: newExercises.length,
            };
          }),
        },
        REORDER_EXERCISES: {
          actions: assign(({ context, event }) => {
            if (event.type !== 'REORDER_EXERCISES') return {};
            const exercises = [...context.exercises];
            const [removed] = exercises.splice(event.fromIndex, 1);
            exercises.splice(event.toIndex, 0, removed);
            return {
              exercises,
            };
          }),
        },
        SET_WORKOUT_DETAILS: {
          actions: assign(({ event }) => {
            if (event.type !== 'SET_WORKOUT_DETAILS') return {};
            return {
              workoutName: event.name,
              workoutDescription: event.description || '',
              workoutType: event.workoutType,
            };
          }),
        },
        SET_DIFFICULTY: {
          actions: assign(({ event }) => {
            if (event.type !== 'SET_DIFFICULTY') return {};
            return {
              difficultyLevel: event.level,
            };
          }),
        },
        PREVIEW_WORKOUT: 'previewing',
        SAVE_TEMPLATE: 'saving',
        SAVE_AND_START: 'savingAndStarting',
        RESET: {
          target: 'setup',
          actions: assign(() => ({
            workoutName: '',
            workoutDescription: '',
            workoutType: 'mixed' as const,
            difficultyLevel: 'beginner' as const,
            tags: [],
            exercises: [],
            currentExerciseIndex: -1,
            selectedExercise: null,
            estimatedDuration: 0,
            totalExercises: 0,
            error: null,
          })),
        },
        CANCEL: 'cancelled',
      },
    },
    
    previewing: {
      on: {
        SAVE_TEMPLATE: 'saving',
        SAVE_AND_START: 'savingAndStarting',
        EDIT_EXERCISE: {
          target: 'editing',
          actions: assign(({ event }) => {
            if (event.type !== 'EDIT_EXERCISE') return {};
            return {
              currentExerciseIndex: event.index,
            };
          }),
        },
        SELECT_EXERCISE: {
          target: 'configuringExercise',
          actions: assign(({ event }) => {
            if (event.type !== 'SELECT_EXERCISE') return {};
            return {
              selectedExercise: event.exercise,
            };
          }),
        },
        CANCEL: 'editing',
      },
    },
    
    saving: {
      invoke: {
        id: 'saveWorkoutTemplate',
        src: saveWorkoutTemplateActor,
        input: ({ context }: { context: WorkoutBuilderContext }) => context,
        onDone: {
          target: 'saved',
          actions: assign(() => ({
            lastSavedAt: new Date(),
            error: null,
          })),
        },
        onError: {
          target: 'editing',
          actions: assign(() => ({
            error: 'Failed to save workout template',
          })),
        },
      },
    },
    
    savingAndStarting: {
      invoke: {
        id: 'saveAndStartWorkout',
        src: saveAndStartWorkoutActor,
        input: ({ context }: { context: WorkoutBuilderContext }) => context,
        onDone: {
          target: 'startingWorkout',
          actions: assign(() => ({
            lastSavedAt: new Date(),
            error: null,
          })),
        },
        onError: {
          target: 'editing',
          actions: assign(() => ({
            error: 'Failed to save and start workout',
          })),
        },
      },
    },
    
    startingWorkout: {
      // This would transition to the workout execution state machine
      type: 'final',
    },
    
    saved: {
      after: {
        2000: 'editing', // Return to editing after showing success message
      },
      on: {
        RESET: {
          target: 'setup',
          actions: assign(() => ({
            workoutName: '',
            workoutDescription: '',
            exercises: [],
            error: null,
          })),
        },
        SAVE_AND_START: 'savingAndStarting',
      },
    },
    
    cancelled: {
      type: 'final',
    },
    
    error: {
      on: {
        RETRY: 'editing',
        CANCEL: 'cancelled',
      },
    },
  },
});

// Helper selectors
export const workoutBuilderSelectors = {
  canAddExercise: (context: WorkoutBuilderContext) => 
    context.selectedExercise !== null,
    
  hasExercises: (context: WorkoutBuilderContext) => 
    context.exercises.length > 0,
    
  canSave: (context: WorkoutBuilderContext) => 
    context.workoutName.trim().length > 0 && context.exercises.length > 0,
    
  isValidWorkout: (context: WorkoutBuilderContext) => 
    context.workoutName.trim().length > 0 && 
    context.exercises.length > 0 && 
    context.exercises.every(ex => ex.exercise),
    
  totalDuration: (context: WorkoutBuilderContext) => 
    context.estimatedDuration,
    
  exerciseCount: (context: WorkoutBuilderContext) => 
    context.exercises.length,
    
  currentExercise: (context: WorkoutBuilderContext) => 
    context.currentExerciseIndex >= 0 ? context.exercises[context.currentExerciseIndex] : null,
};