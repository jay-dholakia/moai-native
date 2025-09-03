import { supabase } from '@/lib/supabase';
import { ServiceResponse } from './types';

// Updated interfaces to match actual database schema
export interface MoaiToken {
  id: string;
  user_id: string;
  moai_id?: string;
  source_type: 'activity' | 'rest_day' | 'commitment_individual' | 'commitment_moai' | 'tier' | 'stone';
  points: number;
  awarded_on: string;
  week_start_date?: string;
  created_at: string;
}

export interface UserTokenPurchase {
  id: string;
  user_id: string;
  tokens_awarded: number;
  amount_usd: number;
  stripe_session_id: string;
  bundle_type: string;
  created_at: string;
  updated_at: string;
}

export interface TokenBalance {
  user_id: string;
  total_balance: number;
  earned_tokens: number;
  purchased_tokens: number;
  // Legacy compatibility fields
  id?: string;
  balance: number; // Alias for total_balance
  lifetime_earned: number; // Alias for earned_tokens  
  lifetime_spent: number; // Always 0 since we don't track spending in this schema
  last_updated?: string;
  created_at?: string;
}

export interface TokenTransaction {
  id: string;
  user_id: string;
  moai_id?: string;
  source_type: MoaiToken['source_type'];
  points: number;
  awarded_on: string;
  week_start_date?: string;
  created_at: string;
  // Legacy compatibility fields for existing components
  type: 'earn' | 'spend' | 'bonus' | 'refund';
  amount: number; // Alias for points
  balance_after?: number;
  description: string;
  source: 'activity' | 'achievement' | 'streak' | 'tier_promotion' | 'purchase' | 'marketplace' | 'admin';
  reference_id?: string;
  reference_type?: 'activity_log' | 'badge' | 'tier' | 'purchase' | 'marketplace_item';
}

// Legacy interfaces for backward compatibility
export interface TokenEarningRule {
  id: string;
  source: string;
  condition: string;
  base_amount: number;
  multiplier?: number;
  description: string;
  is_active: boolean;
}

export interface MarketplaceItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  category: 'badge' | 'theme' | 'avatar' | 'boost' | 'premium';
  image_url?: string;
  is_available: boolean;
  purchase_limit?: number;
  created_at: string;
}

export interface TokenPurchase {
  id: string;
  user_id: string;
  item_id: string;
  cost: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  purchased_at: string;
  item?: MarketplaceItem;
}

export class TokenService {
  /**
   * Get user's current token balance using the database function
   */
  static async getUserBalance(userId: string): Promise<ServiceResponse<TokenBalance>> {
    try {
      // Use the existing database function to get balance
      const { data, error } = await supabase
        .rpc('get_user_token_balance', { p_user_id: userId });

      if (error) throw error;

      // Get breakdown of earned vs purchased tokens
      const { data: earnedTokens } = await supabase
        .from('moai_tokens')
        .select('points')
        .eq('user_id', userId);

      const { data: purchasedTokens } = await supabase
        .from('user_token_purchases')
        .select('tokens_awarded')
        .eq('user_id', userId);

      const earnedTotal = earnedTokens?.reduce((sum, token) => sum + token.points, 0) || 0;
      const purchasedTotal = purchasedTokens?.reduce((sum, purchase) => sum + purchase.tokens_awarded, 0) || 0;

      const balance: TokenBalance = {
        user_id: userId,
        total_balance: data || 0,
        earned_tokens: earnedTotal,
        purchased_tokens: purchasedTotal,
        // Legacy compatibility
        balance: data || 0,
        lifetime_earned: earnedTotal,
        lifetime_spent: 0, // Not tracked in current schema
      };

      return { success: true, data: balance };
    } catch (error) {
      console.error('Error fetching token balance:', error);
      return { success: false, error: 'Failed to fetch token balance' };
    }
  }

  /**
   * Award tokens to a user for various activities
   */
  static async awardTokens(
    userId: string,
    points: number,
    sourceType: MoaiToken['source_type'],
    moaiId?: string,
    weekStartDate?: string
  ): Promise<ServiceResponse<MoaiToken>> {
    try {
      const { data, error } = await supabase
        .from('moai_tokens')
        .insert({
          user_id: userId,
          moai_id: moaiId,
          source_type: sourceType,
          points,
          week_start_date: weekStartDate,
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error awarding tokens:', error);
      return { success: false, error: 'Failed to award tokens' };
    }
  }

  /**
   * Get user's token transaction history
   */
  static async getTransactionHistory(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<ServiceResponse<TokenTransaction[]>> {
    try {
      const { data, error } = await supabase
        .from('moai_tokens')
        .select('*')
        .eq('user_id', userId)
        .order('awarded_on', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      // Transform to legacy format for compatibility
      const transactions: TokenTransaction[] = (data || []).map(token => ({
        ...token,
        type: 'earn' as const,
        amount: token.points,
        description: `${token.source_type} activity`,
        source: this.mapSourceTypeToLegacySource(token.source_type),
      }));

      return { success: true, data: transactions };
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      return { success: false, error: 'Failed to fetch transaction history' };
    }
  }

  /**
   * Get user's token purchase history
   */
  static async getUserPurchases(userId: string): Promise<ServiceResponse<UserTokenPurchase[]>> {
    try {
      const { data, error } = await supabase
        .from('user_token_purchases')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching user purchases:', error);
      return { success: false, error: 'Failed to fetch purchases' };
    }
  }

  /**
   * Calculate tokens for activity completion
   */
  static calculateActivityTokens(activityType: string, duration?: number): number {
    // Base token amounts for different activity types
    const baseTokens: Record<string, number> = {
      'cardio': 15,
      'strength': 20,
      'flexibility': 10,
      'sports': 25,
      'walking': 8,
      'running': 15,
      'cycling': 15,
      'swimming': 20,
      'yoga': 12,
      'default': 10,
    };

    let tokens = baseTokens[activityType.toLowerCase()] || baseTokens.default;
    
    // Duration bonus: extra tokens for longer activities
    if (duration && duration > 1800) { // 30+ minutes
      const bonusMinutes = Math.floor((duration - 1800) / 600); // Bonus per 10 minutes after 30
      tokens += Math.min(bonusMinutes * 2, 20); // Cap at 20 bonus tokens
    }

    return Math.max(tokens, 1); // Minimum 1 token
  }

  /**
   * Award tokens for completing an activity
   */
  static async awardActivityTokens(
    userId: string,
    activityType: string,
    duration?: number,
    moaiId?: string
  ): Promise<ServiceResponse<MoaiToken>> {
    const tokenAmount = this.calculateActivityTokens(activityType, duration);
    
    return this.awardTokens(
      userId,
      tokenAmount,
      'activity',
      moaiId,
      this.getCurrentWeekStart()
    );
  }

  /**
   * Award tokens for tier progression
   */
  static async awardTierTokens(
    userId: string,
    tierLevel: number,
    moaiId?: string
  ): Promise<ServiceResponse<MoaiToken>> {
    const tokenAmount = tierLevel * 50; // 50 tokens per tier level
    
    return this.awardTokens(
      userId,
      tokenAmount,
      'tier',
      moaiId,
      this.getCurrentWeekStart()
    );
  }

  /**
   * Award tokens for individual commitment completion
   */
  static async awardIndividualCommitmentTokens(
    userId: string,
    moaiId?: string
  ): Promise<ServiceResponse<MoaiToken>> {
    return this.awardTokens(
      userId,
      30, // 30 tokens for completing individual commitment
      'commitment_individual',
      moaiId,
      this.getCurrentWeekStart()
    );
  }

  /**
   * Award tokens for moai commitment completion
   */
  static async awardMoaiCommitmentTokens(
    userId: string,
    moaiId: string
  ): Promise<ServiceResponse<MoaiToken>> {
    return this.awardTokens(
      userId,
      50, // 50 tokens for completing moai commitment
      'commitment_moai',
      moaiId,
      this.getCurrentWeekStart()
    );
  }

  /**
   * Award tokens for rest day (active recovery)
   */
  static async awardRestDayTokens(
    userId: string,
    moaiId?: string
  ): Promise<ServiceResponse<MoaiToken>> {
    return this.awardTokens(
      userId,
      10, // 10 tokens for logging rest day
      'rest_day',
      moaiId,
      this.getCurrentWeekStart()
    );
  }

  /**
   * Award tokens for collecting stones
   */
  static async awardStoneTokens(
    userId: string,
    moaiId: string
  ): Promise<ServiceResponse<MoaiToken>> {
    return this.awardTokens(
      userId,
      25, // 25 tokens per stone
      'stone',
      moaiId,
      this.getCurrentWeekStart()
    );
  }

  /**
   * Get token leaderboard for a specific moai
   */
  static async getMoaiTokenLeaderboard(
    moaiId: string,
    limit: number = 10,
    weekStartDate?: string
  ): Promise<ServiceResponse<Array<{ user_id: string; total_points: number; profile?: any }>>> {
    try {
      let query = supabase
        .from('moai_tokens')
        .select(`
          user_id,
          points,
          profiles!inner (
            id,
            first_name,
            last_name,
            username,
            profile_image
          )
        `)
        .eq('moai_id', moaiId);

      if (weekStartDate) {
        query = query.eq('week_start_date', weekStartDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Group by user and sum points
      const userPoints = (data || []).reduce((acc: Record<string, any>, token: any) => {
        if (!acc[token.user_id]) {
          acc[token.user_id] = {
            user_id: token.user_id,
            total_points: 0,
            profile: token.profiles
          };
        }
        acc[token.user_id].total_points += token.points;
        return acc;
      }, {});

      const leaderboard = Object.values(userPoints)
        .sort((a: any, b: any) => b.total_points - a.total_points)
        .slice(0, limit);

      return { success: true, data: leaderboard };
    } catch (error) {
      console.error('Error fetching moai token leaderboard:', error);
      return { success: false, error: 'Failed to fetch leaderboard' };
    }
  }

  /**
   * Get global token leaderboard
   */
  static async getGlobalTokenLeaderboard(limit: number = 10): Promise<ServiceResponse<Array<{ user_id: string; total_points: number; profile?: any }>>> {
    try {
      const { data, error } = await supabase
        .from('moai_tokens')
        .select(`
          user_id,
          points,
          profiles!inner (
            id,
            first_name,
            last_name,
            username,
            profile_image
          )
        `);

      if (error) throw error;

      // Group by user and sum points
      const userPoints = (data || []).reduce((acc: Record<string, any>, token: any) => {
        if (!acc[token.user_id]) {
          acc[token.user_id] = {
            user_id: token.user_id,
            total_points: 0,
            profile: token.profiles
          };
        }
        acc[token.user_id].total_points += token.points;
        return acc;
      }, {});

      const leaderboard = Object.values(userPoints)
        .sort((a: any, b: any) => b.total_points - a.total_points)
        .slice(0, limit);

      return { success: true, data: leaderboard };
    } catch (error) {
      console.error('Error fetching global token leaderboard:', error);
      return { success: false, error: 'Failed to fetch leaderboard' };
    }
  }

  /**
   * Get weekly token summary for a user
   */
  static async getWeeklyTokenSummary(
    userId: string,
    weekStartDate: string
  ): Promise<ServiceResponse<{ total_tokens: number; breakdown: Record<string, number> }>> {
    try {
      const { data, error } = await supabase
        .from('moai_tokens')
        .select('source_type, points')
        .eq('user_id', userId)
        .eq('week_start_date', weekStartDate);

      if (error) throw error;

      const breakdown = (data || []).reduce((acc: Record<string, number>, token) => {
        acc[token.source_type] = (acc[token.source_type] || 0) + token.points;
        return acc;
      }, {});

      const totalTokens = Object.values(breakdown).reduce((sum: number, points: number) => sum + points, 0);

      return { 
        success: true, 
        data: { 
          total_tokens: totalTokens, 
          breakdown 
        } 
      };
    } catch (error) {
      console.error('Error fetching weekly token summary:', error);
      return { success: false, error: 'Failed to fetch weekly summary' };
    }
  }

  /**
   * Helper function to get current week start date (Monday)
   */
  private static getCurrentWeekStart(): string {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysToMonday = (dayOfWeek + 6) % 7; // Convert Sunday=0 to Monday=0 based
    const monday = new Date(now);
    monday.setDate(now.getDate() - daysToMonday);
    monday.setHours(0, 0, 0, 0);
    return monday.toISOString().split('T')[0]; // Return YYYY-MM-DD format
  }

  /**
   * Helper function to map source type to legacy source format
   */
  private static mapSourceTypeToLegacySource(sourceType: MoaiToken['source_type']): TokenTransaction['source'] {
    const mapping: Record<MoaiToken['source_type'], TokenTransaction['source']> = {
      'activity': 'activity',
      'rest_day': 'activity',
      'commitment_individual': 'achievement',
      'commitment_moai': 'achievement',
      'tier': 'tier_promotion',
      'stone': 'achievement'
    };
    return mapping[sourceType] || 'activity';
  }

  /**
   * Check if user can afford a certain token cost
   */
  static async canAfford(userId: string, cost: number): Promise<ServiceResponse<boolean>> {
    const balanceResponse = await this.getUserBalance(userId);
    if (!balanceResponse.success) {
      return { success: false, error: balanceResponse.error };
    }

    return { 
      success: true, 
      data: balanceResponse.data.total_balance >= cost 
    };
  }

  /**
   * Get user's token earning stats
   */
  static async getUserTokenStats(userId: string): Promise<ServiceResponse<{
    total_earned: number;
    this_week: number;
    favorite_source: string;
    streak_days: number;
  }>> {
    try {
      const balanceResponse = await this.getUserBalance(userId);
      if (!balanceResponse.success) {
        return { success: false, error: balanceResponse.error };
      }

      // Get this week's tokens
      const currentWeek = this.getCurrentWeekStart();
      const weeklyResponse = await this.getWeeklyTokenSummary(userId, currentWeek);
      const thisWeekTokens = weeklyResponse.success ? weeklyResponse.data.total_tokens : 0;

      // Get source type breakdown for favorite source
      const { data: allTokens } = await supabase
        .from('moai_tokens')
        .select('source_type, points')
        .eq('user_id', userId);

      const sourceBreakdown = (allTokens || []).reduce((acc: Record<string, number>, token) => {
        acc[token.source_type] = (acc[token.source_type] || 0) + token.points;
        return acc;
      }, {});

      const favoriteSource = Object.keys(sourceBreakdown).reduce((a, b) => 
        sourceBreakdown[a] > sourceBreakdown[b] ? a : b, 'activity'
      );

      return {
        success: true,
        data: {
          total_earned: balanceResponse.data.earned_tokens,
          this_week: thisWeekTokens,
          favorite_source: favoriteSource,
          streak_days: 0, // Would need additional logic to calculate streaks
        }
      };
    } catch (error) {
      console.error('Error fetching user token stats:', error);
      return { success: false, error: 'Failed to fetch token stats' };
    }
  }

  // ===== LEGACY COMPATIBILITY METHODS =====
  // These methods maintain compatibility with existing hooks and components

  /**
   * Get marketplace items (legacy compatibility stub)
   */
  static async getMarketplaceItems(): Promise<ServiceResponse<MarketplaceItem[]>> {
    // TODO: Implement marketplace functionality when marketplace tables are created
    return { success: true, data: [] };
  }

  /**
   * Get earning rules (legacy compatibility stub)
   */
  static async getEarningRules(): Promise<ServiceResponse<TokenEarningRule[]>> {
    // TODO: Implement earning rules when business rules are defined
    return { success: true, data: [] };
  }

  /**
   * Get token leaderboard (alias for getMoaiTokenLeaderboard)
   */
  static async getTokenLeaderboard(limit: number = 10): Promise<ServiceResponse<Array<{ user_id: string; total_points: number; profile?: any }>>> {
    return this.getGlobalTokenLeaderboard(limit);
  }

  /**
   * Spend tokens (legacy compatibility stub)
   */
  static async spendTokens(userId: string, amount: number, description: string, reference?: { type: string; id: string }): Promise<ServiceResponse<any>> {
    // TODO: Implement token spending when spending mechanism is defined
    console.warn('Token spending not yet implemented - tokens are currently earn-only');
    return { success: false, error: 'Token spending not yet implemented' };
  }

  /**
   * Purchase marketplace item (legacy compatibility stub)
   */
  static async purchaseMarketplaceItem(userId: string, itemId: string): Promise<ServiceResponse<TokenPurchase>> {
    // TODO: Implement marketplace purchasing when marketplace tables are created
    return { success: false, error: 'Marketplace not yet implemented' };
  }

  /**
   * Award achievement tokens (legacy compatibility)
   */
  static async awardAchievementTokens(userId: string, achievementId: string, moaiId?: string): Promise<ServiceResponse<MoaiToken>> {
    // Use tier tokens for achievement rewards
    return this.awardTierTokens(userId, 1, moaiId);
  }

  /**
   * Award streak tokens (alias for rest day tokens)
   */
  static async awardStreakTokens(userId: string, streakDays: number, moaiId?: string): Promise<ServiceResponse<MoaiToken>> {
    const tokenAmount = Math.min(streakDays * 5, 50); // 5 tokens per day, cap at 50
    return this.awardTokens(userId, tokenAmount, 'commitment_individual', moaiId, this.getCurrentWeekStart());
  }
}

export default TokenService;