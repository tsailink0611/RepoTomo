import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import './Login.css'

const Login = () => {
  const { signIn, loading, user } = useAuth()
  const [selectedRole, setSelectedRole] = useState<'STAFF' | 'MANAGER'>('STAFF')
  const [error, setError] = useState<string | null>(null)
  const isMockMode = import.meta.env.VITE_USE_MOCK === 'true'
  
  // 既にログイン済みの場合はリダイレクト
  useEffect(() => {
    if (user) {
      // ユーザーの役割に応じてリダイレクト
      const redirectPath = user.role === 'MANAGER' || user.role === 'ADMIN' 
        ? '/admin/dashboard' 
        : '/report/1'
      
      window.location.href = redirectPath
    }
  }, [user])
  
  const handleLogin = async () => {
    setError(null)
    
    try {
      if (isMockMode) {
        // モックモード：役割に応じたユーザーでログイン
        const staffId = selectedRole === 'MANAGER' ? 'M001' : 'S001'
        await signIn(staffId)
      } else {
        // 本番モード：LINE Login
        const lineChannelId = import.meta.env.VITE_LINE_CHANNEL_ID
        if (!lineChannelId) {
          throw new Error('LINE Channel IDが設定されていません')
        }
        
        const redirectUri = encodeURIComponent(window.location.origin + '/auth/callback')
        const state = Math.random().toString(36).substring(7)
        const lineLoginUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${lineChannelId}&redirect_uri=${redirectUri}&state=${state}&scope=profile%20openid`
        
        // LINEログインページに遷移
        window.location.href = lineLoginUrl
      }
    } catch (err) {
      console.error('ログインエラー:', err)
      setError(err instanceof Error ? err.message : 'ログインに失敗しました')
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="app-title">RepoTomo</h1>
        <p className="app-subtitle">報告書管理をもっと楽に</p>
        
        <div className="welcome-message">
          <p>いつもお疲れさまです！</p>
          <p>報告書の提出がとっても簡単になりました</p>
        </div>

        {/* モックモード：役割選択 */}
        {isMockMode && (
          <div style={{ marginBottom: '20px' }}>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
              🔧 開発モード：役割を選択してください
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <input
                  type="radio"
                  value="STAFF"
                  checked={selectedRole === 'STAFF'}
                  onChange={(e) => setSelectedRole(e.target.value as 'STAFF')}
                />
                スタッフ
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <input
                  type="radio"
                  value="MANAGER"
                  checked={selectedRole === 'MANAGER'}
                  onChange={(e) => setSelectedRole(e.target.value as 'MANAGER')}
                />
                管理者
              </label>
            </div>
          </div>
        )}

        {/* エラーメッセージ */}
        {error && (
          <div style={{ 
            backgroundColor: '#FFE5E5', 
            color: '#D32F2F', 
            padding: '10px', 
            borderRadius: '8px', 
            marginBottom: '15px',
            fontSize: '14px'
          }}>
            😅 {error}
          </div>
        )}

        <button 
          className="line-login-button"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <span>ログイン中...</span>
          ) : (
            <span>
              {isMockMode 
                ? `${selectedRole === 'MANAGER' ? '管理者' : 'スタッフ'}としてログイン` 
                : 'LINEでログイン'
              }
            </span>
          )}
        </button>

        <p className="login-note">
          {isMockMode ? (
            <>
              開発モードで動作中です<br />
              {selectedRole === 'MANAGER' ? '管理者' : 'スタッフ'}画面に移動します
            </>
          ) : (
            <>
              LINEアカウントでログインすると、<br />
              報告書の提出や履歴確認ができます
            </>
          )}
        </p>
      </div>
    </div>
  )
}

export default Login