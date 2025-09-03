import { supabase } from '@/lib/supabase';
import { ServiceResponse } from './types';

export interface ProgramTemplate {
  id: string;
  coach_id: string;
  name: string;
  description: string;
  duration_weeks: number;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  program_type: 'strength' | 'cardio' | 'hybrid' | 'flexibility' | 'sport_specific';
  goals: string[];
  equipment_needed: string[];
  image_url?: string;
  price: number;
  is_public: boolean;
  is_featured: boolean;
  rating_average?: number;
  rating_count?: number;
  enrollment_count: number;
  created_at: string;
  updated_at: string;
  coach_profile?: {
    id: string;
    first_name: string;
    last_name: string;
    username: string;
    avatar_url?: string;
    bio?: string;
    specialties: string[];
  };
}

export interface ProgramWeek {
  id: string;
  program_template_id: string;
  week_number: number;
  title: string;
  description?: string;
  focus_areas: string[];
  created_at: string;
}

export interface ProgramWorkout {
  id: string;
  program_week_id: string;
  day_number: number;
  title: string;
  description?: string;
  workout_template_id?: string;
  estimated_duration: number;
  difficulty_level: 'easy' | 'moderate' | 'hard';
  workout_type: 'strength' | 'cardio' | 'flexibility' | 'rest' | 'active_recovery';
  instructions?: string;
  created_at: string;
  workout_template?: any; // Reference to existing workout templates
}

export interface ProgramAssignment {
  id: string;
  program_template_id: string;
  client_id: string;
  coach_id: string;
  start_date: string;
  target_end_date: string;
  actual_end_date?: string;
  status: 'pending' | 'active' | 'paused' | 'completed' | 'cancelled';
  current_week: number;
  current_day: number;
  completion_percentage: number;
  notes?: string;
  customizations?: Record<string, any>;
  created_at: string;
  updated_at: string;
  program_template?: ProgramTemplate;
  client_profile?: any;
}

export interface ProgramProgress {
  id: string;
  assignment_id: string;
  week_number: number;
  day_number: number;
  workout_id: string;
  completed_at?: string;
  skipped: boolean;
  skip_reason?: string;
  feedback?: string;
  difficulty_rating?: number;
  completion_time?: number;
  notes?: string;
  created_at: string;
}

export interface ProgramReview {
  id: string;
  program_template_id: string;
  client_id: string;
  assignment_id: string;
  rating: number;
  review_text?: string;
  would_recommend: boolean;
  created_at: string;
  client_profile?: any;
}

export interface ProgramStats {
  totalPrograms: number;
  activeAssignments: number;
  completedAssignments: number;
  averageRating: number;
  totalEnrollments: number;
  revenueThisMonth: number;
  completionRate: number;
}

// Service response type

export class ProgramService {
  /**
   * Get program templates by coach
   */
  static async getCoachPrograms(coachId: string): Promise<ServiceResponse<ProgramTemplate[]>> {
    try {
      const { data, error } = await supabase
        .from('program_templates')
        .select(`
          *,
          coach_profile:profiles(
            id,
            first_name,
            last_name,
            username,
            avatar_url,
            bio
          )
        `)
        .eq('coach_id', coachId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching coach programs:', error);
      return { success: false, error: 'Failed to fetch programs' };
    }
  }

  /**
   * Get public programs for marketplace
   */
  static async getPublicPrograms(
    filters?: {
      difficulty?: string;
      type?: string;
      minPrice?: number;
      maxPrice?: number;
      searchQuery?: string;
    }
  ): Promise<ServiceResponse<ProgramTemplate[]>> {
    try {
      let query = supabase
        .from('program_templates')
        .select(`
          *,
          coach_profile:profiles(
            id,
            first_name,
            last_name,
            username,
            avatar_url,
            bio,
            specialties
          )
        `)
        .eq('is_public', true);

      // Apply filters
      if (filters?.difficulty) {
        query = query.eq('difficulty_level', filters.difficulty);
      }
      if (filters?.type) {
        query = query.eq('program_type', filters.type);
      }
      if (filters?.minPrice !== undefined) {
        query = query.gte('price', filters.minPrice);
      }
      if (filters?.maxPrice !== undefined) {
        query = query.lte('price', filters.maxPrice);
      }
      if (filters?.searchQuery) {
        query = query.or(`name.ilike.%${filters.searchQuery}%, description.ilike.%${filters.searchQuery}%`);
      }

      const { data, error } = await query
        .order('is_featured', { ascending: false })
        .order('rating_average', { ascending: false, nullsFirst: false })
        .order('enrollment_count', { ascending: false });

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching public programs:', error);
      return { success: false, error: 'Failed to fetch programs' };
    }
  }

  /**
   * Create a new program template
   */
  static async createProgram(
    coachId: string,
    programData: Omit<ProgramTemplate, 'id' | 'coach_id' | 'created_at' | 'updated_at' | 'rating_average' | 'rating_count' | 'enrollment_count'>
  ): Promise<ServiceResponse<ProgramTemplate>> {
    try {
      const { data, error } = await supabase
        .from('program_templates')
        .insert({
          ...programData,
          coach_id: coachId,
          enrollment_count: 0,
        })
        .select(`
          *,
          coach_profile:profiles(
            id,
            first_name,
            last_name,
            username,
            avatar_url,
            bio,
            specialties
          )
        `)
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error creating program:', error);
      return { success: false, error: 'Failed to create program' };
    }
  }

  /**
   * Update program template
   */
  static async updateProgram(
    programId: string,
    updates: Partial<ProgramTemplate>
  ): Promise<ServiceResponse<ProgramTemplate>> {
    try {
      const { data, error } = await supabase
        .from('program_templates')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', programId)
        .select(`
          *,
          coach_profile:profiles(
            id,
            first_name,
            last_name,
            username,
            avatar_url,
            bio,
            specialties
          )
        `)
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error updating program:', error);
      return { success: false, error: 'Failed to update program' };
    }
  }

  /**
   * Delete program template
   */
  static async deleteProgram(programId: string): Promise<ServiceResponse<void>> {
    try {
      const { error } = await supabase
        .from('program_templates')
        .delete()
        .eq('id', programId);

      if (error) throw error;

      return { success: true, data: undefined };
    } catch (error) {
      console.error('Error deleting program:', error);
      return { success: false, error: 'Failed to delete program' };
    }
  }

  /**
   * Get program weeks and workouts
   */
  static async getProgramStructure(programId: string): Promise<ServiceResponse<{
    weeks: ProgramWeek[];
    workouts: Record<string, ProgramWorkout[]>;
  }>> {
    try {
      // Get weeks
      const { data: weeks, error: weeksError } = await supabase
        .from('program_weeks')
        .select('*')
        .eq('program_template_id', programId)
        .order('week_number', { ascending: true });

      if (weeksError) throw weeksError;

      // Get workouts for all weeks
      const weekIds = weeks?.map(w => w.id) || [];
      const { data: workouts, error: workoutsError } = await supabase
        .from('program_workouts')
        .select(`
          *,
          workout_template:workout_templates(*)
        `)
        .in('program_week_id', weekIds)
        .order('day_number', { ascending: true });

      if (workoutsError) throw workoutsError;

      // Group workouts by week
      const workoutsByWeek: Record<string, ProgramWorkout[]> = {};
      workouts?.forEach(workout => {
        if (!workoutsByWeek[workout.program_week_id]) {
          workoutsByWeek[workout.program_week_id] = [];
        }
        workoutsByWeek[workout.program_week_id].push(workout);
      });

      return {
        success: true,
        data: {
          weeks: weeks || [],
          workouts: workoutsByWeek,
        },
      };
    } catch (error) {
      console.error('Error fetching program structure:', error);
      return { success: false, error: 'Failed to fetch program structure' };
    }
  }

  /**
   * Assign program to client
   */
  static async assignProgram(
    programId: string,
    clientId: string,
    coachId: string,
    startDate: string,
    customizations?: Record<string, any>
  ): Promise<ServiceResponse<ProgramAssignment>> {
    try {
      // Get program to calculate target end date
      const { data: program, error: programError } = await supabase
        .from('program_templates')
        .select('duration_weeks')
        .eq('id', programId)
        .single();

      if (programError) throw programError;

      const targetEndDate = new Date(startDate);
      targetEndDate.setDate(targetEndDate.getDate() + (program.duration_weeks * 7));

      const { data, error } = await supabase
        .from('program_assignments')
        .insert({
          program_template_id: programId,
          client_id: clientId,
          coach_id: coachId,
          start_date: startDate,
          target_end_date: targetEndDate.toISOString(),
          status: 'pending',
          current_week: 1,
          current_day: 1,
          completion_percentage: 0,
          customizations,
        })
        .select(`
          *,
          program_template:program_templates(*),
          client_profile:profiles(*)
        `)
        .single();

      if (error) throw error;

      // Update enrollment count
      if (program) {
        await supabase
          .from('program_templates')
          .update({
            enrollment_count: (program as any).enrollment_count + 1,
          })
          .eq('id', programId);
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error assigning program:', error);
      return { success: false, error: 'Failed to assign program' };
    }
  }

  /**
   * Get client's program assignments
   */
  static async getClientAssignments(clientId: string): Promise<ServiceResponse<ProgramAssignment[]>> {
    try {
      const { data, error } = await supabase
        .from('program_assignments')
        .select(`
          *,
          program_template:program_templates(*),
          coach_profile:profiles(*)
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching client assignments:', error);
      return { success: false, error: 'Failed to fetch assignments' };
    }
  }

  /**
   * Get coach's program assignments
   */
  static async getCoachAssignments(coachId: string): Promise<ServiceResponse<ProgramAssignment[]>> {
    try {
      const { data, error } = await supabase
        .from('program_assignments')
        .select(`
          *,
          program_template:program_templates(*),
          client_profile:profiles(*)
        `)
        .eq('coach_id', coachId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching coach assignments:', error);
      return { success: false, error: 'Failed to fetch assignments' };
    }
  }

  /**
   * Update assignment status
   */
  static async updateAssignmentStatus(
    assignmentId: string,
    status: ProgramAssignment['status'],
    notes?: string
  ): Promise<ServiceResponse<ProgramAssignment>> {
    try {
      const updates: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (notes) {
        updates.notes = notes;
      }

      if (status === 'completed') {
        updates.actual_end_date = new Date().toISOString();
        updates.completion_percentage = 100;
      }

      const { data, error } = await supabase
        .from('program_assignments')
        .update(updates)
        .eq('id', assignmentId)
        .select(`
          *,
          program_template:program_templates(*),
          client_profile:profiles(*)
        `)
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error updating assignment status:', error);
      return { success: false, error: 'Failed to update assignment' };
    }
  }

  /**
   * Record workout completion
   */
  static async recordWorkoutCompletion(
    assignmentId: string,
    weekNumber: number,
    dayNumber: number,
    workoutId: string,
    completionData: {
      completed?: boolean;
      skipped?: boolean;
      skipReason?: string;
      feedback?: string;
      difficultyRating?: number;
      completionTime?: number;
      notes?: string;
    }
  ): Promise<ServiceResponse<ProgramProgress>> {
    try {
      const progressData: any = {
        assignment_id: assignmentId,
        week_number: weekNumber,
        day_number: dayNumber,
        workout_id: workoutId,
        skipped: completionData.skipped || false,
        skip_reason: completionData.skipReason,
        feedback: completionData.feedback,
        difficulty_rating: completionData.difficultyRating,
        completion_time: completionData.completionTime,
        notes: completionData.notes,
      };

      if (completionData.completed) {
        progressData.completed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('program_progress')
        .upsert(progressData, {
          onConflict: 'assignment_id,week_number,day_number',
        })
        .select()
        .single();

      if (error) throw error;

      // Update assignment progress
      await this.updateAssignmentProgress(assignmentId);

      return { success: true, data };
    } catch (error) {
      console.error('Error recording workout completion:', error);
      return { success: false, error: 'Failed to record completion' };
    }
  }

  /**
   * Update assignment progress percentage
   */
  private static async updateAssignmentProgress(assignmentId: string): Promise<void> {
    try {
      // Get total workouts and completed workouts
      const { data: assignment } = await supabase
        .from('program_assignments')
        .select(`
          program_template:program_templates(duration_weeks),
          current_week,
          current_day
        `)
        .eq('id', assignmentId)
        .single();

      if (!assignment) return;

      const { data: progress } = await supabase
        .from('program_progress')
        .select('*')
        .eq('assignment_id', assignmentId);

      const totalWorkouts = (assignment.program_template as any).duration_weeks * 7; // Assuming 7 workouts per week
      const completedWorkouts = progress?.filter(p => p.completed_at).length || 0;
      const completionPercentage = Math.round((completedWorkouts / totalWorkouts) * 100);

      await supabase
        .from('program_assignments')
        .update({
          completion_percentage: completionPercentage,
          updated_at: new Date().toISOString(),
        })
        .eq('id', assignmentId);
    } catch (error) {
      console.error('Error updating assignment progress:', error);
    }
  }

  /**
   * Get program statistics for coach
   */
  static async getProgramStats(coachId: string): Promise<ServiceResponse<ProgramStats>> {
    try {
      // Get total programs
      const { count: totalPrograms } = await supabase
        .from('program_templates')
        .select('*', { count: 'exact', head: true })
        .eq('coach_id', coachId);

      // Get active assignments
      const { count: activeAssignments } = await supabase
        .from('program_assignments')
        .select('*', { count: 'exact', head: true })
        .eq('coach_id', coachId)
        .eq('status', 'active');

      // Get completed assignments
      const { count: completedAssignments } = await supabase
        .from('program_assignments')
        .select('*', { count: 'exact', head: true })
        .eq('coach_id', coachId)
        .eq('status', 'completed');

      // Get program ratings
      const { data: programs } = await supabase
        .from('program_templates')
        .select('rating_average, enrollment_count, price')
        .eq('coach_id', coachId);

      const totalEnrollments = programs?.reduce((sum, p) => sum + p.enrollment_count, 0) || 0;
      const averageRating = programs && programs.length > 0 
        ? programs.reduce((sum, p) => sum + (p.rating_average || 0), 0) / programs.length
        : 0;

      // Calculate revenue (simplified - would need actual payment data)
      const revenueThisMonth = programs?.reduce((sum, p) => sum + (p.price * p.enrollment_count), 0) || 0;

      // Calculate completion rate
      const totalAssignments = (activeAssignments || 0) + (completedAssignments || 0);
      const completionRate = totalAssignments > 0 
        ? Math.round(((completedAssignments || 0) / totalAssignments) * 100)
        : 0;

      const stats: ProgramStats = {
        totalPrograms: totalPrograms || 0,
        activeAssignments: activeAssignments || 0,
        completedAssignments: completedAssignments || 0,
        averageRating,
        totalEnrollments,
        revenueThisMonth,
        completionRate,
      };

      return { success: true, data: stats };
    } catch (error) {
      console.error('Error fetching program stats:', error);
      return { success: false, error: 'Failed to fetch program statistics' };
    }
  }

  /**
   * Add program review
   */
  static async addProgramReview(
    programId: string,
    clientId: string,
    assignmentId: string,
    reviewData: {
      rating: number;
      reviewText?: string;
      wouldRecommend: boolean;
    }
  ): Promise<ServiceResponse<ProgramReview>> {
    try {
      const { data, error } = await supabase
        .from('program_reviews')
        .insert({
          program_template_id: programId,
          client_id: clientId,
          assignment_id: assignmentId,
          rating: reviewData.rating,
          review_text: reviewData.reviewText,
          would_recommend: reviewData.wouldRecommend,
        })
        .select(`
          *,
          client_profile:profiles(*)
        `)
        .single();

      if (error) throw error;

      // Update program rating
      await this.updateProgramRating(programId);

      return { success: true, data };
    } catch (error) {
      console.error('Error adding program review:', error);
      return { success: false, error: 'Failed to add review' };
    }
  }

  /**
   * Update program rating based on reviews
   */
  private static async updateProgramRating(programId: string): Promise<void> {
    try {
      const { data: reviews } = await supabase
        .from('program_reviews')
        .select('rating')
        .eq('program_template_id', programId);

      if (!reviews || reviews.length === 0) return;

      const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

      await supabase
        .from('program_templates')
        .update({
          rating_average: averageRating,
          rating_count: reviews.length,
        })
        .eq('id', programId);
    } catch (error) {
      console.error('Error updating program rating:', error);
    }
  }

  /**
   * Get program reviews
   */
  static async getProgramReviews(programId: string): Promise<ServiceResponse<ProgramReview[]>> {
    try {
      const { data, error } = await supabase
        .from('program_reviews')
        .select(`
          *,
          client_profile:profiles(
            id,
            first_name,
            last_name,
            username,
            avatar_url
          )
        `)
        .eq('program_template_id', programId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching program reviews:', error);
      return { success: false, error: 'Failed to fetch reviews' };
    }
  }
}

export default ProgramService;