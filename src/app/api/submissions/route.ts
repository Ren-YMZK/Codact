import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { executeCode } from '@/lib/piston'

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

  // lesson → level → course と辿って言語を取得
  const { data: lesson, error: lessonError } = await supabase
    .from('lessons')
    .select('level_id')
    .eq('id', lesson_id)
    .single()

  if (lessonError || !lesson) {
    return NextResponse.json({ error: 'Lesson情報の取得に失敗しました' }, { status: 404 })
  }

  const { data: level, error: levelError } = await supabase
    .from('levels')
    .select('course_id')
    .eq('id', lesson.level_id)
    .single()

  if (levelError || !level) {
    return NextResponse.json({ error: 'Level情報の取得に失敗しました' }, { status: 404 })
  }

  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('language')
    .eq('id', level.course_id)
    .single()

  if (courseError || !course) {
    return NextResponse.json({ error: 'コース情報の取得に失敗しました' }, { status: 404 })
  }

  const { data: cases, error: casesError } = await supabase
    .from('test_cases')
    .select('input, expected')
    .eq('lesson_id', lesson_id)
    .order('"order"')

  if (casesError) {
    return NextResponse.json({ error: casesError.message }, { status: 500 })
  }

  if (!cases || cases.length === 0) {
    return NextResponse.json({ error: 'このLessonにはテストケースが設定されていません' }, { status: 404 })
  }

  // 全テストケースを並行実行
  let results: { input: string; expected: string; actual: string; passed: boolean; stderr: string }[]
  try {
    results = await Promise.all(
      cases.map(async (tc) => {
        const { stdout, stderr } = await executeCode(course.language, code, tc.input)
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
