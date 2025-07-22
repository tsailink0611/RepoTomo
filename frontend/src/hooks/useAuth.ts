import { useState, useEffect, useCallback } from 'react'
import type { AuthUser } from '../types/database'
import { mockAuthUser, mockManager, gentleErrorMessages } from '../mocks/mockData'

interface UseAuthReturn {
  user: AuthUser | null
  loading: boolean
  signIn: (staffId?: string) => Promise<void>
  signOut: () => Promise<void>
  isAuthenticated: boolean
  isManager: boolean
  isAdmin: boolean
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  // 環境変数でモックモードかどうかを判定
  const isMockMode = import.meta.env.VITE_USE_MOCK === 'true'

  // 初期化：ローカルストレージから認証状態を復元
  useEffect(() => {
    if (isMockMode) {
      const savedUser = localStorage.getItem('repoTomo_auth_user')
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser))
        } catch (error) {
          console.warn('Failed to parse saved user data:', error)
          localStorage.removeItem('repoTomo_auth_user')
        }
      }
      setLoading(false)
    } else {
      // 本番モードの場合はSupabase認証を使用
      initializeSupabaseAuth()
    }
  }, [isMockMode])

  const initializeSupabaseAuth = async () => {
    try {
      // TODO: Supabase認証の初期化
      // const { data: { session } } = await supabase.auth.getSession()
      // if (session?.user) {
      //   const userData = await fetchUserData(session.user.id)
      //   setUser(userData)
      // }
      console.log('Supabase auth initialization (not implemented yet)')
      setLoading(false)
    } catch (error) {
      console.error('Auth initialization error:', error)
      setLoading(false)
    }
  }

  const signIn = useCallback(async (staffId?: string): Promise<void> => {
    setLoading(true)
    
    try {
      if (isMockMode) {
        // モックモード：スタッフIDに基づいてユーザーを切り替え
        await new Promise(resolve => setTimeout(resolve, 1000)) // 1秒待機
        
        const userData = staffId === 'M001' ? mockManager : mockAuthUser
        const authUser: AuthUser = {
          id: userData.id,
          staff_id: userData.staff_id,
          name: userData.name,
          role: userData.role,
          line_user_id: userData.line_user_id
        }
        
        setUser(authUser)
        localStorage.setItem('repoTomo_auth_user', JSON.stringify(authUser))
        
        console.log(`✅ モックログイン成功: ${authUser.name} (${authUser.role})`)
      } else {
        // 本番モード：Supabase認証
        // TODO: LINE Login or Supabase Auth実装
        // const { data, error } = await supabase.auth.signInWithProvider({
        //   provider: 'line'
        // })
        throw new Error('Supabase auth not implemented yet')
      }
    } catch (error) {
      console.error('Sign in error:', error)
      throw new Error(gentleErrorMessages.auth)
    } finally {
      setLoading(false)
    }
  }, [isMockMode])

  const signOut = useCallback(async (): Promise<void> => {
    setLoading(true)
    
    try {
      if (isMockMode) {
        await new Promise(resolve => setTimeout(resolve, 500)) // 0.5秒待機
        setUser(null)
        localStorage.removeItem('repoTomo_auth_user')
        console.log('✅ モックログアウト成功')
      } else {
        // TODO: Supabase signout
        // await supabase.auth.signOut()
        throw new Error('Supabase auth not implemented yet')
      }
    } catch (error) {
      console.error('Sign out error:', error)
      // ログアウトエラーでもローカル状態はクリア
      setUser(null)
      localStorage.removeItem('repoTomo_auth_user')
    } finally {
      setLoading(false)
    }
  }, [isMockMode])

  // 便利な計算プロパティ
  const isAuthenticated = !!user
  const isManager = user?.role === 'MANAGER' || user?.role === 'ADMIN'
  const isAdmin = user?.role === 'ADMIN'

  return {
    user,
    loading,
    signIn,
    signOut,
    isAuthenticated,
    isManager,
    isAdmin
  }
}

// デバッグ用：認証状態をコンソールに表示
export const useAuthDebug = () => {
  const auth = useAuth()
  
  useEffect(() => {
    console.log('🔐 Auth State:', {
      user: auth.user?.name || 'Not logged in',
      role: auth.user?.role || 'None',
      loading: auth.loading,
      isAuthenticated: auth.isAuthenticated,
      isManager: auth.isManager,
      isAdmin: auth.isAdmin
    })
  }, [auth.user, auth.loading])
  
  return auth
}