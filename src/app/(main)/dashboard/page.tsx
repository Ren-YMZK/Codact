import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const languageColors: Record<string, { bg: string; text: string }> = {
  Python: { bg: 'bg-blue-50', text: 'text-blue-600' },
  JavaScript: { bg: 'bg-yellow-50', text: 'text-yellow-600' },
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: courses },
    { data: levels },
    { data: lessons },
    { data: progress },
  ] = await Promise.all([
    supabase.from('courses').select('id, title, language').order('order', { ascending: true }),
    supabase.from('levels').select('id, course_id'),
    supabase.from('lessons').select('id, level_id'),
    supabase.from('progress').select('lesson_id, status, completed_at').eq('user_id', user.id),
  ])

  // level_id → course_id のマップ
  const levelToCourse = new Map((levels ?? []).map(l => [l.id, l.course_id]))

  // course_id → 総Lesson数 / lesson_id → course_id のマップ
  const courseTotalMap = new Map<string, number>()
  const lessonToCourse = new Map<string, string>()
  for (const lesson of lessons ?? []) {
    const courseId = levelToCourse.get(lesson.level_id)
    if (!courseId) continue
    courseTotalMap.set(courseId, (courseTotalMap.get(courseId) ?? 0) + 1)
    lessonToCourse.set(lesson.id, courseId)
  }

  // course_id → 完了Lesson数のマップ
  const courseCompletedMap = new Map<string, number>()
  for (const p of progress ?? []) {
    if (p.status !== 'completed') continue
    const courseId = lessonToCourse.get(p.lesson_id)
    if (!courseId) continue
    courseCompletedMap.set(courseId, (courseCompletedMap.get(courseId) ?? 0) + 1)
  }

  // 最後に取り組んだLessonを特定（in_progress優先、次に最終完了）
  const inProgressEntry = (progress ?? []).find(p => p.status === 'in_progress')
  const lastCompletedEntry = [...(progress ?? [])]
    .filter(p => p.status === 'completed' && p.completed_at)
    .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())[0]
  const lastLessonId = inProgressEntry?.lesson_id ?? lastCompletedEntry?.lesson_id

  const hasCourses = (courses ?? []).length > 0

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* ヘッダー */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
            <p className="mt-1 text-sm text-gray-500">学習の進捗を確認しましょう</p>
          </div>
          <Link
            href={lastLessonId ? `/lessons/${lastLessonId}` : '/courses'}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            続きから始める
          </Link>
        </div>

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
            {(courses ?? []).map((course) => {
              const total = courseTotalMap.get(course.id) ?? 0
              const completed = courseCompletedMap.get(course.id) ?? 0
              const percent = total > 0 ? Math.round((completed / total) * 100) : 0
              const color = languageColors[course.language] ?? { bg: 'bg-gray-50', text: 'text-gray-600' }

              return (
                <div key={course.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-base font-semibold text-gray-900">{course.title}</h2>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${color.bg} ${color.text}`}>
                          {course.language}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-gray-400">
                        {completed} / {total} Lesson完了
                      </p>
                    </div>
                    <Link
                      href={`/courses/${course.id}`}
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
                    <p className="mt-1.5 text-right text-xs text-gray-400">{percent}%</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
