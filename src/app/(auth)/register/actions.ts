'use server'

import { redirect } from 'next/navigation'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

export type RegisterState = { error: string } | undefined

function toJapaneseError(message: string): string {
  if (
    message.includes('user_already_exists') ||
    message.includes('already registered') ||
    message.includes('already exists')
  ) {
    return 'このメールアドレスはすでに登録されています'
  }
  if (message.includes('Password should be at least')) {
    return 'パスワードは6文字以上で設定してください'
  }
  if (message.includes('valid email')) {
    return 'メールアドレスの形式が正しくありません'
  }
  return '登録に失敗しました。もう一度お試しください'
}

export async function register(
  _prevState: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({ email, password })

  if (error) {
    console.error('signUpError:', error)
    return { error: toJapaneseError(error.message) }
  }

  if (!data.user) {
    return { error: '登録に失敗しました。もう一度お試しください' }
  }

  // RLSを確実に回避するためサービスロールキーでusersテーブルに挿入
  const admin = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { error: insertError } = await admin
    .from('users')
    .insert({ id: data.user.id, email, name })

  if (insertError) {
    console.error('insertError:', JSON.stringify(insertError), 'email:', email)
    return { error: 'プロフィールの保存に失敗しました。もう一度お試しください' }
  }

  redirect('/welcome')
}
