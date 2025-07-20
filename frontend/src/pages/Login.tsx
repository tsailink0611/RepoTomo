import { useState, useEffect } from 'react'
import './Login.css'

const Login = () => {
  const [isLoading, setIsLoading] = useState(false)
  const lineChannelId = import.meta.env.VITE_LINE_CHANNEL_ID || '1234567890'
  const redirectUri = encodeURIComponent(window.location.origin + '/auth/callback')
  const state = Math.random().toString(36).substring(7)
  
  const handleLineLogin = () => {
    setIsLoading(true)
    // LINE Login URL
    const lineLoginUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${lineChannelId}&redirect_uri=${redirectUri}&state=${state}&scope=profile%20openid`
    
    // For now, just redirect to report form for testing
    setTimeout(() => {
      window.location.href = '/report/1'
    }, 1000)
    
    // In production: window.location.href = lineLoginUrl
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

        <button 
          className="line-login-button"
          onClick={handleLineLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <span>ログイン中...</span>
          ) : (
            <>
              <img src="/line-icon.svg" alt="LINE" />
              <span>LINEでログイン</span>
            </>
          )}
        </button>

        <p className="login-note">
          LINEアカウントでログインすると、<br />
          報告書の提出や履歴確認ができます
        </p>
      </div>
    </div>
  )
}

export default Login