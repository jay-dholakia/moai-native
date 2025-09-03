import type { Database } from '../types/supabase';

// Use the generated Supabase types as base and extend with UI-needed fields
export type Profile = Database['public']['Tables']['profiles']['Row'] & {
  // Additional computed/UI fields not in database
  email?: string | null;
  full_name?: string | null;
  settings?: {
    theme?: string | null;
    language?: string | null;
    notifications?: {
      email?: boolean | null;
      sms?: boolean | null;
      app?: boolean | null;
    } | null;
  } | null;
}

export type Moai = Database['public']['Tables']['moais']['Row'] & {
  // Additional computed/UI fields not in database
  location?: string | null;
  is_featured?: boolean;
}

export type ActivityLog = Database['public']['Tables']['activity_logs']['Row'];
export type MoaiMemberRow = Database['public']['Tables']['moai_members']['Row'];

export interface MoaiWithGuide extends Moai {
  guide?: {
    id: string;
    first_name: string;
    last_name: string;
    profile_image?: string;
  } | null;
}

export interface MoaiMember extends MoaiMemberRow {
  profile?: Profile;
}

export interface Post {
  id: string;
  user_id: string;
  moai_id?: string;
  content: string;
  image_url?: string;
  type: 'text' | 'image' | 'activity' | 'achievement';
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  profile?: Profile;
}

export interface CommunityPost extends Post {
  community_type: 'general' | 'moai_specific';
}

export interface Message {
  id: string;
  moai_id: string;
  user_id: string;
  content: string;
  message_type: 'text' | 'image' | 'system';
  created_at: string;
  updated_at: string;
  profile?: Profile;
  reactions?: MessageReaction[];
}

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export type Activity = ActivityLog;

export interface UserStatus {
  user_id: string;
  status: 'online' | 'offline' | 'away';
  last_seen: string;
}

export interface OnlineUser {
  user_id: string;
  profile: Profile;
  status: UserStatus;
}

export interface Hobby {
  id: string;
  name: string;
  description?: string;
  category?: string;
  is_active: boolean;
  created_at: string;
}

export interface CreateMoaiData {
  name: string;
  description?: string;
  image_url?: string;
  moai_type: 'public' | 'private';
  max_members?: number;
  hobbies?: string[];
  goals?: string[];
  weekly_goal?: string;
  type: string;
  location_address?: string;
  latitude?: number;
  longitude?: number;
  commitment_type?: string;
  weekly_commitment_goal: number;
  allow_member_invites?: boolean;
}

export interface UpdateProfileData {
  first_name?: string;
  last_name?: string;
  username?: string;
  bio?: string;
  city?: string;
  profile_image?: string;
  fitness_goals?: string[];
  movement_activities?: Record<string, any>;
  equipment_access?: string[];
  first_week_commitment_set?: boolean;
  onboarding_completed?: boolean;
  onboarding_step?: number;
  settings?: Profile['settings'];
}

// API Response types
export type ServiceResponse<T> = 
  | { success: true; data: T; error?: never }
  | { success: false; error: string; data?: never };

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  hasMore: boolean;
  nextPage?: number;
}