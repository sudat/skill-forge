export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          key: string
          value: string
          updated_at: string
        }
        Insert: {
          key: string
          value: string
          updated_at?: string
        }
        Update: {
          key?: string
          value?: string
          updated_at?: string
        }
        Relationships: []
      }
      goal_conversations: {
        Row: {
          created_at: string
          goal_id: string
          id: string
          message: string
          role: string
          triggered_tree_update: boolean
        }
        Insert: {
          created_at?: string
          goal_id: string
          id?: string
          message: string
          role: string
          triggered_tree_update?: boolean
        }
        Update: {
          created_at?: string
          goal_id?: string
          id?: string
          message?: string
          role?: string
          triggered_tree_update?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "goal_conversations_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          created_at: string
          description: string | null
          id: string
          status: string
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          status?: string
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      skill_nodes: {
        Row: {
          coverage_score: number
          created_at: string
          depth: number
          detailed_knowledge_text: string | null
          goal_id: string
          id: string
          knowledge_text: string | null
          label: string
          parent_id: string | null
          sort_order: number
          status: string
          updated_at: string
        }
        Insert: {
          coverage_score?: number
          created_at?: string
          depth?: number
          detailed_knowledge_text?: string | null
          goal_id: string
          id?: string
          knowledge_text?: string | null
          label: string
          parent_id?: string | null
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Update: {
          coverage_score?: number
          created_at?: string
          depth?: number
          detailed_knowledge_text?: string | null
          goal_id?: string
          id?: string
          knowledge_text?: string | null
          label?: string
          parent_id?: string | null
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_nodes_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_nodes_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "skill_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      video_node_mappings: {
        Row: {
          coverage_detail: string | null
          created_at: string
          id: string
          node_id: string
          relevance_score: number
          timestamp_end: string | null
          timestamp_start: string | null
          video_id: string
        }
        Insert: {
          coverage_detail?: string | null
          created_at?: string
          id?: string
          node_id: string
          relevance_score?: number
          timestamp_end?: string | null
          timestamp_start?: string | null
          video_id: string
        }
        Update: {
          coverage_detail?: string | null
          created_at?: string
          id?: string
          node_id?: string
          relevance_score?: number
          timestamp_end?: string | null
          timestamp_start?: string | null
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_node_mappings_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "skill_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_node_mappings_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      video_overlaps: {
        Row: {
          created_at: string
          id: string
          overlap_score: number
          overlapping_topics: Json | null
          recommendation: string | null
          video_a_id: string
          video_b_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          overlap_score?: number
          overlapping_topics?: Json | null
          recommendation?: string | null
          video_a_id: string
          video_b_id: string
        }
        Update: {
          created_at?: string
          id?: string
          overlap_score?: number
          overlapping_topics?: Json | null
          recommendation?: string | null
          video_a_id?: string
          video_b_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_overlaps_video_a_id_fkey"
            columns: ["video_a_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_overlaps_video_b_id_fkey"
            columns: ["video_b_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          analysis_status: string
          channel_name: string | null
          created_at: string
          duration: string | null
          id: string
          key_points: Json | null
          summary: string | null
          title: string
          transcript: string
          updated_at: string
          url: string | null
          user_id: string | null
        }
        Insert: {
          analysis_status?: string
          channel_name?: string | null
          created_at?: string
          duration?: string | null
          id?: string
          key_points?: Json | null
          summary?: string | null
          title: string
          transcript: string
          updated_at?: string
          url?: string | null
          user_id?: string | null
        }
        Update: {
          analysis_status?: string
          channel_name?: string | null
          created_at?: string
          duration?: string | null
          id?: string
          key_points?: Json | null
          summary?: string | null
          title?: string
          transcript?: string
          updated_at?: string
          url?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// ============================================================
// Convenience types
// ============================================================
type DefaultSchema = Database["public"]

export type Tables<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Row"]

export type TablesInsert<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Insert"]

export type TablesUpdate<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Update"]

// Application-level type aliases
export type Goal = Tables<"goals">
export type GoalConversation = Tables<"goal_conversations">
export type SkillNode = Tables<"skill_nodes">
export type Video = Tables<"videos">
export type VideoNodeMapping = Tables<"video_node_mappings">
export type VideoOverlap = Tables<"video_overlaps">

// Skill node with children (for tree rendering)
export type SkillNodeWithChildren = SkillNode & {
  children: SkillNodeWithChildren[]
}

// Skill node status type
export type SkillNodeStatus =
  | "mastered"
  | "learned"
  | "in_progress"
  | "available"
  | "locked"

// Video analysis status type
export type VideoAnalysisStatus =
  | "pending"
  | "analyzing"
  | "completed"
  | "failed"

// Key point structure (stored as JSONB)
export type KeyPoint = {
  topic: string
  description: string
  timestamp?: string
}

// Overlapping topic structure (stored as JSONB)
export type OverlappingTopic = {
  topic: string
  video_a_section?: string
  video_b_section?: string
}
