import Link from 'next/link'

export interface CategoryStat {
  category: string
  rate: number | null
}

export interface WeakConceptStat {
  conceptId: string
  name: string
  category: string
  rate: number
  reviewLesson: { id: string; title: string } | null
}

interface Props {
  categories: CategoryStat[]
  weakConcepts: WeakConceptStat[]
}

function barColor(rate: number): string {
  if (rate >= 0.8) return 'bg-green-500'
  if (rate >= 0.5) return 'bg-blue-500'
  return 'bg-amber-400'
}

export function ConceptMap({ categories, weakConcepts }: Props) {
  const hasAnyData = categories.some(c => c.rate !== null)

  if (!hasAnyData) {
    return (
      <div className="mt-8 bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-8 text-center">
        <p className="text-sm font-semibold text-gray-700">あなたの理解度マップ</p>
        <p className="mt-2 text-sm text-gray-400">
          レッスンでAIレビューを受けると、ここに概念ごとの理解度が表示されます
        </p>
      </div>
    )
  }

  return (
    <div className="mt-8 bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-5">
      <h2 className="text-sm font-semibold text-gray-700">あなたの理解度マップ</h2>

      <div className="mt-4 flex flex-col gap-3">
        {categories.map(({ category, rate }, index) => {
          const pct = rate !== null ? Math.round(rate * 100) : null

          return (
            <div key={index}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-700">{category}</span>
                {pct !== null ? (
                  <span className="text-xs font-medium text-gray-500">{pct}%</span>
                ) : (
                  <span className="text-xs text-gray-400">まだ挑戦していません</span>
                )}
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                {pct !== null && (
                  <div
                    className={`h-full rounded-full transition-all ${barColor(rate!)}`}
                    style={{ width: `${pct}%` }}
                  />
                )}
              </div>
            </div>
          )
        })}
      </div>

      {weakConcepts.length > 0 && (
        <div className="mt-5 pt-4 border-t border-gray-100">
          <p className="text-xs font-medium text-gray-500 mb-2">重点的に復習したい概念</p>
          <ul className="flex flex-col gap-3">
            {weakConcepts.map((w, index) => (
              <li key={index}>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                  <span className="text-sm text-gray-700">
                    {w.category}の「{w.name}」
                    <span className="ml-2 text-xs text-gray-400">{Math.round(w.rate * 100)}%</span>
                  </span>
                </div>
                {w.reviewLesson && (
                  <div className="ml-3.5 mt-0.5">
                    <Link
                      href={`/lessons/${w.reviewLesson.id}`}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      「{w.reviewLesson.title}」を復習する →
                    </Link>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
