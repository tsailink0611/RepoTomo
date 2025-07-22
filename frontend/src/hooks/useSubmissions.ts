import { useState } from 'react'
import { useAuth } from './useAuth'
import { supabase } from '../lib/supabase'
import { withErrorHandling } from '../utils/errorHandler'
import type { Submission } from '../types/database'
import { encouragementMessages } from '../mocks/mockData'

interface SubmitReportData {
  templateId: string
  answers: Record<string, any>
  mood?: 'happy' | 'neutral' | 'need_help'
  hasQuestion: boolean
  question?: string
}

interface UseSubmissionsReturn {
  submitReport: (data: SubmitReportData) => Promise<{ success: boolean; error?: string }>
  loading: boolean
  lastSubmission: Submission | null
}

export const useSubmissions = (): UseSubmissionsReturn => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [lastSubmission, setLastSubmission] = useState<Submission | null>(null)
  const isMockMode = import.meta.env.VITE_USE_MOCK === 'true'

  const submitReportWithErrorHandling = withErrorHandling(async (data: SubmitReportData) => {
    if (!user) {
      throw new Error('ログインが必要です')
    }

    if (isMockMode) {
      // モックモード：提出をシミュレート
      await new Promise(resolve => setTimeout(resolve, 1000)) // 1秒待機

      const mockSubmission: Submission = {
        id: `mock-submission-${Date.now()}`,
        report_id: data.templateId,
        staff_id: user.id,
        answers: data.answers,
        mood: data.mood || null,
        has_question: data.hasQuestion,
        question: data.question || null,
        is_answered: false,
        admin_reply: null,
        replied_at: null,
        submitted_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // 励ましメッセージを表示
      const messages = data.hasQuestion 
        ? encouragementMessages.consult 
        : encouragementMessages.submit
      const randomMessage = messages[Math.floor(Math.random() * messages.length)]
      
      console.log(`🎉 ${randomMessage}`)
      
      setLastSubmission(mockSubmission)
      return mockSubmission
    }

    // 本番モード：Supabaseに提出
    const submissionData = {
      report_id: data.templateId,
      staff_id: user.id,
      answers: data.answers,
      mood: data.mood || null,
      has_question: data.hasQuestion,
      question: data.question || null,
      submitted_at: new Date().toISOString()
    }

    const { data: submission, error } = await supabase
      .from('submissions')
      .insert([submissionData])
      .select()
      .single()

    if (error) throw error

    setLastSubmission(submission)
    return submission
  }, 'submitReport')

  const submitReport = async (data: SubmitReportData) => {
    setLoading(true)

    const result = await submitReportWithErrorHandling(data)
    
    setLoading(false)

    if (result.success) {
      return { success: true }
    } else {
      console.error('報告書提出エラー:', result.error)
      return { 
        success: false, 
        error: result.error.message 
      }
    }
  }

  return {
    submitReport,
    loading,
    lastSubmission
  }
}

// 提出履歴取得用フック
interface UseSubmissionHistoryReturn {
  submissions: Submission[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export const useSubmissionHistory = (): UseSubmissionHistoryReturn => {
  const { user } = useAuth()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isMockMode = import.meta.env.VITE_USE_MOCK === 'true'

  const fetchHistory = withErrorHandling(async () => {
    if (!user) {
      throw new Error('ログインが必要です')
    }

    if (isMockMode) {
      // モックデータ返却
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // 過去3日分のモックデータを生成
      const mockSubmissions: Submission[] = []
      for (let i = 0; i < 3; i++) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        
        mockSubmissions.push({
          id: `mock-history-${i}`,
          report_id: 'mock-template-001',
          staff_id: user.id,
          answers: {
            'mock-q-001': `${i + 1}日前の報告内容です`,
            'mock-q-003': String(3 + i)
          },
          mood: i === 0 ? 'happy' : i === 1 ? 'neutral' : 'need_help',
          has_question: i === 2,
          question: i === 2 ? '質問があります' : null,
          is_answered: i !== 2,
          admin_reply: i !== 2 ? 'ありがとうございます！' : null,
          replied_at: i !== 2 ? date.toISOString() : null,
          submitted_at: date.toISOString(),
          created_at: date.toISOString(),
          updated_at: date.toISOString()
        })
      }
      
      return mockSubmissions
    }

    // 本番モード：Supabaseから履歴取得
    const { data, error: fetchError } = await supabase
      .from('submissions')
      .select('*')
      .eq('staff_id', user.id)
      .order('submitted_at', { ascending: false })
      .limit(10) // 最新10件

    if (fetchError) throw fetchError

    return data || []
  }, 'useSubmissionHistory')

  const loadHistory = async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    const result = await fetchHistory()
    
    if (result.success) {
      setSubmissions(result.data)
    } else {
      setError(result.error.message)
      console.error('提出履歴取得エラー:', result.error)
    }
    
    setLoading(false)
  }

  const refetch = async () => {
    await loadHistory()
  }

  // user が変更されたら履歴を再読み込み
  useState(() => {
    if (user) {
      loadHistory()
    }
  })

  return {
    submissions,
    loading,
    error,
    refetch
  }
}