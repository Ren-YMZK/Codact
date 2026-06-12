import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'

const languageColors: Record<string, { bg: string; text: string }> = {
  Python: { bg: 'bg-blue-50', text: 'text-blue-600' },
  JavaScript: { bg: 'bg-yellow-50', text: 'text-yellow-600' },
}

export default async function CoursesPage() {
  const supabase = await createClient()

  const { data: courses, error } = await supabase
    .from('courses')
    .select('*')
    .order('order', { ascending: true })

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-red-500">コースの取得に失敗しました</p>
          <p className="mt-1 text-xs text-gray-400">{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Container size="wide" className="py-12">
        {/* ページタイトル */}
        <h1 className="text-2xl font-bold text-gray-900">コース一覧</h1>
        <p className="mt-1 text-sm text-gray-500">
          取り組みたいコースを選んでください
        </p>

        {/* コース一覧 */}
        {courses.length === 0 ? (
          <div className="mt-16 text-center">
            <p className="text-sm text-gray-400">コースがありません</p>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => {
              const color = languageColors[course.language] ?? { bg: 'bg-gray-50', text: 'text-gray-600' }
              return (
                <div
                  key={course.id}
                  className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col"
                >
                  {/* 言語バッジ */}
                  <span className={`inline-flex items-center self-start px-2.5 py-0.5 rounded-full text-xs font-medium ${color.bg} ${color.text}`}>
                    {course.language}
                  </span>

                  {/* タイトル・説明 */}
                  <h2 className="mt-3 text-base font-semibold text-gray-900">
                    {course.title}
                  </h2>
                  <p className="mt-1.5 text-sm text-gray-500 leading-relaxed flex-1">
                    {course.description ?? ''}
                  </p>

                  {/* 始めるボタン */}
                  <Button href={`/courses/${course.id}`} className="mt-5 w-full">
                    始める
                  </Button>
                </div>
              )
            })}
          </div>
        )}
      </Container>
    </div>
  )
}
