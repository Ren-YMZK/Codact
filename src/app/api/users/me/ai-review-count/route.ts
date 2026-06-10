import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPlanLimit, applyMonthlyResetIfNeeded } from '@/lib/aiReview'

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
  const count = await applyMonthlyResetIfNeeded(
    supabase,
    user.id,
    userData.ai_review_count,
    userData.ai_review_reset_at,
  )

  const limit = getPlanLimit(userData.plan)
  const remaining = Math.max(0, limit - count)

  return NextResponse.json({ remaining, limit, count })
}
