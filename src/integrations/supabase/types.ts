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
  public: {
    Tables: {
      game_players: {
        Row: {
          id: string
          is_admin: boolean
          joined_at: string
          nickname: string
          session_id: string
          team_id: string | null
        }
        Insert: {
          id?: string
          is_admin?: boolean
          joined_at?: string
          nickname: string
          session_id: string
          team_id?: string | null
        }
        Update: {
          id?: string
          is_admin?: boolean
          joined_at?: string
          nickname?: string
          session_id?: string
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_players_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      game_sessions: {
        Row: {
          admin_id: string
          code: string
          created_at: string
          game_state: Json | null
          id: string
          status: string
          updated_at: string
        }
        Insert: {
          admin_id: string
          code: string
          created_at?: string
          game_state?: Json | null
          id?: string
          status?: string
          updated_at?: string
        }
        Update: {
          admin_id?: string
          code?: string
          created_at?: string
          game_state?: Json | null
          id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      multiplayer_events: {
        Row: {
          actor_user_id: string | null
          created_at: string
          id: number
          payload: Json
          room_id: string
          type: string
        }
        Insert: {
          actor_user_id?: string | null
          created_at?: string
          id?: number
          payload?: Json
          room_id: string
          type: string
        }
        Update: {
          actor_user_id?: string | null
          created_at?: string
          id?: number
          payload?: Json
          room_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "multiplayer_events_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "multiplayer_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      multiplayer_match_state: {
        Row: {
          room_id: string
          state: Json
          updated_at: string
          version: number
        }
        Insert: {
          room_id: string
          state?: Json
          updated_at?: string
          version?: number
        }
        Update: {
          room_id?: string
          state?: Json
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "multiplayer_match_state_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: true
            referencedRelation: "multiplayer_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      multiplayer_pending_decisions: {
        Row: {
          created_at: string
          kind: string
          payload: Json
          room_id: string
          side: string
          submitted_by: string
          version: number
        }
        Insert: {
          created_at?: string
          kind: string
          payload: Json
          room_id: string
          side: string
          submitted_by: string
          version: number
        }
        Update: {
          created_at?: string
          kind?: string
          payload?: Json
          room_id?: string
          side?: string
          submitted_by?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "multiplayer_pending_decisions_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "multiplayer_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      multiplayer_room_members: {
        Row: {
          display_name: string
          id: string
          joined_at: string
          ready: boolean
          role: string
          room_id: string
          team_side: string | null
          user_id: string
        }
        Insert: {
          display_name: string
          id?: string
          joined_at?: string
          ready?: boolean
          role?: string
          room_id: string
          team_side?: string | null
          user_id: string
        }
        Update: {
          display_name?: string
          id?: string
          joined_at?: string
          ready?: boolean
          role?: string
          room_id?: string
          team_side?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "multiplayer_room_members_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "multiplayer_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      multiplayer_room_secrets: {
        Row: {
          room_id: string
          seed: string
        }
        Insert: {
          room_id: string
          seed?: string
        }
        Update: {
          room_id?: string
          seed?: string
        }
        Relationships: [
          {
            foreignKeyName: "multiplayer_room_secrets_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: true
            referencedRelation: "multiplayer_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      multiplayer_rooms: {
        Row: {
          code: string
          created_at: string
          host_user_id: string
          id: string
          paused_from: string | null
          settings: Json
          setups: Json
          status: string
          team_a: Json | null
          team_b: Json | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          host_user_id: string
          id?: string
          paused_from?: string | null
          settings?: Json
          setups?: Json
          status?: string
          team_a?: Json | null
          team_b?: Json | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          host_user_id?: string
          id?: string
          paused_from?: string | null
          settings?: Json
          setups?: Json
          status?: string
          team_a?: Json | null
          team_b?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      player_all_time_stats: {
        Row: {
          balls_bowled: number
          balls_faced: number
          best_bowling_runs: number
          best_bowling_wickets: number
          created_at: string
          fifties: number
          fours: number
          highest_score: number
          hundreds: number
          id: string
          image_url: string | null
          maidens: number
          matches_batted: number
          matches_bowled: number
          not_outs: number
          player_id: string
          player_name: string
          runs_conceded: number
          sixes: number
          team_name: string | null
          total_runs: number
          total_wickets: number
          updated_at: string
        }
        Insert: {
          balls_bowled?: number
          balls_faced?: number
          best_bowling_runs?: number
          best_bowling_wickets?: number
          created_at?: string
          fifties?: number
          fours?: number
          highest_score?: number
          hundreds?: number
          id?: string
          image_url?: string | null
          maidens?: number
          matches_batted?: number
          matches_bowled?: number
          not_outs?: number
          player_id: string
          player_name: string
          runs_conceded?: number
          sixes?: number
          team_name?: string | null
          total_runs?: number
          total_wickets?: number
          updated_at?: string
        }
        Update: {
          balls_bowled?: number
          balls_faced?: number
          best_bowling_runs?: number
          best_bowling_wickets?: number
          created_at?: string
          fifties?: number
          fours?: number
          highest_score?: number
          hundreds?: number
          id?: string
          image_url?: string | null
          maidens?: number
          matches_batted?: number
          matches_bowled?: number
          not_outs?: number
          player_id?: string
          player_name?: string
          runs_conceded?: number
          sixes?: number
          team_name?: string | null
          total_runs?: number
          total_wickets?: number
          updated_at?: string
        }
        Relationships: []
      }
      player_innings: {
        Row: {
          balls_faced: number
          created_at: string
          dismissed: boolean
          fours: number
          id: string
          image_url: string | null
          match_id: string | null
          player_id: string
          player_name: string
          runs: number
          sixes: number
          team_name: string | null
        }
        Insert: {
          balls_faced?: number
          created_at?: string
          dismissed?: boolean
          fours?: number
          id?: string
          image_url?: string | null
          match_id?: string | null
          player_id: string
          player_name: string
          runs?: number
          sixes?: number
          team_name?: string | null
        }
        Update: {
          balls_faced?: number
          created_at?: string
          dismissed?: boolean
          fours?: number
          id?: string
          image_url?: string | null
          match_id?: string | null
          player_id?: string
          player_name?: string
          runs?: number
          sixes?: number
          team_name?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      mp_assign_member: {
        Args: {
          p_role: string
          p_room: string
          p_side?: string
          p_user: string
        }
        Returns: undefined
      }
      mp_clean_name: { Args: { _n: string }; Returns: string }
      mp_commit_state: {
        Args: {
          p_actor: string
          p_event: Json
          p_event_type: string
          p_expected_version: number
          p_room: string
          p_state: Json
          p_status: string
        }
        Returns: number
      }
      mp_create_room: {
        Args: { p_display_name: string; p_overs?: number }
        Returns: Json
      }
      mp_decision_status: { Args: { p_room: string }; Returns: Json }
      mp_is_member: { Args: { _room: string; _uid: string }; Returns: boolean }
      mp_join_room: {
        Args: { p_code: string; p_display_name: string }
        Returns: Json
      }
      mp_kick_member: {
        Args: { p_room: string; p_user: string }
        Returns: undefined
      }
      mp_leave_room: { Args: { p_room: string }; Returns: undefined }
      mp_log: {
        Args: { _payload?: Json; _room: string; _type: string }
        Returns: undefined
      }
      mp_require_host: {
        Args: { _room: string }
        Returns: {
          code: string
          created_at: string
          host_user_id: string
          id: string
          paused_from: string | null
          settings: Json
          setups: Json
          status: string
          team_a: Json | null
          team_b: Json | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "multiplayer_rooms"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      mp_require_uid: { Args: never; Returns: string }
      mp_set_my_squad: {
        Args: { p_room: string; p_team: Json }
        Returns: undefined
      }
      mp_set_paused: {
        Args: { p_paused: boolean; p_room: string }
        Returns: undefined
      }
      mp_set_teams: {
        Args: { p_room: string; p_team_a: Json; p_team_b: Json }
        Returns: undefined
      }
      mp_side_of: { Args: { _room: string; _uid: string }; Returns: string }
      mp_submit_decision: {
        Args: {
          p_expected_version: number
          p_kind: string
          p_payload: Json
          p_room: string
        }
        Returns: undefined
      }
      mp_submit_team_setup: {
        Args: { p_impact: string[]; p_room: string; p_xi: string[] }
        Returns: undefined
      }
      mp_transfer_host: {
        Args: { p_room: string; p_user: string }
        Returns: undefined
      }
      mp_validate_team: { Args: { t: Json }; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
