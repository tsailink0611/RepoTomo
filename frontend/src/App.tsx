import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Login from './pages/Login'
import ReportForm from './pages/ReportForm'
import Complete from './pages/Complete'
import AdminDashboard from './pages/AdminDashboard'
import './App.css'

function App() {
  const { user, loading } = useAuth()

  // ローディング中の表示
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <div style={{ fontSize: '24px' }}>📝</div>
        <div>RepoTomo起動中...</div>
      </div>
    )
  }

  return (
    <Router>
      <div className="app">
        <Routes>
          {/* ログイン画面 */}
          <Route 
            path="/login" 
            element={user ? <Navigate to="/dashboard" replace /> : <Login />} 
          />
          
          {/* ダッシュボード（ログイン後のホーム） */}
          <Route 
            path="/dashboard" 
            element={
              user ? (
                <div style={{ padding: '20px', textAlign: 'center' }}>
                  <h1>🎉 RepoTomo ダッシュボード</h1>
                  <p>こんにちは、<strong>{user.name}</strong>さん（{user.role}）</p>
                  <div style={{ 
                    background: '#FFE5E5', 
                    padding: '15px', 
                    borderRadius: '8px', 
                    margin: '20px 0',
                    border: '1px solid #FF8C69'
                  }}>
                    <p>🔧 <strong>モックモード</strong>で動作中</p>
                    <p>Phase 2 コア機能実装完了！</p>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '20px', flexWrap: 'wrap' }}>
                    {user.role === 'MANAGER' || user.role === 'ADMIN' ? (
                      <button 
                        onClick={() => window.location.href = '/admin/dashboard'}
                        style={{
                          padding: '12px 24px',
                          backgroundColor: '#4CAF50',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '16px'
                        }}
                      >
                        👑 管理者ダッシュボード
                      </button>
                    ) : (
                      <button 
                        onClick={() => window.location.href = '/report/1'}
                        style={{
                          padding: '12px 24px',
                          backgroundColor: '#2196F3',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '16px'
                        }}
                      >
                        📝 報告書作成
                      </button>
                    )}
                    
                    <button 
                      onClick={() => {
                        localStorage.removeItem('repoTomo_auth_user')
                        window.location.href = '/login'
                      }}
                      style={{
                        padding: '12px 24px',
                        backgroundColor: '#FF8C69',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '16px'
                      }}
                    >
                      ログアウト
                    </button>
                  </div>
                </div>
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />

          {/* 既存の報告書関連画面 */}
          <Route 
            path="/report/:id" 
            element={user ? <ReportForm /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/complete" 
            element={user ? <Complete /> : <Navigate to="/login" replace />} 
          />

          {/* 管理者ダッシュボード */}
          <Route 
            path="/admin/dashboard" 
            element={
              user && (user.role === 'MANAGER' || user.role === 'ADMIN') ? (
                <AdminDashboard />
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />

          {/* ルートアクセス時の処理 */}
          <Route 
            path="/" 
            element={<Navigate to={user ? "/dashboard" : "/login"} replace />} 
          />

          {/* 404 - 未定義のルート */}
          <Route 
            path="*" 
            element={
              <div style={{ padding: '20px', textAlign: 'center' }}>
                <h1>😅 ページが見つかりません</h1>
                <p>申し訳ありませんが、お探しのページが見つかりませんでした</p>
                <button 
                  onClick={() => window.location.href = '/'}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#FF8C69',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  ホームに戻る
                </button>
              </div>
            } 
          />
        </Routes>
      </div>
    </Router>
  )
}

export default App
