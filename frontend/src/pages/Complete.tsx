import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import './Complete.css'

const Complete = () => {
  const navigate = useNavigate()

  useEffect(() => {
    // Celebrate animation
    const timer = setTimeout(() => {
      // Auto redirect after 5 seconds
    }, 5000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="complete-container">
      <div className="complete-card">
        <div className="celebration-icon">🎉</div>
        
        <h1>提出完了しました！</h1>
        
        <div className="message">
          <p>お疲れさまでした！</p>
          <p>報告書の提出ありがとうございます。</p>
          <p>今週も頑張りましたね！</p>
        </div>

        <div className="success-animation">
          <div className="checkmark">✓</div>
        </div>

        <div className="action-buttons">
          <button 
            className="btn primary"
            onClick={() => navigate('/')}
          >
            ホームに戻る
          </button>
          <button 
            className="btn secondary"
            onClick={() => navigate('/report/1')}
          >
            続けて他の報告書を書く
          </button>
        </div>

        <div className="motivational-quote">
          <p>「小さな一歩の積み重ねが、大きな成果につながります」</p>
          <p>ゆっくり休んでくださいね ☕</p>
        </div>
      </div>
    </div>
  )
}

export default Complete