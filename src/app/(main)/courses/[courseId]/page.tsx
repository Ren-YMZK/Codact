import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { StatusIcon } from '@/components/ui/StatusIcon'

type Status = 'not_started' | 'in_progress' | 'completed'

function deriveLevelStatus(lessonIds: string[], progressMap: Map<string, Status>): Status {
  if (lessonIds.length === 0) return 'not_started'
  const statuses = lessonIds.map((id) => progressMap.get(id) ?? 'not_started')
  if (statuses.every((s) => s === 'completed')) return 'completed'
  if (statuses.some((s) => s === 'in_progress' || s === 'completed')) return 'in_progress'
  return 'not_started'
}

export default async function CourseLevelsPage({
  params,
}: {
  params: Promise<{ courseId: string }>
}) {
  const { courseId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: course }, { data: levels, error }] = await Promise.all([
    supabase.from('courses').select('title').eq('id', courseId).single(),
    supabase.from('levels').select('id, title, order').eq('course_id', courseId).order('order', { ascending: true }),
  ])

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-red-500">レベルの取得に失敗しました</p>
          <p className="mt-1 text-xs text-gray-400">{error.message}</p>
        </div>
      </div>
    )
  }

  // 進捗マップを構築（ログイン済みの場合のみ）
  const progressMap = new Map<string, Status>()
  if (user && levels && levels.length > 0) {
    const levelIds = levels.map((l) => l.id)

    const [{ data: lessons }, { data: progressRows }] = await Promise.all([
      supabase.from('lessons').select('id, level_id').in('level_id', levelIds),
      supabase.from('progress').select('lesson_id, status').eq('user_id', user.id),
    ])

    if (progressRows) {
      for (const row of progressRows) {
        progressMap.set(row.lesson_id, row.status as Status)
      }
    }

    // level_id → lesson IDs のマップ
    const levelLessonsMap = new Map<string, string[]>()
    if (lessons) {
      for (const lesson of lessons) {
        const list = levelLessonsMap.get(lesson.level_id) ?? []
        list.push(lesson.id)
        levelLessonsMap.set(lesson.level_id, list)
      }
    }

    // Levelステータスを progressMap に書き戻す（levelId → status として再利用）
    for (const level of levels) {
      const lessonIds = levelLessonsMap.get(level.id) ?? []
      const levelStatus = deriveLevelStatus(lessonIds, progressMap)
      progressMap.set(`level:${level.id}`, levelStatus)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* パンくず */}
        <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-6">
          <Link href="/courses" className="hover:text-gray-600 transition-colors">コース一覧</Link>
          <span>/</span>
          <span className="text-gray-600">{course?.title ?? 'コース'}</span>
        </nav>

        {/* ページタイトル */}
        <h1 className="text-2xl font-bold text-gray-900">{course?.title ?? 'コース'}</h1>
        <p className="mt-1 text-sm text-gray-500">レベルを選んで始めましょう</p>

        {/* Level一覧 */}
        {!levels || levels.length === 0 ? (
          <div className="mt-16 text-center">
            <p className="text-sm text-gray-400">レベルがありません</p>
          </div>
        ) : (
          <div className="mt-8 flex flex-col gap-3">
            {levels.map((level, index) => {
              const status: Status = (progressMap.get(`level:${level.id}`) as Status | undefined) ?? 'not_started'
              return (
                <Link
                  key={level.id}
                  href={`/courses/${courseId}/levels/${level.id}`}
                  className="flex items-center gap-4 bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4 hover:border-blue-300 hover:shadow transition-all"
                >
                  <StatusIcon status={status} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 mb-0.5">Level {index + 1}</p>
                    <p className="text-sm font-semibold text-gray-900 truncate">{level.title}</p>
                  </div>
                  <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
