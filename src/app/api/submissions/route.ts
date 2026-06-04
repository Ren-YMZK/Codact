import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { executePython } from '@/lib/piston'
import { testCases } from '@/lib/testCases'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { lesson_id, code } = body as { lesson_id: string; code: string }

  if (!lesson_id || !code) {
    return NextResponse.json({ error: 'lesson_id と code は必須です' }, { status: 400 })
  }

  const cases = testCases[lesson_id]
  if (!cases || cases.length === 0) {
    return NextResponse.json({ error: 'このLessonのテストケースが見つかりません' }, { status: 404 })
  }

  // 全テストケースを並行実行
  let results: { input: string; expected: string; actual: string; passed: boolean; stderr: string }[]
  try {
    results = await Promise.all(
      cases.map(async (tc) => {
        const { stdout, stderr } = await executePython(code, tc.input)
        const actual = stdout.trimEnd()
        const expected = tc.expected.trimEnd()
        return {
          input: tc.input,
          expected,
          actual,
          passed: actual === expected,
          stderr,
        }
      })
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'コードの実行に失敗しました'
    return NextResponse.json({ error: message }, { status: 503 })
  }

  const status = results.every((r) => r.passed) ? 'passed' : 'failed'

  const { data: submission, error: insertError } = await supabase
    .from('submissions')
    .insert({
      user_id: user.id,
      lesson_id,
      code,
      status,
      test_result: results,
    })
    .select()
    .single()

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ submission, test_result: results })
}
