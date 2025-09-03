import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

interface Badge {
  key: string;
  name: string;
  description: string;
  icon: string;
  level: number;
  unlocked: boolean;
}

interface BadgeProgression {
  currentBadge: Badge | null;
  nextBadge: Badge | null;
  progress: number; // 0-100 percentage
  totalActivities: number;
  moaiMoverWeeks: number;
  milestoneBadges: Badge[];
}

const MILESTONE_BADGES = [
  { key: 'starter', name: 'First Steps', description: 'Log your first activity', icon: '👶', level: 1 },
  { key: 'apprentice', name: 'Fitness Apprentice', description: 'Complete 5 activities', icon: '🌱', level: 5 },
  { key: 'dedicated', name: 'Dedicated Mover', description: 'Log 10 activities consistently', icon: '💪', level: 10 },
  { key: 'committed', name: 'Fitness Committed', description: 'Reach 15 activities', icon: '🔥', level: 15 },
  { key: 'champion', name: 'Fitness Champion', description: 'Achieve 25 activities', icon: '🏆', level: 25 },
  { key: 'warrior', name: 'Fitness Warrior', description: 'Complete 40 activities', icon: '⚔️', level: 40 },
  { key: 'legend', name: 'Moai Legend', description: 'Master 50+ activities', icon: '⭐', level: 50 },
  { key: 'ultimate', name: 'Ultimate Mover', description: 'Achieve 75+ activities', icon: '👑', level: 75 },
  { key: 'godlike', name: 'Fitness God', description: 'Transcend 100+ activities', icon: '🌟', level: 100 },
];

export function useProfileBadges() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['profile-badges', user?.id],
    queryFn: async (): Promise<BadgeProgression> => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Fetch total activities count
      const { count: totalActivities, error: activitiesError } = await supabase
        .from('activity_logs')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', user.id);

      if (activitiesError) {
        throw activitiesError;
      }

      const activityCount = totalActivities || 0;

      // Fetch weekly activity summary for Moai Mover weeks calculation
      const { data: weeklyData, error: weeklyError } = await supabase
        .from('weekly_activity_summary')
        .select('*')
        .eq('profile_id', user.id)
        .eq('fire_badge_earned', true)
        .order('week_start_date', { ascending: false });

      if (weeklyError) {
        console.error('Error fetching weekly activity summary:', weeklyError);
      }

      // Calculate consecutive weeks with fire badge (Moai Mover)
      const moaiMoverWeeks = (weeklyData || []).length;

      // Find current badge and next badge
      let currentBadge: Badge | null = null;
      let nextBadge: Badge | null = null;
      let progress = 0;

      // Create badges with unlocked status
      const milestoneBadges: Badge[] = MILESTONE_BADGES.map(badge => ({
        ...badge,
        unlocked: activityCount >= badge.level
      }));

      // Find the highest unlocked badge as current badge
      for (let i = milestoneBadges.length - 1; i >= 0; i--) {
        if (milestoneBadges[i].unlocked) {
          currentBadge = milestoneBadges[i];
          // Next badge is the next one in the list
          if (i + 1 < milestoneBadges.length) {
            nextBadge = milestoneBadges[i + 1];
            // Calculate progress towards next badge
            const progressToNext = activityCount - currentBadge.level;
            const totalNeeded = nextBadge.level - currentBadge.level;
            progress = Math.min((progressToNext / totalNeeded) * 100, 100);
          }
          break;
        }
      }

      // If no badge is unlocked, set first badge as next
      if (!currentBadge) {
        nextBadge = milestoneBadges[0];
        progress = Math.min((activityCount / nextBadge.level) * 100, 100);
      }

      return {
        currentBadge,
        nextBadge,
        progress,
        totalActivities: activityCount,
        moaiMoverWeeks,
        milestoneBadges
      };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}