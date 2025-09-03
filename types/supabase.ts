export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          activity_partners: Json | null
          activity_type: string
          created_at: string
          duration_minutes: number | null
          emoji: string
          id: string
          image_url: string | null
          location: string | null
          logged_at: string
          muscle_groups: Json | null
          notes: string | null
          profile_id: string
          source_tag_id: string | null
          updated_at: string
        }
        Insert: {
          activity_partners?: Json | null
          activity_type: string
          created_at?: string
          duration_minutes?: number | null
          emoji: string
          id?: string
          image_url?: string | null
          location?: string | null
          logged_at?: string
          muscle_groups?: Json | null
          notes?: string | null
          profile_id: string
          source_tag_id?: string | null
          updated_at?: string
        }
        Update: {
          activity_partners?: Json | null
          activity_type?: string
          created_at?: string
          duration_minutes?: number | null
          emoji?: string
          id?: string
          image_url?: string | null
          location?: string | null
          logged_at?: string
          muscle_groups?: Json | null
          notes?: string | null
          profile_id?: string
          source_tag_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_source_tag_id_fkey"
            columns: ["source_tag_id"]
            isOneToOne: false
            referencedRelation: "activity_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_reactions: {
        Row: {
          activity_log_id: string
          created_at: string
          id: string
          profile_id: string
          reaction_type: string
        }
        Insert: {
          activity_log_id: string
          created_at?: string
          id?: string
          profile_id: string
          reaction_type?: string
        }
        Update: {
          activity_log_id?: string
          created_at?: string
          id?: string
          profile_id?: string
          reaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_reactions_activity_log_id_fkey"
            columns: ["activity_log_id"]
            isOneToOne: false
            referencedRelation: "activity_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_reactions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_tags: {
        Row: {
          activity_log_id: string
          created_at: string | null
          expires_at: string | null
          id: string
          linked_activity_log_id: string | null
          responded_at: string | null
          status: string
          tagged_by_user_id: string
          tagged_user_id: string
        }
        Insert: {
          activity_log_id: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          linked_activity_log_id?: string | null
          responded_at?: string | null
          status?: string
          tagged_by_user_id: string
          tagged_user_id: string
        }
        Update: {
          activity_log_id?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          linked_activity_log_id?: string | null
          responded_at?: string | null
          status?: string
          tagged_by_user_id?: string
          tagged_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_tags_activity_log_id_fkey"
            columns: ["activity_log_id"]
            isOneToOne: false
            referencedRelation: "activity_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_tags_linked_activity_log_id_fkey"
            columns: ["linked_activity_log_id"]
            isOneToOne: false
            referencedRelation: "activity_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_tags_tagged_by_user_id_fkey"
            columns: ["tagged_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_tags_tagged_user_id_fkey"
            columns: ["tagged_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      buddy_chat_channels: {
        Row: {
          buddy_group: Json
          buddy_type: string | null
          chat_name: string
          created_at: string | null
          cycle_end_date: string | null
          cycle_start_date: string | null
          id: string
          is_active: boolean | null
          moai_id: string
          updated_at: string | null
          week_start_date: string
        }
        Insert: {
          buddy_group: Json
          buddy_type?: string | null
          chat_name: string
          created_at?: string | null
          cycle_end_date?: string | null
          cycle_start_date?: string | null
          id?: string
          is_active?: boolean | null
          moai_id: string
          updated_at?: string | null
          week_start_date: string
        }
        Update: {
          buddy_group?: Json
          buddy_type?: string | null
          chat_name?: string
          created_at?: string | null
          cycle_end_date?: string | null
          cycle_start_date?: string | null
          id?: string
          is_active?: boolean | null
          moai_id?: string
          updated_at?: string | null
          week_start_date?: string
        }
        Relationships: []
      }
      buddy_cycle_pairings: {
        Row: {
          assignment_timestamp: string | null
          buddy_group: Json
          buddy_type: string
          created_at: string
          cycle_id: string
          id: string
          last_updated: string | null
          moai_id: string
          was_mid_cycle_assignment: boolean | null
        }
        Insert: {
          assignment_timestamp?: string | null
          buddy_group: Json
          buddy_type?: string
          created_at?: string
          cycle_id: string
          id?: string
          last_updated?: string | null
          moai_id: string
          was_mid_cycle_assignment?: boolean | null
        }
        Update: {
          assignment_timestamp?: string | null
          buddy_group?: Json
          buddy_type?: string
          created_at?: string
          cycle_id?: string
          id?: string
          last_updated?: string | null
          moai_id?: string
          was_mid_cycle_assignment?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "buddy_cycle_pairings_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "buddy_cycles"
            referencedColumns: ["id"]
          },
        ]
      }
      buddy_cycles: {
        Row: {
          created_at: string
          cycle_end_date: string
          cycle_start_date: string
          id: string
          moai_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          cycle_end_date: string
          cycle_start_date: string
          id?: string
          moai_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          cycle_end_date?: string
          cycle_start_date?: string
          id?: string
          moai_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      buddy_member_state: {
        Row: {
          buddy_preferences: Json | null
          created_at: string | null
          current_buddy_group: Json | null
          id: string
          last_assignment_date: string | null
          moai_id: string
          past_buddies: Json | null
          profile_id: string
          updated_at: string | null
          was_late_joiner: boolean | null
        }
        Insert: {
          buddy_preferences?: Json | null
          created_at?: string | null
          current_buddy_group?: Json | null
          id?: string
          last_assignment_date?: string | null
          moai_id: string
          past_buddies?: Json | null
          profile_id: string
          updated_at?: string | null
          was_late_joiner?: boolean | null
        }
        Update: {
          buddy_preferences?: Json | null
          created_at?: string | null
          current_buddy_group?: Json | null
          id?: string
          last_assignment_date?: string | null
          moai_id?: string
          past_buddies?: Json | null
          profile_id?: string
          updated_at?: string | null
          was_late_joiner?: boolean | null
        }
        Relationships: []
      }
      buddy_nudges: {
        Row: {
          created_at: string | null
          id: string
          moai_id: string
          nudge_date: string
          receiver_id: string
          sender_id: string
          week_start_date: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          moai_id: string
          nudge_date?: string
          receiver_id: string
          sender_id: string
          week_start_date: string
        }
        Update: {
          created_at?: string | null
          id?: string
          moai_id?: string
          nudge_date?: string
          receiver_id?: string
          sender_id?: string
          week_start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "buddy_nudges_moai_id_fkey"
            columns: ["moai_id"]
            isOneToOne: false
            referencedRelation: "moais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buddy_nudges_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buddy_nudges_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      buddy_prompt_templates: {
        Row: {
          category: string | null
          created_at: string
          id: string
          is_active: boolean | null
          template_text: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          template_text: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          template_text?: string
        }
        Relationships: []
      }
      challenge_templates: {
        Row: {
          activity_type: string
          category: string | null
          created_at: string | null
          description: string
          id: string
          is_active: boolean | null
          name: string
          points_per_session: number
          target_count: number
          updated_at: string | null
        }
        Insert: {
          activity_type: string
          category?: string | null
          created_at?: string | null
          description: string
          id?: string
          is_active?: boolean | null
          name: string
          points_per_session: number
          target_count: number
          updated_at?: string | null
        }
        Update: {
          activity_type?: string
          category?: string | null
          created_at?: string | null
          description?: string
          id?: string
          is_active?: boolean | null
          name?: string
          points_per_session?: number
          target_count?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      coach_alerts: {
        Row: {
          alert_message: string
          alert_type: string
          coach_id: string
          created_at: string
          expires_at: string | null
          id: string
          is_read: boolean | null
          member_id: string | null
          moai_id: string
          severity: string | null
        }
        Insert: {
          alert_message: string
          alert_type: string
          coach_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          member_id?: string | null
          moai_id: string
          severity?: string | null
        }
        Update: {
          alert_message?: string
          alert_type?: string
          coach_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          member_id?: string | null
          moai_id?: string
          severity?: string | null
        }
        Relationships: []
      }
      coach_calendar_events: {
        Row: {
          coach_id: string
          created_at: string
          event_date: string
          event_description: string | null
          event_title: string
          event_type: string
          id: string
          is_completed: boolean | null
          member_id: string | null
          moai_id: string | null
          updated_at: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          event_date: string
          event_description?: string | null
          event_title: string
          event_type: string
          id?: string
          is_completed?: boolean | null
          member_id?: string | null
          moai_id?: string | null
          updated_at?: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          event_date?: string
          event_description?: string | null
          event_title?: string
          event_type?: string
          id?: string
          is_completed?: boolean | null
          member_id?: string | null
          moai_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      coach_client_access: {
        Row: {
          client_id: string
          coach_id: string
          granted_at: string
          has_access: boolean
          id: string
          revoked_at: string | null
        }
        Insert: {
          client_id: string
          coach_id: string
          granted_at?: string
          has_access?: boolean
          id?: string
          revoked_at?: string | null
        }
        Update: {
          client_id?: string
          coach_id?: string
          granted_at?: string
          has_access?: boolean
          id?: string
          revoked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coach_client_access_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_client_relationships: {
        Row: {
          auto_renew: boolean
          client_id: string
          coach_id: string
          created_at: string
          end_date: string | null
          id: string
          monthly_price: number
          private_chat_id: string | null
          start_date: string
          status: string
          stripe_subscription_id: string | null
          subscription_type: string
          updated_at: string
        }
        Insert: {
          auto_renew?: boolean
          client_id: string
          coach_id: string
          created_at?: string
          end_date?: string | null
          id?: string
          monthly_price?: number
          private_chat_id?: string | null
          start_date?: string
          status?: string
          stripe_subscription_id?: string | null
          subscription_type?: string
          updated_at?: string
        }
        Update: {
          auto_renew?: boolean
          client_id?: string
          coach_id?: string
          created_at?: string
          end_date?: string | null
          id?: string
          monthly_price?: number
          private_chat_id?: string | null
          start_date?: string
          status?: string
          stripe_subscription_id?: string | null
          subscription_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_coach_client_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_coach_client_coach"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_member_checkins: {
        Row: {
          checkin_notes: string | null
          checkin_type: string
          coach_id: string
          created_at: string
          id: string
          last_checkin_at: string
          member_id: string
          moai_id: string
          updated_at: string
        }
        Insert: {
          checkin_notes?: string | null
          checkin_type?: string
          coach_id: string
          created_at?: string
          id?: string
          last_checkin_at?: string
          member_id: string
          moai_id: string
          updated_at?: string
        }
        Update: {
          checkin_notes?: string | null
          checkin_type?: string
          coach_id?: string
          created_at?: string
          id?: string
          last_checkin_at?: string
          member_id?: string
          moai_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      coach_member_insights: {
        Row: {
          created_at: string
          current_streak: number | null
          engagement_score: number | null
          goals_achieved_percentage: number | null
          id: string
          last_activity_date: string | null
          last_milestone_date: string | null
          missed_workout_days: number | null
          moai_id: string
          motivation_triggers: string[] | null
          preferred_workout_time: string | null
          profile_id: string
          red_flag_alerts: string[] | null
          risk_factors: string[] | null
          streak_broken: boolean | null
          updated_at: string
          week_start_date: string
          workout_completion_trend: string | null
          workouts_assigned: number | null
          workouts_completed: number | null
        }
        Insert: {
          created_at?: string
          current_streak?: number | null
          engagement_score?: number | null
          goals_achieved_percentage?: number | null
          id?: string
          last_activity_date?: string | null
          last_milestone_date?: string | null
          missed_workout_days?: number | null
          moai_id: string
          motivation_triggers?: string[] | null
          preferred_workout_time?: string | null
          profile_id: string
          red_flag_alerts?: string[] | null
          risk_factors?: string[] | null
          streak_broken?: boolean | null
          updated_at?: string
          week_start_date: string
          workout_completion_trend?: string | null
          workouts_assigned?: number | null
          workouts_completed?: number | null
        }
        Update: {
          created_at?: string
          current_streak?: number | null
          engagement_score?: number | null
          goals_achieved_percentage?: number | null
          id?: string
          last_activity_date?: string | null
          last_milestone_date?: string | null
          missed_workout_days?: number | null
          moai_id?: string
          motivation_triggers?: string[] | null
          preferred_workout_time?: string | null
          profile_id?: string
          red_flag_alerts?: string[] | null
          risk_factors?: string[] | null
          streak_broken?: boolean | null
          updated_at?: string
          week_start_date?: string
          workout_completion_trend?: string | null
          workouts_assigned?: number | null
          workouts_completed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "coach_member_insights_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_member_notes: {
        Row: {
          coach_id: string
          created_at: string
          id: string
          member_id: string
          moai_id: string
          note_content: string
          updated_at: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          id?: string
          member_id: string
          moai_id: string
          note_content: string
          updated_at?: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          id?: string
          member_id?: string
          moai_id?: string
          note_content?: string
          updated_at?: string
        }
        Relationships: []
      }
      coach_member_tags: {
        Row: {
          coach_id: string
          created_at: string
          id: string
          member_id: string
          moai_id: string
          tag_color: string | null
          tag_name: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          id?: string
          member_id: string
          moai_id: string
          tag_color?: string | null
          tag_name: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          id?: string
          member_id?: string
          moai_id?: string
          tag_color?: string | null
          tag_name?: string
        }
        Relationships: []
      }
      coach_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          message_type: string | null
          sender_id: string
          session_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          message_type?: string | null
          sender_id: string
          session_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          message_type?: string | null
          sender_id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "coach_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_notes: {
        Row: {
          coach_id: string
          created_at: string
          id: string
          is_priority: boolean | null
          member_id: string
          moai_id: string
          note_category: string | null
          note_content: string
          updated_at: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          id?: string
          is_priority?: boolean | null
          member_id: string
          moai_id: string
          note_category?: string | null
          note_content: string
          updated_at?: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          id?: string
          is_priority?: boolean | null
          member_id?: string
          moai_id?: string
          note_category?: string | null
          note_content?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_notes_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_notes_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_notes_moai_id_fkey"
            columns: ["moai_id"]
            isOneToOne: false
            referencedRelation: "moais"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_nudges: {
        Row: {
          client_id: string
          coach_id: string
          created_at: string
          id: string
          is_read: boolean
          message: string
          sent_at: string
        }
        Insert: {
          client_id: string
          coach_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          sent_at?: string
        }
        Update: {
          client_id?: string
          coach_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_nudges_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_private_chat_messages: {
        Row: {
          chat_id: string
          created_at: string
          id: string
          is_automated: boolean
          message_content: string
          message_type: string
          sender_id: string
        }
        Insert: {
          chat_id: string
          created_at?: string
          id?: string
          is_automated?: boolean
          message_content: string
          message_type?: string
          sender_id: string
        }
        Update: {
          chat_id?: string
          created_at?: string
          id?: string
          is_automated?: boolean
          message_content?: string
          message_type?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_private_chat_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "coach_private_chats"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_private_chats: {
        Row: {
          archived_at: string | null
          archived_by: string | null
          client_id: string
          coach_id: string
          created_at: string
          id: string
          is_active: boolean
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          client_id: string
          coach_id: string
          created_at?: string
          id?: string
          is_active?: boolean
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          client_id?: string
          coach_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "coach_private_chats_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_program_audio: {
        Row: {
          audio_url: string
          coach_id: string
          created_at: string
          duration_seconds: number | null
          id: string
          program_id: string
          updated_at: string
        }
        Insert: {
          audio_url: string
          coach_id: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          program_id: string
          updated_at?: string
        }
        Update: {
          audio_url?: string
          coach_id?: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          program_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      coach_relationships: {
        Row: {
          coach_id: string
          created_at: string | null
          end_date: string | null
          id: string
          moai_id: string | null
          monthly_price: number | null
          relationship_type: string
          start_date: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          coach_id: string
          created_at?: string | null
          end_date?: string | null
          id?: string
          moai_id?: string | null
          monthly_price?: number | null
          relationship_type: string
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          coach_id?: string
          created_at?: string | null
          end_date?: string | null
          id?: string
          moai_id?: string | null
          monthly_price?: number | null
          relationship_type?: string
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coach_relationships_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_relationships_moai_id_fkey"
            columns: ["moai_id"]
            isOneToOne: false
            referencedRelation: "moais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_relationships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_resources: {
        Row: {
          category: string | null
          coach_id: string
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean
          resource_type: string
          title: string
          updated_at: string
          url: string
        }
        Insert: {
          category?: string | null
          coach_id: string
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean
          resource_type?: string
          title: string
          updated_at?: string
          url: string
        }
        Update: {
          category?: string | null
          coach_id?: string
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean
          resource_type?: string
          title?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_resources_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_sessions: {
        Row: {
          client_id: string
          coach_id: string
          created_at: string
          end_date: string | null
          group_members: Json | null
          id: string
          price: number | null
          session_data: Json | null
          session_type: string
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          client_id: string
          coach_id: string
          created_at?: string
          end_date?: string | null
          group_members?: Json | null
          id?: string
          price?: number | null
          session_data?: Json | null
          session_type: string
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          coach_id?: string
          created_at?: string
          end_date?: string | null
          group_members?: Json | null
          id?: string
          price?: number | null
          session_data?: Json | null
          session_type?: string
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_sessions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_sessions_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_subscriptions: {
        Row: {
          amount_paid: number
          auto_renew: boolean
          coach_id: string
          created_at: string
          end_date: string
          id: string
          next_billing_date: string | null
          plan_duration_months: number
          plan_type: string
          start_date: string
          status: string
          stripe_payment_intent_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_paid?: number
          auto_renew?: boolean
          coach_id: string
          created_at?: string
          end_date: string
          id?: string
          next_billing_date?: string | null
          plan_duration_months: number
          plan_type: string
          start_date?: string
          status?: string
          stripe_payment_intent_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_paid?: number
          auto_renew?: boolean
          coach_id?: string
          created_at?: string
          end_date?: string
          id?: string
          next_billing_date?: string | null
          plan_duration_months?: number
          plan_type?: string
          start_date?: string
          status?: string
          stripe_payment_intent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_subscriptions_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_workout_audio: {
        Row: {
          audio_url: string
          coach_id: string
          created_at: string
          duration_seconds: number | null
          id: string
          updated_at: string
          workout_id: string
        }
        Insert: {
          audio_url: string
          coach_id: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          updated_at?: string
          workout_id: string
        }
        Update: {
          audio_url?: string
          coach_id?: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          updated_at?: string
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_workout_audio_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_workout_audio_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      coaches: {
        Row: {
          availability_json: Json | null
          bio: string | null
          certifications: string[] | null
          coach_status: string | null
          created_at: string
          id: string
          internal_notes: string | null
          is_active: boolean
          languages_spoken: string[] | null
          monthly_price: number | null
          pricing_json: Json | null
          profile_id: string
          rating: number | null
          specialties: string[] | null
          total_sessions: number | null
          updated_at: string
        }
        Insert: {
          availability_json?: Json | null
          bio?: string | null
          certifications?: string[] | null
          coach_status?: string | null
          created_at?: string
          id?: string
          internal_notes?: string | null
          is_active?: boolean
          languages_spoken?: string[] | null
          monthly_price?: number | null
          pricing_json?: Json | null
          profile_id: string
          rating?: number | null
          specialties?: string[] | null
          total_sessions?: number | null
          updated_at?: string
        }
        Update: {
          availability_json?: Json | null
          bio?: string | null
          certifications?: string[] | null
          coach_status?: string | null
          created_at?: string
          id?: string
          internal_notes?: string | null
          is_active?: boolean
          languages_spoken?: string[] | null
          monthly_price?: number | null
          pricing_json?: Json | null
          profile_id?: string
          rating?: number | null
          specialties?: string[] | null
          total_sessions?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coaches_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coaching_questionnaires: {
        Row: {
          additional_notes: string | null
          available_days: string[] | null
          coach_id: string
          created_at: string
          current_fitness_level: string | null
          equipment_access: string[] | null
          fitness_goals: string[] | null
          id: string
          injuries_limitations: string | null
          motivation_style: string | null
          preferred_workout_types: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          additional_notes?: string | null
          available_days?: string[] | null
          coach_id: string
          created_at?: string
          current_fitness_level?: string | null
          equipment_access?: string[] | null
          fitness_goals?: string[] | null
          id?: string
          injuries_limitations?: string | null
          motivation_style?: string | null
          preferred_workout_types?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          additional_notes?: string | null
          available_days?: string[] | null
          coach_id?: string
          created_at?: string
          current_fitness_level?: string | null
          equipment_access?: string[] | null
          fitness_goals?: string[] | null
          id?: string
          injuries_limitations?: string | null
          motivation_style?: string | null
          preferred_workout_types?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      collaborative_workout_exercises: {
        Row: {
          added_by: string
          created_at: string
          exercise_id: string
          exercise_order: number
          id: string
          reps: string
          rest_time: string | null
          session_id: string
          sets: number
        }
        Insert: {
          added_by: string
          created_at?: string
          exercise_id: string
          exercise_order?: number
          id?: string
          reps?: string
          rest_time?: string | null
          session_id: string
          sets?: number
        }
        Update: {
          added_by?: string
          created_at?: string
          exercise_id?: string
          exercise_order?: number
          id?: string
          reps?: string
          rest_time?: string | null
          session_id?: string
          sets?: number
        }
        Relationships: [
          {
            foreignKeyName: "collaborative_workout_exercises_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaborative_workout_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaborative_workout_exercises_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "collaborative_workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      collaborative_workout_participants: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          joined_at: string | null
          profile_id: string
          session_id: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          joined_at?: string | null
          profile_id: string
          session_id: string
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          joined_at?: string | null
          profile_id?: string
          session_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "collaborative_workout_participants_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaborative_workout_participants_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "collaborative_workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      collaborative_workout_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          exercise_id: string
          id: string
          is_completed: boolean
          profile_id: string
          reps: string
          session_id: string
          set_number: number
          updated_at: string
          weight: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          exercise_id: string
          id?: string
          is_completed?: boolean
          profile_id: string
          reps: string
          session_id: string
          set_number: number
          updated_at?: string
          weight?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          exercise_id?: string
          id?: string
          is_completed?: boolean
          profile_id?: string
          reps?: string
          session_id?: string
          set_number?: number
          updated_at?: string
          weight?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collaborative_workout_progress_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaborative_workout_progress_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaborative_workout_progress_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "collaborative_workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      collaborative_workout_sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string
          id: string
          session_name: string | null
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by: string
          id?: string
          session_name?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string
          id?: string
          session_name?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "collaborative_workout_sessions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          profile_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          profile_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      commitment_check_ins: {
        Row: {
          check_in_date: string
          created_at: string
          id: string
          notes: string | null
          progress_data: Json | null
          user_commitment_id: string
        }
        Insert: {
          check_in_date?: string
          created_at?: string
          id?: string
          notes?: string | null
          progress_data?: Json | null
          user_commitment_id: string
        }
        Update: {
          check_in_date?: string
          created_at?: string
          id?: string
          notes?: string | null
          progress_data?: Json | null
          user_commitment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "commitment_check_ins_user_commitment_id_fkey"
            columns: ["user_commitment_id"]
            isOneToOne: false
            referencedRelation: "user_commitments"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          content: string
          created_at: string
          id: string
          image_url: string | null
          moai_id: string
          profile_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          moai_id: string
          profile_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          moai_id?: string
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_moai_id_fkey"
            columns: ["moai_id"]
            isOneToOne: false
            referencedRelation: "moais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_posts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_history: {
        Row: {
          amount: number
          billing_cycle_start: string | null
          coach_id: string | null
          created_at: string | null
          credit_type: string
          description: string | null
          id: string
          moai_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          billing_cycle_start?: string | null
          coach_id?: string | null
          created_at?: string | null
          credit_type: string
          description?: string | null
          id?: string
          moai_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          billing_cycle_start?: string | null
          coach_id?: string | null
          created_at?: string | null
          credit_type?: string
          description?: string | null
          id?: string
          moai_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_history_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_history_moai_id_fkey"
            columns: ["moai_id"]
            isOneToOne: false
            referencedRelation: "moais"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_checkin_responses: {
        Row: {
          checkin_id: string | null
          id: string
          is_private_response: boolean | null
          member_id: string | null
          responded_at: string | null
          response_data: Json | null
          response_text: string | null
        }
        Insert: {
          checkin_id?: string | null
          id?: string
          is_private_response?: boolean | null
          member_id?: string | null
          responded_at?: string | null
          response_data?: Json | null
          response_text?: string | null
        }
        Update: {
          checkin_id?: string | null
          id?: string
          is_private_response?: boolean | null
          member_id?: string | null
          responded_at?: string | null
          response_data?: Json | null
          response_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_checkin_responses_checkin_id_fkey"
            columns: ["checkin_id"]
            isOneToOne: false
            referencedRelation: "daily_checkins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_checkin_responses_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_checkins: {
        Row: {
          coach_id: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          moai_id: string | null
          prompt_options: Json | null
          prompt_text: string
          prompt_type: string | null
          scheduled_date: string
        }
        Insert: {
          coach_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          moai_id?: string | null
          prompt_options?: Json | null
          prompt_text: string
          prompt_type?: string | null
          scheduled_date: string
        }
        Update: {
          coach_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          moai_id?: string | null
          prompt_options?: Json | null
          prompt_text?: string
          prompt_type?: string | null
          scheduled_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_checkins_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_checkins_moai_id_fkey"
            columns: ["moai_id"]
            isOneToOne: false
            referencedRelation: "moais"
            referencedColumns: ["id"]
          },
        ]
      }
      elite_week_tracker: {
        Row: {
          created_at: string
          elite_week_achieved: boolean
          id: string
          members_completed: number
          members_required: number
          moai_id: string
          updated_at: string
          week_start_date: string
        }
        Insert: {
          created_at?: string
          elite_week_achieved?: boolean
          id?: string
          members_completed?: number
          members_required?: number
          moai_id: string
          updated_at?: string
          week_start_date: string
        }
        Update: {
          created_at?: string
          elite_week_achieved?: boolean
          id?: string
          members_completed?: number
          members_required?: number
          moai_id?: string
          updated_at?: string
          week_start_date?: string
        }
        Relationships: []
      }
      event_approvals: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          event_id: string
          notes: string | null
          status: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          event_id: string
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          event_id?: string
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_approvals_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_approvals_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_rsvps: {
        Row: {
          created_at: string
          event_id: string
          id: string
          profile_id: string
          rsvp_status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          profile_id: string
          rsvp_status: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          profile_id?: string
          rsvp_status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_rsvps_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          address: string | null
          approval_status: string | null
          created_at: string
          creator_id: string
          date: string
          description: string | null
          emoji: string | null
          event_type: string
          id: string
          is_global: boolean
          location: string
          meeting_link: string | null
          moai_id: string
          needs_approval: boolean | null
          rsvp_capacity: number | null
          timezone: string
          title: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          approval_status?: string | null
          created_at?: string
          creator_id: string
          date: string
          description?: string | null
          emoji?: string | null
          event_type?: string
          id?: string
          is_global?: boolean
          location: string
          meeting_link?: string | null
          moai_id: string
          needs_approval?: boolean | null
          rsvp_capacity?: number | null
          timezone?: string
          title: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          approval_status?: string | null
          created_at?: string
          creator_id?: string
          date?: string
          description?: string | null
          emoji?: string | null
          event_type?: string
          id?: string
          is_global?: boolean
          location?: string
          meeting_link?: string | null
          moai_id?: string
          needs_approval?: boolean | null
          rsvp_capacity?: number | null
          timezone?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_moai_id_fkey"
            columns: ["moai_id"]
            isOneToOne: false
            referencedRelation: "moais"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_details: {
        Row: {
          created_at: string | null
          duration_seconds: number | null
          id: string
          notes: string | null
          reps: number | null
          sets: number | null
          type: string
          weight: number | null
          workout_exercise_id: string
        }
        Insert: {
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          notes?: string | null
          reps?: number | null
          sets?: number | null
          type: string
          weight?: number | null
          workout_exercise_id: string
        }
        Update: {
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          notes?: string | null
          reps?: number | null
          sets?: number | null
          type?: string
          weight?: number | null
          workout_exercise_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_details_workout_exercise_id_fkey"
            columns: ["workout_exercise_id"]
            isOneToOne: false
            referencedRelation: "workout_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_library_extended: {
        Row: {
          coach_id: string | null
          created_at: string | null
          custom_instructions: string | null
          difficulty_level: string | null
          equipment_needed: string[] | null
          exercise_id: string | null
          id: string
          is_custom: boolean | null
          updated_at: string | null
          video_demo_url: string | null
        }
        Insert: {
          coach_id?: string | null
          created_at?: string | null
          custom_instructions?: string | null
          difficulty_level?: string | null
          equipment_needed?: string[] | null
          exercise_id?: string | null
          id?: string
          is_custom?: boolean | null
          updated_at?: string | null
          video_demo_url?: string | null
        }
        Update: {
          coach_id?: string | null
          created_at?: string | null
          custom_instructions?: string | null
          difficulty_level?: string | null
          equipment_needed?: string[] | null
          exercise_id?: string | null
          id?: string
          is_custom?: boolean | null
          updated_at?: string | null
          video_demo_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercise_library_extended_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_library_extended_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_logs: {
        Row: {
          activity_log_id: string | null
          created_at: string
          date: string
          exercise_id: string
          id: string
          reps: number
          set_number: number
          updated_at: string
          user_id: string
          weight: number | null
          workout_completion_id: string | null
        }
        Insert: {
          activity_log_id?: string | null
          created_at?: string
          date?: string
          exercise_id: string
          id?: string
          reps: number
          set_number: number
          updated_at?: string
          user_id: string
          weight?: number | null
          workout_completion_id?: string | null
        }
        Update: {
          activity_log_id?: string | null
          created_at?: string
          date?: string
          exercise_id?: string
          id?: string
          reps?: number
          set_number?: number
          updated_at?: string
          user_id?: string
          weight?: number | null
          workout_completion_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercise_logs_activity_log_id_fkey"
            columns: ["activity_log_id"]
            isOneToOne: false
            referencedRelation: "activity_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          category: string | null
          created_at: string | null
          default_type: string | null
          form_video_url: string | null
          id: string
          instructions: string | null
          muscle_group: string | null
          name: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          default_type?: string | null
          form_video_url?: string | null
          id?: string
          instructions?: string | null
          muscle_group?: string | null
          name: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          default_type?: string | null
          form_video_url?: string | null
          id?: string
          instructions?: string | null
          muscle_group?: string | null
          name?: string
        }
        Relationships: []
      }
      friend_requests: {
        Row: {
          created_at: string | null
          id: string
          receiver_id: string
          sender_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          receiver_id: string
          sender_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          receiver_id?: string
          sender_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "friend_requests_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friend_requests_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      friendships: {
        Row: {
          created_at: string | null
          friend_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          friend_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          friend_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "friendships_friend_id_fkey"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_types: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      group_statuses: {
        Row: {
          created_at: string
          elite_weeks_completed: number
          id: string
          moai_id: string
          status_description: string
          status_name: string
          status_number: number
          unlocked_at: string
        }
        Insert: {
          created_at?: string
          elite_weeks_completed: number
          id?: string
          moai_id: string
          status_description: string
          status_name: string
          status_number: number
          unlocked_at?: string
        }
        Update: {
          created_at?: string
          elite_weeks_completed?: number
          id?: string
          moai_id?: string
          status_description?: string
          status_name?: string
          status_number?: number
          unlocked_at?: string
        }
        Relationships: []
      }
      group_stones: {
        Row: {
          created_at: string
          id: string
          moai_id: string
          statuses_completed: number
          stone_description: string
          stone_name: string
          stone_number: number
          unlocked_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          moai_id: string
          statuses_completed: number
          stone_description: string
          stone_name: string
          stone_number: number
          unlocked_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          moai_id?: string
          statuses_completed?: number
          stone_description?: string
          stone_name?: string
          stone_number?: number
          unlocked_at?: string
        }
        Relationships: []
      }
      hobbies: {
        Row: {
          category: string | null
          created_at: string
          icon: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          profile_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          profile_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      member_check_ins: {
        Row: {
          activities_logged: number
          check_in_deadline: string
          created_at: string
          goal_met: boolean
          id: string
          member_id: string
          moai_id: string
          status: string
          updated_at: string
          week_start_date: string
        }
        Insert: {
          activities_logged?: number
          check_in_deadline: string
          created_at?: string
          goal_met?: boolean
          id?: string
          member_id: string
          moai_id: string
          status?: string
          updated_at?: string
          week_start_date: string
        }
        Update: {
          activities_logged?: number
          check_in_deadline?: string
          created_at?: string
          goal_met?: boolean
          id?: string
          member_id?: string
          moai_id?: string
          status?: string
          updated_at?: string
          week_start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_check_ins_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_check_ins_moai_id_fkey"
            columns: ["moai_id"]
            isOneToOne: false
            referencedRelation: "moais"
            referencedColumns: ["id"]
          },
        ]
      }
      member_milestones: {
        Row: {
          achieved_date: string
          celebration_message: string | null
          coach_id: string | null
          created_at: string | null
          id: string
          is_group_shared: boolean | null
          member_id: string | null
          milestone_type: string
          milestone_value: string
          moai_id: string | null
        }
        Insert: {
          achieved_date: string
          celebration_message?: string | null
          coach_id?: string | null
          created_at?: string | null
          id?: string
          is_group_shared?: boolean | null
          member_id?: string | null
          milestone_type: string
          milestone_value: string
          moai_id?: string | null
        }
        Update: {
          achieved_date?: string
          celebration_message?: string | null
          coach_id?: string | null
          created_at?: string | null
          id?: string
          is_group_shared?: boolean | null
          member_id?: string | null
          milestone_type?: string
          milestone_value?: string
          moai_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "member_milestones_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_milestones_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_milestones_moai_id_fkey"
            columns: ["moai_id"]
            isOneToOne: false
            referencedRelation: "moais"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          message_id: string
          profile_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          profile_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reactions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      message_replies: {
        Row: {
          created_at: string
          id: string
          parent_message_id: string
          reply_message_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          parent_message_id: string
          reply_message_id: string
        }
        Update: {
          created_at?: string
          id?: string
          parent_message_id?: string
          reply_message_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_replies_parent_message_id_fkey"
            columns: ["parent_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_replies_reply_message_id_fkey"
            columns: ["reply_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      message_templates: {
        Row: {
          coach_id: string | null
          created_at: string | null
          id: string
          is_quick_response: boolean | null
          template_category: string | null
          template_content: string
          template_name: string
          updated_at: string | null
        }
        Insert: {
          coach_id?: string | null
          created_at?: string | null
          id?: string
          is_quick_response?: boolean | null
          template_category?: string | null
          template_content: string
          template_name: string
          updated_at?: string | null
        }
        Update: {
          coach_id?: string | null
          created_at?: string | null
          id?: string
          is_quick_response?: boolean | null
          template_category?: string | null
          template_content?: string
          template_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_templates_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          buddy_chat_cycle_start: string | null
          buddy_chat_week_start: string | null
          chat_type: string | null
          coach_id: string | null
          coach_private_chat_id: string | null
          content: string
          created_at: string
          id: string
          image_url: string | null
          is_buddy_chat: boolean | null
          is_pinned: boolean | null
          message_subtype: string | null
          message_type: string | null
          metadata: Json | null
          moai_coaching_chat_id: string | null
          moai_id: string
          profile_id: string
        }
        Insert: {
          buddy_chat_cycle_start?: string | null
          buddy_chat_week_start?: string | null
          chat_type?: string | null
          coach_id?: string | null
          coach_private_chat_id?: string | null
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_buddy_chat?: boolean | null
          is_pinned?: boolean | null
          message_subtype?: string | null
          message_type?: string | null
          metadata?: Json | null
          moai_coaching_chat_id?: string | null
          moai_id: string
          profile_id: string
        }
        Update: {
          buddy_chat_cycle_start?: string | null
          buddy_chat_week_start?: string | null
          chat_type?: string | null
          coach_id?: string | null
          coach_private_chat_id?: string | null
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_buddy_chat?: boolean | null
          is_pinned?: boolean | null
          message_subtype?: string | null
          message_type?: string | null
          metadata?: Json | null
          moai_coaching_chat_id?: string | null
          moai_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_coach_private_chat_id_fkey"
            columns: ["coach_private_chat_id"]
            isOneToOne: false
            referencedRelation: "coach_private_chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_moai_coaching_chat_id_fkey"
            columns: ["moai_coaching_chat_id"]
            isOneToOne: false
            referencedRelation: "moai_coaching_chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_moai_id_fkey"
            columns: ["moai_id"]
            isOneToOne: false
            referencedRelation: "moais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      moai_album_photos: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          moai_id: string
          storage_path: string
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          moai_id: string
          storage_path: string
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          moai_id?: string
          storage_path?: string
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "moai_album_photos_moai_id_fkey"
            columns: ["moai_id"]
            isOneToOne: false
            referencedRelation: "moais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moai_album_photos_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      moai_blocklist: {
        Row: {
          blocked_at: string
          blocked_by: string
          created_at: string
          id: string
          is_active: boolean
          moai_id: string
          reason: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          blocked_at?: string
          blocked_by: string
          created_at?: string
          id?: string
          is_active?: boolean
          moai_id: string
          reason?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          blocked_at?: string
          blocked_by?: string
          created_at?: string
          id?: string
          is_active?: boolean
          moai_id?: string
          reason?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "moai_blocklist_blocked_by_fkey"
            columns: ["blocked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moai_blocklist_moai_id_fkey"
            columns: ["moai_id"]
            isOneToOne: false
            referencedRelation: "moais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moai_blocklist_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      moai_coaching_chats: {
        Row: {
          coach_id: string
          created_at: string
          id: string
          is_active: boolean
          moai_id: string
          unlock_percentage: number
        }
        Insert: {
          coach_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          moai_id: string
          unlock_percentage?: number
        }
        Update: {
          coach_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          moai_id?: string
          unlock_percentage?: number
        }
        Relationships: [
          {
            foreignKeyName: "moai_coaching_chats_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moai_coaching_chats_moai_id_fkey"
            columns: ["moai_id"]
            isOneToOne: false
            referencedRelation: "moais"
            referencedColumns: ["id"]
          },
        ]
      }
      moai_invitations: {
        Row: {
          created_at: string | null
          current_uses: number | null
          expires_at: string | null
          id: string
          invite_code: string
          invited_by: string
          is_active: boolean | null
          max_uses: number | null
          moai_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_uses?: number | null
          expires_at?: string | null
          id?: string
          invite_code: string
          invited_by: string
          is_active?: boolean | null
          max_uses?: number | null
          moai_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_uses?: number | null
          expires_at?: string | null
          id?: string
          invite_code?: string
          invited_by?: string
          is_active?: boolean | null
          max_uses?: number | null
          moai_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "moai_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moai_invitations_moai_id_fkey"
            columns: ["moai_id"]
            isOneToOne: false
            referencedRelation: "moais"
            referencedColumns: ["id"]
          },
        ]
      }
      moai_members: {
        Row: {
          current_program_id: string | null
          id: string
          invite_expires_at: string | null
          invite_token: string | null
          invited_by: string | null
          is_active: boolean
          joined_at: string
          moai_id: string
          profile_id: string
          role_in_moai: string | null
        }
        Insert: {
          current_program_id?: string | null
          id?: string
          invite_expires_at?: string | null
          invite_token?: string | null
          invited_by?: string | null
          is_active?: boolean
          joined_at?: string
          moai_id: string
          profile_id: string
          role_in_moai?: string | null
        }
        Update: {
          current_program_id?: string | null
          id?: string
          invite_expires_at?: string | null
          invite_token?: string | null
          invited_by?: string | null
          is_active?: boolean
          joined_at?: string
          moai_id?: string
          profile_id?: string
          role_in_moai?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "moai_members_current_program_id_fkey"
            columns: ["current_program_id"]
            isOneToOne: false
            referencedRelation: "workout_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moai_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moai_members_moai_id_fkey"
            columns: ["moai_id"]
            isOneToOne: false
            referencedRelation: "moais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moai_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      moai_permissions: {
        Row: {
          granted_at: string | null
          granted_by: string
          id: string
          moai_id: string
          permission_id: string
          profile_id: string
        }
        Insert: {
          granted_at?: string | null
          granted_by: string
          id?: string
          moai_id: string
          permission_id: string
          profile_id: string
        }
        Update: {
          granted_at?: string | null
          granted_by?: string
          id?: string
          moai_id?: string
          permission_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "moai_permissions_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moai_permissions_moai_id_fkey"
            columns: ["moai_id"]
            isOneToOne: false
            referencedRelation: "moais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moai_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moai_permissions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      moai_photo_tags: {
        Row: {
          id: string
          photo_id: string
          profile_id: string
          tagged_at: string
          tagged_by: string
        }
        Insert: {
          id?: string
          photo_id: string
          profile_id: string
          tagged_at?: string
          tagged_by: string
        }
        Update: {
          id?: string
          photo_id?: string
          profile_id?: string
          tagged_at?: string
          tagged_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "moai_photo_tags_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "moai_album_photos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moai_photo_tags_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moai_photo_tags_tagged_by_fkey"
            columns: ["tagged_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      moai_program_history: {
        Row: {
          changed_by: string
          created_at: string | null
          id: string
          moai_id: string
          program_id: string
          reason: string | null
          week_start_date: string
        }
        Insert: {
          changed_by: string
          created_at?: string | null
          id?: string
          moai_id: string
          program_id: string
          reason?: string | null
          week_start_date?: string
        }
        Update: {
          changed_by?: string
          created_at?: string | null
          id?: string
          moai_id?: string
          program_id?: string
          reason?: string | null
          week_start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "moai_program_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moai_program_history_moai_id_fkey"
            columns: ["moai_id"]
            isOneToOne: false
            referencedRelation: "moais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moai_program_history_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "workout_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      moai_recommendations: {
        Row: {
          created_at: string
          id: string
          moai_id: string
          profile_id: string
          reason: string | null
          score: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          moai_id: string
          profile_id: string
          reason?: string | null
          score?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          moai_id?: string
          profile_id?: string
          reason?: string | null
          score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "moai_recommendations_moai_id_fkey"
            columns: ["moai_id"]
            isOneToOne: false
            referencedRelation: "moais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moai_recommendations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      moai_tokens: {
        Row: {
          awarded_on: string
          created_at: string
          id: string
          moai_id: string | null
          points: number
          source_type: string
          user_id: string
          week_start_date: string | null
        }
        Insert: {
          awarded_on?: string
          created_at?: string
          id?: string
          moai_id?: string | null
          points: number
          source_type: string
          user_id: string
          week_start_date?: string | null
        }
        Update: {
          awarded_on?: string
          created_at?: string
          id?: string
          moai_id?: string | null
          points?: number
          source_type?: string
          user_id?: string
          week_start_date?: string | null
        }
        Relationships: []
      }
      moai_user_invitations: {
        Row: {
          created_at: string
          id: string
          invited_at: string
          invited_by_user_id: string
          invited_user_id: string
          moai_id: string
          responded_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_at?: string
          invited_by_user_id: string
          invited_user_id: string
          moai_id: string
          responded_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_at?: string
          invited_by_user_id?: string
          invited_user_id?: string
          moai_id?: string
          responded_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "moai_user_invitations_invited_by_user_id_fkey"
            columns: ["invited_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moai_user_invitations_invited_user_id_fkey"
            columns: ["invited_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moai_user_invitations_moai_id_fkey"
            columns: ["moai_id"]
            isOneToOne: false
            referencedRelation: "moais"
            referencedColumns: ["id"]
          },
        ]
      }
      moai_weekly_snapshots: {
        Row: {
          activities_logged_this_week: number
          created_at: string
          id: string
          member_id: string
          met_weekly_commitment: boolean
          moai_id: string
          updated_at: string
          week_start_date: string
        }
        Insert: {
          activities_logged_this_week?: number
          created_at?: string
          id?: string
          member_id: string
          met_weekly_commitment?: boolean
          moai_id: string
          updated_at?: string
          week_start_date: string
        }
        Update: {
          activities_logged_this_week?: number
          created_at?: string
          id?: string
          member_id?: string
          met_weekly_commitment?: boolean
          moai_id?: string
          updated_at?: string
          week_start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "moai_weekly_snapshots_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moai_weekly_snapshots_moai_id_fkey"
            columns: ["moai_id"]
            isOneToOne: false
            referencedRelation: "moais"
            referencedColumns: ["id"]
          },
        ]
      }
      moais: {
        Row: {
          allow_member_invites: boolean | null
          capacity: number | null
          coach_id: string | null
          coach_match_percentage: number | null
          commitment_threshold: number | null
          commitment_type: string | null
          consecutive_missed_weeks: number
          created_at: string
          creator_id: string | null
          cumulative_success_weeks: number
          current_program_id: string | null
          current_streak_weeks: number | null
          current_tier: number | null
          description: string | null
          goal_type: string | null
          goals: string[] | null
          hobbies: string[] | null
          id: string
          image_url: string | null
          is_active: boolean
          is_archived: boolean
          is_path_moai: boolean | null
          latitude: number | null
          location_address: string | null
          longitude: number | null
          max_members: number | null
          member_count: number | null
          missed_weeks_count: number | null
          moai_success_this_week: boolean | null
          moai_type: Database["public"]["Enums"]["moai_type"]
          monthly_subscription_cost: number | null
          name: string
          next_checkin_deadline: string | null
          price: number | null
          program_schedule: Json | null
          requires_payment: boolean
          status: Database["public"]["Enums"]["moai_status"]
          stone_earned_this_week: boolean | null
          tier_advanced_this_week: boolean | null
          type: string
          updated_at: string
          urgency_status: string | null
          weekly_commitment_goal: number
          weekly_goal: string | null
        }
        Insert: {
          allow_member_invites?: boolean | null
          capacity?: number | null
          coach_id?: string | null
          coach_match_percentage?: number | null
          commitment_threshold?: number | null
          commitment_type?: string | null
          consecutive_missed_weeks?: number
          created_at?: string
          creator_id?: string | null
          cumulative_success_weeks?: number
          current_program_id?: string | null
          current_streak_weeks?: number | null
          current_tier?: number | null
          description?: string | null
          goal_type?: string | null
          goals?: string[] | null
          hobbies?: string[] | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_archived?: boolean
          is_path_moai?: boolean | null
          latitude?: number | null
          location_address?: string | null
          longitude?: number | null
          max_members?: number | null
          member_count?: number | null
          missed_weeks_count?: number | null
          moai_success_this_week?: boolean | null
          moai_type?: Database["public"]["Enums"]["moai_type"]
          monthly_subscription_cost?: number | null
          name: string
          next_checkin_deadline?: string | null
          price?: number | null
          program_schedule?: Json | null
          requires_payment?: boolean
          status?: Database["public"]["Enums"]["moai_status"]
          stone_earned_this_week?: boolean | null
          tier_advanced_this_week?: boolean | null
          type?: string
          updated_at?: string
          urgency_status?: string | null
          weekly_commitment_goal?: number
          weekly_goal?: string | null
        }
        Update: {
          allow_member_invites?: boolean | null
          capacity?: number | null
          coach_id?: string | null
          coach_match_percentage?: number | null
          commitment_threshold?: number | null
          commitment_type?: string | null
          consecutive_missed_weeks?: number
          created_at?: string
          creator_id?: string | null
          cumulative_success_weeks?: number
          current_program_id?: string | null
          current_streak_weeks?: number | null
          current_tier?: number | null
          description?: string | null
          goal_type?: string | null
          goals?: string[] | null
          hobbies?: string[] | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_archived?: boolean
          is_path_moai?: boolean | null
          latitude?: number | null
          location_address?: string | null
          longitude?: number | null
          max_members?: number | null
          member_count?: number | null
          missed_weeks_count?: number | null
          moai_success_this_week?: boolean | null
          moai_type?: Database["public"]["Enums"]["moai_type"]
          monthly_subscription_cost?: number | null
          name?: string
          next_checkin_deadline?: string | null
          price?: number | null
          program_schedule?: Json | null
          requires_payment?: boolean
          status?: Database["public"]["Enums"]["moai_status"]
          stone_earned_this_week?: boolean | null
          tier_advanced_this_week?: boolean | null
          type?: string
          updated_at?: string
          urgency_status?: string | null
          weekly_commitment_goal?: number
          weekly_goal?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "moais_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moais_current_program_id_fkey"
            columns: ["current_program_id"]
            isOneToOne: false
            referencedRelation: "workout_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moais_guide_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean
          profile_id: string
          related_entity_id: string | null
          type: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          profile_id: string
          related_entity_id?: string | null
          type: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          profile_id?: string
          related_entity_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      nudge_templates: {
        Row: {
          coach_id: string
          created_at: string
          id: string
          is_default: boolean | null
          template_category: string | null
          template_content: string
          template_name: string
          updated_at: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          template_category?: string | null
          template_content: string
          template_name: string
          updated_at?: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          template_category?: string | null
          template_content?: string
          template_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      onboarding_checkpoints: {
        Row: {
          completed_at: string | null
          created_at: string
          data_submitted: Json | null
          id: string
          is_completed: boolean
          profile_id: string
          step_name: string
          step_number: number
          updated_at: string
          validation_passed: boolean
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          data_submitted?: Json | null
          id?: string
          is_completed?: boolean
          profile_id: string
          step_name: string
          step_number: number
          updated_at?: string
          validation_passed?: boolean
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          data_submitted?: Json | null
          id?: string
          is_completed?: boolean
          profile_id?: string
          step_name?: string
          step_number?: number
          updated_at?: string
          validation_passed?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_checkpoints_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_trends: {
        Row: {
          created_at: string
          exercise_id: string | null
          id: string
          metric_type: string
          metric_value: number
          percentage_change: number | null
          profile_id: string
          trend_direction: string | null
          week_start_date: string
        }
        Insert: {
          created_at?: string
          exercise_id?: string | null
          id?: string
          metric_type: string
          metric_value: number
          percentage_change?: number | null
          profile_id: string
          trend_direction?: string | null
          week_start_date: string
        }
        Update: {
          created_at?: string
          exercise_id?: string | null
          id?: string
          metric_type?: string
          metric_value?: number
          percentage_change?: number | null
          profile_id?: string
          trend_direction?: string | null
          week_start_date?: string
        }
        Relationships: []
      }
      permissions: {
        Row: {
          created_at: string | null
          description: string
          id: string
          key: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          key: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          key?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      plan_workouts: {
        Row: {
          created_at: string | null
          created_by: string | null
          display_order: number | null
          id: string
          plan_id: string | null
          updated_at: string | null
          workout_template_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          display_order?: number | null
          id?: string
          plan_id?: string | null
          updated_at?: string | null
          workout_template_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          display_order?: number | null
          id?: string
          plan_id?: string | null
          updated_at?: string | null
          workout_template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plan_workouts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          content: string
          created_at: string
          id: string
          image_url: string | null
          is_pinned: boolean | null
          moai_id: string
          profile_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_pinned?: boolean | null
          moai_id: string
          profile_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_pinned?: boolean | null
          moai_id?: string
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_moai_id_fkey"
            columns: ["moai_id"]
            isOneToOne: false
            referencedRelation: "moais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          accountability_style: string | null
          age: number | null
          bio: string | null
          birth_date: string | null
          city: string | null
          coach_accountability_style: string | null
          country: string | null
          created_at: string | null
          current_coach_id: string | null
          equipment_access: string[] | null
          fire_streak_count: number
          first_name: string | null
          first_week_commitment_set: boolean
          fitness_goals: string[] | null
          gender: string | null
          height: number | null
          hobbies: string[] | null
          id: string
          last_credit_calculation: string | null
          last_name: string | null
          latitude: number | null
          longitude: number | null
          measurement_system: string | null
          moai_credit_balance: number | null
          moai_path: string | null
          monthly_coach_credit: number | null
          movement_activities: Json | null
          movement_frequency: string | null
          movement_time: string | null
          onboarding_completed: boolean | null
          onboarding_step: number | null
          phone_number: string | null
          physical_limitations: string | null
          preferred_activities: string[] | null
          preferred_contact: string | null
          primary_goal: string | null
          profile_image: string | null
          relationship_status: string | null
          selected_moai_type: string | null
          social_handles: Json | null
          state: string | null
          street_address: string | null
          token_balance: number
          total_activities_logged: number | null
          updated_at: string | null
          user_archetype: string | null
          username: string | null
          weight: number | null
          workout_location_preference: string | null
          zip_code: string | null
        }
        Insert: {
          accountability_style?: string | null
          age?: number | null
          bio?: string | null
          birth_date?: string | null
          city?: string | null
          coach_accountability_style?: string | null
          country?: string | null
          created_at?: string | null
          current_coach_id?: string | null
          equipment_access?: string[] | null
          fire_streak_count?: number
          first_name?: string | null
          first_week_commitment_set?: boolean
          fitness_goals?: string[] | null
          gender?: string | null
          height?: number | null
          hobbies?: string[] | null
          id: string
          last_credit_calculation?: string | null
          last_name?: string | null
          latitude?: number | null
          longitude?: number | null
          measurement_system?: string | null
          moai_credit_balance?: number | null
          moai_path?: string | null
          monthly_coach_credit?: number | null
          movement_activities?: Json | null
          movement_frequency?: string | null
          movement_time?: string | null
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          phone_number?: string | null
          physical_limitations?: string | null
          preferred_activities?: string[] | null
          preferred_contact?: string | null
          primary_goal?: string | null
          profile_image?: string | null
          relationship_status?: string | null
          selected_moai_type?: string | null
          social_handles?: Json | null
          state?: string | null
          street_address?: string | null
          token_balance?: number
          total_activities_logged?: number | null
          updated_at?: string | null
          user_archetype?: string | null
          username?: string | null
          weight?: number | null
          workout_location_preference?: string | null
          zip_code?: string | null
        }
        Update: {
          accountability_style?: string | null
          age?: number | null
          bio?: string | null
          birth_date?: string | null
          city?: string | null
          coach_accountability_style?: string | null
          country?: string | null
          created_at?: string | null
          current_coach_id?: string | null
          equipment_access?: string[] | null
          fire_streak_count?: number
          first_name?: string | null
          first_week_commitment_set?: boolean
          fitness_goals?: string[] | null
          gender?: string | null
          height?: number | null
          hobbies?: string[] | null
          id?: string
          last_credit_calculation?: string | null
          last_name?: string | null
          latitude?: number | null
          longitude?: number | null
          measurement_system?: string | null
          moai_credit_balance?: number | null
          moai_path?: string | null
          monthly_coach_credit?: number | null
          movement_activities?: Json | null
          movement_frequency?: string | null
          movement_time?: string | null
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          phone_number?: string | null
          physical_limitations?: string | null
          preferred_activities?: string[] | null
          preferred_contact?: string | null
          primary_goal?: string | null
          profile_image?: string | null
          relationship_status?: string | null
          selected_moai_type?: string | null
          social_handles?: Json | null
          state?: string | null
          street_address?: string | null
          token_balance?: number
          total_activities_logged?: number | null
          updated_at?: string | null
          user_archetype?: string | null
          username?: string | null
          weight?: number | null
          workout_location_preference?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_current_coach_id_fkey"
            columns: ["current_coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      program_templates: {
        Row: {
          coach_id: string | null
          created_at: string | null
          description: string | null
          difficulty_level: string | null
          duration_weeks: number | null
          id: string
          is_public: boolean | null
          tags: string[] | null
          template_data: Json
          template_name: string
          updated_at: string | null
        }
        Insert: {
          coach_id?: string | null
          created_at?: string | null
          description?: string | null
          difficulty_level?: string | null
          duration_weeks?: number | null
          id?: string
          is_public?: boolean | null
          tags?: string[] | null
          template_data: Json
          template_name: string
          updated_at?: string | null
        }
        Update: {
          coach_id?: string | null
          created_at?: string | null
          description?: string | null
          difficulty_level?: string | null
          duration_weeks?: number | null
          id?: string
          is_public?: boolean | null
          tags?: string[] | null
          template_data?: Json
          template_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "program_templates_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      program_weeks: {
        Row: {
          created_at: string | null
          id: string
          program_id: string
          week_number: number
          workout_id: string
          workout_order: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          program_id: string
          week_number: number
          workout_id: string
          workout_order?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          program_id?: string
          week_number?: number
          workout_id?: string
          workout_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "program_weeks_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "workout_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_weeks_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      qr_invite_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          qr_token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          qr_token: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          qr_token?: string
          user_id?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          created_at: string | null
          permission_id: string
          role_id: string
        }
        Insert: {
          created_at?: string | null
          permission_id: string
          role_id: string
        }
        Update: {
          created_at?: string | null
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_permission"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_role"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      story_views: {
        Row: {
          created_at: string
          id: string
          moai_id: string
          profile_id: string
          updated_at: string
          viewed_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          moai_id: string
          profile_id: string
          updated_at?: string
          viewed_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          moai_id?: string
          profile_id?: string
          updated_at?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_views_moai_id_fkey"
            columns: ["moai_id"]
            isOneToOne: false
            referencedRelation: "moais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_views_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_description: string | null
          badge_icon: string
          badge_key: string
          badge_name: string
          badge_type: string
          created_at: string
          earned_at: string
          id: string
          milestone_value: number | null
          profile_id: string
        }
        Insert: {
          badge_description?: string | null
          badge_icon: string
          badge_key: string
          badge_name: string
          badge_type: string
          created_at?: string
          earned_at?: string
          id?: string
          milestone_value?: number | null
          profile_id: string
        }
        Update: {
          badge_description?: string | null
          badge_icon?: string
          badge_key?: string
          badge_name?: string
          badge_type?: string
          created_at?: string
          earned_at?: string
          id?: string
          milestone_value?: number | null
          profile_id?: string
        }
        Relationships: []
      }
      user_blocklist: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
          reason: string | null
          updated_at: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
          reason?: string | null
          updated_at?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
          reason?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_challenge_progress: {
        Row: {
          created_at: string | null
          current_count: number | null
          id: string
          is_completed: boolean | null
          points_earned: number | null
          target_count: number
          updated_at: string | null
          user_id: string
          weekly_challenge_id: string
        }
        Insert: {
          created_at?: string | null
          current_count?: number | null
          id?: string
          is_completed?: boolean | null
          points_earned?: number | null
          target_count: number
          updated_at?: string | null
          user_id: string
          weekly_challenge_id: string
        }
        Update: {
          created_at?: string | null
          current_count?: number | null
          id?: string
          is_completed?: boolean | null
          points_earned?: number | null
          target_count?: number
          updated_at?: string | null
          user_id?: string
          weekly_challenge_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_challenge_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_challenge_progress_weekly_challenge_id_fkey"
            columns: ["weekly_challenge_id"]
            isOneToOne: false
            referencedRelation: "weekly_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_commitments: {
        Row: {
          activity_type: string | null
          check_in_data: Json | null
          commitment_id: string | null
          commitment_type: string | null
          created_at: string
          frequency_count: number | null
          id: string
          is_completed: boolean | null
          moai_id: string | null
          movement_days_goal: number | null
          profile_id: string
          updated_at: string
          week_start_date: string
        }
        Insert: {
          activity_type?: string | null
          check_in_data?: Json | null
          commitment_id?: string | null
          commitment_type?: string | null
          created_at?: string
          frequency_count?: number | null
          id?: string
          is_completed?: boolean | null
          moai_id?: string | null
          movement_days_goal?: number | null
          profile_id: string
          updated_at?: string
          week_start_date: string
        }
        Update: {
          activity_type?: string | null
          check_in_data?: Json | null
          commitment_id?: string | null
          commitment_type?: string | null
          created_at?: string
          frequency_count?: number | null
          id?: string
          is_completed?: boolean | null
          moai_id?: string | null
          movement_days_goal?: number | null
          profile_id?: string
          updated_at?: string
          week_start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_commitments_commitment_id_fkey"
            columns: ["commitment_id"]
            isOneToOne: false
            referencedRelation: "weekly_commitments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_commitments_moai_id_fkey"
            columns: ["moai_id"]
            isOneToOne: false
            referencedRelation: "moais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_commitments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_program_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string
          assigned_via_moai: boolean | null
          assignment_type: string | null
          completed_at: string | null
          created_at: string
          id: string
          moai_id: string | null
          notes: string | null
          profile_id: string
          program_id: string
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          assigned_via_moai?: boolean | null
          assignment_type?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          moai_id?: string | null
          notes?: string | null
          profile_id: string
          program_id: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          assigned_via_moai?: boolean | null
          assignment_type?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          moai_id?: string | null
          notes?: string | null
          profile_id?: string
          program_id?: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_program_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_program_assignments_moai_id_fkey"
            columns: ["moai_id"]
            isOneToOne: false
            referencedRelation: "moais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_program_assignments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_program_assignments_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "workout_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_subscriptions: {
        Row: {
          amount_paid: number | null
          created_at: string
          currency: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          moai_id: string
          payment_date: string | null
          payment_status: string
          stripe_customer_id: string | null
          subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_paid?: number | null
          created_at?: string
          currency?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          moai_id: string
          payment_date?: string | null
          payment_status?: string
          stripe_customer_id?: string | null
          subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_paid?: number | null
          created_at?: string
          currency?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          moai_id?: string
          payment_date?: string | null
          payment_status?: string
          stripe_customer_id?: string | null
          subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_moai_id_fkey"
            columns: ["moai_id"]
            isOneToOne: false
            referencedRelation: "moais"
            referencedColumns: ["id"]
          },
        ]
      }
      user_token_purchases: {
        Row: {
          amount_usd: number
          bundle_type: string
          created_at: string
          id: string
          stripe_session_id: string
          tokens_awarded: number
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_usd: number
          bundle_type: string
          created_at?: string
          id?: string
          stripe_session_id: string
          tokens_awarded: number
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_usd?: number
          bundle_type?: string
          created_at?: string
          id?: string
          stripe_session_id?: string
          tokens_awarded?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      waitlist_submissions: {
        Row: {
          age: number
          city: string | null
          created_at: string | null
          email: string
          first_name: string
          fitness_apps: string[] | null
          gender: string | null
          id: string
          last_name: string
          location: string | null
          other_fitness_app: string | null
          other_goal: string | null
          other_referral: string | null
          other_training_app: string | null
          other_workout: string | null
          phone_number: string | null
          primary_goal: string
          referral_code: string | null
          referral_source: string
          state: string | null
          training_apps: string[] | null
          updated_at: string | null
          workout_types: string[]
        }
        Insert: {
          age: number
          city?: string | null
          created_at?: string | null
          email: string
          first_name: string
          fitness_apps?: string[] | null
          gender?: string | null
          id?: string
          last_name: string
          location?: string | null
          other_fitness_app?: string | null
          other_goal?: string | null
          other_referral?: string | null
          other_training_app?: string | null
          other_workout?: string | null
          phone_number?: string | null
          primary_goal: string
          referral_code?: string | null
          referral_source: string
          state?: string | null
          training_apps?: string[] | null
          updated_at?: string | null
          workout_types: string[]
        }
        Update: {
          age?: number
          city?: string | null
          created_at?: string | null
          email?: string
          first_name?: string
          fitness_apps?: string[] | null
          gender?: string | null
          id?: string
          last_name?: string
          location?: string | null
          other_fitness_app?: string | null
          other_goal?: string | null
          other_referral?: string | null
          other_training_app?: string | null
          other_workout?: string | null
          phone_number?: string | null
          primary_goal?: string
          referral_code?: string | null
          referral_source?: string
          state?: string | null
          training_apps?: string[] | null
          updated_at?: string | null
          workout_types?: string[]
        }
        Relationships: []
      }
      weekly_activity_summary: {
        Row: {
          activity_count: number
          created_at: string
          fire_badge_earned: boolean
          id: string
          profile_id: string
          updated_at: string
          week_start_date: string
        }
        Insert: {
          activity_count?: number
          created_at?: string
          fire_badge_earned?: boolean
          id?: string
          profile_id: string
          updated_at?: string
          week_start_date: string
        }
        Update: {
          activity_count?: number
          created_at?: string
          fire_badge_earned?: boolean
          id?: string
          profile_id?: string
          updated_at?: string
          week_start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_activity_summary_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_buddy_pairings: {
        Row: {
          buddy_group: Json
          created_at: string | null
          id: string
          moai_id: string
          week_start_date: string
        }
        Insert: {
          buddy_group: Json
          created_at?: string | null
          id?: string
          moai_id: string
          week_start_date: string
        }
        Update: {
          buddy_group?: Json
          created_at?: string | null
          id?: string
          moai_id?: string
          week_start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_buddy_pairings_moai_id_fkey"
            columns: ["moai_id"]
            isOneToOne: false
            referencedRelation: "moais"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_challenges: {
        Row: {
          challenge_template_id: string
          coach_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          updated_at: string | null
          week_start_date: string
        }
        Insert: {
          challenge_template_id: string
          coach_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          week_start_date?: string
        }
        Update: {
          challenge_template_id?: string
          coach_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          week_start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_challenges_challenge_template_id_fkey"
            columns: ["challenge_template_id"]
            isOneToOne: false
            referencedRelation: "challenge_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_challenges_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_commitments: {
        Row: {
          challenge_id: string | null
          created_at: string
          description: string | null
          end_date: string
          id: string
          is_active: boolean
          start_date: string
          title: string
          total_participants: number | null
          updated_at: string
        }
        Insert: {
          challenge_id?: string | null
          created_at?: string
          description?: string | null
          end_date: string
          id?: string
          is_active?: boolean
          start_date: string
          title: string
          total_participants?: number | null
          updated_at?: string
        }
        Update: {
          challenge_id?: string | null
          created_at?: string
          description?: string | null
          end_date?: string
          id?: string
          is_active?: boolean
          start_date?: string
          title?: string
          total_participants?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      weekly_member_commitments: {
        Row: {
          activities_completed: number
          commitment_count: number
          commitment_met: boolean | null
          created_at: string
          days_completed: number | null
          id: string
          moai_id: string
          movement_days_goal: number | null
          profile_id: string
          updated_at: string
          week_start_date: string
        }
        Insert: {
          activities_completed?: number
          commitment_count: number
          commitment_met?: boolean | null
          created_at?: string
          days_completed?: number | null
          id?: string
          moai_id: string
          movement_days_goal?: number | null
          profile_id: string
          updated_at?: string
          week_start_date: string
        }
        Update: {
          activities_completed?: number
          commitment_count?: number
          commitment_met?: boolean | null
          created_at?: string
          days_completed?: number | null
          id?: string
          moai_id?: string
          movement_days_goal?: number | null
          profile_id?: string
          updated_at?: string
          week_start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_member_commitments_moai_id_fkey"
            columns: ["moai_id"]
            isOneToOne: false
            referencedRelation: "moais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_member_commitments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_movement_plans: {
        Row: {
          committed_at: string | null
          created_at: string
          id: string
          is_committed: boolean | null
          plan_update_reason: string | null
          profile_id: string
          updated_at: string
          updated_within_window: boolean | null
          version_number: number | null
          week_start_date: string
          weekly_plan: Json
        }
        Insert: {
          committed_at?: string | null
          created_at?: string
          id?: string
          is_committed?: boolean | null
          plan_update_reason?: string | null
          profile_id: string
          updated_at?: string
          updated_within_window?: boolean | null
          version_number?: number | null
          week_start_date: string
          weekly_plan?: Json
        }
        Update: {
          committed_at?: string | null
          created_at?: string
          id?: string
          is_committed?: boolean | null
          plan_update_reason?: string | null
          profile_id?: string
          updated_at?: string
          updated_within_window?: boolean | null
          version_number?: number | null
          week_start_date?: string
          weekly_plan?: Json
        }
        Relationships: []
      }
      weekly_workout_buckets: {
        Row: {
          assigned_at: string
          client_id: string
          coach_id: string
          completed_at: string | null
          created_at: string
          id: string
          notes: string | null
          position: number
          status: string
          updated_at: string
          week_start_date: string
          workout_id: string | null
          workout_template_id: string | null
        }
        Insert: {
          assigned_at?: string
          client_id: string
          coach_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          position?: number
          status?: string
          updated_at?: string
          week_start_date: string
          workout_id?: string | null
          workout_template_id?: string | null
        }
        Update: {
          assigned_at?: string
          client_id?: string
          coach_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          position?: number
          status?: string
          updated_at?: string
          week_start_date?: string
          workout_id?: string | null
          workout_template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_weekly_buckets_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_weekly_buckets_coach"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_weekly_buckets_template"
            columns: ["workout_template_id"]
            isOneToOne: false
            referencedRelation: "workout_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_analytics: {
        Row: {
          completion_date: string
          completion_rate: number | null
          created_at: string | null
          duration_minutes: number | null
          exercises_completed: number | null
          id: string
          moai_id: string | null
          notes: string | null
          profile_id: string | null
          total_exercises: number | null
          workout_type: string | null
        }
        Insert: {
          completion_date: string
          completion_rate?: number | null
          created_at?: string | null
          duration_minutes?: number | null
          exercises_completed?: number | null
          id?: string
          moai_id?: string | null
          notes?: string | null
          profile_id?: string | null
          total_exercises?: number | null
          workout_type?: string | null
        }
        Update: {
          completion_date?: string
          completion_rate?: number | null
          created_at?: string | null
          duration_minutes?: number | null
          exercises_completed?: number | null
          id?: string
          moai_id?: string | null
          notes?: string | null
          profile_id?: string | null
          total_exercises?: number | null
          workout_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_analytics_moai_id_fkey"
            columns: ["moai_id"]
            isOneToOne: false
            referencedRelation: "moais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_analytics_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_comments: {
        Row: {
          coach_id: string
          comment_text: string
          comment_type: string | null
          created_at: string
          exercise_id: string | null
          id: string
          is_private: boolean | null
          member_id: string
          moai_id: string
          updated_at: string
          workout_completion_id: string | null
        }
        Insert: {
          coach_id: string
          comment_text: string
          comment_type?: string | null
          created_at?: string
          exercise_id?: string | null
          id?: string
          is_private?: boolean | null
          member_id: string
          moai_id: string
          updated_at?: string
          workout_completion_id?: string | null
        }
        Update: {
          coach_id?: string
          comment_text?: string
          comment_type?: string | null
          created_at?: string
          exercise_id?: string | null
          id?: string
          is_private?: boolean | null
          member_id?: string
          moai_id?: string
          updated_at?: string
          workout_completion_id?: string | null
        }
        Relationships: []
      }
      workout_completions: {
        Row: {
          activity_log_id: string | null
          completed_at: string | null
          created_at: string | null
          exercise_data: Json
          id: string
          notes: string | null
          profile_id: string
          program_id: string | null
          program_week_id: string | null
          workout_id: string
        }
        Insert: {
          activity_log_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          exercise_data: Json
          id?: string
          notes?: string | null
          profile_id: string
          program_id?: string | null
          program_week_id?: string | null
          workout_id: string
        }
        Update: {
          activity_log_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          exercise_data?: Json
          id?: string
          notes?: string | null
          profile_id?: string
          program_id?: string | null
          program_week_id?: string | null
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_completions_activity_log_id_fkey"
            columns: ["activity_log_id"]
            isOneToOne: false
            referencedRelation: "activity_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_completions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_completions_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "workout_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_completions_program_week_id_fkey"
            columns: ["program_week_id"]
            isOneToOne: false
            referencedRelation: "program_weeks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_completions_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_exercises: {
        Row: {
          created_at: string | null
          duration: string | null
          exercise_id: string
          exercise_order: number
          id: string
          notes: string | null
          order_index: number
          reps: string | null
          rest_time: string | null
          sets: number | null
          weight: string | null
          workout_id: string
        }
        Insert: {
          created_at?: string | null
          duration?: string | null
          exercise_id: string
          exercise_order?: number
          id?: string
          notes?: string | null
          order_index: number
          reps?: string | null
          rest_time?: string | null
          sets?: number | null
          weight?: string | null
          workout_id: string
        }
        Update: {
          created_at?: string | null
          duration?: string | null
          exercise_id?: string
          exercise_order?: number
          id?: string
          notes?: string | null
          order_index?: number
          reps?: string | null
          rest_time?: string | null
          sets?: number | null
          weight?: string | null
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_workout_exercises_exercise_id"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_exercises_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_folder_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string
          assigned_to_id: string
          assigned_to_type: string
          folder_id: string
          id: string
          is_active: boolean | null
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          assigned_to_id: string
          assigned_to_type: string
          folder_id: string
          id?: string
          is_active?: boolean | null
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          assigned_to_id?: string
          assigned_to_type?: string
          folder_id?: string
          id?: string
          is_active?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_folder_assignments_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "workout_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_folder_templates: {
        Row: {
          added_at: string
          folder_id: string
          id: string
          template_id: string
        }
        Insert: {
          added_at?: string
          folder_id: string
          id?: string
          template_id: string
        }
        Update: {
          added_at?: string
          folder_id?: string
          id?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_folder_templates_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "workout_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_folder_templates_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "workout_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_folders: {
        Row: {
          created_at: string
          created_by: string
          created_by_type: string
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          created_by_type: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          created_by_type?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_workout_folders_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_notes: {
        Row: {
          activity_log_id: string
          created_at: string
          id: string
          note_content: string
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_log_id: string
          created_at?: string
          id?: string
          note_content: string
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_log_id?: string
          created_at?: string
          id?: string
          note_content?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_notes_activity_log_id_fkey"
            columns: ["activity_log_id"]
            isOneToOne: false
            referencedRelation: "activity_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_programs: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          title: string
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          title: string
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_programs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_templates: {
        Row: {
          coach_id: string | null
          created_at: string
          created_by_admin: boolean | null
          description: string | null
          entry_format: string | null
          exercises: Json
          freestyle_content: string | null
          id: string
          is_active: boolean
          membership_tier: string | null
          movement_components: Json | null
          structured_exercises: Json | null
          tags: string[] | null
          template_name: string
          updated_at: string
          workout_type: Json | null
        }
        Insert: {
          coach_id?: string | null
          created_at?: string
          created_by_admin?: boolean | null
          description?: string | null
          entry_format?: string | null
          exercises?: Json
          freestyle_content?: string | null
          id?: string
          is_active?: boolean
          membership_tier?: string | null
          movement_components?: Json | null
          structured_exercises?: Json | null
          tags?: string[] | null
          template_name: string
          updated_at?: string
          workout_type?: Json | null
        }
        Update: {
          coach_id?: string | null
          created_at?: string
          created_by_admin?: boolean | null
          description?: string | null
          entry_format?: string | null
          exercises?: Json
          freestyle_content?: string | null
          id?: string
          is_active?: boolean
          membership_tier?: string | null
          movement_components?: Json | null
          structured_exercises?: Json | null
          tags?: string[] | null
          template_name?: string
          updated_at?: string
          workout_type?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_workout_templates_coach"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      workouts: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          is_freeform: boolean | null
          is_template: boolean | null
          title: string
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          is_freeform?: boolean | null
          is_template?: boolean | null
          title: string
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          is_freeform?: boolean | null
          is_template?: boolean | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "workouts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      archive_previous_buddy_chats: {
        Args: { p_moai_id: string }
        Returns: undefined
      }
      assign_mid_cycle_buddy: {
        Args: { p_moai_id: string; p_profile_id: string }
        Returns: Json
      }
      assign_program_from_template: {
        Args: {
          p_assigned_by: string
          p_moai_id: string
          p_start_date?: string
          p_template_id: string
        }
        Returns: undefined
      }
      assign_program_to_moai_members: {
        Args: {
          p_assigned_by: string
          p_moai_id: string
          p_program_id: string
          p_week_start_date?: string
        }
        Returns: undefined
      }
      assign_to_existing_buddy_group: {
        Args: { p_moai_id: string; p_user_id: string }
        Returns: boolean
      }
      block_user_from_moai: {
        Args: {
          p_blocked_by: string
          p_moai_id: string
          p_reason?: string
          p_user_id: string
        }
        Returns: undefined
      }
      calculate_credit_tier: {
        Args: { coached_members_count: number }
        Returns: number
      }
      calculate_group_success_percentage: {
        Args: { p_moai_id: string; p_week_start_date: string }
        Returns: number
      }
      calculate_member_risk_score: {
        Args: { p_member_id: string; p_moai_id: string }
        Returns: number
      }
      calculate_moai_coach_match_percentage: {
        Args: { p_moai_id: string }
        Returns: number
      }
      calculate_moai_urgency_status: {
        Args: { p_moai_id: string }
        Returns: string
      }
      calculate_monthly_credit: {
        Args: { p_user_id: string }
        Returns: number
      }
      calculate_movement_days: {
        Args: { p_profile_id: string; p_week_start_date: string }
        Returns: number
      }
      calculate_movement_days_tz: {
        Args: {
          p_profile_id: string
          p_timezone: string
          p_week_start_date: string
        }
        Returns: number
      }
      calculate_weekly_member_insights: {
        Args: { p_moai_id: string; p_week_start_date: string }
        Returns: undefined
      }
      can_user_create_new_moai: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      can_user_view_moai: {
        Args: { p_moai_id: string; p_user_id: string }
        Returns: boolean
      }
      capture_weekly_snapshots: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      check_and_award_elite_week: {
        Args: { p_moai_id: string; p_week_start_date: string }
        Returns: boolean
      }
      check_and_award_milestone_badges: {
        Args: { p_profile_id: string }
        Returns: undefined
      }
      check_and_award_moai_mover_badge: {
        Args: { p_profile_id: string; p_week_start_date: string }
        Returns: undefined
      }
      check_and_create_group_coaching_chat: {
        Args: { p_moai_id: string }
        Returns: undefined
      }
      check_and_unlock_group_progression: {
        Args: { p_moai_id: string }
        Returns: undefined
      }
      check_is_any_moai_member_for_rls: {
        Args: { p_moai_id: string; p_profile_id: string }
        Returns: boolean
      }
      check_permission: {
        Args: {
          p_moai_id?: string
          p_permission_key: string
          p_user_id: string
        }
        Returns: boolean
      }
      cleanup_expired_qr_tokens: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      coach_can_access_moai: {
        Args: { p_coach_profile_id: string; p_moai_id: string }
        Returns: boolean
      }
      coach_can_access_user: {
        Args: { p_coach_profile_id: string; p_user_id: string }
        Returns: boolean
      }
      confirm_activity_tag: {
        Args: { tag_id: string }
        Returns: string
      }
      count_user_active_moai_memberships: {
        Args: { p_profile_id: string }
        Returns: number
      }
      count_user_active_moais: {
        Args: { p_profile_id: string }
        Returns: number
      }
      create_buddy_chat_channel: {
        Args: {
          p_buddy_group: Json
          p_moai_id: string
          p_week_start_date: string
        }
        Returns: string
      }
      create_moai_invitation: {
        Args: {
          p_expires_hours?: number
          p_max_uses?: number
          p_moai_id: string
        }
        Returns: Json
      }
      create_weekly_buddy_pairings: {
        Args: { p_moai_id: string }
        Returns: undefined
      }
      create_weekly_buddy_pairings_enhanced: {
        Args: { p_moai_id: string }
        Returns: undefined
      }
      create_weekly_movement_plan_safe: {
        Args: {
          p_is_committed?: boolean
          p_profile_id: string
          p_week_start_date: string
          p_weekly_plan: Json
        }
        Returns: string
      }
      decline_activity_tag: {
        Args: { tag_id: string }
        Returns: boolean
      }
      delete_coach_program_audio: {
        Args: { p_coach_id: string; p_program_id: string }
        Returns: undefined
      }
      ensure_buddy_cycles_for_active_moais: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      evaluate_weekly_group_progress: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      evaluate_weekly_moai_progress: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_coach_alerts: {
        Args: { p_moai_id: string }
        Returns: undefined
      }
      generate_coaching_suggestions: {
        Args: { p_member_id: string; p_moai_id: string }
        Returns: string[]
      }
      generate_weekly_snapshots: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_available_moais_with_capacity: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          name: string
          goal_type: string
          description: string
          price: number
          capacity: number
          current_member_count: number
          spots_remaining: number
          coach_name: string
          coach_accountability_style: string
          is_full: boolean
        }[]
      }
      get_challenge_week_start: {
        Args: { p_timezone?: string }
        Returns: string
      }
      get_coach_program_audio: {
        Args: { p_coach_id: string; p_program_id: string }
        Returns: {
          id: string
          program_id: string
          coach_id: string
          audio_url: string
          duration_seconds: number
          created_at: string
          updated_at: string
        }[]
      }
      get_coach_program_audios: {
        Args: { p_coach_id: string }
        Returns: {
          id: string
          program_id: string
          coach_id: string
          audio_url: string
          duration_seconds: number
          created_at: string
          updated_at: string
        }[]
      }
      get_coached_members_count: {
        Args: { p_coach_id: string; p_user_id: string }
        Returns: number
      }
      get_commitment_window_state: {
        Args: { p_timezone?: string }
        Returns: string
      }
      get_committed_weekly_plan: {
        Args: { p_profile_id: string; p_week_start_date: string }
        Returns: {
          weekly_plan: Json
          committed_at: string
          version_number: number
        }[]
      }
      get_current_buddy_cycle: {
        Args: { p_moai_id: string }
        Returns: {
          cycle_id: string
          cycle_start_date: string
          cycle_end_date: string
          days_remaining: number
        }[]
      }
      get_current_week_start: {
        Args: { p_timezone?: string }
        Returns: string
      }
      get_current_weekly_plan: {
        Args: { p_profile_id: string; p_week_start_date: string }
        Returns: {
          weekly_plan: Json
          is_committed: boolean
          committed_at: string
          version_number: number
          created_at: string
        }[]
      }
      get_enhanced_member_insights: {
        Args: { p_coach_id: string; p_moai_id: string }
        Returns: {
          member_id: string
          first_name: string
          last_name: string
          profile_image: string
          total_activities: number
          weekly_activities: number
          current_streak: number
          last_activity_date: string
          has_notes: boolean
          latest_note: string
          member_tags: string[]
          last_checkin_date: string
          days_since_checkin: number
          engagement_score: number
        }[]
      }
      get_group_progression_summary: {
        Args: { p_moai_id: string }
        Returns: {
          elite_weeks_total: number
          current_status_number: number
          current_status_name: string
          current_status_description: string
          next_status_progress: number
          current_stone_number: number
          current_stone_name: string
          next_stone_progress: number
          recent_elite_weeks: Json
        }[]
      }
      get_member_leaderboard: {
        Args: Record<PropertyKey, never>
        Returns: {
          profile_id: string
          first_name: string
          last_name: string
          profile_image: string
          fire_badge_count: number
          moai_names: string[]
        }[]
      }
      get_moai_leaderboard: {
        Args: Record<PropertyKey, never>
        Returns: {
          moai_id: string
          moai_name: string
          moai_image: string
          total_fire_badges: number
          member_count: number
        }[]
      }
      get_moai_type: {
        Args: { p_moai_id: string }
        Returns: Database["public"]["Enums"]["moai_type"]
      }
      get_next_plan_version: {
        Args: { p_profile_id: string; p_week_start_date: string }
        Returns: number
      }
      get_next_week_start: {
        Args: { p_timezone?: string }
        Returns: string
      }
      get_personal_best: {
        Args: { p_exercise_id: string; p_user_id: string }
        Returns: {
          max_weight: number
          reps_at_max_weight: number
          max_reps: number
          weight_at_max_reps: number
        }[]
      }
      get_personal_records: {
        Args: { p_exercise_id: string; p_user_id: string }
        Returns: {
          id: string
          exercise_id: string
          exercise_name: string
          weight_lbs: number
          reps: number
          achieved_at: string
        }[]
      }
      get_plan_update_history: {
        Args: { p_profile_id: string; p_week_start_date: string }
        Returns: {
          weekly_plan: Json
          is_committed: boolean
          committed_at: string
          version_number: number
          created_at: string
          plan_update_reason: string
          updated_within_window: boolean
        }[]
      }
      get_tier_info: {
        Args: { p_tier: number }
        Returns: {
          tier_number: number
          tier_name: string
          weeks_required: number
          weeks_for_next_tier: number
        }[]
      }
      get_user_moai_role_secure: {
        Args: { p_moai_id: string; p_user_id: string }
        Returns: string
      }
      get_user_token_balance: {
        Args: { p_user_id: string }
        Returns: number
      }
      get_user_token_history: {
        Args: { p_limit?: number; p_user_id: string }
        Returns: {
          id: string
          source_type: string
          points: number
          awarded_on: string
          week_start_date: string
          moai_name: string
        }[]
      }
      grant_moai_permission: {
        Args: {
          _granted_by: string
          _moai_id: string
          _permission_key: string
          _profile_id: string
        }
        Returns: undefined
      }
      handle_member_leave_buddy_system: {
        Args: { p_moai_id: string; p_profile_id: string }
        Returns: Json
      }
      has_moai_permission: {
        Args: { _moai_id: string; _permission_key: string; _profile_id: string }
        Returns: boolean
      }
      has_permission: {
        Args: { _permission_key: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: { _role: string; _user_id: string }
        Returns: boolean
      }
      increment_token_balance: {
        Args: { amount: number; user_id: string }
        Returns: undefined
      }
      initialize_user_checkpoints: {
        Args: { user_id: string }
        Returns: undefined
      }
      insert_workout_photo: {
        Args: { photo_url: string; workout_log_id: string }
        Returns: undefined
      }
      is_active_member_secure: {
        Args: { p_moai_id: string; p_user_id: string }
        Returns: boolean
      }
      is_admin: {
        Args: Record<PropertyKey, never> | { user_id: string }
        Returns: boolean
      }
      is_authenticated_user: {
        Args: { _profile_id: string }
        Returns: boolean
      }
      is_coach_of: {
        Args: { _moai_id: string; _profile_id: string }
        Returns: boolean
      }
      is_commitment_window_open: {
        Args: Record<PropertyKey, never> | { p_timezone?: string }
        Returns: boolean
      }
      is_moai_admin: {
        Args: { _moai_id: string; _profile_id: string }
        Returns: boolean
      }
      is_moai_creator_secure: {
        Args: { p_moai_id: string; p_user_id: string }
        Returns: boolean
      }
      is_moai_full: {
        Args: { p_moai_id: string }
        Returns: boolean
      }
      is_moai_member: {
        Args: { _moai_id: string; _profile_id: string }
        Returns: boolean
      }
      is_user_active_member_of_moai: {
        Args: { p_moai_id: string; p_profile_id: string }
        Returns: boolean
      }
      is_user_active_member_of_moai_secure: {
        Args: { p_moai_id: string; p_user_id: string }
        Returns: boolean
      }
      is_user_active_member_or_invitee: {
        Args: { p_moai_id: string; p_user_id: string }
        Returns: boolean
      }
      is_user_blocked_from_moai: {
        Args: { moai_id: string; user_id: string }
        Returns: boolean
      }
      is_user_coached_by: {
        Args: { p_coach_id: string; p_user_id: string }
        Returns: boolean
      }
      is_user_invited_to_private_moai: {
        Args: { p_moai_id: string; p_profile_id: string }
        Returns: boolean
      }
      is_user_member_of_moai: {
        Args: { p_moai_id: string; p_user_id: string }
        Returns: boolean
      }
      is_user_moai_admin: {
        Args: { p_moai_id: string; p_user_id: string }
        Returns: boolean
      }
      is_user_moai_member: {
        Args: { moai_id_param: string }
        Returns: boolean
      }
      is_username_available: {
        Args: { desired_username: string }
        Returns: boolean
      }
      is_valid_and_consumable_invite_token: {
        Args: {
          p_invite_token: string
          p_moai_id: string
          p_profile_id: string
        }
        Returns: boolean
      }
      join_moai_action: {
        Args: { p_moai_id: string }
        Returns: Json
      }
      log_activity_from_tag: {
        Args: {
          p_activity_type: string
          p_duration_minutes?: number
          p_emoji: string
          p_location?: string
          p_logged_at?: string
          p_notes?: string
          p_tag_id: string
        }
        Returns: string
      }
      log_workout_photo: {
        Args: { p_photo_url: string; p_workout_log_id: string }
        Returns: undefined
      }
      parse_activity_text: {
        Args: { activity_types: string[]; text_input: string }
        Returns: Json
      }
      pin_post: {
        Args: { post_id_param: string }
        Returns: undefined
      }
      recalculate_user_commitments: {
        Args: { p_profile_id: string; p_timezone?: string }
        Returns: number
      }
      revoke_moai_permission: {
        Args: { _moai_id: string; _permission_key: string; _profile_id: string }
        Returns: undefined
      }
      rls_enabled: {
        Args: { message: string; table_name: string }
        Returns: undefined
      }
      save_coach_program_audio: {
        Args: {
          p_audio_url: string
          p_coach_id: string
          p_duration_seconds?: number
          p_program_id: string
        }
        Returns: string
      }
      send_buddy_nudge: {
        Args: { p_moai_id: string; p_receiver_id: string }
        Returns: boolean
      }
      sync_user_token_balance: {
        Args: { p_user_id: string }
        Returns: number
      }
      tag_workout_member: {
        Args: {
          p_tagged_by_id: string
          p_tagged_user_id: string
          p_workout_log_id: string
        }
        Returns: undefined
      }
      unblock_user_from_moai: {
        Args: { p_moai_id: string; p_user_id: string }
        Returns: undefined
      }
      unpin_moai_posts: {
        Args: { moai_id_param: string }
        Returns: undefined
      }
      update_challenge_progress: {
        Args: {
          p_activity_date: string
          p_activity_type: string
          p_user_id: string
        }
        Returns: undefined
      }
      update_commitment_completion: {
        Args: {
          p_profile_id: string
          p_timezone?: string
          p_week_start_date: string
        }
        Returns: undefined
      }
      update_moai_tier_progression: {
        Args: { p_moai_id: string }
        Returns: undefined
      }
      user_has_active_subscription: {
        Args: { p_moai_id: string; p_user_id: string }
        Returns: boolean
      }
      user_has_global_role: {
        Args: { p_role_name: string; p_user_id: string }
        Returns: boolean
      }
      user_is_tagged_in_activity_log: {
        Args: { activity_log_id: string }
        Returns: boolean
      }
      users_share_moai: {
        Args: { user1_id: string; user2_id: string }
        Returns: boolean
      }
      validate_and_consume_invite: {
        Args: { p_invite_code: string }
        Returns: Json
      }
      validate_buddy_system_integrity: {
        Args: { p_moai_id?: string }
        Returns: Json
      }
      validate_checkpoint_completion: {
        Args: { step_data: Json; step_num: number; user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      assignment_type: "moai_auto" | "manual"
      chat_type: "coach_dm" | "moai_group" | "buddy_chat"
      moai_format: "goal" | "activity"
      moai_member_role: "member" | "admin" | "coach"
      moai_status: "active" | "archived"
      moai_type: "public" | "private"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      assignment_type: ["moai_auto", "manual"],
      chat_type: ["coach_dm", "moai_group", "buddy_chat"],
      moai_format: ["goal", "activity"],
      moai_member_role: ["member", "admin", "coach"],
      moai_status: ["active", "archived"],
      moai_type: ["public", "private"],
    },
  },
} as const

