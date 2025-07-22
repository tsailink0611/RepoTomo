import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { withErrorHandling } from '../utils/errorHandler'
import type { ReportTemplate, Question } from '../types/database'
import { mockReportTemplate, mockQuestions } from '../mocks/mockData'

interface ReportTemplateWithQuestions extends ReportTemplate {
  questions: Question[]
}

interface UseReportTemplatesReturn {
  templates: ReportTemplateWithQuestions[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export const useReportTemplates = (): UseReportTemplatesReturn => {
  const [templates, setTemplates] = useState<ReportTemplateWithQuestions[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isMockMode = import.meta.env.VITE_USE_MOCK === 'true'

  const fetchTemplates = withErrorHandling(async () => {
    if (isMockMode) {
      // モックデータ返却
      await new Promise(resolve => setTimeout(resolve, 500)) // 遅延をシミュレート
      
      return [{
        ...mockReportTemplate,
        questions: mockQuestions
      }]
    }

    // 本番モード：Supabaseからデータ取得
    const { data: templatesData, error: templatesError } = await supabase
      .from('report_templates')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (templatesError) throw templatesError

    // 各テンプレートに関連する質問を取得
    const templatesWithQuestions = await Promise.all(
      (templatesData || []).map(async (template) => {
        const { data: questions, error: questionsError } = await supabase
          .from('questions')
          .select('*')
          .eq('template_id', template.id)
          .order('order', { ascending: true })

        if (questionsError) throw questionsError

        return {
          ...template,
          questions: questions || []
        }
      })
    )

    return templatesWithQuestions
  }, 'useReportTemplates')

  const loadTemplates = async () => {
    setLoading(true)
    setError(null)

    const result = await fetchTemplates()
    
    if (result.success) {
      setTemplates(result.data)
    } else {
      setError(result.error.message)
      console.error('報告書テンプレート取得エラー:', result.error)
    }
    
    setLoading(false)
  }

  useEffect(() => {
    loadTemplates()
  }, [isMockMode])

  const refetch = async () => {
    await loadTemplates()
  }

  return {
    templates,
    loading,
    error,
    refetch
  }
}

// 特定のテンプレート取得用フック
export const useReportTemplate = (templateId: string) => {
  const [template, setTemplate] = useState<ReportTemplateWithQuestions | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isMockMode = import.meta.env.VITE_USE_MOCK === 'true'

  const fetchTemplate = withErrorHandling(async () => {
    if (isMockMode) {
      // モックデータ返却
      await new Promise(resolve => setTimeout(resolve, 300))
      
      if (templateId === mockReportTemplate.id || templateId === '1') {
        return {
          ...mockReportTemplate,
          questions: mockQuestions
        }
      }
      
      throw new Error('テンプレートが見つかりません')
    }

    // 本番モード：Supabaseからテンプレート取得
    const { data: templateData, error: templateError } = await supabase
      .from('report_templates')
      .select('*')
      .eq('id', templateId)
      .eq('is_active', true)
      .single()

    if (templateError) throw templateError

    // 関連する質問を取得
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .eq('template_id', templateId)
      .order('order', { ascending: true })

    if (questionsError) throw questionsError

    return {
      ...templateData,
      questions: questions || []
    }
  }, 'useReportTemplate')

  useEffect(() => {
    const loadTemplate = async () => {
      setLoading(true)
      setError(null)

      const result = await fetchTemplate()
      
      if (result.success) {
        setTemplate(result.data)
      } else {
        setError(result.error.message)
        console.error('報告書テンプレート取得エラー:', result.error)
      }
      
      setLoading(false)
    }

    if (templateId) {
      loadTemplate()
    }
  }, [templateId, isMockMode])

  return {
    template,
    loading,
    error
  }
}