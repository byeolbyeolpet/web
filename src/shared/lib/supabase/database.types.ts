// Supabase 스키마에서 자동 생성된 타입. 직접 수정하지 말 것 (MCP generate_typescript_types 로 재생성).
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
      breeds: {
        Row: {
          created_at: string
          id: string
          name_en: string | null
          name_ko: string
          species_code: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name_en?: string | null
          name_ko: string
          species_code: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name_en?: string | null
          name_ko?: string
          species_code?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "breeds_species_code_fkey"
            columns: ["species_code"]
            isOneToOne: false
            referencedRelation: "species"
            referencedColumns: ["code"]
          },
        ]
      }
      comments: {
        Row: {
          author_id: string | null
          body: string
          created_at: string
          id: string
          parent_id: string | null
          post_id: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          body: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          body?: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_fkey"
            columns: ["post_id", "parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["post_id", "id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      dex_articles: {
        Row: {
          body: string
          created_at: string
          id: string
          published: boolean
          published_at: string | null
          search_tsv: unknown
          slug: string
          species_code: string | null
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          published?: boolean
          published_at?: string | null
          search_tsv?: unknown
          slug: string
          species_code?: string | null
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          published?: boolean
          published_at?: string | null
          search_tsv?: unknown
          slug?: string
          species_code?: string | null
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dex_articles_species_code_fkey"
            columns: ["species_code"]
            isOneToOne: false
            referencedRelation: "species"
            referencedColumns: ["code"]
          },
        ]
      }
      ingredients: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name_en: string | null
          name_ko: string
          safety: Database["public"]["Enums"]["ingredient_safety"]
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name_en?: string | null
          name_ko: string
          safety?: Database["public"]["Enums"]["ingredient_safety"]
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name_en?: string | null
          name_ko?: string
          safety?: Database["public"]["Enums"]["ingredient_safety"]
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      pets: {
        Row: {
          avatar_url: string | null
          birth_date: string | null
          breed_id: string | null
          created_at: string
          id: string
          name: string
          neutered: boolean | null
          owner_id: string
          sex: Database["public"]["Enums"]["pet_sex"]
          species_code: string
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          avatar_url?: string | null
          birth_date?: string | null
          breed_id?: string | null
          created_at?: string
          id?: string
          name: string
          neutered?: boolean | null
          owner_id: string
          sex?: Database["public"]["Enums"]["pet_sex"]
          species_code: string
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          avatar_url?: string | null
          birth_date?: string | null
          breed_id?: string | null
          created_at?: string
          id?: string
          name?: string
          neutered?: boolean | null
          owner_id?: string
          sex?: Database["public"]["Enums"]["pet_sex"]
          species_code?: string
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pets_breed_id_fkey"
            columns: ["breed_id"]
            isOneToOne: false
            referencedRelation: "breeds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pets_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pets_species_code_fkey"
            columns: ["species_code"]
            isOneToOne: false
            referencedRelation: "species"
            referencedColumns: ["code"]
          },
        ]
      }
      place_species: {
        Row: {
          created_at: string
          place_id: string
          source: string
          species_code: string
        }
        Insert: {
          created_at?: string
          place_id: string
          source?: string
          species_code: string
        }
        Update: {
          created_at?: string
          place_id?: string
          source?: string
          species_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "place_species_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "place_species_species_code_fkey"
            columns: ["species_code"]
            isOneToOne: false
            referencedRelation: "species"
            referencedColumns: ["code"]
          },
        ]
      }
      places: {
        Row: {
          category: Database["public"]["Enums"]["place_category"]
          created_at: string
          external_id: string | null
          geog: unknown
          id: string
          jibun_address: string | null
          lat: number
          lng: number
          name: string
          phone: string | null
          road_address: string | null
          source: string
          status: Database["public"]["Enums"]["place_status"]
          updated_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["place_category"]
          created_at?: string
          external_id?: string | null
          geog?: unknown
          id?: string
          jibun_address?: string | null
          lat: number
          lng: number
          name: string
          phone?: string | null
          road_address?: string | null
          source?: string
          status?: Database["public"]["Enums"]["place_status"]
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["place_category"]
          created_at?: string
          external_id?: string | null
          geog?: unknown
          id?: string
          jibun_address?: string | null
          lat?: number
          lng?: number
          name?: string
          phone?: string | null
          road_address?: string | null
          source?: string
          status?: Database["public"]["Enums"]["place_status"]
          updated_at?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          author_id: string | null
          body: string
          category: Database["public"]["Enums"]["post_category"]
          created_at: string
          geog: unknown
          id: string
          image_paths: string[]
          lat: number | null
          lng: number | null
          meta: Json
          region_code: string | null
          search_tsv: unknown
          species_code: string | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          body: string
          category: Database["public"]["Enums"]["post_category"]
          created_at?: string
          geog?: unknown
          id?: string
          image_paths?: string[]
          lat?: number | null
          lng?: number | null
          meta?: Json
          region_code?: string | null
          search_tsv?: unknown
          species_code?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          body?: string
          category?: Database["public"]["Enums"]["post_category"]
          created_at?: string
          geog?: unknown
          id?: string
          image_paths?: string[]
          lat?: number | null
          lng?: number | null
          meta?: Json
          region_code?: string | null
          search_tsv?: unknown
          species_code?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_species_code_fkey"
            columns: ["species_code"]
            isOneToOne: false
            referencedRelation: "species"
            referencedColumns: ["code"]
          },
        ]
      }
      product_ingredients: {
        Row: {
          created_at: string
          ingredient_id: string
          position: number | null
          product_id: string
        }
        Insert: {
          created_at?: string
          ingredient_id: string
          position?: number | null
          product_id: string
        }
        Update: {
          created_at?: string
          ingredient_id?: string
          position?: number | null
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_ingredients_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_ingredients_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          barcode: string | null
          brand: string | null
          category: string | null
          created_at: string
          id: string
          image_path: string | null
          name: string
          updated_at: string
        }
        Insert: {
          barcode?: string | null
          brand?: string | null
          category?: string | null
          created_at?: string
          id?: string
          image_path?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          barcode?: string | null
          brand?: string | null
          category?: string | null
          created_at?: string
          id?: string
          image_path?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          id: string
          nickname: string
          region_code: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          id: string
          nickname: string
          region_code?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          nickname?: string
          region_code?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          author_id: string | null
          body: string
          created_at: string
          id: string
          image_paths: string[]
          is_verified: boolean
          place_id: string
          rating: number
          receipt_image_path: string | null
          search_tsv: unknown
          updated_at: string
          visited_species_code: string | null
        }
        Insert: {
          author_id?: string | null
          body: string
          created_at?: string
          id?: string
          image_paths?: string[]
          is_verified?: boolean
          place_id: string
          rating: number
          receipt_image_path?: string | null
          search_tsv?: unknown
          updated_at?: string
          visited_species_code?: string | null
        }
        Update: {
          author_id?: string | null
          body?: string
          created_at?: string
          id?: string
          image_paths?: string[]
          is_verified?: boolean
          place_id?: string
          rating?: number
          receipt_image_path?: string | null
          search_tsv?: unknown
          updated_at?: string
          visited_species_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_visited_species_code_fkey"
            columns: ["visited_species_code"]
            isOneToOne: false
            referencedRelation: "species"
            referencedColumns: ["code"]
          },
        ]
      }
      species: {
        Row: {
          code: string
          created_at: string
          group: Database["public"]["Enums"]["species_group"]
          name_en: string | null
          name_ko: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          group: Database["public"]["Enums"]["species_group"]
          name_en?: string | null
          name_ko: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          group?: Database["public"]["Enums"]["species_group"]
          name_en?: string | null
          name_ko?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      nearby_places: {
        Args: {
          p_category?: Database["public"]["Enums"]["place_category"]
          p_lat: number
          p_lng: number
          p_radius_m?: number
          p_species_code?: string
          p_statuses?: Database["public"]["Enums"]["place_status"][]
        }
        Returns: {
          category: Database["public"]["Enums"]["place_category"]
          distance_m: number
          external_id: string
          id: string
          jibun_address: string
          lat: number
          lng: number
          name: string
          phone: string
          road_address: string
          status: Database["public"]["Enums"]["place_status"]
        }[]
      }
    }
    Enums: {
      ingredient_safety: "safe" | "caution" | "danger" | "unknown"
      pet_sex: "male" | "female" | "unknown"
      place_category: "animal_hospital" | "grooming" | "boarding"
      place_status: "operating" | "suspended" | "closed"
      post_category: "walk_crew" | "missing" | "adoption" | "free"
      species_group: "dog" | "cat" | "exotic"
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
      ingredient_safety: ["safe", "caution", "danger", "unknown"],
      pet_sex: ["male", "female", "unknown"],
      place_category: ["animal_hospital", "grooming", "boarding"],
      place_status: ["operating", "suspended", "closed"],
      post_category: ["walk_crew", "missing", "adoption", "free"],
      species_group: ["dog", "cat", "exotic"],
    },
  },
} as const
