import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useSubmissionHistory } from '../hooks/useSubmissions'
import type { Submission } from '../types/database'
import { mockStaff, mockManager } from '../mocks/mockData'

interface DashboardStats {
  totalSubmissions: number
  pendingQuestions: number
  todaySubmissions: number
  staffCount: number
}

const AdminDashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { submissions, loading: submissionsLoading } = useSubmissionHistory()
  
  const [stats, setStats] = useState<DashboardStats>({
    totalSubmissions: 0,
    pendingQuestions: 0,
    todaySubmissions: 0,
    staffCount: 0
  })

  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [replyText, setReplyText] = useState('')
  const [isReplying, setIsReplying] = useState(false)

  useEffect(() => {
    // 管理者権限チェック
    if (!user || (user.role !== 'MANAGER' && user.role !== 'ADMIN')) {
      navigate('/dashboard')
      return
    }

    // 統計データの計算
    if (submissions) {
      const today = new Date().toDateString()
      const todaySubmissions = submissions.filter(
        sub => new Date(sub.submitted_at).toDateString() === today
      ).length

      const pendingQuestions = submissions.filter(
        sub => sub.has_question && !sub.is_answered
      ).length

      setStats({
        totalSubmissions: submissions.length,
        pendingQuestions,
        todaySubmissions,
        staffCount: 120 // モック値
      })
    }
  }, [user, navigate, submissions])

  const handleReply = async (submissionId: string) => {
    setIsReplying(true)
    
    // モックモード：返信処理のシミュレート
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 実際の実装では Supabase へ送信
    console.log('返信送信:', { submissionId, replyText })
    
    setIsReplying(false)
    setSelectedSubmission(null)
    setReplyText('')
    
    // 成功メッセージ表示
    alert('返信を送信しました！スタッフに通知されます📧')
  }

  if (!user || (user.role !== 'MANAGER' && user.role !== 'ADMIN')) {
    return <div>管理者権限が必要です</div>
  }

  const urgentItems = submissions?.filter(sub => 
    (sub.has_question && !sub.is_answered) || 
    sub.mood === 'need_help'
  ) || []

  const quickReplyTemplates = [
    'いつもお疲れさまです！頑張ってますね😊',
    '提出ありがとうございます。とても参考になりました👍',
    '質問ありがとうございます。一緒に考えましょう💪',
    '何か困ったことがあれば、いつでも相談してくださいね🤝'
  ]

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* ヘッダー */}
      <div style={{ marginBottom: '30px' }}>
        <h1>👑 管理者ダッシュボード</h1>
        <p>ようこそ、<strong>{user.name}</strong>さん（{user.role}）</p>
        <button 
          onClick={() => navigate('/dashboard')}
          style={{
            padding: '8px 16px',
            backgroundColor: '#666',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          ← ダッシュボードに戻る
        </button>
      </div>

      {/* 統計カード */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{ 
          backgroundColor: '#E8F5E8', 
          padding: '20px', 
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#2E7D32' }}>
            {stats.todaySubmissions}
          </div>
          <div style={{ color: '#2E7D32' }}>今日の提出</div>
        </div>
        
        <div style={{ 
          backgroundColor: '#FFF3E0', 
          padding: '20px', 
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#F57C00' }}>
            {stats.pendingQuestions}
          </div>
          <div style={{ color: '#F57C00' }}>未回答の質問</div>
        </div>
        
        <div style={{ 
          backgroundColor: '#E3F2FD', 
          padding: '20px', 
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1976D2' }}>
            {stats.totalSubmissions}
          </div>
          <div style={{ color: '#1976D2' }}>総提出数</div>
        </div>
        
        <div style={{ 
          backgroundColor: '#F3E5F5', 
          padding: '20px', 
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#7B1FA2' }}>
            {stats.staffCount}
          </div>
          <div style={{ color: '#7B1FA2' }}>スタッフ数</div>
        </div>
      </div>

      {/* 優先対応が必要な項目 */}
      {urgentItems.length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ color: '#D32F2F' }}>🚨 優先対応が必要</h2>
          <div style={{ 
            backgroundColor: '#FFEBEE', 
            border: '1px solid #F44336',
            borderRadius: '8px',
            padding: '15px'
          }}>
            {urgentItems.map((item) => (
              <div key={item.id} style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px',
                borderBottom: '1px solid #FFCDD2',
                marginBottom: '10px'
              }}>
                <div>
                  <strong>スタッフ: {mockStaff.name}</strong>
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    {item.has_question ? `質問: ${item.question}` : '体調不良の可能性'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#999' }}>
                    {new Date(item.submitted_at).toLocaleString()}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSubmission(item)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#F44336',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  返信する
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 最近の提出一覧 */}
      <div>
        <h2>📋 最近の提出状況</h2>
        {submissionsLoading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            読み込み中...
          </div>
        ) : (
          <div style={{ 
            backgroundColor: 'white',
            border: '1px solid #E0E0E0',
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            {submissions?.slice(0, 10).map((submission) => (
              <div key={submission.id} style={{ 
                padding: '15px',
                borderBottom: '1px solid #F0F0F0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold' }}>
                    {mockStaff.name}
                    <span style={{ 
                      marginLeft: '10px',
                      padding: '2px 8px',
                      fontSize: '12px',
                      borderRadius: '12px',
                      backgroundColor: submission.mood === 'happy' ? '#E8F5E8' : 
                                      submission.mood === 'need_help' ? '#FFEBEE' : '#F5F5F5',
                      color: submission.mood === 'happy' ? '#2E7D32' :
                             submission.mood === 'need_help' ? '#D32F2F' : '#666'
                    }}>
                      {submission.mood === 'happy' ? '😊 好調' :
                       submission.mood === 'need_help' ? '😅 要サポート' : '😐 普通'}
                    </span>
                  </div>
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    {new Date(submission.submitted_at).toLocaleString()}
                  </div>
                  {submission.has_question && (
                    <div style={{ 
                      fontSize: '14px', 
                      fontStyle: 'italic',
                      color: '#1976D2',
                      marginTop: '5px'
                    }}>
                      💬 質問あり: {submission.question}
                    </div>
                  )}
                </div>
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  {submission.has_question && !submission.is_answered && (
                    <button
                      onClick={() => setSelectedSubmission(submission)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#1976D2',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      返信
                    </button>
                  )}
                  {submission.is_answered && (
                    <span style={{ 
                      padding: '6px 12px',
                      backgroundColor: '#E8F5E8',
                      color: '#2E7D32',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}>
                      ✓ 回答済み
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 返信モーダル */}
      {selectedSubmission && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '12px',
            maxWidth: '500px',
            width: '90%'
          }}>
            <h3>📧 {mockStaff.name}さんに返信</h3>
            
            {selectedSubmission.question && (
              <div style={{ 
                backgroundColor: '#F5F5F5',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '20px'
              }}>
                <strong>質問:</strong>
                <div style={{ marginTop: '5px' }}>{selectedSubmission.question}</div>
              </div>
            )}

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>返信内容:</label>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="優しく励ましの言葉を書いてくださいね"
                rows={4}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #DDD',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '14px', marginBottom: '10px' }}>💡 クイック返信:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {quickReplyTemplates.map((template, index) => (
                  <button
                    key={index}
                    onClick={() => setReplyText(template)}
                    style={{
                      padding: '5px 10px',
                      fontSize: '12px',
                      backgroundColor: '#F0F0F0',
                      border: '1px solid #DDD',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    {template.substring(0, 20)}...
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setSelectedSubmission(null)
                  setReplyText('')
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#666',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                キャンセル
              </button>
              <button
                onClick={() => handleReply(selectedSubmission.id)}
                disabled={!replyText.trim() || isReplying}
                style={{
                  padding: '10px 20px',
                  backgroundColor: replyText.trim() ? '#4CAF50' : '#CCC',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: replyText.trim() ? 'pointer' : 'not-allowed'
                }}
              >
                {isReplying ? '送信中...' : '送信'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard