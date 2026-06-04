import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type ProgressStatus = 'not_started' | 'in_progress' | 'completed'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { lessonId } = await params
  const body = await request.json()
  const { status } = body as { status: ProgressStatus }

  const validStatuses: ProgressStatus[] = ['not_started', 'in_progress', 'completed']
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: '無効なステータスです' }, { status: 400 })
  }

  const upsertData: {
    user_id: string
    lesson_id: string
    status: ProgressStatus
    completed_at?: string | null
  } = {
    user_id: user.id,
    lesson_id: lessonId,
    status,
    completed_at: status === 'completed' ? new Date().toISOString() : null,
  }

  const { data, error } = await supabase
    .from('progress')
    .upsert(upsertData, { onConflict: 'user_id,lesson_id' })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
