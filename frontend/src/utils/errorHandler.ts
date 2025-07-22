// RepoTomo エラーハンドリングユーティリティ
// 心理的安全性を重視した優しいエラーメッセージ

import { gentleErrorMessages } from '../mocks/mockData'

export interface AppError {
  type: 'network' | 'validation' | 'auth' | 'permission' | 'supabase' | 'general'
  message: string
  originalError?: Error
  details?: Record<string, any>
}

/**
 * エラーを心理的安全性を重視したメッセージに変換
 */
export const createGentleError = (
  type: AppError['type'], 
  originalError?: Error,
  details?: Record<string, any>
): AppError => {
  const message = gentleErrorMessages[type] || gentleErrorMessages.general
  
  return {
    type,
    message,
    originalError,
    details
  }
}

/**
 * Supabaseエラーを優しいメッセージに変換
 */
export const handleSupabaseError = (error: any): AppError => {
  console.error('Supabase Error:', error)

  // 認証関連エラー
  if (error?.message?.includes('auth') || error?.message?.includes('JWT')) {
    return createGentleError('auth', error)
  }

  // ネットワーク関連エラー
  if (error?.message?.includes('fetch') || error?.message?.includes('network')) {
    return createGentleError('network', error)
  }

  // 権限関連エラー
  if (error?.message?.includes('permission') || error?.message?.includes('RLS')) {
    return createGentleError('permission', error, {
      hint: 'ログインし直してみてください'
    })
  }

  // バリデーションエラー
  if (error?.message?.includes('violates') || error?.message?.includes('constraint')) {
    return createGentleError('validation', error)
  }

  // その他のSupabaseエラー
  return createGentleError('supabase', error)
}

/**
 * 一般的なJavaScriptエラーを処理
 */
export const handleJavaScriptError = (error: Error): AppError => {
  console.error('JavaScript Error:', error)

  // ネットワークエラー
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return createGentleError('network', error)
  }

  // その他
  return createGentleError('general', error)
}

/**
 * エラーをコンソールにログ出力（開発用）
 */
export const logError = (error: AppError, context?: string) => {
  const prefix = context ? `[${context}]` : ''
  
  console.group(`❌ ${prefix} RepoTomo Error`)
  console.error('Type:', error.type)
  console.error('Message:', error.message)
  if (error.originalError) {
    console.error('Original:', error.originalError)
  }
  if (error.details) {
    console.error('Details:', error.details)
  }
  console.groupEnd()
}

/**
 * エラーをユーザーに表示するためのフォーマット
 */
export const formatErrorForDisplay = (error: AppError): string => {
  return error.message
}

/**
 * 非同期処理のエラーハンドリング用ラッパー
 */
export const withErrorHandling = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context?: string
) => {
  return async (...args: T): Promise<{ success: true; data: R } | { success: false; error: AppError }> => {
    try {
      const data = await fn(...args)
      return { success: true, data }
    } catch (err) {
      let appError: AppError

      if (err && typeof err === 'object' && 'message' in err) {
        // Supabaseエラーっぽい場合
        if (err && typeof err === 'object' && ('code' in err || 'statusCode' in err)) {
          appError = handleSupabaseError(err)
        } else {
          appError = handleJavaScriptError(err as Error)
        }
      } else {
        appError = createGentleError('general', new Error(String(err)))
      }

      if (context) {
        logError(appError, context)
      }

      return { success: false, error: appError }
    }
  }
}

/**
 * React用：エラー境界で使用するエラーメッセージ
 */
export const getErrorBoundaryMessage = (error: Error): string => {
  return 'アプリの調子が少し良くないみたいです😅 ページを更新してもう一度試してみてください'
}

/**
 * 開発環境でのみ詳細なエラー情報を表示
 */
export const isDevelopment = () => {
  return import.meta.env.MODE === 'development' || import.meta.env.VITE_DEBUG_MODE === 'true'
}

/**
 * デバッグモードでの詳細エラー表示
 */
export const getDetailedErrorInfo = (error: AppError): string => {
  if (!isDevelopment()) {
    return error.message
  }

  let details = `${error.message}\n\n`
  details += `Type: ${error.type}\n`
  
  if (error.originalError) {
    details += `Original: ${error.originalError.message}\n`
    if (error.originalError.stack) {
      details += `Stack: ${error.originalError.stack}\n`
    }
  }
  
  if (error.details) {
    details += `Details: ${JSON.stringify(error.details, null, 2)}\n`
  }

  return details
}

// 心理的安全性を重視した追加メッセージテンプレート
export const encouragementAfterError = [
  'エラーが起きても大丈夫です！よくあることですよ😊',
  '少し休憩してから試してみてくださいね☕',
  '何度でもトライしてください。応援しています💪',
  'うまくいかない時もありますが、一緒に解決しましょう🤝'
]

export const getRandomEncouragement = (): string => {
  return encouragementAfterError[Math.floor(Math.random() * encouragementAfterError.length)]
}