import { supabase } from '@/lib/supabase';
import { Moai, MoaiMember, CreateMoaiData, ServiceResponse, PaginatedResponse } from './types';
import { withServiceWrapper, withPagination, getValidSessionForRequest } from './base-service';

// Fetch all public moais
export const fetchMoais = async (
  page: number = 0,
  limit: number = 20
): Promise<ServiceResponse<PaginatedResponse<Moai>>> => {
  return withServiceWrapper(async () => {
    const query = supabase
      .from('moais')
      .select(`
        *,
        moai_members!inner(count)
      `)
      .eq('is_active', true)
      .eq('is_archived', false)
      .eq('moai_type', 'public');

    const result = await withPagination<Moai>(query, page, limit);
    
    return {
      data: result.data,
      count: result.count,
      hasMore: result.hasMore,
      nextPage: result.hasMore ? page + 1 : undefined
    };
  }, 'Fetch moais');
};

// Fetch user's moais
export const fetchUserMoais = async (
  userId?: string,
  page: number = 0,
  limit: number = 20
): Promise<ServiceResponse<PaginatedResponse<Moai>>> => {
  return withServiceWrapper(async () => {
    const session = await getValidSessionForRequest();
    const targetUserId = userId || session?.user?.id;
    
    if (!targetUserId) {
      throw new Error('User ID required');
    }

    const query = supabase
      .from('moais')
      .select(`
        *,
        moai_members!inner(
          id,
          role_in_moai,
          is_active,
          joined_at
        )
      `)
      .eq('moai_members.profile_id', targetUserId)
      .eq('moai_members.is_active', true)
      .eq('is_active', true);

    const result = await withPagination<Moai>(query, page, limit);
    
    return {
      data: result.data,
      count: result.count,
      hasMore: result.hasMore,
      nextPage: result.hasMore ? page + 1 : undefined
    };
  }, 'Fetch user moais');
};

// Fetch moai by ID with members
export const fetchMoaiById = async (moaiId: string): Promise<ServiceResponse<Moai & { members?: MoaiMember[] }>> => {
  return withServiceWrapper(async () => {
    const { data: moai, error: moaiError } = await supabase
      .from('moais')
      .select('*')
      .eq('id', moaiId)
      .single();

    if (moaiError) throw moaiError;

    // Fetch members
    const { data: members, error: membersError } = await supabase
      .from('moai_members')
      .select(`
        *,
        profile:profiles!profile_id(
          id,
          first_name,
          last_name,
          username,
          profile_image
        )
      `)
      .eq('moai_id', moaiId)
      .eq('is_active', true)
      .order('joined_at', { ascending: true });

    if (membersError) throw membersError;

    return {
      ...moai,
      members: members || []
    };
  }, 'Fetch moai by ID');
};

// Fetch moai members
export const fetchMoaiMembers = async (moaiId: string): Promise<ServiceResponse<MoaiMember[]>> => {
  return withServiceWrapper(async () => {
    const { data: members, error } = await supabase
      .from('moai_members')
      .select(`
        *,
        profile:profiles!profile_id(
          id,
          first_name,
          last_name,
          username,
          profile_image,
          bio
        )
      `)
      .eq('moai_id', moaiId)
      .eq('is_active', true)
      .order('joined_at', { ascending: true });

    if (error) throw error;
    return members || [];
  }, 'Fetch moai members');
};

// Create new moai
export const createMoai = async (moaiData: CreateMoaiData): Promise<ServiceResponse<Moai>> => {
  return withServiceWrapper(async () => {
    const session = await getValidSessionForRequest();
    if (!session?.user?.id) {
      throw new Error('Authentication required');
    }

    // Create the moai
    const { data: newMoai, error: moaiError } = await supabase
      .from('moais')
      .insert([{
        ...moaiData,
        creator_id: session.user.id,
        is_active: true,
        is_archived: false,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (moaiError) throw moaiError;

    // Add creator as admin member with proper error handling
    const { error: memberError } = await supabase
      .from('moai_members')
      .insert([{
        moai_id: newMoai.id,
        profile_id: session.user.id,
        role_in_moai: 'admin',
        is_active: true,
        joined_at: new Date().toISOString()
      }]);

    if (memberError) {
      // If member insert fails, cleanup the moai to maintain consistency
      await supabase.from('moais').delete().eq('id', newMoai.id);
      throw memberError;
    }

    // Update member count to reflect new membership
    await supabase
      .from('moais')
      .update({ member_count: 1 })
      .eq('id', newMoai.id);

    return newMoai;
  }, 'Create moai', true, 'Moai created successfully');
};

// Update moai
export const updateMoai = async (
  moaiId: string, 
  updates: Partial<CreateMoaiData>
): Promise<ServiceResponse<Moai>> => {
  return withServiceWrapper(async () => {
    const { data: updatedMoai, error } = await supabase
      .from('moais')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', moaiId)
      .select()
      .single();

    if (error) throw error;
    return updatedMoai;
  }, 'Update moai', true, 'Moai updated successfully');
};

// Delete moai (soft delete)
export const deleteMoai = async (moaiId: string): Promise<ServiceResponse<boolean>> => {
  return withServiceWrapper(async () => {
    const { error } = await supabase
      .from('moais')
      .update({
        is_active: false,
        is_archived: true,
        status: 'archived',
        updated_at: new Date().toISOString()
      })
      .eq('id', moaiId);

    if (error) throw error;
    return true;
  }, 'Delete moai', true, 'Moai deleted successfully');
};

// Join moai
export const joinMoai = async (moaiId: string): Promise<ServiceResponse<MoaiMember>> => {
  return withServiceWrapper(async () => {
    const session = await getValidSessionForRequest();
    if (!session?.user?.id) {
      throw new Error('Authentication required');
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('moai_members')
      .select('*')
      .eq('moai_id', moaiId)
      .eq('profile_id', session.user.id)
      .single();

    if (existingMember) {
      if (existingMember.is_active === true) {
        throw new Error('You are already a member of this moai');
      }
      
      // Reactivate membership if previously left
      const { data: reactivatedMember, error } = await supabase
        .from('moai_members')
        .update({
          is_active: true,
          joined_at: new Date().toISOString()
        })
        .eq('id', existingMember.id)
        .select()
        .single();

      if (error) throw error;
      return reactivatedMember;
    }

    // Check moai capacity
    const { data: moai } = await supabase
      .from('moais')
      .select('max_members, member_count')
      .eq('id', moaiId)
      .single();

    if (moai?.max_members && moai.member_count >= moai.max_members) {
      throw new Error('This moai is at full capacity');
    }

    // Create new membership
    const { data: newMember, error } = await supabase
      .from('moai_members')
      .insert([{
        moai_id: moaiId,
        profile_id: session.user.id,
        role_in_moai: 'member',
        is_active: true,
        joined_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    // Update member count
    await supabase
      .from('moais')
      .update({ 
        member_count: (moai?.member_count || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', moaiId);

    return newMember;
  }, 'Join moai', true, 'Successfully joined moai');
};

// Leave moai
export const leaveMoai = async (moaiId: string): Promise<ServiceResponse<boolean>> => {
  return withServiceWrapper(async () => {
    const session = await getValidSessionForRequest();
    if (!session?.user?.id) {
      throw new Error('Authentication required');
    }

    const { error } = await supabase
      .from('moai_members')
      .update({
        is_active: false,
        left_at: new Date().toISOString()
      })
      .eq('moai_id', moaiId)
      .eq('profile_id', session.user.id);

    if (error) throw error;

    // Update member count
    const { data: moai } = await supabase
      .from('moais')
      .select('member_count')
      .eq('id', moaiId)
      .single();

    await supabase
      .from('moais')
      .update({ 
        member_count: Math.max(0, (moai?.member_count || 1) - 1),
        updated_at: new Date().toISOString()
      })
      .eq('id', moaiId);

    return true;
  }, 'Leave moai', true, 'Successfully left moai');
};

// Search moais
export const searchMoais = async (
  searchTerm: string,
  filters?: {
    type?: string;
    hobbies?: string[];
    location?: string;
  },
  page: number = 0,
  limit: number = 20
): Promise<ServiceResponse<PaginatedResponse<Moai>>> => {
  return withServiceWrapper(async () => {
    let query = supabase
      .from('moais')
      .select('*')
      .eq('is_active', true)
      .eq('is_archived', false)
      .eq('moai_type', 'public');

    // Add search term
    if (searchTerm) {
      query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
    }

    // Add filters
    if (filters?.type) {
      query = query.eq('type', filters.type);
    }

    if (filters?.hobbies && filters.hobbies.length > 0) {
      query = query.overlaps('hobbies', filters.hobbies);
    }

    if (filters?.location) {
      query = query.ilike('location_address', `%${filters.location}%`);
    }

    const result = await withPagination<Moai>(query, page, limit);
    
    return {
      data: result.data,
      count: result.count,
      hasMore: result.hasMore,
      nextPage: result.hasMore ? page + 1 : undefined
    };
  }, 'Search moais');
};

// Check if user can join moai
export const canJoinMoai = async (moaiId: string): Promise<ServiceResponse<boolean>> => {
  return withServiceWrapper(async () => {
    const session = await getValidSessionForRequest();
    if (!session?.user?.id) {
      return false;
    }

    // Check if already a member
    const { data: existingMember } = await supabase
      .from('moai_members')
      .select('is_active')
      .eq('moai_id', moaiId)
      .eq('profile_id', session.user.id)
      .single();

    if (existingMember?.is_active === true) {
      return false;
    }

    // Check capacity
    const { data: moai } = await supabase
      .from('moais')
      .select('max_members, member_count, moai_type')
      .eq('id', moaiId)
      .single();

    if (!moai || moai.moai_type !== 'public') {
      return false;
    }

    if (moai.max_members && moai.member_count >= moai.max_members) {
      return false;
    }

    return true;
  }, 'Check if user can join moai');
};

// Posts service functions
export const fetchMoaiPosts = async (moaiId: string): Promise<ServiceResponse<any[]>> => {
  return withServiceWrapper(async () => {
    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        *,
        profile:profiles!profile_id(
          id,
          first_name,
          last_name,
          profile_image,
          username
        )
      `)
      .eq('moai_id', moaiId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return posts || [];
  }, 'Fetch moai posts');
};

export const createMoaiPost = async (
  moaiId: string,
  content: string,
  imageUrl?: string
): Promise<ServiceResponse<any>> => {
  return withServiceWrapper(async () => {
    const session = await getValidSessionForRequest();
    if (!session?.user?.id) {
      throw new Error('Authentication required');
    }

    // Verify user is member of moai
    const { data: membership } = await supabase
      .from('moai_members')
      .select('id')
      .eq('moai_id', moaiId)
      .eq('profile_id', session.user.id)
      .eq('is_active', true)
      .single();

    if (!membership) {
      throw new Error('You must be a member of this moai to post');
    }

    const { data: newPost, error } = await supabase
      .from('posts')
      .insert([{
        moai_id: moaiId,
        profile_id: session.user.id,
        content,
        image_url: imageUrl,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select(`
        *,
        profile:profiles!profile_id(
          id,
          first_name,
          last_name,
          profile_image,
          username
        )
      `)
      .single();

    if (error) throw error;
    return newPost;
  }, 'Create moai post', true, 'Post created successfully');
};

export const pinMoaiPost = async (
  moaiId: string,
  postId: string
): Promise<ServiceResponse<boolean>> => {
  return withServiceWrapper(async () => {
    const session = await getValidSessionForRequest();
    if (!session?.user?.id) {
      throw new Error('Authentication required');
    }

    // Verify user is admin of moai
    const { data: membership } = await supabase
      .from('moai_members')
      .select('role_in_moai')
      .eq('moai_id', moaiId)
      .eq('profile_id', session.user.id)
      .eq('is_active', true)
      .single();

    if (!membership || membership.role_in_moai !== 'admin') {
      throw new Error('Only administrators can pin posts');
    }

    // First, unpin any existing pinned posts in this moai
    await supabase
      .from('posts')
      .update({ is_pinned: false })
      .eq('moai_id', moaiId)
      .eq('is_pinned', true);

    // Pin the new post
    const { error } = await supabase
      .from('posts')
      .update({ 
        is_pinned: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', postId)
      .eq('moai_id', moaiId);

    if (error) throw error;
    return true;
  }, 'Pin moai post', true, 'Post pinned successfully');
};

// Stories/Moments service functions - Simplified implementation since moments table doesn't exist yet
export const fetchMoaiMoments = async (moaiId: string): Promise<ServiceResponse<any[]>> => {
  return withServiceWrapper(async () => {
    // Stories/moments table doesn't exist yet - return empty array
    // TODO: Implement when stories/moments table is created
    return [];
  }, 'Fetch moai moments');
};

export const getMomentsStatus = async (
  moaiIds: string[]
): Promise<ServiceResponse<Record<string, { hasStories: boolean; hasViewedStories: boolean }>>> => {
  return withServiceWrapper(async () => {
    const session = await getValidSessionForRequest();
    if (!session?.user?.id || moaiIds.length === 0) {
      return {};
    }

    const status: Record<string, { hasStories: boolean; hasViewedStories: boolean }> = {};

    // Get viewed status for current user from existing story_views table
    const { data: viewedStories, error: viewedError } = await supabase
      .from('story_views')
      .select('moai_id')
      .in('moai_id', moaiIds)
      .eq('profile_id', session.user.id);

    if (viewedError) throw viewedError;

    const viewedSet = new Set(viewedStories?.map(v => v.moai_id) || []);

    // For now, simulate some moais having stories (demo purposes)
    // This can be replaced when actual stories/moments are implemented
    moaiIds.forEach(id => {
      // Demo: Some moais have stories based on simple hash
      const hasStories = id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % 3 === 0;
      const hasViewedStories = viewedSet.has(id);
      status[id] = { hasStories, hasViewedStories };
    });

    return status;
  }, 'Get moments status');
};

// Mark stories as viewed
export const markStoriesAsViewed = async (moaiId: string): Promise<ServiceResponse<boolean>> => {
  return withServiceWrapper(async () => {
    const session = await getValidSessionForRequest();
    if (!session?.user?.id) {
      throw new Error('Authentication required');
    }

    // Insert or update story view record
    const { error } = await supabase
      .from('story_views')
      .upsert({
        moai_id: moaiId,
        profile_id: session.user.id,
        viewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
    return true;
  }, 'Mark stories as viewed');
};