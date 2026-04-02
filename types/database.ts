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
      expenses: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          description: string
          expense_date: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string
          description: string
          expense_date?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          description?: string
          expense_date?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          documento: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          documento: string
          email: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          documento?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      student_payments: {
        Row: {
          amount_expected: number
          amount_paid: number | null
          created_at: string
          id: string
          notes: string | null
          payment_date: string | null
          payment_method: string | null
          payment_status: string
          reference_month: string
          student_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_expected?: number
          amount_paid?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          payment_status?: string
          reference_month: string
          student_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_expected?: number
          amount_paid?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          payment_status?: string
          reference_month?: string
          student_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          backhand_progress: number
          class_days: string[] | null
          class_start_date: string
          class_time: string | null
          created_at: string
          forehand_progress: number
          id: string
          level: string
          monthly_fee: number
          name: string
          physical_progress: number
          progress: number
          serve_progress: number
          slice_progress: number
          status: string
          tactical_progress: number
          updated_at: string
          user_id: string
          volley_progress: number
        }
        Insert: {
          backhand_progress?: number
          class_days?: string[] | null
          class_start_date?: string
          class_time?: string | null
          created_at?: string
          forehand_progress?: number
          id?: string
          level: string
          monthly_fee?: number
          name: string
          physical_progress?: number
          progress?: number
          serve_progress?: number
          slice_progress?: number
          status?: string
          tactical_progress?: number
          updated_at?: string
          user_id: string
          volley_progress?: number
        }
        Update: {
          backhand_progress?: number
          class_days?: string[] | null
          class_start_date?: string
          class_time?: string | null
          created_at?: string
          forehand_progress?: number
          id?: string
          level?: string
          monthly_fee?: number
          name?: string
          physical_progress?: number
          progress?: number
          serve_progress?: number
          slice_progress?: number
          status?: string
          tactical_progress?: number
          updated_at?: string
          user_id?: string
          volley_progress?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: 'administrador' | 'professor' | 'aluno'
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: 'administrador' | 'professor' | 'aluno'
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: 'administrador' | 'professor' | 'aluno'
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: 'administrador' | 'professor' | 'aluno'
      }
      has_role: {
        Args: { _role: 'administrador' | 'professor' | 'aluno'; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: 'administrador' | 'professor' | 'aluno'
    }
  }
}

export type Student = Database['public']['Tables']['students']['Row']
export type Expense = Database['public']['Tables']['expenses']['Row']
export type Payment = Database['public']['Tables']['student_payments']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
