import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const FREE_LIMIT = 3
const PAID_LIMIT = 30

export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: userData, error } = await supabase
    .from('users')
    .select('plan, ai_review_count, ai_review_reset_at')
    .eq('id', user.id)
    .single()

  if (error || !userData) {
    return NextResponse.json({ error: 'ユーザー情報の取得に失敗しました' }, { status: 500 })
  }

  // 1ヶ月以上経過していたらリセット
  const resetAt = new Date(userData.ai_review_reset_at)
  const oneMonthAgo = new Date()
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

  let count = userData.ai_review_count
  if (resetAt <= oneMonthAgo) {
    await supabase
      .from('users')
      .update({ ai_review_count: 0, ai_review_reset_at: new Date().toISOString() })
      .eq('id', user.id)
    count = 0
  }

  const limit = userData.plan === 'paid' ? PAID_LIMIT : FREE_LIMIT
  const remaining = Math.max(0, limit - count)

  return NextResponse.json({ remaining, limit, count })
}
