import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import './ReportForm.css'

const ReportForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      console.log('Submitting report:', { reportId: id, content })
      navigate('/complete')
    }, 1500)
  }

  return (
    <div className="report-form-container">
      <div className="report-form-card">
        <div className="header">
          <h2>今週もお疲れさまでした！😊</h2>
          <p>ゆっくり振り返ってみましょう</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="report-content">
              今週の出来事を教えてください
            </label>
            <textarea
              id="report-content"
              className="gentle-textarea"
              placeholder="今週嬉しかったこと、困ったこと、なんでも書いてくださいね。&#10;箇条書きでも、文章でも、お好きな形で大丈夫です。"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={10}
              required
            />
            <p className="textarea-hint">
              ※後から追記・修正もできますので、気軽に書いてくださいね
            </p>
          </div>

          <div className="button-group">
            <button
              type="submit"
              className="submit-btn primary"
              disabled={isSubmitting || !content.trim()}
            >
              {isSubmitting ? '送信中...' : '提出する'}
            </button>
            <button
              type="button"
              className="submit-btn secondary"
              onClick={() => navigate('/')}
              disabled={isSubmitting}
            >
              後で書く
            </button>
          </div>
        </form>

        <div className="encouragement-message">
          <p>💡 ヒント：</p>
          <ul>
            <li>達成できたこと（小さなことでもOK！）</li>
            <li>新しく学んだこと</li>
            <li>困っていること・相談したいこと</li>
            <li>来週の目標（無理のない範囲で）</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default ReportForm