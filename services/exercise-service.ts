import { supabase } from '@/lib/supabase';
import { ServiceResponse } from './types';

export interface Exercise {
  id: string;
  name: string;
  description?: string;
  instructions?: string;
  muscle_groups: string[];
  equipment: string[];
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  exercise_type: 'strength' | 'cardio' | 'flexibility' | 'balance' | 'sports';
  video_url?: string;
  image_url?: string;
  calories_per_minute?: number;
  created_at: string;
  updated_at: string;
}

export interface ExerciseCategory {
  name: string;
  icon: string;
  exercises_count: number;
}

export interface WorkoutExercise {
  id: string;
  exercise_id: string;
  sets?: number;
  reps?: number;
  weight?: number;
  duration_seconds?: number;
  distance?: number;
  rest_seconds?: number;
  notes?: string;
  exercise?: Exercise;
}

export interface ExerciseSearchFilters {
  muscle_groups?: string[];
  equipment?: string[];
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced';
  exercise_type?: 'strength' | 'cardio' | 'flexibility' | 'balance' | 'sports';
  query?: string;
}

export class ExerciseService {
  /**
   * Get all exercises with optional filters
   */
  static async getExercises(
    filters: ExerciseSearchFilters = {},
    page = 1,
    limit = 20
  ): Promise<ServiceResponse<{ exercises: Exercise[]; hasMore: boolean; total: number }>> {
    try {
      let query = supabase
        .from('exercises')
        .select('*', { count: 'exact' });

      // Apply filters
      if (filters.muscle_groups && filters.muscle_groups.length > 0) {
        query = query.overlaps('muscle_groups', filters.muscle_groups);
      }

      if (filters.equipment && filters.equipment.length > 0) {
        query = query.overlaps('equipment', filters.equipment);
      }

      if (filters.difficulty_level) {
        query = query.eq('difficulty_level', filters.difficulty_level);
      }

      if (filters.exercise_type) {
        query = query.eq('exercise_type', filters.exercise_type);
      }

      if (filters.query) {
        query = query.or(`name.ilike.%${filters.query}%,description.ilike.%${filters.query}%`);
      }

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      // Order by name
      query = query.order('name', { ascending: true });

      const { data: exercises, error, count } = await query;

      if (error) {
        console.error('Error fetching exercises:', error);
        return { success: false, error: error.message };
      }

      const total = count || 0;
      const hasMore = total > page * limit;

      return {
        success: true,
        data: {
          exercises: exercises || [],
          hasMore,
          total,
        },
      };
    } catch (error) {
      console.error('Error fetching exercises:', error);
      return { success: false, error: 'Failed to fetch exercises' };
    }
  }

  /**
   * Search exercises by name or description
   */
  static async searchExercises(
    query: string,
    limit = 10
  ): Promise<ServiceResponse<Exercise[]>> {
    try {
      if (query.length < 2) {
        return { success: true, data: [] };
      }

      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .order('name', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('Error searching exercises:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error searching exercises:', error);
      return { success: false, error: 'Failed to search exercises' };
    }
  }

  /**
   * Get exercise by ID
   */
  static async getExerciseById(id: string): Promise<ServiceResponse<Exercise>> {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching exercise:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error fetching exercise:', error);
      return { success: false, error: 'Failed to fetch exercise' };
    }
  }

  /**
   * Get exercises by muscle group
   */
  static async getExercisesByMuscleGroup(
    muscleGroup: string,
    limit = 20
  ): Promise<ServiceResponse<Exercise[]>> {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .contains('muscle_groups', [muscleGroup])
        .order('name', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('Error fetching exercises by muscle group:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching exercises by muscle group:', error);
      return { success: false, error: 'Failed to fetch exercises' };
    }
  }

  /**
   * Get available muscle groups
   */
  static async getMuscleGroups(): Promise<ServiceResponse<string[]>> {
    try {
      // This would ideally be a separate table, but we can extract from exercises
      const { data, error } = await supabase
        .from('exercises')
        .select('muscle_groups');

      if (error) {
        console.error('Error fetching muscle groups:', error);
        return { success: false, error: error.message };
      }

      // Extract unique muscle groups
      const muscleGroups = new Set<string>();
      data?.forEach((exercise) => {
        exercise.muscle_groups?.forEach((group: string) => {
          muscleGroups.add(group);
        });
      });

      return { success: true, data: Array.from(muscleGroups).sort() };
    } catch (error) {
      console.error('Error fetching muscle groups:', error);
      return { success: false, error: 'Failed to fetch muscle groups' };
    }
  }

  /**
   * Get available equipment types
   */
  static async getEquipmentTypes(): Promise<ServiceResponse<string[]>> {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('equipment');

      if (error) {
        console.error('Error fetching equipment types:', error);
        return { success: false, error: error.message };
      }

      // Extract unique equipment types
      const equipmentTypes = new Set<string>();
      data?.forEach((exercise) => {
        exercise.equipment?.forEach((equipment: string) => {
          equipmentTypes.add(equipment);
        });
      });

      return { success: true, data: Array.from(equipmentTypes).sort() };
    } catch (error) {
      console.error('Error fetching equipment types:', error);
      return { success: false, error: 'Failed to fetch equipment types' };
    }
  }

  /**
   * Get exercise categories with counts
   */
  static async getExerciseCategories(): Promise<ServiceResponse<ExerciseCategory[]>> {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('exercise_type');

      if (error) {
        console.error('Error fetching exercise categories:', error);
        return { success: false, error: error.message };
      }

      // Count exercises by type
      const typeCounts = new Map<string, number>();
      data?.forEach((exercise) => {
        const type = exercise.exercise_type;
        typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
      });

      // Map to categories with icons
      const categories: ExerciseCategory[] = Array.from(typeCounts.entries()).map(([type, count]) => ({
        name: type,
        icon: getExerciseTypeIcon(type),
        exercises_count: count,
      }));

      return { success: true, data: categories };
    } catch (error) {
      console.error('Error fetching exercise categories:', error);
      return { success: false, error: 'Failed to fetch exercise categories' };
    }
  }

  /**
   * Get popular exercises (most used in workouts)
   */
  static async getPopularExercises(limit = 10): Promise<ServiceResponse<Exercise[]>> {
    try {
      // This would require joining with workout_exercises table to get usage counts
      // For now, return exercises ordered by name as a placeholder
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .order('name', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('Error fetching popular exercises:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching popular exercises:', error);
      return { success: false, error: 'Failed to fetch popular exercises' };
    }
  }

  /**
   * Get recommended exercises based on user's activity history
   */
  static async getRecommendedExercises(limit = 10): Promise<ServiceResponse<Exercise[]>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // For now, return random exercises
      // In the future, this could analyze user's workout history and preferences
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .limit(limit);

      if (error) {
        console.error('Error fetching recommended exercises:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching recommended exercises:', error);
      return { success: false, error: 'Failed to fetch recommended exercises' };
    }
  }

  /**
   * Create a custom exercise
   */
  static async createCustomExercise(exerciseData: Omit<Exercise, 'id' | 'created_at' | 'updated_at'>): Promise<ServiceResponse<Exercise>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data, error } = await supabase
        .from('exercises')
        .insert({
          ...exerciseData,
          // Add creator_id if you have that field
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating custom exercise:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error creating custom exercise:', error);
      return { success: false, error: 'Failed to create custom exercise' };
    }
  }
}

// Helper function to get exercise type icons
function getExerciseTypeIcon(type: string): string {
  const iconMap: Record<string, string> = {
    strength: '💪',
    cardio: '🏃',
    flexibility: '🧘',
    balance: '⚖️',
    sports: '⚽',
  };
  return iconMap[type] || '🏋️';
}