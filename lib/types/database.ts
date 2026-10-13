// Database types generated from Supabase schema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          display_name: string | null
          preferred_currency: string
          preferred_locale: string
          theme_preference: 'light' | 'dark' | 'system'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          preferred_currency?: string
          preferred_locale?: string
          theme_preference?: 'light' | 'dark' | 'system'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          preferred_currency?: string
          preferred_locale?: string
          theme_preference?: 'light' | 'dark' | 'system'
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          id: string
          user_id: string | null
          name: string
          icon: string | null
          color: string | null
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          icon?: string | null
          color?: string | null
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          icon?: string | null
          color?: string | null
          is_default?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          id: string
          user_id: string
          name: string
          color: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          color?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          color?: string
          updated_at?: string
        }
        Relationships: []
      }
      spaces: {
        Row: {
          id: string
          user_id: string
          name: string
          icon: string | null
          color: string | null
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          icon?: string | null
          color?: string | null
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          icon?: string | null
          color?: string | null
          is_default?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          id: string
          user_id: string
          space_id: string | null
          title: string
          description: string | null
          amount: number
          currency: string
          category_id: string | null
          merchant: string | null
          payment_method: PaymentMethod | null
          transaction_date: string
          is_recurring: boolean
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          space_id?: string | null
          title: string
          description?: string | null
          amount: number
          currency?: string
          category_id?: string | null
          merchant?: string | null
          payment_method?: PaymentMethod | null
          transaction_date: string
          is_recurring?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          space_id?: string | null
          title?: string
          description?: string | null
          amount?: number
          currency?: string
          category_id?: string | null
          merchant?: string | null
          payment_method?: PaymentMethod | null
          transaction_date?: string
          is_recurring?: boolean
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          }
        ]
      }
      expense_tags: {
        Row: {
          expense_id: string
          tag_id: string
        }
        Insert: {
          expense_id: string
          tag_id: string
        }
        Update: {
          expense_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_tags_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          }
        ]
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

export type PaymentMethod =
  | 'cash'
  | 'credit_card'
  | 'debit_card'
  | 'upi'
  | 'net_banking'
  | 'wallet'
  | 'other'

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Space = Database['public']['Tables']['spaces']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type Tag = Database['public']['Tables']['tags']['Row']
export type Expense = Database['public']['Tables']['expenses']['Row']
export type ExpenseTag = Database['public']['Tables']['expense_tags']['Row']

export type ExpenseWithRelations = Expense & {
  category: Category | null
  tags: Tag[]
  space?: Space | null
}

export type ThemePreference = 'light' | 'dark' | 'system'
