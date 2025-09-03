import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addWeeks } from 'date-fns';

interface ActivityCategory {
  name: string;
  value: number;
  color: string;
  percentage: number;
}

interface ProfileStats {
  totalActivities: number;
  workoutsCompleted: number;
  milesMoved: number;
  minutesMoved: number;
  currentStreak: number;
  activityCategories: ActivityCategory[];
}

const CATEGORY_COLORS = {
  Move: '#14B8A6', // Teal
  Lift: '#F59E0B', // Amber
  Flow: '#8B5CF6', // Purple
  Rest: '#6B7280'  // Gray
};

const categorizeActivity = (activityType: string): string => {
  const type = activityType.toLowerCase();
  
  if (type.includes('running') || type.includes('walk') || type.includes('cycling') || 
      type.includes('cardio') || type.includes('swim') || type.includes('hike') ||
      type.includes('dance') || type.includes('bike')) {
    return 'Move';
  }
  
  if (type.includes('lift') || type.includes('weight') || type.includes('strength') ||
      type.includes('resistance') || type.includes('gym') || type.includes('crossfit') ||
      type.includes('bodyweight') || type.includes('calisthenics')) {
    return 'Lift';
  }
  
  if (type.includes('yoga') || type.includes('stretch') || type.includes('pilates') ||
      type.includes('meditation') || type.includes('tai chi') || type.includes('mobility') ||
      type.includes('balance') || type.includes('flow')) {
    return 'Flow';
  }
  
  if (type.includes('rest') || type.includes('recovery') || type.includes('sleep') ||
      type.includes('massage') || type.includes('sauna') || type.includes('break')) {
    return 'Rest';
  }
  
  return 'Move';
};

export function useProfileStats(
  view: 'weekly' | 'monthly' = 'weekly',
  weekOffset: number = 0,
  currentMonth: Date = new Date()
) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['profile-stats', user?.id, view, weekOffset, format(currentMonth, 'yyyy-MM')],
    queryFn: async (): Promise<ProfileStats> => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      let periodStart: Date;
      let periodEnd: Date;

      if (view === 'weekly') {
        const today = new Date();
        const targetWeek = addWeeks(today, weekOffset);
        periodStart = startOfWeek(targetWeek, { weekStartsOn: 1 });
        periodEnd = endOfWeek(targetWeek, { weekStartsOn: 1 });
      } else {
        periodStart = startOfMonth(currentMonth);
        periodEnd = endOfMonth(currentMonth);
      }

      // Fetch activities for the period
      const { data: activities, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('profile_id', user.id)
        .gte('logged_at', periodStart.toISOString())
        .lte('logged_at', periodEnd.toISOString())
        .order('logged_at', { ascending: false });

      if (error) {
        throw error;
      }

      const activitiesData = activities || [];

      // Calculate workout activities (non-rest activities)
      const workoutActivities = activitiesData.filter(activity => 
        !activity.notes?.toLowerCase().includes('rest') && 
        activity.duration_minutes && activity.duration_minutes > 0
      );

      // Calculate total duration in minutes
      const totalMinutes = activitiesData.reduce((sum, activity) => 
        sum + (activity.duration_minutes || 0), 0
      );

      // Estimate miles (rough calculation based on activity type and duration)
      const estimatedMiles = activitiesData.reduce((sum, activity) => {
        const minutes = activity.duration_minutes || 0;
        let milesPerMinute = 0;
        
        switch (activity.activity_type.toLowerCase()) {
          case 'running':
            milesPerMinute = 0.1; // ~6 mph
            break;
          case 'walking':
            milesPerMinute = 0.05; // ~3 mph
            break;
          case 'cycling':
            milesPerMinute = 0.2; // ~12 mph
            break;
          default:
            milesPerMinute = 0.02; // minimal movement for other activities
        }
        
        return sum + (minutes * milesPerMinute);
      }, 0);

      // Categorize activities and count them
      const categoryCount: { [key: string]: number } = {
        Move: 0,
        Lift: 0,
        Flow: 0,
        Rest: 0
      };
      
      activitiesData.forEach(activity => {
        const category = categorizeActivity(activity.activity_type);
        categoryCount[category]++;
      });

      const totalCategorizedActivities = Object.values(categoryCount).reduce((sum, count) => sum + count, 0);
      
      // Convert to chart data format with percentages
      const activityCategories: ActivityCategory[] = Object.entries(categoryCount)
        .filter(([_, count]) => count > 0)
        .map(([category, count]) => ({
          name: category,
          value: count,
          color: CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS],
          percentage: totalCategorizedActivities > 0 ? (count / totalCategorizedActivities) * 100 : 0
        }));

      // Fetch weekly activity summary for fire streak calculation
      const { data: weeklyData, error: weeklyError } = await supabase
        .from('weekly_activity_summary')
        .select('*')
        .eq('profile_id', user.id)
        .order('week_start_date', { ascending: false })
        .limit(10);

      if (weeklyError) {
        console.error('Error fetching weekly activity summary:', weeklyError);
      }

      // Calculate current streak from weekly fire badges
      const currentStreak = (weeklyData || []).reduce((streak, week) => {
        if (week.fire_badge_earned) {
          return streak + 1;
        }
        return 0; // Reset if no fire badge
      }, 0);

      return {
        totalActivities: activitiesData.length,
        workoutsCompleted: workoutActivities.length,
        milesMoved: Math.round(estimatedMiles * 10) / 10, // Round to 1 decimal
        minutesMoved: totalMinutes,
        currentStreak,
        activityCategories
      };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}