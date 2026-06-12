import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { extractLesson } from '@/lib/supabaseHelpers'

const languageColors: Record<string, { bg: string; text: string }> = {
  Python: { bg: 'bg-blue-50', text: 'text-blue-600' },
  JavaScript: { bg: 'bg-yellow-50', text: 'text-yellow-600' },
}

interface CourseSummaryRow {
  course_id: string
  course_title: string
  language: string
  course_order: number
  total_lessons: number
  completed_lessons: number
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // コース集計・in_progress・最終completed を並列取得
  const [summaryResult, inProgressResult, lastCompletedResult] = await Promise.all([
    supabase.rpc('get_course_progress_summary', { p_user_id: user.id }),
    supabase
      .from('progress')
      .select('lessons(id, title)')
      .eq('user_id', user.id)
      .eq('status', 'in_progress')
      .limit(1)
      .maybeSingle(),
    supabase
      .from('progress')
      .select('lessons(id, title)')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const courses = (summaryResult.data ?? []) as CourseSummaryRow[]
  const hasCourses = courses.length > 0

  // in_progress 優先、なければ最後にcompleted したLesson
  const nextProgressData = inProgressResult.data ?? lastCompletedResult.data
  const lastLesson = nextProgressData
    ? extractLesson((nextProgressData as { lessons: unknown }).lessons)
    : null

  return (
    <div className="min-h-screen bg-gray-50">
      <Container size="narrow" className="py-12">
        {/* ヘッダー */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
          <p className="mt-1 text-sm text-gray-500">学習の進捗を確認しましょう</p>
        </div>

        {/* 続きから始めるCTA */}
        {lastLesson ? (
          <div className="mt-6 bg-blue-600 rounded-2xl px-6 py-5 flex items-center justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <p className="text-xs text-blue-200 mb-1">次のLesson</p>
              <p className="text-base font-semibold text-white truncate">{lastLesson.title}</p>
            </div>
            <Button href={`/lessons/${lastLesson.id}`} variant="secondary" size="md" className="shrink-0 text-blue-700 border-0">
              続きから始める
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          </div>
        ) : hasCourses ? (
          <div className="mt-6">
            <Button href="/courses" variant="primary" size="md">
              コースを始める
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          </div>
        ) : null}

        {/* コース進捗一覧 */}
        {!hasCourses ? (
          <div className="mt-16 text-center">
            <p className="text-sm text-gray-500">まだコースがありません。</p>
            <Link href="/courses" className="mt-3 inline-block text-sm text-blue-600 hover:text-blue-700 font-medium">
              コース一覧から始めましょう
            </Link>
          </div>
        ) : (
          <div className="mt-8 flex flex-col gap-4">
            {courses.map((row) => {
              const total = row.total_lessons
              const completed = row.completed_lessons
              const percent = total > 0 ? Math.round((completed / total) * 100) : 0
              const color = languageColors[row.language] ?? { bg: 'bg-gray-50', text: 'text-gray-600' }

              return (
                <div key={row.course_id} className="bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <h2 className="text-base font-semibold text-gray-900">{row.course_title}</h2>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${color.bg} ${color.text}`}>
                        {row.language}
                      </span>
                    </div>
                    <Link
                      href={`/courses/${row.course_id}`}
                      className="shrink-0 text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      詳細
                    </Link>
                  </div>

                  {/* プログレスバー */}
                  <div className="mt-4">
                    <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          percent === 100
                            ? 'bg-green-500'
                            : percent > 0
                            ? 'bg-blue-500'
                            : 'bg-gray-200'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <div className="mt-1.5 flex items-center justify-between">
                      <p className="text-xs text-gray-500">{completed} / {total} Lesson完了</p>
                      <p className="text-xs text-gray-400">{percent}%</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Container>
    </div>
  )
}
