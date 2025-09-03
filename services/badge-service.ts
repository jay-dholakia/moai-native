import { BaseService } from './base-service';
import { ServiceResponse } from './types';

export interface UserBadge {
  id: string;
  profile_id: string;
  badge_type: 'milestone' | 'moai_mover';
  badge_key: string;
  badge_name: string;
  badge_icon: string;
  badge_description: string;
  milestone_value?: number;
  earned_at: string;
  created_at: string;
}

export interface MilestoneBadge {
  level: number;
  name: string;
  icon: string;
  description: string;
  key: string;
  unlocked: boolean;
}

const MILESTONE_BADGES: Omit<MilestoneBadge, 'unlocked'>[] = [
  { level: 10, name: 'Spark', icon: '⭐️', description: "You've started moving. Let's go!", key: 'spark' },
  { level: 50, name: 'Momentum', icon: '🍃', description: "You've got a rhythm. Keep it up.", key: 'momentum' },
  { level: 100, name: 'On Fire', icon: '🔥', description: "You're heating up. 100 down.", key: 'on_fire' },
  { level: 200, name: 'Resilient', icon: '💪', description: 'Strength in numbers — 200 strong.', key: 'resilient' },
  { level: 300, name: 'Relentless', icon: '🏃', description: 'You never miss. Keep chasing.', key: 'relentless' },
  { level: 400, name: 'Charged Up', icon: '⚡', description: 'Energy for days. ⚡️ Charged.', key: 'charged_up' },
  { level: 500, name: 'Machine Mode', icon: '🧱', description: "Built different. You're a machine.", key: 'machine_mode' },
  { level: 600, name: 'Lift Off', icon: '🚀', description: "You've launched. Sky's the limit.", key: 'lift_off' },
  { level: 700, name: 'Climber', icon: '⛰️', description: 'Every rep is a step higher.', key: 'climber' },
  { level: 800, name: 'Pathfinder', icon: '🧭', description: "You've found your groove.", key: 'pathfinder' },
  { level: 900, name: 'Untamed', icon: '🐉', description: "You've unlocked beast mode.", key: 'untamed' },
  { level: 1000, name: 'Legend', icon: '🏆', description: 'You made history. Legend. 🏆', key: 'legend' },
];

export class BadgeService extends BaseService {
  static async fetchUserBadges(profileId: string): Promise<ServiceResponse<UserBadge[]>> {
    try {
      const { data, error } = await this.supabase
        .from('user_badges')
        .select('*')
        .eq('profile_id', profileId)
        .order('earned_at', { ascending: false });

      if (error) {
        console.error('Error fetching user badges:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data as UserBadge[] };
    } catch (error) {
      console.error('Error fetching user badges:', error);
      return { success: false, error: 'Failed to fetch user badges' };
    }
  }

  static getMilestoneBadges(totalActivities: number, userBadges: UserBadge[]): MilestoneBadge[] {
    const earnedBadgeKeys = userBadges
      .filter(badge => badge.badge_type === 'milestone')
      .map(badge => badge.badge_key);

    return MILESTONE_BADGES.map(badge => ({
      ...badge,
      unlocked: totalActivities >= badge.level || earnedBadgeKeys.includes(badge.key)
    }));
  }

  static getCurrentMilestoneBadge(totalActivities: number): Omit<MilestoneBadge, 'unlocked'> | null {
    for (let i = MILESTONE_BADGES.length - 1; i >= 0; i--) {
      if (totalActivities >= MILESTONE_BADGES[i].level) {
        return MILESTONE_BADGES[i];
      }
    }
    return null;
  }

  static getNextMilestoneBadge(totalActivities: number): Omit<MilestoneBadge, 'unlocked'> | null {
    for (const badge of MILESTONE_BADGES) {
      if (totalActivities < badge.level) {
        return badge;
      }
    }
    return null;
  }

  static getMilestoneProgress(totalActivities: number): number {
    const currentBadge = this.getCurrentMilestoneBadge(totalActivities);
    const nextBadge = this.getNextMilestoneBadge(totalActivities);
    
    if (!nextBadge) return 100; // Max level reached
    if (!currentBadge) {
      // No current badge, show progress to first badge
      return Math.min((totalActivities / nextBadge.level) * 100, 95);
    }
    
    const progressInCurrentTier = totalActivities - currentBadge.level;
    const tierRange = nextBadge.level - currentBadge.level;
    
    // Ensure we show at least 5% progress when at a milestone level
    const calculatedProgress = (progressInCurrentTier / tierRange) * 100;
    return Math.max(calculatedProgress, 5);
  }

  static async getMoaiMoverWeeks(profileId: string): Promise<ServiceResponse<number>> {
    try {
      const { data, error } = await this.supabase
        .from('user_badges')
        .select('milestone_value')
        .eq('profile_id', profileId)
        .eq('badge_type', 'moai_mover')
        .order('earned_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching moai mover weeks:', error);
        return { success: false, error: error.message };
      }
      
      if (!data || data.length === 0) {
        return { success: true, data: 0 };
      }
      
      return { success: true, data: data[0].milestone_value || 0 };
    } catch (error) {
      console.error('Error fetching moai mover weeks:', error);
      return { success: false, error: 'Failed to fetch moai mover weeks' };
    }
  }

  // Helper function to create a new badge for a user
  static async awardBadge(
    profileId: string, 
    badgeType: 'milestone' | 'moai_mover',
    badgeKey: string,
    badgeName: string,
    badgeIcon: string,
    badgeDescription: string,
    milestoneValue?: number
  ): Promise<ServiceResponse<UserBadge>> {
    try {
      const { data, error } = await this.supabase
        .from('user_badges')
        .insert({
          profile_id: profileId,
          badge_type: badgeType,
          badge_key: badgeKey,
          badge_name: badgeName,
          badge_icon: badgeIcon,
          badge_description: badgeDescription,
          milestone_value: milestoneValue,
          earned_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error awarding badge:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data as UserBadge };
    } catch (error) {
      console.error('Error awarding badge:', error);
      return { success: false, error: 'Failed to award badge' };
    }
  }

  // Check if user should receive a new milestone badge
  static async checkAndAwardMilestoneBadges(profileId: string, totalActivities: number): Promise<ServiceResponse<UserBadge[]>> {
    try {
      // Get current user badges
      const userBadgesResponse = await this.fetchUserBadges(profileId);
      if (!userBadgesResponse.success) {
        return { success: false, error: userBadgesResponse.error };
      }

      const userBadges = userBadgesResponse.data;
      const earnedMilestoneBadges = userBadges
        .filter(badge => badge.badge_type === 'milestone')
        .map(badge => badge.badge_key);

      const newBadges: UserBadge[] = [];

      // Check each milestone badge
      for (const badge of MILESTONE_BADGES) {
        if (totalActivities >= badge.level && !earnedMilestoneBadges.includes(badge.key)) {
          const awardResult = await this.awardBadge(
            profileId,
            'milestone',
            badge.key,
            badge.name,
            badge.icon,
            badge.description,
            badge.level
          );

          if (awardResult.success) {
            newBadges.push(awardResult.data);
          }
        }
      }

      return { success: true, data: newBadges };
    } catch (error) {
      console.error('Error checking milestone badges:', error);
      return { success: false, error: 'Failed to check milestone badges' };
    }
  }
}