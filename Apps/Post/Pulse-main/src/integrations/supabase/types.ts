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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activation_queue: {
        Row: {
          created_at: string
          dealership_id: string
          id: string
          notes: string | null
          request_type: string
          reviewed_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          dealership_id: string
          id?: string
          notes?: string | null
          request_type?: string
          reviewed_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          dealership_id?: string
          id?: string
          notes?: string | null
          request_type?: string
          reviewed_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "activation_queue_dealership_id_fkey"
            columns: ["dealership_id"]
            isOneToOne: false
            referencedRelation: "dealerships"
            referencedColumns: ["id"]
          },
        ]
      }
      dealer_settings: {
        Row: {
          address: string | null
          auto_blur_plates: boolean
          auto_post_new_inventory: boolean
          auto_renew_days: number
          auto_renew_listings: boolean
          brand_color: string | null
          created_at: string
          dba: string | null
          dealer_id: string | null
          dealership_name: string
          delete_on_sold: boolean
          fb_page_token: string | null
          fb_token_expires_at: string | null
          fb_token_status: string
          global_system_prompt: string | null
          id: string
          logo_url: string | null
          price_markup: number
          primary_phone: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          address?: string | null
          auto_blur_plates?: boolean
          auto_post_new_inventory?: boolean
          auto_renew_days?: number
          auto_renew_listings?: boolean
          brand_color?: string | null
          created_at?: string
          dba?: string | null
          dealer_id?: string | null
          dealership_name?: string
          delete_on_sold?: boolean
          fb_page_token?: string | null
          fb_token_expires_at?: string | null
          fb_token_status?: string
          global_system_prompt?: string | null
          id?: string
          logo_url?: string | null
          price_markup?: number
          primary_phone?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          address?: string | null
          auto_blur_plates?: boolean
          auto_post_new_inventory?: boolean
          auto_renew_days?: number
          auto_renew_listings?: boolean
          brand_color?: string | null
          created_at?: string
          dba?: string | null
          dealer_id?: string | null
          dealership_name?: string
          delete_on_sold?: boolean
          fb_page_token?: string | null
          fb_token_expires_at?: string | null
          fb_token_status?: string
          global_system_prompt?: string | null
          id?: string
          logo_url?: string | null
          price_markup?: number
          primary_phone?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dealer_settings_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "dealerships"
            referencedColumns: ["id"]
          },
        ]
      }
      dealerships: {
        Row: {
          address: string | null
          api_credentials_approved: boolean
          created_at: string
          id: string
          max_vehicles: number
          name: string
          onboarding_token: string | null
          owner_email: string | null
          phone: string | null
          sftp_password_hash: string | null
          sftp_username: string | null
          slug: string
          status: string
          subscription_tier: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          api_credentials_approved?: boolean
          created_at?: string
          id?: string
          max_vehicles?: number
          name: string
          onboarding_token?: string | null
          owner_email?: string | null
          phone?: string | null
          sftp_password_hash?: string | null
          sftp_username?: string | null
          slug: string
          status?: string
          subscription_tier?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          api_credentials_approved?: boolean
          created_at?: string
          id?: string
          max_vehicles?: number
          name?: string
          onboarding_token?: string | null
          owner_email?: string | null
          phone?: string | null
          sftp_password_hash?: string | null
          sftp_username?: string | null
          slug?: string
          status?: string
          subscription_tier?: string
          updated_at?: string
        }
        Relationships: []
      }
      dms_field_mappings: {
        Row: {
          active: boolean
          app_field: string
          created_at: string
          dealer_id: string | null
          dms_field: string
          dms_source: string
          id: string
          transform: string | null
        }
        Insert: {
          active?: boolean
          app_field: string
          created_at?: string
          dealer_id?: string | null
          dms_field: string
          dms_source?: string
          id?: string
          transform?: string | null
        }
        Update: {
          active?: boolean
          app_field?: string
          created_at?: string
          dealer_id?: string | null
          dms_field?: string
          dms_source?: string
          id?: string
          transform?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dms_field_mappings_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "dealerships"
            referencedColumns: ["id"]
          },
        ]
      }
      ingestion_logs: {
        Row: {
          created_at: string
          dealer_id: string | null
          feed_type: string
          id: string
          images_fetched: number
          marked_sold: number
          message: string | null
          new_vehicles: number
          source: string
          status: string
          vehicles_scanned: number
        }
        Insert: {
          created_at?: string
          dealer_id?: string | null
          feed_type?: string
          id?: string
          images_fetched?: number
          marked_sold?: number
          message?: string | null
          new_vehicles?: number
          source: string
          status?: string
          vehicles_scanned?: number
        }
        Update: {
          created_at?: string
          dealer_id?: string | null
          feed_type?: string
          id?: string
          images_fetched?: number
          marked_sold?: number
          message?: string | null
          new_vehicles?: number
          source?: string
          status?: string
          vehicles_scanned?: number
        }
        Relationships: [
          {
            foreignKeyName: "ingestion_logs_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "dealerships"
            referencedColumns: ["id"]
          },
        ]
      }
      invitation_links: {
        Row: {
          created_at: string
          created_by: string | null
          dealership_id: string | null
          dealership_name: string | null
          expires_at: string
          id: string
          token: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          dealership_id?: string | null
          dealership_name?: string | null
          expires_at?: string
          id?: string
          token?: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          dealership_id?: string | null
          dealership_name?: string | null
          expires_at?: string
          id?: string
          token?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invitation_links_dealership_id_fkey"
            columns: ["dealership_id"]
            isOneToOne: false
            referencedRelation: "dealerships"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          created_at: string
          dealer_id: string | null
          email: string | null
          id: string
          message: string | null
          name: string
          phone: string | null
          source: string
          status: string
          vehicle_id: string | null
          vin: string
        }
        Insert: {
          created_at?: string
          dealer_id?: string | null
          email?: string | null
          id?: string
          message?: string | null
          name: string
          phone?: string | null
          source?: string
          status?: string
          vehicle_id?: string | null
          vin: string
        }
        Update: {
          created_at?: string
          dealer_id?: string | null
          email?: string | null
          id?: string
          message?: string | null
          name?: string
          phone?: string | null
          source?: string
          status?: string
          vehicle_id?: string | null
          vin?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "dealerships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      price_history: {
        Row: {
          change_amount: number | null
          change_date: string
          change_percent: number | null
          created_at: string
          dealer_id: string | null
          id: string
          new_price: number
          old_price: number
          source: string
          vehicle_id: string
        }
        Insert: {
          change_amount?: number | null
          change_date?: string
          change_percent?: number | null
          created_at?: string
          dealer_id?: string | null
          id?: string
          new_price: number
          old_price: number
          source?: string
          vehicle_id: string
        }
        Update: {
          change_amount?: number | null
          change_date?: string
          change_percent?: number | null
          created_at?: string
          dealer_id?: string | null
          id?: string
          new_price?: number
          old_price?: number
          source?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_history_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "dealerships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_history_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          dealership_id: string | null
          full_name: string | null
          id: string
          onboarding_complete: boolean
          onboarding_step: number
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          dealership_id?: string | null
          full_name?: string | null
          id?: string
          onboarding_complete?: boolean
          onboarding_step?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          dealership_id?: string | null
          full_name?: string | null
          id?: string
          onboarding_complete?: boolean
          onboarding_step?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_dealership_id_fkey"
            columns: ["dealership_id"]
            isOneToOne: false
            referencedRelation: "dealerships"
            referencedColumns: ["id"]
          },
        ]
      }
      sold_alerts: {
        Row: {
          acknowledged: boolean
          created_at: string
          dealer_id: string | null
          id: string
          staff_id: string | null
          vehicle_id: string
          vehicle_label: string
          vin: string
        }
        Insert: {
          acknowledged?: boolean
          created_at?: string
          dealer_id?: string | null
          id?: string
          staff_id?: string | null
          vehicle_id: string
          vehicle_label: string
          vin: string
        }
        Update: {
          acknowledged?: boolean
          created_at?: string
          dealer_id?: string | null
          id?: string
          staff_id?: string | null
          vehicle_id?: string
          vehicle_label?: string
          vin?: string
        }
        Relationships: [
          {
            foreignKeyName: "sold_alerts_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "dealerships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sold_alerts_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sold_alerts_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          active: boolean
          avatar_url: string | null
          created_at: string
          dealer_id: string | null
          email: string | null
          facebook_account: string | null
          id: string
          name: string
          phone: string | null
          role: string
        }
        Insert: {
          active?: boolean
          avatar_url?: string | null
          created_at?: string
          dealer_id?: string | null
          email?: string | null
          facebook_account?: string | null
          id?: string
          name: string
          phone?: string | null
          role?: string
        }
        Update: {
          active?: boolean
          avatar_url?: string | null
          created_at?: string
          dealer_id?: string | null
          email?: string | null
          facebook_account?: string | null
          id?: string
          name?: string
          phone?: string | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "dealerships"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_tracking: {
        Row: {
          action_type: string
          created_at: string
          credits_used: number
          dealership_id: string
          id: string
          metadata: Json | null
        }
        Insert: {
          action_type?: string
          created_at?: string
          credits_used?: number
          dealership_id: string
          id?: string
          metadata?: Json | null
        }
        Update: {
          action_type?: string
          created_at?: string
          credits_used?: number
          dealership_id?: string
          id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "usage_tracking_dealership_id_fkey"
            columns: ["dealership_id"]
            isOneToOne: false
            referencedRelation: "dealerships"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_vehicle_postings: {
        Row: {
          created_at: string
          dealer_id: string
          fb_listing_url: string | null
          id: string
          posted_at: string
          user_id: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          dealer_id: string
          fb_listing_url?: string | null
          id?: string
          posted_at?: string
          user_id: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          dealer_id?: string
          fb_listing_url?: string | null
          id?: string
          posted_at?: string
          user_id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_vehicle_postings_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "dealerships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_vehicle_postings_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_performance: {
        Row: {
          click_count: number
          created_at: string
          days_live: number
          dealer_id: string | null
          id: string
          last_click_at: string | null
          post_date: string
          renewed_at: string | null
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          click_count?: number
          created_at?: string
          days_live?: number
          dealer_id?: string | null
          id?: string
          last_click_at?: string | null
          post_date?: string
          renewed_at?: string | null
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          click_count?: number
          created_at?: string
          days_live?: number
          dealer_id?: string | null
          id?: string
          last_click_at?: string | null
          post_date?: string
          renewed_at?: string | null
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_performance_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "dealerships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_performance_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: true
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          ai_description: string | null
          assigned_staff_id: string | null
          created_at: string
          days_on_lot: number
          dealer_id: string | null
          exterior_color: string | null
          facebook_post_id: string | null
          fb_listing_url: string | null
          id: string
          images: string[] | null
          last_posted_at: string | null
          last_price_change: string | null
          leads: number
          make: string
          mileage: number
          model: string
          posted_by_staff_id: string | null
          price: number
          status: Database["public"]["Enums"]["vehicle_status"]
          synced_to_facebook: boolean
          trim: string | null
          updated_at: string
          vin: string
          year: number
        }
        Insert: {
          ai_description?: string | null
          assigned_staff_id?: string | null
          created_at?: string
          days_on_lot?: number
          dealer_id?: string | null
          exterior_color?: string | null
          facebook_post_id?: string | null
          fb_listing_url?: string | null
          id?: string
          images?: string[] | null
          last_posted_at?: string | null
          last_price_change?: string | null
          leads?: number
          make: string
          mileage?: number
          model: string
          posted_by_staff_id?: string | null
          price?: number
          status?: Database["public"]["Enums"]["vehicle_status"]
          synced_to_facebook?: boolean
          trim?: string | null
          updated_at?: string
          vin: string
          year: number
        }
        Update: {
          ai_description?: string | null
          assigned_staff_id?: string | null
          created_at?: string
          days_on_lot?: number
          dealer_id?: string | null
          exterior_color?: string | null
          facebook_post_id?: string | null
          fb_listing_url?: string | null
          id?: string
          images?: string[] | null
          last_posted_at?: string | null
          last_price_change?: string | null
          leads?: number
          make?: string
          mileage?: number
          model?: string
          posted_by_staff_id?: string | null
          price?: number
          status?: Database["public"]["Enums"]["vehicle_status"]
          synced_to_facebook?: boolean
          trim?: string | null
          updated_at?: string
          vin?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_assigned_staff_id_fkey"
            columns: ["assigned_staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "dealerships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_posted_by_staff_id_fkey"
            columns: ["posted_by_staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_dealership_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "super_admin" | "dealer_admin" | "dealer_user"
      vehicle_status: "available" | "pending" | "sold"
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
      app_role: ["super_admin", "dealer_admin", "dealer_user"],
      vehicle_status: ["available", "pending", "sold"],
    },
  },
} as const
