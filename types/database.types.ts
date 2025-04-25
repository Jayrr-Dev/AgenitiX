export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      employees: {
        Row: {
          active: boolean | null
          authID: string | null
          eid: number
          email: string | null
          epcor_title: string | null
          name: string | null
          name_code: string | null
          role: Database["public"]["Enums"]["app_role"] | null
          title: string | null
        }
        Insert: {
          active?: boolean | null
          authID?: string | null
          eid: number
          email?: string | null
          epcor_title?: string | null
          name?: string | null
          name_code?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          title?: string | null
        }
        Update: {
          active?: boolean | null
          authID?: string | null
          eid?: number
          email?: string | null
          epcor_title?: string | null
          name?: string | null
          name_code?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_title_fkey"
            columns: ["title"]
            isOneToOne: false
            referencedRelation: "titles"
            referencedColumns: ["title"]
          },
        ]
      }
      project_related_links: {
        Row: {
          id: string
          project_id: string
          related_project_id: string
        }
        Insert: {
          id?: string
          project_id: string
          related_project_id: string
        }
        Update: {
          id?: string
          project_id?: string
          related_project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_related_links_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_showcase"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_related_links_related_project_id_fkey"
            columns: ["related_project_id"]
            isOneToOne: false
            referencedRelation: "project_showcase"
            referencedColumns: ["id"]
          },
        ]
      }
      project_showcase: {
        Row: {
          contact_info: string | null
          description: string | null
          details: string | null
          id: string
          image_carousel: Json | null
          image_url: string | null
          outcomes: Json | null
          project_link: string | null
          title: string | null
          year: string | null
        }
        Insert: {
          contact_info?: string | null
          description?: string | null
          details?: string | null
          id?: string
          image_carousel?: Json | null
          image_url?: string | null
          outcomes?: Json | null
          project_link?: string | null
          title?: string | null
          year?: string | null
        }
        Update: {
          contact_info?: string | null
          description?: string | null
          details?: string | null
          id?: string
          image_carousel?: Json | null
          image_url?: string | null
          outcomes?: Json | null
          project_link?: string | null
          title?: string | null
          year?: string | null
        }
        Relationships: []
      }
      project_tags: {
        Row: {
          project_id: string
          tags_id: string
        }
        Insert: {
          project_id: string
          tags_id: string
        }
        Update: {
          project_id?: string
          tags_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_categories_category_id_fkey"
            columns: ["tags_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["tag_id"]
          },
          {
            foreignKeyName: "project_categories_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_showcase"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          assigned: string | null
          company: string | null
          created_at: string
          department: string | null
          description: string
          id: number
          notes: string | null
          project: string | null
          task: number | null
          type: string | null
          wo: number | null
          wr: number | null
        }
        Insert: {
          assigned?: string | null
          company?: string | null
          created_at?: string
          department?: string | null
          description: string
          id?: number
          notes?: string | null
          project?: string | null
          task?: number | null
          type?: string | null
          wo?: number | null
          wr?: number | null
        }
        Update: {
          assigned?: string | null
          company?: string | null
          created_at?: string
          department?: string | null
          description?: string
          id?: number
          notes?: string | null
          project?: string | null
          task?: number | null
          type?: string | null
          wo?: number | null
          wr?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_assigned_fkey"
            columns: ["assigned"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["name"]
          },
        ]
      }
      role_permissions: {
        Row: {
          id: number
          permission: Database["public"]["Enums"]["app_permission"]
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          id?: number
          permission: Database["public"]["Enums"]["app_permission"]
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          id?: number
          permission?: Database["public"]["Enums"]["app_permission"]
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      showcase: {
        Row: {
          created_at: string
          id: number
        }
        Insert: {
          created_at?: string
          id?: number
        }
        Update: {
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      tags: {
        Row: {
          tag_id: string
          tags: string
        }
        Insert: {
          tag_id?: string
          tags: string
        }
        Update: {
          tag_id?: string
          tags?: string
        }
        Relationships: []
      }
      timesheet_entries: {
        Row: {
          authID: string | null
          bt: number | null
          company: string | null
          created_at: string | null
          department: string | null
          descriptions: string | null
          eid: number
          entry_date: string
          ht: number | null
          id: number
          km: number | null
          name_code: string | null
          ot: number | null
          pay_period: number | null
          project: string | null
          project_id: number | null
          rt: number | null
          sl: number | null
          status: boolean
          task: number | null
          title: string | null
          type: string | null
          updated_at: string | null
          vt: number | null
          we: string | null
          wo: string | null
          work_performed: string | null
        }
        Insert: {
          authID?: string | null
          bt?: number | null
          company?: string | null
          created_at?: string | null
          department?: string | null
          descriptions?: string | null
          eid: number
          entry_date: string
          ht?: number | null
          id?: number
          km?: number | null
          name_code?: string | null
          ot?: number | null
          pay_period?: number | null
          project?: string | null
          project_id?: number | null
          rt?: number | null
          sl?: number | null
          status?: boolean
          task?: number | null
          title?: string | null
          type?: string | null
          updated_at?: string | null
          vt?: number | null
          we?: string | null
          wo?: string | null
          work_performed?: string | null
        }
        Update: {
          authID?: string | null
          bt?: number | null
          company?: string | null
          created_at?: string | null
          department?: string | null
          descriptions?: string | null
          eid?: number
          entry_date?: string
          ht?: number | null
          id?: number
          km?: number | null
          name_code?: string | null
          ot?: number | null
          pay_period?: number | null
          project?: string | null
          project_id?: number | null
          rt?: number | null
          sl?: number | null
          status?: boolean
          task?: number | null
          title?: string | null
          type?: string | null
          updated_at?: string | null
          vt?: number | null
          we?: string | null
          wo?: string | null
          work_performed?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "timesheet_entries_descriptions_fkey"
            columns: ["descriptions"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["description"]
          },
          {
            foreignKeyName: "timesheet_entries_eid_fkey"
            columns: ["eid"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["eid"]
          },
          {
            foreignKeyName: "timesheet_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      titles: {
        Row: {
          id: number
          title: string
        }
        Insert: {
          id?: number
          title: string
        }
        Update: {
          id?: number
          title?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          employee_id: number
          id: string
        }
        Insert: {
          employee_id: number
          id: string
        }
        Update: {
          employee_id?: number
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "employees"
            referencedColumns: ["eid"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: number
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: number
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: number
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      authorize: {
        Args: {
          requested_permission: Database["public"]["Enums"]["app_permission"]
        }
        Returns: boolean
      }
      custom_access_token_hook: {
        Args: { event: Json }
        Returns: Json
      }
    }
    Enums: {
      app_permission: "channels.delete" | "messages.delete"
      app_role: "admin" | "manager" | "employee"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_permission: ["channels.delete", "messages.delete"],
      app_role: ["admin", "manager", "employee"],
    },
  },
} as const
