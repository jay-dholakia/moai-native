import { supabase } from '@/lib/supabase';
import { ServiceResponse } from './types';

export interface MoaiInvitation {
  id: string;
  moai_id: string;
  invited_by: string;
  invite_code: string;
  max_uses: number | null;
  current_uses: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateInvitationParams {
  moaiId: string;
  maxUses?: number;
  expiresHours?: number;
}

export interface InvitationResult {
  success: boolean;
  error?: string;
  invitation_id?: string;
  invite_code?: string;
  expires_at?: string;
}

export interface JoinResult {
  success: boolean;
  error?: string;
  moai_id?: string;
  moai_name?: string;
}

export interface InviteDetails {
  success: boolean;
  error?: string;
  moai_name?: string;
  inviter_name?: string;
  moai_id?: string;
  is_valid?: boolean;
  is_expired?: boolean;
  is_full?: boolean;
  member_count?: number;
  max_members?: number;
  member_names?: string[];
}

export class InvitationService {
  /**
   * Get details about an invite code to validate and show information
   */
  static async getInviteDetails(inviteCode: string): Promise<ServiceResponse<InviteDetails>> {
    try {
      console.log(`🔍 [INVITE] Getting details for code: "${inviteCode}"`);
      
      if (!inviteCode || inviteCode.trim() === '') {
        return { success: false, error: 'Empty invite code provided' };
      }
      
      // Query for the invitation
      const { data: invitationData, error: invitationError } = await supabase
        .from('moai_invitations')
        .select('*')
        .eq('invite_code', inviteCode.trim())
        .single();

      if (invitationError || !invitationData) {
        console.error('❌ [INVITE] No invitation found:', invitationError);
        return { 
          success: true, 
          data: { 
            success: false, 
            error: `No invitation found with code "${inviteCode}"` 
          } 
        };
      }

      console.log(`📋 [INVITE] Found invitation:`, invitationData);

      // Get moai details
      const { data: moaiData, error: moaiError } = await supabase
        .from('moais')
        .select('name, member_count, max_members')
        .eq('id', invitationData.moai_id)
        .single();

      if (moaiError || !moaiData) {
        console.error('❌ [INVITE] Moai not found:', moaiError);
        return { 
          success: true, 
          data: { 
            success: false, 
            error: 'Associated moai not found' 
          } 
        };
      }

      // Get inviter details
      const { data: inviterData, error: inviterError } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', invitationData.invited_by)
        .single();

      if (inviterError || !inviterData) {
        console.error('❌ [INVITE] Inviter not found:', inviterError);
        return { 
          success: true, 
          data: { 
            success: false, 
            error: 'Invitation creator not found' 
          } 
        };
      }

      // Get member names
      const { data: memberData, error: memberError } = await supabase
        .from('moai_members')
        .select('profile_id')
        .eq('moai_id', invitationData.moai_id)
        .eq('is_active', true);

      let memberNames: string[] = [];
      if (memberData && !memberError && memberData.length > 0) {
        const profileIds = memberData.map(member => member.profile_id);
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .in('id', profileIds);

        if (profileData && !profileError) {
          memberNames = profileData
            .filter(profile => profile.first_name)
            .map(profile => {
              const lastName = profile.last_name ? profile.last_name[0] + '.' : '';
              return `${profile.first_name} ${lastName}`.trim();
            });
        }
      }

      // Validation checks
      const now = new Date();
      const isActive = invitationData.is_active;
      
      let isExpired = false;
      if (invitationData.expires_at) {
        const expiresAt = new Date(invitationData.expires_at);
        isExpired = now > expiresAt;
      }
      
      const hasReachedMaxUses = invitationData.max_uses && invitationData.current_uses >= invitationData.max_uses;
      const isFull = moaiData.member_count >= moaiData.max_members;
      const isValid = isActive && !isExpired && !hasReachedMaxUses && !isFull;

      console.log(`🎯 [INVITE] Validation result:`, {
        isActive,
        isExpired,
        hasReachedMaxUses,
        isFull,
        isValid
      });

      const result: InviteDetails = {
        success: true,
        moai_name: moaiData.name,
        inviter_name: inviterData.first_name,
        moai_id: invitationData.moai_id,
        is_valid: isValid,
        is_expired: isExpired,
        is_full: isFull,
        member_count: moaiData.member_count,
        max_members: moaiData.max_members,
        member_names: memberNames,
      };

      return { success: true, data: result };
    } catch (error) {
      console.error('💥 [INVITE] Error in getInviteDetails:', error);
      return { 
        success: false, 
        error: `Failed to get invite details: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Validate and consume an invite code to join a moai
   */
  static async validateAndJoinViaInvite(inviteCode: string): Promise<ServiceResponse<JoinResult>> {
    try {
      console.log(`🎫 [INVITE] Validating and joining via code: "${inviteCode}"`);
      
      const { data, error } = await supabase.rpc('validate_and_consume_invite', {
        p_invite_code: inviteCode
      });

      if (error) {
        console.error('❌ [INVITE] RPC error:', error);
        throw error;
      }

      const result = data as unknown as JoinResult;
      console.log(`✅ [INVITE] Join result:`, result);
      
      return { success: true, data: result };
    } catch (error) {
      console.error('❌ [INVITE] Error joining via invite:', error);
      return { 
        success: false, 
        error: `Failed to join via invite: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Create a new moai invitation
   */
  static async createMoaiInvitation(params: CreateInvitationParams): Promise<ServiceResponse<InvitationResult>> {
    try {
      console.log(`🚀 [INVITE] Creating invitation with params:`, params);
      
      const { data, error } = await supabase.rpc('create_moai_invitation', {
        p_moai_id: params.moaiId,
        p_max_uses: params.maxUses || null,
        p_expires_hours: params.expiresHours || null
      });

      if (error) {
        console.error(`❌ [INVITE] RPC error:`, error);
        throw error;
      }
      
      const result = data as unknown as InvitationResult;
      console.log(`✅ [INVITE] Creation result:`, result);
      
      return { success: true, data: result };
    } catch (error) {
      console.error('❌ [INVITE] Error creating invitation:', error);
      return { 
        success: false, 
        error: `Failed to create invitation: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Fetch all invitations for a moai
   */
  static async fetchMoaiInvitations(moaiId: string): Promise<ServiceResponse<MoaiInvitation[]>> {
    try {
      const { data, error } = await supabase
        .from('moai_invitations')
        .select('*')
        .eq('moai_id', moaiId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [INVITE] Error fetching invitations:', error);
        throw error;
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('❌ [INVITE] Error fetching invitations:', error);
      return { 
        success: false, 
        error: `Failed to fetch invitations: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Deactivate an invitation
   */
  static async deactivateInvitation(invitationId: string): Promise<ServiceResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('moai_invitations')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', invitationId);

      if (error) {
        console.error('❌ [INVITE] Error deactivating invitation:', error);
        throw error;
      }

      return { success: true, data: true };
    } catch (error) {
      console.error('❌ [INVITE] Error deactivating invitation:', error);
      return { 
        success: false, 
        error: `Failed to deactivate invitation: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Generate invite URL for sharing
   */
  static generateInviteUrl(inviteCode: string): string {
    // In React Native, we don't have window.location, so we'll use a config-based approach
    const baseUrl = 'https://moai.app'; // This should come from app config
    return `${baseUrl}/join/${inviteCode}`;
  }
}