export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type HabitCategory = 'self_discipline' | 'learning' | 'exercise' | 'sleep' | 'diet' | 'life' | 'other'
export type TargetType = 'boolean' | 'duration' | 'count' | 'value'
export type RepeatType = 'daily' | 'weekdays' | 'weekends' | 'weekly' | 'custom'
export type OccurrenceStatus = 'pending' | 'done' | 'skipped' | 'missed'
export type SleepQuality = 'great' | 'fair' | 'poor'
export type ExerciseCategory = 'running' | 'walking' | 'gym' | 'stretching' | 'cycling' | 'yoga' | 'ball' | 'rehab' | 'other'
export type ExerciseIntensity = 'light' | 'moderate' | 'intense'
export type SetFeeling = 'easy' | 'slight' | 'challenging' | 'painful'
export type BookStatus = 'reading' | 'finished' | 'paused' | 'dropped'
export type BookSource = 'manual' | 'weixin_read' | 'kindle' | 'other'
export type Mood = 'great' | 'fair' | 'poor'
export type GoalStatus = 'active' | 'completed' | 'abandoned'
export type GoalKrStatus = 'not_started' | 'in_progress' | 'completed'
export type CoupleStatus = 'active' | 'disbanded'
export type InviteStatus = 'pending' | 'accepted' | 'expired' | 'cancelled'
export type ShareLevel = 'none' | 'status' | 'detail'
export type DataType = 'habits' | 'sleep' | 'exercise' | 'reading' | 'reflection' | 'goals'
export type SuggestionType = 'exercise' | 'rest' | 'sleep' | 'other'
export type SuggestionStatus = 'pending' | 'accepted' | 'modified' | 'rejected' | 'ignored'
export type EncouragementType = '加油' | '辛苦了' | '早点休息' | 'custom'
export type ReminderType = 'primary' | 'secondary'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          nickname: string | null
          avatar_url: string | null
          timezone: string
          preferred_wake_time: string | null
          preferred_sleep_time: string | null
          work_days: number[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          nickname?: string | null
          avatar_url?: string | null
          timezone?: string
          preferred_wake_time?: string | null
          preferred_sleep_time?: string | null
          work_days?: number[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          nickname?: string | null
          avatar_url?: string | null
          timezone?: string
          preferred_wake_time?: string | null
          preferred_sleep_time?: string | null
          work_days?: number[]
          created_at?: string
          updated_at?: string
        }
      }
      habits: {
        Row: {
          id: string
          user_id: string
          name: string
          category: HabitCategory
          icon: string | null
          color: string
          target_type: TargetType
          target_value: number | null
          target_unit: string | null
          is_important: boolean
          is_shared: boolean
          is_enabled: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          category?: HabitCategory
          icon?: string | null
          color?: string
          target_type: TargetType
          target_value?: number | null
          target_unit?: string | null
          is_important?: boolean
          is_shared?: boolean
          is_enabled?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          category?: HabitCategory
          icon?: string | null
          color?: string
          target_type?: TargetType
          target_value?: number | null
          target_unit?: string | null
          is_important?: boolean
          is_shared?: boolean
          is_enabled?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      habit_schedules: {
        Row: {
          id: string
          habit_id: string
          repeat_type: RepeatType
          repeat_days: number[]
          custom_dates: string[]
          start_date: string
          end_date: string | null
          reminder_time: string | null
          reminder_secondary: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          habit_id: string
          repeat_type: RepeatType
          repeat_days?: number[]
          custom_dates?: string[]
          start_date: string
          end_date?: string | null
          reminder_time?: string | null
          reminder_secondary?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          habit_id?: string
          repeat_type?: RepeatType
          repeat_days?: number[]
          custom_dates?: string[]
          start_date?: string
          end_date?: string | null
          reminder_time?: string | null
          reminder_secondary?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      habit_occurrences: {
        Row: {
          id: string
          user_id: string
          habit_id: string
          local_date: string
          title_snapshot: string
          target_type_snapshot: string
          target_value_snapshot: number | null
          target_unit_snapshot: string | null
          status: OccurrenceStatus
          completed_at: string | null
          skipped_at: string | null
          note: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          habit_id: string
          local_date: string
          title_snapshot: string
          target_type_snapshot: string
          target_value_snapshot?: number | null
          target_unit_snapshot?: string | null
          status?: OccurrenceStatus
          completed_at?: string | null
          skipped_at?: string | null
          note?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          habit_id?: string
          local_date?: string
          title_snapshot?: string
          target_type_snapshot?: string
          target_value_snapshot?: number | null
          target_unit_snapshot?: string | null
          status?: OccurrenceStatus
          completed_at?: string | null
          skipped_at?: string | null
          note?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      habit_logs: {
        Row: {
          id: string
          occurrence_id: string
          user_id: string
          actual_value: number | null
          actual_duration: number | null
          feeling: number | null
          context: string | null
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          occurrence_id: string
          user_id: string
          actual_value?: number | null
          actual_duration?: number | null
          feeling?: number | null
          context?: string | null
          note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          occurrence_id?: string
          user_id?: string
          actual_value?: number | null
          actual_duration?: number | null
          feeling?: number | null
          context?: string | null
          note?: string | null
          created_at?: string
        }
      }
      sleep_records: {
        Row: {
          id: string
          user_id: string
          sleep_date: string
          sleep_time: string
          wake_date: string | null
          wake_time: string | null
          duration_minutes: number | null
          quality: SleepQuality | null
          pre_sleep_activities: Json
          note: string | null
          is_shared: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          sleep_date: string
          sleep_time: string
          wake_date?: string | null
          wake_time?: string | null
          duration_minutes?: number | null
          quality?: SleepQuality | null
          pre_sleep_activities?: Json
          note?: string | null
          is_shared?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          sleep_date?: string
          sleep_time?: string
          wake_date?: string | null
          wake_time?: string | null
          duration_minutes?: number | null
          quality?: SleepQuality | null
          pre_sleep_activities?: Json
          note?: string | null
          is_shared?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      exercise_templates: {
        Row: {
          id: string
          user_id: string
          name: string
          category: ExerciseCategory
          is_rehab: boolean
          default_sets: number
          default_reps: number | null
          default_duration: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          category?: ExerciseCategory
          is_rehab?: boolean
          default_sets?: number
          default_reps?: number | null
          default_duration?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          category?: ExerciseCategory
          is_rehab?: boolean
          default_sets?: number
          default_reps?: number | null
          default_duration?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      exercise_records: {
        Row: {
          id: string
          user_id: string
          template_id: string | null
          exercise_date: string
          start_time: string | null
          end_time: string | null
          duration_minutes: number | null
          distance_km: number | null
          intensity: ExerciseIntensity | null
          feeling: number | null
          note: string | null
          is_shared: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          template_id?: string | null
          exercise_date: string
          start_time?: string | null
          end_time?: string | null
          duration_minutes?: number | null
          distance_km?: number | null
          intensity?: ExerciseIntensity | null
          feeling?: number | null
          note?: string | null
          is_shared?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          template_id?: string | null
          exercise_date?: string
          start_time?: string | null
          end_time?: string | null
          duration_minutes?: number | null
          distance_km?: number | null
          intensity?: ExerciseIntensity | null
          feeling?: number | null
          note?: string | null
          is_shared?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      exercise_set_logs: {
        Row: {
          id: string
          record_id: string
          user_id: string
          set_number: number
          reps: number | null
          weight_kg: number | null
          duration_seconds: number | null
          feeling: SetFeeling | null
          is_completed: boolean
          created_at: string
        }
        Insert: {
          id?: string
          record_id: string
          user_id: string
          set_number: number
          reps?: number | null
          weight_kg?: number | null
          duration_seconds?: number | null
          feeling?: SetFeeling | null
          is_completed?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          record_id?: string
          user_id?: string
          set_number?: number
          reps?: number | null
          weight_kg?: number | null
          duration_seconds?: number | null
          feeling?: SetFeeling | null
          is_completed?: boolean
          created_at?: string
        }
      }
      reading_books: {
        Row: {
          id: string
          user_id: string
          title: string
          author: string | null
          isbn: string | null
          total_pages: number | null
          current_page: number
          status: BookStatus
          source: BookSource
          source_book_id: string | null
          cover_url: string | null
          rating: number | null
          is_shared: boolean
          started_at: string | null
          finished_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          author?: string | null
          isbn?: string | null
          total_pages?: number | null
          current_page?: number
          status?: BookStatus
          source?: BookSource
          source_book_id?: string | null
          cover_url?: string | null
          rating?: number | null
          is_shared?: boolean
          started_at?: string | null
          finished_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          author?: string | null
          isbn?: string | null
          total_pages?: number | null
          current_page?: number
          status?: BookStatus
          source?: BookSource
          source_book_id?: string | null
          cover_url?: string | null
          rating?: number | null
          is_shared?: boolean
          started_at?: string | null
          finished_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      reading_sessions: {
        Row: {
          id: string
          book_id: string
          user_id: string
          read_date: string
          duration_minutes: number
          pages_read: number | null
          start_page: number | null
          end_page: number | null
          highlights: string | null
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          book_id: string
          user_id: string
          read_date: string
          duration_minutes: number
          pages_read?: number | null
          start_page?: number | null
          end_page?: number | null
          highlights?: string | null
          note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          book_id?: string
          user_id?: string
          read_date?: string
          duration_minutes?: number
          pages_read?: number | null
          start_page?: number | null
          end_page?: number | null
          highlights?: string | null
          note?: string | null
          created_at?: string
        }
      }
      daily_reflections: {
        Row: {
          id: string
          user_id: string
          local_date: string
          mood: Mood | null
          best_thing: string | null
          improve_thing: string | null
          tomorrow_focus: string | null
          note: string | null
          is_shared: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          local_date: string
          mood?: Mood | null
          best_thing?: string | null
          improve_thing?: string | null
          tomorrow_focus?: string | null
          note?: string | null
          is_shared?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          local_date?: string
          mood?: Mood | null
          best_thing?: string | null
          improve_thing?: string | null
          tomorrow_focus?: string | null
          note?: string | null
          is_shared?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      goals: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          category: string
          target_date: string | null
          status: GoalStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          category?: string
          target_date?: string | null
          status?: GoalStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          category?: string
          target_date?: string | null
          status?: GoalStatus
          created_at?: string
          updated_at?: string
        }
      }
      goal_key_results: {
        Row: {
          id: string
          goal_id: string
          user_id: string
          title: string
          target_value: number | null
          current_value: number
          unit: string | null
          status: GoalKrStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          goal_id: string
          user_id: string
          title: string
          target_value?: number | null
          current_value?: number
          unit?: string | null
          status?: GoalKrStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          goal_id?: string
          user_id?: string
          title?: string
          target_value?: number | null
          current_value?: number
          unit?: string | null
          status?: GoalKrStatus
          created_at?: string
          updated_at?: string
        }
      }
      goal_milestones: {
        Row: {
          id: string
          goal_id: string
          user_id: string
          key_result_id: string | null
          title: string
          due_date: string | null
          is_completed: boolean
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          goal_id: string
          user_id: string
          key_result_id?: string | null
          title: string
          due_date?: string | null
          is_completed?: boolean
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          goal_id?: string
          user_id?: string
          title?: string
          key_result_id?: string | null
          due_date?: string | null
          is_completed?: boolean
          completed_at?: string | null
          updated_at?: string
        }
      }
      couples: {
        Row: {
          id: string
          status: CoupleStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          status?: CoupleStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          status?: CoupleStatus
          created_at?: string
          updated_at?: string
        }
      }
      couple_members: {
        Row: {
          id: string
          couple_id: string
          user_id: string
          joined_at: string
        }
        Insert: {
          id?: string
          couple_id: string
          user_id: string
          joined_at?: string
        }
        Update: {
          id?: string
          couple_id?: string
          user_id?: string
          joined_at?: string
        }
      }
      couple_invites: {
        Row: {
          id: string
          inviter_id: string
          invite_code: string
          status: InviteStatus
          expires_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          inviter_id: string
          invite_code: string
          status?: InviteStatus
          expires_at: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          inviter_id?: string
          invite_code?: string
          status?: InviteStatus
          expires_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      shared_permissions: {
        Row: {
          id: string
          user_id: string
          data_type: DataType
          share_level: ShareLevel
          is_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          data_type: DataType
          share_level?: ShareLevel
          is_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          data_type?: DataType
          share_level?: ShareLevel
          is_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      shared_plan_suggestions: {
        Row: {
          id: string
          couple_id: string
          sender_id: string
          receiver_id: string
          title: string
          description: string | null
          suggested_date: string | null
          suggested_time: string | null
          suggestion_type: SuggestionType
          status: SuggestionStatus
          receiver_note: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          couple_id: string
          sender_id: string
          receiver_id: string
          title: string
          description?: string | null
          suggested_date?: string | null
          suggested_time?: string | null
          suggestion_type?: SuggestionType
          status?: SuggestionStatus
          receiver_note?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          couple_id?: string
          sender_id?: string
          receiver_id?: string
          title?: string
          description?: string | null
          suggested_date?: string | null
          suggested_time?: string | null
          suggestion_type?: SuggestionType
          status?: SuggestionStatus
          receiver_note?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      encouragement_messages: {
        Row: {
          id: string
          couple_id: string
          sender_id: string
          content: string
          message_type: EncouragementType
          created_at: string
        }
        Insert: {
          id?: string
          couple_id: string
          sender_id: string
          content: string
          message_type?: EncouragementType
          created_at?: string
        }
        Update: {
          id?: string
          couple_id?: string
          sender_id?: string
          content?: string
          message_type?: EncouragementType
          created_at?: string
        }
      }
      notification_settings: {
        Row: {
          id: string
          user_id: string
          habit_id: string | null
          is_enabled: boolean
          reminder_time: string | null
          reminder_type: ReminderType
          last_triggered_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          habit_id?: string | null
          is_enabled?: boolean
          reminder_time?: string | null
          reminder_type?: ReminderType
          last_triggered_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          habit_id?: string | null
          is_enabled?: boolean
          reminder_time?: string | null
          reminder_type?: ReminderType
          last_triggered_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      notification_logs: {
        Row: {
          id: string
          user_id: string
          habit_id: string | null
          notification_type: string
          title: string
          body: string | null
          triggered_at: string
          read_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          habit_id?: string | null
          notification_type: string
          title: string
          body?: string | null
          triggered_at?: string
          read_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          habit_id?: string | null
          notification_type?: string
          title?: string
          body?: string | null
          triggered_at?: string
          read_at?: string | null
        }
      }
      pattern_insights: {
        Row: {
          id: string
          user_id: string
          insight_type: string
          title: string
          content: string
          data_snapshot: Json
          is_read: boolean
          generated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          insight_type: string
          title: string
          content: string
          data_snapshot?: Json
          is_read?: boolean
          generated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          insight_type?: string
          title?: string
          content?: string
          data_snapshot?: Json
          is_read?: boolean
          generated_at?: string
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}
