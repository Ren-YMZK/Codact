import Link from 'next/link'

const dummyCourses = [
  {
    id: '1',
    title: 'Python基礎',
    language: 'Python',
    description: '変数・条件分岐・ループ・関数など、Pythonの基本文法を実装しながら身につけます。',
  },
  {
    id: '2',
    title: 'JavaScript基礎',
    language: 'JavaScript',
    description: '配列・オブジェクト・非同期処理など、現代のJS開発に欠かせない基礎を学びます。',
  },
  {
    id: '3',
    title: 'データ構造とアルゴリズム',
    language: 'Python',
    description: 'スタック・キュー・二分探索など、コーディング面接でも頻出の基本アルゴリズムを実装します。',
  },
]

const languageColors: Record<string, { bg: string; text: string }> = {
  Python: { bg: 'bg-blue-50', text: 'text-blue-600' },
  JavaScript: { bg: 'bg-yellow-50', text: 'text-yellow-600' },
}

export default function CoursesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* ページタイトル */}
        <h1 className="text-2xl font-bold text-gray-900">コース一覧</h1>
        <p className="mt-1 text-sm text-gray-500">
          取り組みたいコースを選んでください
        </p>

        {/* コース一覧 */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {dummyCourses.map((course) => {
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
                  {course.description}
                </p>

                {/* 始めるボタン */}
                <Link
                  href={`/courses/${course.id}`}
                  className="mt-5 block text-center py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  始める
                </Link>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
