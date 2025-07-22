import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useReportTemplate } from '../hooks/useReportTemplates'
import { useSubmissions } from '../hooks/useSubmissions'
import { useAuth } from '../hooks/useAuth'
import { moodOptions } from '../mocks/mockData'
import type { MoodOption } from '../types/database'
import './ReportForm.css'

const ReportForm = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { template, loading: templateLoading, error: templateError } = useReportTemplate(id || '')
  const { submitReport, loading: submitting } = useSubmissions()
  
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [selectedMood, setSelectedMood] = useState<MoodOption['value']>('happy')
  const [hasQuestion, setHasQuestion] = useState(false)
  const [question, setQuestion] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)

  // ユーザーが未ログインの場合はリダイレクト
  useEffect(() => {
    if (!user) {
      navigate('/login')
    }
  }, [user, navigate])

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    if (!template || !user) return

    const result = await submitReport({
      templateId: template.id,
      answers,
      mood: selectedMood,
      hasQuestion,
      question: hasQuestion ? question : undefined
    })

    if (result.success) {
      navigate('/complete', { 
        state: { 
          templateTitle: template.title,
          mood: selectedMood,
          hasQuestion,
          question 
        } 
      })
    } else {
      setSubmitError(result.error || '提出に失敗しました')
    }
  }

  if (!user) {
    return <div>ログインが必要です...</div>
  }

  if (templateLoading) {
    return (
      <div className="report-form-container">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>📝</div>
          <div>報告書を準備中...</div>
        </div>
      </div>
    )
  }

  if (templateError || !template) {
    return (
      <div className="report-form-container">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>😅</div>
          <div>報告書が見つかりませんでした</div>
          <button 
            onClick={() => navigate('/dashboard')}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              backgroundColor: '#FF8C69',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            ダッシュボードに戻る
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="report-form-container">
      <div className="report-form-card">
        <div className="header">
          <h2>{template.title} 😊</h2>
          <p>{template.description || 'ゆっくり振り返ってみましょう'}</p>
          <small style={{ color: '#666' }}>こんにちは、{user.name}さん</small>
        </div>

        {submitError && (
          <div style={{ 
            backgroundColor: '#FFE5E5', 
            color: '#D32F2F', 
            padding: '15px', 
            borderRadius: '8px', 
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            😅 {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* 動的な質問表示 */}
          {template.questions.map((question) => (
            <div key={question.id} className="form-group">
              <label htmlFor={question.id}>
                {question.text}
                {question.is_required && <span style={{ color: '#FF8C69' }}>*</span>}
              </label>

              {question.type === 'TEXTAREA' && (
                <textarea
                  id={question.id}
                  className="gentle-textarea"
                  placeholder="お気軽に書いてくださいね"
                  value={answers[question.id] || ''}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  rows={6}
                  required={question.is_required}
                />
              )}

              {question.type === 'TEXT' && (
                <input
                  type="text"
                  id={question.id}
                  className="gentle-input"
                  placeholder="入力してください"
                  value={answers[question.id] || ''}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  required={question.is_required}
                />
              )}

              {question.type === 'SCALE_1_TO_5' && (
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', margin: '15px 0' }}>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <label key={value} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <input
                        type="radio"
                        name={question.id}
                        value={value}
                        checked={answers[question.id] == value}
                        onChange={() => handleAnswerChange(question.id, value)}
                        required={question.is_required}
                      />
                      <span style={{ fontSize: '12px', marginTop: '5px' }}>{value}</span>
                    </label>
                  ))}
                </div>
              )}

              {question.type === 'YES_NO' && (
                <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', margin: '15px 0' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <input
                      type="radio"
                      name={question.id}
                      value="yes"
                      checked={answers[question.id] === 'yes'}
                      onChange={() => handleAnswerChange(question.id, 'yes')}
                      required={question.is_required}
                    />
                    はい
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <input
                      type="radio"
                      name={question.id}
                      value="no"
                      checked={answers[question.id] === 'no'}
                      onChange={() => handleAnswerChange(question.id, 'no')}
                      required={question.is_required}
                    />
                    いいえ
                  </label>
                </div>
              )}
            </div>
          ))}

          {/* 気分選択 */}
          <div className="form-group">
            <label>今日の気分はいかがですか？</label>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', margin: '15px 0' }}>
              {moodOptions.map((mood) => (
                <label key={mood.value} style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  cursor: 'pointer',
                  padding: '10px',
                  borderRadius: '8px',
                  backgroundColor: selectedMood === mood.value ? '#FFE5CC' : 'transparent',
                  transition: 'background-color 0.2s'
                }}>
                  <input
                    type="radio"
                    name="mood"
                    value={mood.value}
                    checked={selectedMood === mood.value}
                    onChange={() => setSelectedMood(mood.value)}
                    style={{ display: 'none' }}
                  />
                  <span style={{ fontSize: '24px', marginBottom: '5px' }}>{mood.icon}</span>
                  <span style={{ fontSize: '12px', textAlign: 'center' }}>{mood.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 質問・相談欄 */}
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="checkbox"
                checked={hasQuestion}
                onChange={(e) => setHasQuestion(e.target.checked)}
              />
              何か質問や相談がありますか？
            </label>
            
            {hasQuestion && (
              <textarea
                className="gentle-textarea"
                placeholder="どんな小さなことでも大丈夫です。お気軽に書いてくださいね💬"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows={4}
                style={{ marginTop: '10px' }}
              />
            )}
          </div>

          <div className="button-group">
            <button
              type="submit"
              className="submit-btn primary"
              disabled={submitting}
            >
              {submitting ? '送信中...' : hasQuestion ? '質問と一緒に提出' : '提出する'}
            </button>
            <button
              type="button"
              className="submit-btn secondary"
              onClick={() => navigate('/dashboard')}
              disabled={submitting}
            >
              後で書く
            </button>
          </div>
        </form>

        <div className="encouragement-message">
          <p>💡 ヒント：</p>
          <ul>
            <li>正直な気持ちを書いてください（完璧である必要はありません）</li>
            <li>困っていることがあれば遠慮なく相談してくださいね</li>
            <li>小さな成功も大切な成果です！</li>
            <li>後から追記・修正もできますので気軽に提出してください</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default ReportForm