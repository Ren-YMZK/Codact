import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { submissionId } = await params

  const { data, error } = await supabase
    .from('ai_reviews')
    .select('id, review, created_at')
    .eq('submission_id', submissionId)
    .eq('user_id', user.id)
    .single()

  if (error) {
    return NextResponse.json({ error: 'AIレビューが見つかりません' }, { status: 404 })
  }

  return NextResponse.json(data)
}
