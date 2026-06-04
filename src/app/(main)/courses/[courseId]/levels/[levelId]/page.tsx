import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

type Status = 'not_started' | 'in_progress' | 'completed'

function StatusIcon({ status }: { status: Status }) {
  if (status === 'completed') {
    return (
      <span className="shrink-0 w-7 h-7 rounded-full bg-green-100 flex items-center justify-center">
        <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </span>
    )
  }
  if (status === 'in_progress') {
    return (
      <span className="shrink-0 w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center">
        <span className="w-2.5 h-2.5 rounded-full bg-orange-400" />
      </span>
    )
  }
  return (
    <span className="shrink-0 w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
      <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />
    </span>
  )
}

export default async function LevelLessonsPage({
  params,
}: {
  params: Promise<{ courseId: string; levelId: string }>
}) {
  const { courseId, levelId } = await params
  const supabase = await createClient()

  const [
    { data: course },
    { data: level },
    { data: lessons, error },
  ] = await Promise.all([
    supabase.from('courses').select('title').eq('id', courseId).single(),
    supabase.from('levels').select('title').eq('id', levelId).single(),
    supabase.from('lessons').select('*').eq('level_id', levelId).order('order', { ascending: true }),
  ])

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-red-500">レッスンの取得に失敗しました</p>
          <p className="mt-1 text-xs text-gray-400">{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* パンくず */}
        <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-6 flex-wrap">
          <Link href="/courses" className="hover:text-gray-600 transition-colors">コース一覧</Link>
          <span>/</span>
          <Link href={`/courses/${courseId}`} className="hover:text-gray-600 transition-colors">
            {course?.title ?? 'コース'}
          </Link>
          <span>/</span>
          <span className="text-gray-600">{level?.title ?? 'レベル'}</span>
        </nav>

        {/* ページタイトル */}
        <h1 className="text-2xl font-bold text-gray-900">{level?.title ?? 'レベル'}</h1>
        <p className="mt-1 text-sm text-gray-500">レッスンを順番に進めましょう</p>

        {/* Lesson一覧 */}
        {!lessons || lessons.length === 0 ? (
          <div className="mt-16 text-center">
            <p className="text-sm text-gray-400">レッスンがありません</p>
          </div>
        ) : (
          <div className="mt-8 flex flex-col gap-3">
            {lessons.map((lesson, index) => (
              <Link
                key={lesson.id}
                href={`/lessons/${lesson.id}`}
                className="flex items-center gap-4 bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4 hover:border-blue-300 hover:shadow transition-all"
              >
                <StatusIcon status="not_started" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 mb-0.5">Lesson {index + 1}</p>
                  <p className="text-sm font-semibold text-gray-900 truncate">{lesson.title}</p>
                </div>
                <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
