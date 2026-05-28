export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
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
      badge_unlocks: {
        Row: {
          badge_id: string
          family_member_id: string
          id: string
          unlocked_at: string
        }
        Insert: {
          badge_id: string
          family_member_id: string
          id?: string
          unlocked_at?: string
        }
        Update: {
          badge_id?: string
          family_member_id?: string
          id?: string
          unlocked_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "badge_unlocks_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "badge_unlocks_family_member_id_fkey"
            columns: ["family_member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          code: string
          coins_reward: number
          criteria: Json | null
          description: string | null
          icon_url: string | null
          id: string
          name: string
          xp_reward: number
        }
        Insert: {
          code: string
          coins_reward?: number
          criteria?: Json | null
          description?: string | null
          icon_url?: string | null
          id?: string
          name: string
          xp_reward?: number
        }
        Update: {
          code?: string
          coins_reward?: number
          criteria?: Json | null
          description?: string | null
          icon_url?: string | null
          id?: string
          name?: string
          xp_reward?: number
        }
        Relationships: []
      }
      bucket_list_completions: {
        Row: {
          completed_at: string
          created_at: string
          id: string
          item_id: string
          location: string | null
          notes: string | null
          participants: string[]
          photos: string[]
        }
        Insert: {
          completed_at?: string
          created_at?: string
          id?: string
          item_id: string
          location?: string | null
          notes?: string | null
          participants?: string[]
          photos?: string[]
        }
        Update: {
          completed_at?: string
          created_at?: string
          id?: string
          item_id?: string
          location?: string | null
          notes?: string | null
          participants?: string[]
          photos?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "bucket_list_completions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "bucket_list_items"
            referencedColumns: ["id"]
          },
        ]
      }
      bucket_list_items: {
        Row: {
          category: Database["public"]["Enums"]["bucket_list_category"]
          completed_at: string | null
          created_at: string
          created_by: string
          description: string | null
          family_id: string
          id: string
          points: number
          priority: Database["public"]["Enums"]["bucket_list_priority"]
          status: Database["public"]["Enums"]["bucket_list_status"]
          target_date: string | null
          title: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["bucket_list_category"]
          completed_at?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          family_id: string
          id?: string
          points?: number
          priority?: Database["public"]["Enums"]["bucket_list_priority"]
          status?: Database["public"]["Enums"]["bucket_list_status"]
          target_date?: string | null
          title: string
        }
        Update: {
          category?: Database["public"]["Enums"]["bucket_list_category"]
          completed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          family_id?: string
          id?: string
          points?: number
          priority?: Database["public"]["Enums"]["bucket_list_priority"]
          status?: Database["public"]["Enums"]["bucket_list_status"]
          target_date?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "bucket_list_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bucket_list_items_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          all_day: boolean
          created_at: string
          created_by: string
          description: string | null
          end_at: string
          family_id: string
          id: string
          start_at: string
          title: string
        }
        Insert: {
          all_day?: boolean
          created_at?: string
          created_by: string
          description?: string | null
          end_at: string
          family_id: string
          id?: string
          start_at: string
          title: string
        }
        Update: {
          all_day?: boolean
          created_at?: string
          created_by?: string
          description?: string | null
          end_at?: string
          family_id?: string
          id?: string
          start_at?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_logs: {
        Row: {
          challenge_id: string
          delta: number
          id: string
          logged_at: string
          note: string | null
          participant_id: string
        }
        Insert: {
          challenge_id: string
          delta: number
          id?: string
          logged_at?: string
          note?: string | null
          participant_id: string
        }
        Update: {
          challenge_id?: string
          delta?: number
          id?: string
          logged_at?: string
          note?: string | null
          participant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_logs_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_logs_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "challenge_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_participants: {
        Row: {
          challenge_id: string
          completed_at: string | null
          current_value: number
          family_member_id: string
          id: string
          joined_at: string
          points_earned: number
        }
        Insert: {
          challenge_id: string
          completed_at?: string | null
          current_value?: number
          family_member_id: string
          id?: string
          joined_at?: string
          points_earned?: number
        }
        Update: {
          challenge_id?: string
          completed_at?: string | null
          current_value?: number
          family_member_id?: string
          id?: string
          joined_at?: string
          points_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "challenge_participants_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_participants_family_member_id_fkey"
            columns: ["family_member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_tasks: {
        Row: {
          challenge_id: string
          damage: number
          id: string
          show_on_task_list: boolean
          task_id: string
        }
        Insert: {
          challenge_id: string
          damage?: number
          id?: string
          show_on_task_list?: boolean
          task_id: string
        }
        Update: {
          challenge_id?: string
          damage?: number
          id?: string
          show_on_task_list?: boolean
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_tasks_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_tasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          boss_emoji: string
          boss_name: string | null
          created_at: string
          created_by: string
          description: string | null
          end_date: string | null
          family_id: string
          id: string
          points: number
          reward_coins: number
          reward_xp: number
          start_date: string | null
          status: Database["public"]["Enums"]["challenge_status"]
          target_value: number
          template_id: string | null
          title: string
          type: Database["public"]["Enums"]["challenge_type"]
          unit: string
        }
        Insert: {
          boss_emoji?: string
          boss_name?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          end_date?: string | null
          family_id: string
          id?: string
          points?: number
          reward_coins?: number
          reward_xp?: number
          start_date?: string | null
          status?: Database["public"]["Enums"]["challenge_status"]
          target_value?: number
          template_id?: string | null
          title: string
          type?: Database["public"]["Enums"]["challenge_type"]
          unit?: string
        }
        Update: {
          boss_emoji?: string
          boss_name?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          end_date?: string | null
          family_id?: string
          id?: string
          points?: number
          reward_coins?: number
          reward_xp?: number
          start_date?: string | null
          status?: Database["public"]["Enums"]["challenge_status"]
          target_value?: number
          template_id?: string | null
          title?: string
          type?: Database["public"]["Enums"]["challenge_type"]
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenges_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenges_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      chore_chart_slots: {
        Row: {
          assignee_id: string
          chart_id: string
          day_of_week: number
          id: string
        }
        Insert: {
          assignee_id: string
          chart_id: string
          day_of_week: number
          id?: string
        }
        Update: {
          assignee_id?: string
          chart_id?: string
          day_of_week?: number
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chore_chart_slots_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chore_chart_slots_chart_id_fkey"
            columns: ["chart_id"]
            isOneToOne: false
            referencedRelation: "chore_charts"
            referencedColumns: ["id"]
          },
        ]
      }
      chore_charts: {
        Row: {
          coins_reward: number
          created_at: string
          created_by: string
          description: string | null
          difficulty: Database["public"]["Enums"]["task_difficulty"]
          family_id: string
          id: string
          is_active: boolean
          points: number
          rotation_members: string[]
          schedule_type: Database["public"]["Enums"]["chore_schedule_type"]
          title: string
        }
        Insert: {
          coins_reward?: number
          created_at?: string
          created_by: string
          description?: string | null
          difficulty?: Database["public"]["Enums"]["task_difficulty"]
          family_id: string
          id?: string
          is_active?: boolean
          points?: number
          rotation_members?: string[]
          schedule_type?: Database["public"]["Enums"]["chore_schedule_type"]
          title: string
        }
        Update: {
          coins_reward?: number
          created_at?: string
          created_by?: string
          description?: string | null
          difficulty?: Database["public"]["Enums"]["task_difficulty"]
          family_id?: string
          id?: string
          is_active?: boolean
          points?: number
          rotation_members?: string[]
          schedule_type?: Database["public"]["Enums"]["chore_schedule_type"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "chore_charts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chore_charts_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      event_attendees: {
        Row: {
          event_id: string
          family_member_id: string
          id: string
          status: Database["public"]["Enums"]["attendance_status"]
        }
        Insert: {
          event_id: string
          family_member_id: string
          id?: string
          status?: Database["public"]["Enums"]["attendance_status"]
        }
        Update: {
          event_id?: string
          family_member_id?: string
          id?: string
          status?: Database["public"]["Enums"]["attendance_status"]
        }
        Relationships: [
          {
            foreignKeyName: "event_attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "calendar_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_attendees_family_member_id_fkey"
            columns: ["family_member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      families: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      family_invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          family_id: string
          id: string
          invited_by: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          family_id: string
          id?: string
          invited_by: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          family_id?: string
          id?: string
          invited_by?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_invites_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      family_members: {
        Row: {
          avatar_url: string | null
          birthdate: string | null
          coins: number
          created_at: string
          current_streak: number
          family_id: string
          id: string
          last_active_date: string | null
          level: number
          longest_streak: number
          nickname: string
          notification_prefs: Json
          pin_hash: string | null
          push_token: string | null
          role: Database["public"]["Enums"]["family_role"]
          timezone: string
          total_xp: number
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          birthdate?: string | null
          coins?: number
          created_at?: string
          current_streak?: number
          family_id: string
          id?: string
          last_active_date?: string | null
          level?: number
          longest_streak?: number
          nickname: string
          notification_prefs?: Json
          pin_hash?: string | null
          push_token?: string | null
          role?: Database["public"]["Enums"]["family_role"]
          timezone?: string
          total_xp?: number
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          birthdate?: string | null
          coins?: number
          created_at?: string
          current_streak?: number
          family_id?: string
          id?: string
          last_active_date?: string | null
          level?: number
          longest_streak?: number
          nickname?: string
          notification_prefs?: Json
          pin_hash?: string | null
          push_token?: string | null
          role?: Database["public"]["Enums"]["family_role"]
          timezone?: string
          total_xp?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "family_members_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderboard_history: {
        Row: {
          created_at: string
          family_id: string
          family_member_id: string
          id: string
          rank: number
          week_end: string
          week_start: string
          xp_earned: number
        }
        Insert: {
          created_at?: string
          family_id: string
          family_member_id: string
          id?: string
          rank?: number
          week_end: string
          week_start: string
          xp_earned?: number
        }
        Update: {
          created_at?: string
          family_id?: string
          family_member_id?: string
          id?: string
          rank?: number
          week_end?: string
          week_start?: string
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "leaderboard_history_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leaderboard_history_family_member_id_fkey"
            columns: ["family_member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      movie_watches: {
        Row: {
          id: string
          movie_id: string
          notes: string | null
          rating: number | null
          watched_at: string
          watched_by: string
        }
        Insert: {
          id?: string
          movie_id: string
          notes?: string | null
          rating?: number | null
          watched_at?: string
          watched_by: string
        }
        Update: {
          id?: string
          movie_id?: string
          notes?: string | null
          rating?: number | null
          watched_at?: string
          watched_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "movie_watches_movie_id_fkey"
            columns: ["movie_id"]
            isOneToOne: false
            referencedRelation: "movies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movie_watches_watched_by_fkey"
            columns: ["watched_by"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      movies: {
        Row: {
          added_by: string
          created_at: string
          family_id: string
          id: string
          poster_url: string | null
          rating: number | null
          status: Database["public"]["Enums"]["movie_status"]
          title: string
          year: number | null
        }
        Insert: {
          added_by: string
          created_at?: string
          family_id: string
          id?: string
          poster_url?: string | null
          rating?: number | null
          status?: Database["public"]["Enums"]["movie_status"]
          title: string
          year?: number | null
        }
        Update: {
          added_by?: string
          created_at?: string
          family_id?: string
          id?: string
          poster_url?: string | null
          rating?: number | null
          status?: Database["public"]["Enums"]["movie_status"]
          title?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "movies_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movies_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          attempts: number
          body: string
          created_at: string
          data: Json | null
          family_member_id: string
          id: string
          sent_at: string | null
          status: string
          title: string
          type: string
        }
        Insert: {
          attempts?: number
          body: string
          created_at?: string
          data?: Json | null
          family_member_id: string
          id?: string
          sent_at?: string | null
          status?: string
          title: string
          type: string
        }
        Update: {
          attempts?: number
          body?: string
          created_at?: string
          data?: Json | null
          family_member_id?: string
          id?: string
          sent_at?: string | null
          status?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_family_member_id_fkey"
            columns: ["family_member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_redemptions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          coins_spent: number
          id: string
          redeemed_at: string
          redeemed_by: string
          reward_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          coins_spent: number
          id?: string
          redeemed_at?: string
          redeemed_by: string
          reward_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          coins_spent?: number
          id?: string
          redeemed_at?: string
          redeemed_by?: string
          reward_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_redemptions_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_redemptions_redeemed_by_fkey"
            columns: ["redeemed_by"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards: {
        Row: {
          cost_coins: number
          created_at: string
          created_by: string
          description: string | null
          family_id: string
          icon_url: string | null
          id: string
          is_active: boolean
          title: string
        }
        Insert: {
          cost_coins: number
          created_at?: string
          created_by: string
          description?: string | null
          family_id: string
          icon_url?: string | null
          id?: string
          is_active?: boolean
          title: string
        }
        Update: {
          cost_coins?: number
          created_at?: string
          created_by?: string
          description?: string | null
          family_id?: string
          icon_url?: string | null
          id?: string
          is_active?: boolean
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "rewards_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rewards_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      task_activities: {
        Row: {
          created_at: string
          family_id: string
          id: string
          last_used_at: string
          name: string
        }
        Insert: {
          created_at?: string
          family_id: string
          id?: string
          last_used_at?: string
          name: string
        }
        Update: {
          created_at?: string
          family_id?: string
          id?: string
          last_used_at?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_activities_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      task_completions: {
        Row: {
          coins_awarded: number
          completed_at: string
          completed_by: string
          id: string
          notes: string | null
          photo_url: string | null
          points_awarded: number
          task_id: string
        }
        Insert: {
          coins_awarded?: number
          completed_at?: string
          completed_by: string
          id?: string
          notes?: string | null
          photo_url?: string | null
          points_awarded?: number
          task_id: string
        }
        Update: {
          coins_awarded?: number
          completed_at?: string
          completed_by?: string
          id?: string
          notes?: string | null
          photo_url?: string | null
          points_awarded?: number
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_completions_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_completions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assignee_id: string | null
          coins_reward: number
          created_at: string
          created_by: string
          creator_tz: string
          description: string | null
          difficulty: Database["public"]["Enums"]["task_difficulty"]
          due_date: string | null
          family_id: string
          id: string
          is_active: boolean
          points: number
          recurrence: Database["public"]["Enums"]["task_recurrence"]
          source_chart_id: string | null
          task_type: Database["public"]["Enums"]["task_type"]
          title: string
        }
        Insert: {
          assignee_id?: string | null
          coins_reward?: number
          created_at?: string
          created_by: string
          creator_tz?: string
          description?: string | null
          difficulty?: Database["public"]["Enums"]["task_difficulty"]
          due_date?: string | null
          family_id: string
          id?: string
          is_active?: boolean
          points?: number
          recurrence?: Database["public"]["Enums"]["task_recurrence"]
          source_chart_id?: string | null
          task_type?: Database["public"]["Enums"]["task_type"]
          title: string
        }
        Update: {
          assignee_id?: string | null
          coins_reward?: number
          created_at?: string
          created_by?: string
          creator_tz?: string
          description?: string | null
          difficulty?: Database["public"]["Enums"]["task_difficulty"]
          due_date?: string | null
          family_id?: string
          id?: string
          is_active?: boolean
          points?: number
          recurrence?: Database["public"]["Enums"]["task_recurrence"]
          source_chart_id?: string | null
          task_type?: Database["public"]["Enums"]["task_type"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_source_chart_id_fkey"
            columns: ["source_chart_id"]
            isOneToOne: false
            referencedRelation: "chore_charts"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          created_at: string
          delta_coins: number
          delta_xp: number
          family_member_id: string
          id: string
          reason: string
          ref_id: string | null
          ref_table: string | null
        }
        Insert: {
          created_at?: string
          delta_coins?: number
          delta_xp?: number
          family_member_id: string
          id?: string
          reason: string
          ref_id?: string | null
          ref_table?: string | null
        }
        Update: {
          created_at?: string
          delta_coins?: number
          delta_xp?: number
          family_member_id?: string
          id?: string
          reason?: string
          ref_id?: string | null
          ref_table?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_family_member_id_fkey"
            columns: ["family_member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      award_points: {
        Args: {
          p_coins: number
          p_member_id: string
          p_reason: string
          p_ref_id?: string
          p_ref_table?: string
          p_xp: number
        }
        Returns: undefined
      }
      check_badges: { Args: { p_member_id: string }; Returns: string[] }
      complete_bucket_list_item: {
        Args: {
          p_item_id: string
          p_location?: string
          p_notes?: string
          p_participants?: string[]
          p_photos?: string[]
        }
        Returns: string
      }
      claim_daily_chest: {
        Args: { p_member_id: string }
        Returns: Json
      }
      complete_task: {
        Args: { p_member_id: string; p_task_id: string }
        Returns: Json
      }
      create_challenge: {
        Args: {
          p_boss_emoji: string
          p_boss_name: string
          p_created_by: string
          p_end_date?: string
          p_family_id: string
          p_participant_ids?: string[]
          p_reward_coins: number
          p_reward_xp: number
          p_tasks?: Json
          p_template_id: string
          p_title: string
        }
        Returns: string
      }
      create_chore_chart: {
        Args: {
          p_coins_reward?: number
          p_created_by?: string
          p_description?: string
          p_difficulty?: Database["public"]["Enums"]["task_difficulty"]
          p_family_id: string
          p_points?: number
          p_rotation_members?: string[]
          p_schedule_type?: Database["public"]["Enums"]["chore_schedule_type"]
          p_slots?: Json
          p_title: string
        }
        Returns: string
      }
      create_family_with_member: {
        Args: { p_name: string; p_nickname: string }
        Returns: string
      }
      ensure_daily_habits: {
        Args: { p_family_id: string; p_member_id: string; p_tz: string }
        Returns: undefined
      }
      expire_failed_challenges: { Args: never; Returns: undefined }
      generate_chore_tasks: { Args: never; Returns: undefined }
      get_assignable_family_members: {
        Args: { p_family_id: string }
        Returns: {
          id: string
          nickname: string
          role: Database["public"]["Enums"]["family_role"]
        }[]
      }
      is_assignable_family_member: {
        Args: { p_member_id: string }
        Returns: boolean
      }
      is_family_member: { Args: { p_family_id: string }; Returns: boolean }
      is_family_parent: { Args: { p_family_id: string }; Returns: boolean }
      join_challenge: {
        Args: { p_challenge_id: string; p_member_id: string }
        Returns: undefined
      }
      join_family_with_invite: {
        Args: { p_invite_code: string; p_nickname: string }
        Returns: string
      }
      log_challenge_contribution:
        | {
            Args: {
              p_challenge_id: string
              p_delta: number
              p_member_id: string
              p_note?: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_challenge_id: string
              p_delta: number
              p_from_trigger?: boolean
              p_member_id: string
              p_note?: string
            }
            Returns: Json
          }
      my_family_ids: { Args: never; Returns: string[] }
      notify_overdue_tasks: { Args: never; Returns: undefined }
      notify_streak_at_risk: { Args: never; Returns: undefined }
      redeem_reward: {
        Args: { p_member_id: string; p_reward_id: string }
        Returns: Json
      }
      reset_stale_streaks: { Args: never; Returns: undefined }
      retry_failed_notifications: { Args: never; Returns: undefined }
      snapshot_weekly_leaderboard: { Args: never; Returns: undefined }
      update_chore_chart: {
        Args: {
          p_chart_id: string
          p_coins_reward?: number
          p_description?: string
          p_difficulty?: Database["public"]["Enums"]["task_difficulty"]
          p_is_active?: boolean
          p_points?: number
          p_rotation_members?: string[]
          p_schedule_type?: Database["public"]["Enums"]["chore_schedule_type"]
          p_slots?: Json
          p_title: string
        }
        Returns: undefined
      }
      update_streak: { Args: { p_member_id: string }; Returns: undefined }
    }
    Enums: {
      attendance_status: "going" | "maybe" | "declined"
      bucket_list_category: "travel" | "experience" | "skill" | "other"
      bucket_list_priority: "small" | "medium" | "large"
      bucket_list_status: "open" | "in_progress" | "completed"
      challenge_status: "active" | "completed" | "cancelled" | "failed"
      challenge_type: "solo" | "collaborative" | "boss_battle"
      chore_schedule_type: "fixed" | "rotate_weekly"
      family_role: "parent" | "child" | "admin"
      movie_status: "want_to_watch" | "watched"
      task_difficulty: "easy" | "medium" | "hard"
      task_recurrence: "none" | "daily" | "weekly" | "monthly"
      task_type: "regular" | "daily_habit"
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
      attendance_status: ["going", "maybe", "declined"],
      bucket_list_category: ["travel", "experience", "skill", "other"],
      bucket_list_priority: ["small", "medium", "large"],
      bucket_list_status: ["open", "in_progress", "completed"],
      challenge_status: ["active", "completed", "cancelled", "failed"],
      challenge_type: ["solo", "collaborative", "boss_battle"],
      chore_schedule_type: ["fixed", "rotate_weekly"],
      family_role: ["parent", "child", "admin"],
      movie_status: ["want_to_watch", "watched"],
      task_difficulty: ["easy", "medium", "hard"],
      task_recurrence: ["none", "daily", "weekly", "monthly"],
      task_type: ["regular", "daily_habit"],
    },
  },
} as const
