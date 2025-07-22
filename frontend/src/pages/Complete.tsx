import { useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { encouragementMessages, getRandomEncouragement } from '../mocks/mockData'
import './Complete.css'

interface LocationState {
  templateTitle?: string
  mood?: 'happy' | 'neutral' | 'need_help'
  hasQuestion?: boolean
  question?: string
}

const Complete = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [celebrationPhase, setCelebrationPhase] = useState(0)
  
  const state = location.state as LocationState
  const templateTitle = state?.templateTitle || '報告書'
  const mood = state?.mood
  const hasQuestion = state?.hasQuestion
  const question = state?.question

  useEffect(() => {
    // ユーザーが未ログインの場合はリダイレクト
    if (!user) {
      navigate('/login')
      return
    }

    // 段階的なお祝いアニメーション
    const phases = [
      () => setCelebrationPhase(1), // 基本メッセージ
      () => setCelebrationPhase(2), // 詳細フィードバック
      () => setCelebrationPhase(3), // 励ましメッセージ
    ]

    phases.forEach((phase, index) => {
      setTimeout(phase, index * 1000)
    })

  }, [user, navigate])

  const getMoodMessage = () => {
    switch (mood) {
      case 'happy':
        return '今日は調子が良いようですね！素晴らしいです🌟'
      case 'neutral':
        return '今日も一日お疲れさまでした。無理せずに進んでいきましょう😊'
      case 'need_help':
        return '少し大変そうですね。何かサポートが必要でしたらいつでも相談してくださいね💪'
      default:
        return ''
    }
  }

  const getSubmissionMessage = () => {
    if (hasQuestion) {
      const messages = encouragementMessages.consult
      return messages[Math.floor(Math.random() * messages.length)]
    } else {
      const messages = encouragementMessages.submit
      return messages[Math.floor(Math.random() * messages.length)]
    }
  }

  if (!user) {
    return <div>ログインが必要です...</div>
  }

  return (
    <div className="complete-container">
      <div className="complete-card">
        <div className="celebration-icon">
          {hasQuestion ? '💬' : '🎉'}
        </div>
        
        <h1>
          {hasQuestion ? '質問と報告書を受け取りました！' : '提出完了しました！'}
        </h1>
        
        <div className="user-greeting">
          <p><strong>{user.name}</strong>さん、{getSubmissionMessage()}</p>
        </div>

        <div className="submission-details">
          <div style={{ 
            backgroundColor: '#F8F9FA', 
            padding: '15px', 
            borderRadius: '8px', 
            margin: '20px 0' 
          }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>📋 提出内容</h3>
            <p><strong>報告書:</strong> {templateTitle}</p>
            {mood && (
              <p><strong>気分:</strong> {getMoodMessage()}</p>
            )}
            {hasQuestion && question && (
              <div style={{ marginTop: '10px' }}>
                <p><strong>ご質問:</strong></p>
                <div style={{ 
                  backgroundColor: '#FFE5CC', 
                  padding: '10px', 
                  borderRadius: '6px',
                  fontStyle: 'italic' 
                }}>
                  "{question}"
                </div>
                <p style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
                  📞 管理者から3時間以内にお返事いたします
                </p>
              </div>
            )}
          </div>
        </div>

        {celebrationPhase >= 1 && (
          <div className="success-animation" style={{ 
            opacity: celebrationPhase >= 1 ? 1 : 0,
            transition: 'opacity 0.5s ease-in-out'
          }}>
            <div className="checkmark">✓</div>
          </div>
        )}

        {celebrationPhase >= 2 && (
          <div style={{ 
            opacity: celebrationPhase >= 2 ? 1 : 0,
            transition: 'opacity 0.5s ease-in-out',
            margin: '20px 0'
          }}>
            <div style={{ 
              backgroundColor: '#E8F5E8', 
              padding: '15px', 
              borderRadius: '8px',
              border: '1px solid #4CAF50'
            }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#2E7D32' }}>🌟 今回の頑張り</h3>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#2E7D32' }}>
                <li>報告書の提出 +10ポイント</li>
                {hasQuestion && <li>積極的な質問・相談 +5ポイント</li>}
                <li>継続的な成長への参加 +5ポイント</li>
              </ul>
            </div>
          </div>
        )}

        <div className="action-buttons">
          <button 
            className="btn primary"
            onClick={() => navigate('/dashboard')}
          >
            ダッシュボードに戻る
          </button>
          
          {user.role === 'STAFF' && (
            <button 
              className="btn secondary"
              onClick={() => navigate('/report/1')}
            >
              別の報告書を書く
            </button>
          )}

          {hasQuestion && (
            <button 
              className="btn secondary"
              onClick={() => navigate('/consultations')} // 相談履歴画面（未実装）
            >
              相談履歴を見る
            </button>
          )}
        </div>

        {celebrationPhase >= 3 && (
          <div className="motivational-quote" style={{ 
            opacity: celebrationPhase >= 3 ? 1 : 0,
            transition: 'opacity 0.5s ease-in-out'
          }}>
            <p>「{getRandomEncouragement()}」</p>
            <p>今日もお疲れさまでした。ゆっくり休んでくださいね ☕</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Complete