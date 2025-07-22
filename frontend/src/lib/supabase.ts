import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

// 環境変数の取得と検証
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const isMockMode = import.meta.env.VITE_USE_MOCK === 'true'

// Supabaseクライアントの設定
let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null

export const getSupabase = () => {
  if (!supabaseInstance) {
    if (isMockMode || !supabaseUrl || !supabaseAnonKey) {
      // モックモードまたは環境変数未設定の場合
      console.log('🔧 Supabase: モックモードで動作中')
      
      // モック用のダミークライアント（実際には使用されない）
      supabaseInstance = createClient('https://mock.supabase.co', 'mock-anon-key', {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      }) as any
      
      return supabaseInstance
    }

    // 本番モードの設定
    console.log('🚀 Supabase: 本番モードで接続中...')
    
    supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      },
      realtime: {
        params: {
          eventsPerSecond: 2 // レート制限で無料枠を節約
        }
      }
    })
  }
  
  return supabaseInstance
}

// 便利な再エクスポート
export const supabase = getSupabase()

// Database型定義（Supabase CLIで生成される型と互換）
export type Database = {
  public: {
    Tables: {
      staff: {
        Row: {
          id: string
          staff_id: string
          name: string
          line_user_id: string | null
          role: 'STAFF' | 'MANAGER' | 'ADMIN'
          is_active: boolean
          preferred_reminder_time: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          staff_id: string
          name: string
          line_user_id?: string | null
          role?: 'STAFF' | 'MANAGER' | 'ADMIN'
          is_active?: boolean
          preferred_reminder_time?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          staff_id?: string
          name?: string
          line_user_id?: string | null
          role?: 'STAFF' | 'MANAGER' | 'ADMIN'
          is_active?: boolean
          preferred_reminder_time?: string
          created_at?: string
          updated_at?: string
        }
      }
      submissions: {
        Row: {
          id: string
          report_id: string | null
          staff_id: string | null
          answers: Record<string, any> | null
          mood: 'happy' | 'neutral' | 'need_help' | null
          has_question: boolean
          question: string | null
          is_answered: boolean
          admin_reply: string | null
          replied_at: string | null
          submitted_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          report_id?: string | null
          staff_id?: string | null
          answers?: Record<string, any> | null
          mood?: 'happy' | 'neutral' | 'need_help' | null
          has_question?: boolean
          question?: string | null
          is_answered?: boolean
          admin_reply?: string | null
          replied_at?: string | null
          submitted_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          report_id?: string | null
          staff_id?: string | null
          answers?: Record<string, any> | null
          mood?: 'happy' | 'neutral' | 'need_help' | null
          has_question?: boolean
          question?: string | null
          is_answered?: boolean
          admin_reply?: string | null
          replied_at?: string | null
          submitted_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      report_templates: {
        Row: {
          id: string
          title: string
          description: string | null
          frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | null
          due_time: string
          reminder_message: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          frequency?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | null
          due_time?: string
          reminder_message?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          frequency?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | null
          due_time?: string
          reminder_message?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      questions: {
        Row: {
          id: string
          template_id: string
          text: string
          type: 'TEXT' | 'TEXTAREA' | 'CHOICE' | 'MULTIPLE_CHOICE' | 'SCALE_1_TO_5' | 'YES_NO'
          options: string[] | null
          is_required: boolean
          order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          template_id: string
          text: string
          type: 'TEXT' | 'TEXTAREA' | 'CHOICE' | 'MULTIPLE_CHOICE' | 'SCALE_1_TO_5' | 'YES_NO'
          options?: string[] | null
          is_required?: boolean
          order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          template_id?: string
          text?: string
          type?: 'TEXT' | 'TEXTAREA' | 'CHOICE' | 'MULTIPLE_CHOICE' | 'SCALE_1_TO_5' | 'YES_NO'
          options?: string[] | null
          is_required?: boolean
          order?: number
          created_at?: string
          updated_at?: string
        }
      }
      consultations: {
        Row: {
          id: string
          staff_id: string
          title: string
          content: string
          is_anonymous: boolean
          status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
          priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
          admin_reply: string | null
          replied_at: string | null
          replied_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          staff_id: string
          title: string
          content: string
          is_anonymous?: boolean
          status?: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
          priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
          admin_reply?: string | null
          replied_at?: string | null
          replied_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          staff_id?: string
          title?: string
          content?: string
          is_anonymous?: boolean
          status?: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
          priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
          admin_reply?: string | null
          replied_at?: string | null
          replied_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      achievements: {
        Row: {
          id: string
          staff_id: string
          type: string
          title: string
          description: string | null
          icon: string | null
          points: number
          earned_at: string
        }
        Insert: {
          id?: string
          staff_id: string
          type: string
          title: string
          description?: string | null
          icon?: string | null
          points?: number
          earned_at?: string
        }
        Update: {
          id?: string
          staff_id?: string
          type?: string
          title?: string
          description?: string | null
          icon?: string | null
          points?: number
          earned_at?: string
        }
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

// ヘルパー関数：接続テスト
export const testSupabaseConnection = async () => {
  if (isMockMode) {
    console.log('🔧 モックモードのため接続テストをスキップ')
    return { success: true, message: 'モックモード' }
  }

  try {
    const { data, error } = await supabase.from('staff').select('count', { count: 'exact', head: true })
    
    if (error) {
      console.error('❌ Supabase接続エラー:', error)
      return { success: false, message: error.message }
    }
    
    console.log('✅ Supabase接続成功')
    return { success: true, message: '接続成功' }
  } catch (error) {
    console.error('❌ Supabase接続テストエラー:', error)
    return { success: false, message: 'ネットワークエラー' }
  }
}

// デバッグ用：現在の設定を表示
export const debugSupabaseConfig = () => {
  console.log('🔍 Supabase設定:', {
    url: supabaseUrl || 'Not set',
    hasAnonKey: !!supabaseAnonKey,
    isMockMode,
    environment: import.meta.env.VITE_ENVIRONMENT || 'Unknown'
  })
}