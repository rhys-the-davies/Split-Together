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
      contribution: {
        Row: {
          amount: number
          contributor_id: string
          created_at: string
          id: string
          instance_id: string
          made_at: string | null
          marked_made_by: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          contributor_id: string
          created_at?: string
          id?: string
          instance_id: string
          made_at?: string | null
          marked_made_by?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          contributor_id?: string
          created_at?: string
          id?: string
          instance_id?: string
          made_at?: string | null
          marked_made_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contribution_contributor_id_fkey"
            columns: ["contributor_id"]
            isOneToOne: false
            referencedRelation: "member"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contribution_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "occasion_instance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contribution_marked_made_by_fkey"
            columns: ["marked_made_by"]
            isOneToOne: false
            referencedRelation: "member"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_suggestion: {
        Row: {
          created_at: string
          id: string
          instance_id: string
          is_decided: boolean
          preview_image_url: string | null
          price: number
          proposed_by: string
          title: string
          updated_at: string
          url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          instance_id: string
          is_decided?: boolean
          preview_image_url?: string | null
          price: number
          proposed_by: string
          title: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          instance_id?: string
          is_decided?: boolean
          preview_image_url?: string | null
          price?: number
          proposed_by?: string
          title?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gift_suggestion_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "occasion_instance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gift_suggestion_proposed_by_fkey"
            columns: ["proposed_by"]
            isOneToOne: false
            referencedRelation: "member"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_vote: {
        Row: {
          member_id: string
          suggestion_id: string
          voted_at: string
        }
        Insert: {
          member_id: string
          suggestion_id: string
          voted_at?: string
        }
        Update: {
          member_id?: string
          suggestion_id?: string
          voted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gift_vote_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gift_vote_suggestion_id_fkey"
            columns: ["suggestion_id"]
            isOneToOne: false
            referencedRelation: "gift_suggestion"
            referencedColumns: ["id"]
          },
        ]
      }
      member: {
        Row: {
          auth_id: string | null
          created_at: string
          email: string
          id: string
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          auth_id?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          auth_id?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      occasion: {
        Row: {
          created_at: string
          created_by: string
          id: string
          invite_token: string
          recipient_name: string
          recurrence: Database["public"]["Enums"]["recurrence_type"]
          recurrence_day: number | null
          recurrence_month: number | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          invite_token?: string
          recipient_name: string
          recurrence?: Database["public"]["Enums"]["recurrence_type"]
          recurrence_day?: number | null
          recurrence_month?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          invite_token?: string
          recipient_name?: string
          recurrence?: Database["public"]["Enums"]["recurrence_type"]
          recurrence_day?: number | null
          recurrence_month?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "occasion_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "member"
            referencedColumns: ["id"]
          },
        ]
      }
      occasion_instance: {
        Row: {
          archived_at: string | null
          buyer_bank_details: string | null
          buyer_id: string | null
          created_at: string
          decided_gift_id: string | null
          id: string
          occasion_id: string
          status: Database["public"]["Enums"]["instance_status"]
          updated_at: string
          year: number
        }
        Insert: {
          archived_at?: string | null
          buyer_bank_details?: string | null
          buyer_id?: string | null
          created_at?: string
          decided_gift_id?: string | null
          id?: string
          occasion_id: string
          status?: Database["public"]["Enums"]["instance_status"]
          updated_at?: string
          year: number
        }
        Update: {
          archived_at?: string | null
          buyer_bank_details?: string | null
          buyer_id?: string | null
          created_at?: string
          decided_gift_id?: string | null
          id?: string
          occasion_id?: string
          status?: Database["public"]["Enums"]["instance_status"]
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_decided_gift"
            columns: ["decided_gift_id"]
            isOneToOne: false
            referencedRelation: "gift_suggestion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occasion_instance_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "member"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occasion_instance_occasion_id_fkey"
            columns: ["occasion_id"]
            isOneToOne: false
            referencedRelation: "occasion"
            referencedColumns: ["id"]
          },
        ]
      }
      occasion_member: {
        Row: {
          joined_at: string
          member_id: string
          occasion_id: string
        }
        Insert: {
          joined_at?: string
          member_id: string
          occasion_id: string
        }
        Update: {
          joined_at?: string
          member_id?: string
          occasion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "occasion_member_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occasion_member_occasion_id_fkey"
            columns: ["occasion_id"]
            isOneToOne: false
            referencedRelation: "occasion"
            referencedColumns: ["id"]
          },
        ]
      }
      split: {
        Row: {
          amount: number
          created_at: string
          id: string
          instance_id: string
          member_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          instance_id: string
          member_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          instance_id?: string
          member_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "split_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "occasion_instance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "split_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assign_buyer_and_init_splits: {
        Args: { p_buyer_id: string; p_instance_id: string }
        Returns: undefined
      }
      is_occasion_member: { Args: { p_occasion_id: string }; Returns: boolean }
      regenerate_invite_token: {
        Args: { p_occasion_id: string }
        Returns: string
      }
      snapshot_contributions: {
        Args: { p_instance_id: string }
        Returns: undefined
      }
    }
    Enums: {
      instance_status: "planning" | "decided" | "purchased" | "done"
      recurrence_type: "one_off" | "annual"
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
  public: {
    Enums: {
      instance_status: ["planning", "decided", "purchased", "done"],
      recurrence_type: ["one_off", "annual"],
    },
  },
} as const
