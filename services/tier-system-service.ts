import { supabase } from '@/lib/supabase';
import { ServiceResponse } from './types';

export type TierLevel = 'bronze' | 'silver' | 'gold' | 'elite';

export interface TierRequirements {
  level: TierLevel;
  minWeeklyActivities: number;
  minWeeklyCommitment: number;
  consecutiveWeeksRequired: number;
  description: string;
  icon: string;
  color: string;
}

export interface UserTierStatus {
  userId: string;
  currentTier: TierLevel;
  consecutiveWeeks: number;
  currentWeekProgress: number;
  currentWeekCommitment: number;
  weeklyActivities: number;
  nextTierRequirements?: TierRequirements;
  canPromote: boolean;
  lastUpdated: string;
}

export interface MoaiTierStats {
  moaiId: string;
  memberTiers: {
    bronze: number;
    silver: number;
    gold: number;
    elite: number;
  };
  averageTier: TierLevel;
  eliteWeekCount: number;
  totalEliteWeeksAchieved: number;
  currentWeekEliteStatus: boolean;
}

export interface StreakData {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  weeklyStreaks: {
    weekStart: string;
    completed: boolean;
    activitiesCount: number;
    commitmentMet: boolean;
  }[];
}

// Tier progression requirements
export const TIER_REQUIREMENTS: Record<TierLevel, TierRequirements> = {
  bronze: {
    level: 'bronze',
    minWeeklyActivities: 3,
    minWeeklyCommitment: 3,
    consecutiveWeeksRequired: 1,
    description: 'Complete 3+ activities per week',
    icon: '🥉',
    color: '#CD7F32',
  },
  silver: {
    level: 'silver',
    minWeeklyActivities: 4,
    minWeeklyCommitment: 4,
    consecutiveWeeksRequired: 2,
    description: 'Complete 4+ activities for 2 consecutive weeks',
    icon: '🥈',
    color: '#C0C0C0',
  },
  gold: {
    level: 'gold',
    minWeeklyActivities: 5,
    minWeeklyCommitment: 5,
    consecutiveWeeksRequired: 3,
    description: 'Complete 5+ activities for 3 consecutive weeks',
    icon: '🥇',
    color: '#FFD700',
  },
  elite: {
    level: 'elite',
    minWeeklyActivities: 6,
    minWeeklyCommitment: 6,
    consecutiveWeeksRequired: 4,
    description: 'Complete 6+ activities for 4 consecutive weeks',
    icon: '👑',
    color: '#8B008B',
  },
};

export class TierSystemService {
  /**
   * Get current tier status for a user
   */
  static async getUserTierStatus(userId: string): Promise<ServiceResponse<UserTierStatus>> {
    try {
      // Get user's profile and activity data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        return { success: false, error: 'Failed to fetch user profile' };
      }

      // Calculate current tier based on activity history
      const tierStatus = await this.calculateUserTier(userId);
      
      if (!tierStatus.success) {
        return tierStatus;
      }

      return { success: true, data: tierStatus.data };
    } catch (error) {
      console.error('Error getting user tier status:', error);
      return { success: false, error: 'Failed to get tier status' };
    }
  }

  /**
   * Calculate user's tier based on activity history and consistency
   */
  private static async calculateUserTier(userId: string): Promise<ServiceResponse<UserTierStatus>> {
    try {
      // Get last 8 weeks of activity to determine tier
      const eightWeeksAgo = new Date();
      eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56); // 8 weeks

      const { data: activities, error: activitiesError } = await supabase
        .from('activity_logs')
        .select('created_at, duration_minutes')
        .eq('profile_id', userId)
        .gte('created_at', eightWeeksAgo.toISOString())
        .order('created_at', { ascending: false });

      if (activitiesError) {
        return { success: false, error: 'Failed to fetch activity history' };
      }

      // Group activities by week
      const weeklyData = await this.groupActivitiesByWeek(activities || []);
      
      // Determine current tier
      const currentTier = this.determineTierFromWeeklyData(weeklyData);
      
      // Get current week progress
      const currentWeekProgress = this.getCurrentWeekProgress(weeklyData);

      // Calculate consecutive weeks at current tier
      const consecutiveWeeks = this.calculateConsecutiveWeeks(weeklyData, currentTier);

      // Determine next tier and if promotion is possible
      const nextTier = this.getNextTier(currentTier);
      const canPromote = nextTier ? this.canPromoteToTier(weeklyData, nextTier) : false;

      const tierStatus: UserTierStatus = {
        userId,
        currentTier,
        consecutiveWeeks,
        currentWeekProgress: currentWeekProgress.activitiesCount,
        currentWeekCommitment: TIER_REQUIREMENTS[currentTier].minWeeklyCommitment,
        weeklyActivities: currentWeekProgress.activitiesCount,
        nextTierRequirements: nextTier ? TIER_REQUIREMENTS[nextTier] : undefined,
        canPromote,
        lastUpdated: new Date().toISOString(),
      };

      return { success: true, data: tierStatus };
    } catch (error) {
      console.error('Error calculating user tier:', error);
      return { success: false, error: 'Failed to calculate tier' };
    }
  }

  /**
   * Get tier statistics for a MOAI group
   */
  static async getMoaiTierStats(moaiId: string): Promise<ServiceResponse<MoaiTierStats>> {
    try {
      // Get all active members of the MOAI
      const { data: members, error: membersError } = await supabase
        .from('moai_members')
        .select('profile_id')
        .eq('moai_id', moaiId)
        .eq('is_active', true);

      if (membersError) {
        return { success: false, error: 'Failed to fetch MOAI members' };
      }

      if (!members || members.length === 0) {
        return { success: false, error: 'No active members found' };
      }

      // Get tier status for each member
      const memberTiers = { bronze: 0, silver: 0, gold: 0, elite: 0 };
      let eliteMembers = 0;

      for (const member of members) {
        const tierResult = await this.getUserTierStatus(member.profile_id);
        if (tierResult.success) {
          memberTiers[tierResult.data.currentTier as TierLevel]++;
          if (tierResult.data.currentTier === 'elite') {
            eliteMembers++;
          }
        }
      }

      // Calculate average tier
      const tierScores = { bronze: 1, silver: 2, gold: 3, elite: 4 };
      const totalScore = Object.entries(memberTiers).reduce(
        (sum: number, [tier, count]: [string, number]) => sum + tierScores[tier as TierLevel] * count,
        0
      );
      const averageScore = totalScore / members.length;
      const averageTier = this.scoreToTier(averageScore);

      // Get elite week statistics
      const { data: eliteWeeks, error: eliteError } = await supabase
        .from('elite_week_tracker')
        .select('*')
        .eq('moai_id', moaiId)
        .order('week_start_date', { ascending: false });

      if (eliteError) {
        console.warn('Error fetching elite weeks:', eliteError);
      }

      const totalEliteWeeksAchieved = eliteWeeks?.filter(w => w.elite_week_achieved).length || 0;
      const currentWeekEliteStatus = eliteWeeks?.[0]?.elite_week_achieved || false;

      const stats: MoaiTierStats = {
        moaiId,
        memberTiers,
        averageTier,
        eliteWeekCount: eliteMembers,
        totalEliteWeeksAchieved,
        currentWeekEliteStatus,
      };

      return { success: true, data: stats };
    } catch (error) {
      console.error('Error getting MOAI tier stats:', error);
      return { success: false, error: 'Failed to get MOAI tier statistics' };
    }
  }

  /**
   * Get user's streak data
   */
  static async getUserStreakData(userId: string): Promise<ServiceResponse<StreakData>> {
    try {
      // Get last 12 weeks of activities for streak calculation
      const twelveWeeksAgo = new Date();
      twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84);

      const { data: activities, error: activitiesError } = await supabase
        .from('activity_logs')
        .select('created_at, duration_minutes')
        .eq('profile_id', userId)
        .gte('created_at', twelveWeeksAgo.toISOString())
        .order('created_at', { ascending: false });

      if (activitiesError) {
        return { success: false, error: 'Failed to fetch activity history' };
      }

      const weeklyData = await this.groupActivitiesByWeek(activities || []);
      const streakData = this.calculateStreakData(userId, weeklyData);

      return { success: true, data: streakData };
    } catch (error) {
      console.error('Error getting user streak data:', error);
      return { success: false, error: 'Failed to get streak data' };
    }
  }

  /**
   * Update elite week status for a MOAI
   */
  static async updateEliteWeekStatus(moaiId: string): Promise<ServiceResponse<boolean>> {
    try {
      const currentWeekStart = this.getWeekStart(new Date());
      
      // Get MOAI tier stats
      const statsResult = await this.getMoaiTierStats(moaiId);
      if (!statsResult.success) {
        return statsResult;
      }

      const { memberTiers } = statsResult.data;
      const totalMembers = Object.values(memberTiers).reduce((sum, count) => sum + count, 0);
      const eliteMembers = memberTiers.elite;
      
      // Elite week achieved if >= 80% of members are elite tier
      const eliteWeekAchieved = totalMembers > 0 && (eliteMembers / (totalMembers as number)) >= 0.8;

      // Update or create elite week record
      const { error: upsertError } = await supabase
        .from('elite_week_tracker')
        .upsert({
          moai_id: moaiId,
          week_start_date: currentWeekStart.toISOString().split('T')[0],
          members_completed: eliteMembers,
          members_required: Math.ceil((totalMembers as number) * 0.8),
          elite_week_achieved: eliteWeekAchieved,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'moai_id,week_start_date',
        });

      if (upsertError) {
        return { success: false, error: 'Failed to update elite week status' };
      }

      return { success: true, data: eliteWeekAchieved };
    } catch (error) {
      console.error('Error updating elite week status:', error);
      return { success: false, error: 'Failed to update elite week status' };
    }
  }

  // Helper methods
  private static groupActivitiesByWeek(activities: any[]): any[] {
    const weeklyData: { [key: string]: any } = {};

    activities.forEach(activity => {
      const activityDate = new Date(activity.created_at);
      const weekStart = this.getWeekStart(activityDate);
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = {
          weekStart: weekKey,
          activitiesCount: 0,
          totalDuration: 0,
          activities: [],
        };
      }

      weeklyData[weekKey].activitiesCount++;
      weeklyData[weekKey].totalDuration += activity.duration_minutes || 0;
      weeklyData[weekKey].activities.push(activity);
    });

    // Sort by week start date, most recent first
    return Object.values(weeklyData).sort((a, b) => 
      new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime()
    );
  }

  private static getWeekStart(date: Date): Date {
    const weekStart = new Date(date);
    const day = weekStart.getDay();
    const diff = weekStart.getDate() - day; // Adjust to Sunday
    weekStart.setDate(diff);
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  }

  private static determineTierFromWeeklyData(weeklyData: any[]): TierLevel {
    if (weeklyData.length === 0) return 'bronze';

    // Check each tier from highest to lowest
    const tiers: TierLevel[] = ['elite', 'gold', 'silver', 'bronze'];
    
    for (const tier of tiers) {
      const requirements = TIER_REQUIREMENTS[tier];
      const consecutiveWeeks = this.calculateConsecutiveWeeks(weeklyData, tier);
      
      if (consecutiveWeeks >= requirements.consecutiveWeeksRequired) {
        return tier;
      }
    }

    return 'bronze';
  }

  private static calculateConsecutiveWeeks(weeklyData: any[], tier: TierLevel): number {
    const requirements = TIER_REQUIREMENTS[tier];
    let consecutiveWeeks = 0;
    
    for (const week of weeklyData) {
      if (week.activitiesCount >= requirements.minWeeklyActivities) {
        consecutiveWeeks++;
      } else {
        break;
      }
    }
    
    return consecutiveWeeks;
  }

  private static getCurrentWeekProgress(weeklyData: any[]): any {
    if (weeklyData.length === 0) {
      return { activitiesCount: 0, totalDuration: 0 };
    }
    
    return weeklyData[0]; // Most recent week
  }

  private static getNextTier(currentTier: TierLevel): TierLevel | null {
    const progression: Record<TierLevel, TierLevel | null> = {
      bronze: 'silver',
      silver: 'gold',
      gold: 'elite',
      elite: null,
    };
    
    return progression[currentTier];
  }

  private static canPromoteToTier(weeklyData: any[], tier: TierLevel): boolean {
    const requirements = TIER_REQUIREMENTS[tier];
    const consecutiveWeeks = this.calculateConsecutiveWeeks(weeklyData, tier);
    return consecutiveWeeks >= requirements.consecutiveWeeksRequired;
  }

  private static scoreToTier(score: number): TierLevel {
    if (score >= 3.5) return 'elite';
    if (score >= 2.5) return 'gold';
    if (score >= 1.5) return 'silver';
    return 'bronze';
  }

  private static calculateStreakData(userId: string, weeklyData: any[]): StreakData {
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let lastActivityDate: string | null = null;

    // Calculate current streak (from most recent week backwards)
    for (const week of weeklyData) {
      if (week.activitiesCount >= 3) { // Minimum for streak
        if (currentStreak === 0) {
          currentStreak = 1;
        } else {
          currentStreak++;
        }
        tempStreak++;
      } else {
        if (currentStreak === 0) {
          break; // No current streak
        }
        break;
      }
    }

    // Calculate longest streak
    tempStreak = 0;
    for (const week of weeklyData.reverse()) { // Check chronologically
      if (week.activitiesCount >= 3) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    if (weeklyData.length > 0 && weeklyData[0].activities.length > 0) {
      lastActivityDate = weeklyData[0].activities[0].created_at;
    }

    const weeklyStreaks = weeklyData.map(week => ({
      weekStart: week.weekStart,
      completed: week.activitiesCount >= 3,
      activitiesCount: week.activitiesCount,
      commitmentMet: week.activitiesCount >= 3,
    }));

    return {
      userId,
      currentStreak,
      longestStreak,
      lastActivityDate,
      weeklyStreaks: weeklyStreaks.reverse(), // Back to most recent first
    };
  }
}