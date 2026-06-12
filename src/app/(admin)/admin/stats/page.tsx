import { createAdminClient } from '@/lib/supabase/admin'

type SummaryRow = {
  total_users: number
  paid_users: number
  total_submissions: number
  total_ai_reviews: number
  new_users_7d: number
  active_users_7d: number
}

type LessonStatRow = {
  course_id: string
  course_title: string
  level_order: number
  level_title: string
  lesson_id: string
  lesson_title: string
  lesson_order: number
  completed_count: number
  in_progress_count: number
  submission_count: number
  ai_review_count: number
}

type UserStatRow = {
  email: string
  plan: string
  created_at: string
  last_submission: string | null
  completed_lesson_count: number
  ai_review_used: number
}

export default async function AdminStatsPage() {
  const admin = createAdminClient()

  const [
    { data: summaryRaw },
    { data: lessonRaw },
    { data: userRaw },
  ] = await Promise.all([
    admin.rpc('get_admin_stats_summary'),
    admin.rpc('get_admin_lesson_stats'),
    admin.rpc('get_admin_user_stats'),
  ])

  const summary = (summaryRaw as SummaryRow[] | null)?.[0] ?? null
  const lessonStats = (lessonRaw as LessonStatRow[] | null) ?? []
  const userStats = (userRaw as UserStatRow[] | null) ?? []

  const conversionRate =
    summary && summary.total_users > 0
      ? ((summary.paid_users / summary.total_users) * 100).toFixed(1)
      : '0.0'

  const courseMap = new Map<string, { title: string; lessons: LessonStatRow[] }>()
  for (const row of lessonStats) {
    if (!courseMap.has(row.course_id)) {
      courseMap.set(row.course_id, { title: row.course_title, lessons: [] })
    }
    courseMap.get(row.course_id)!.lessons.push(row)
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">統計</h1>

      {/* サマリーカード */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <SummaryCard label="総ユーザー数" value={summary?.total_users ?? 0} />
        <SummaryCard
          label="有料ユーザー"
          value={summary?.paid_users ?? 0}
          sub={`転換率 ${conversionRate}%`}
        />
        <SummaryCard label="総提出数" value={summary?.total_submissions ?? 0} />
        <SummaryCard label="AIレビュー実行数" value={summary?.total_ai_reviews ?? 0} />
        <SummaryCard label="新規登録（直近7日）" value={summary?.new_users_7d ?? 0} />
        <SummaryCard label="アクティブ（直近7日）" value={summary?.active_users_7d ?? 0} />
      </div>

      {/* Lesson別 進捗状況 */}
      <h2 className="text-base font-semibold text-gray-900 mb-3">Lesson別 進捗状況</h2>

      {courseMap.size === 0 ? (
        <p className="text-sm text-gray-400 mb-8">データがありません</p>
      ) : (
        Array.from(courseMap.entries()).map(([courseId, { title, lessons }]) => (
          <div key={courseId} className="bg-white rounded-xl border border-gray-200 mb-6 overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5">
              <span className="text-sm font-semibold text-gray-700">{title}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 whitespace-nowrap">Level</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Lesson</th>
                    <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500 whitespace-nowrap">完了人数</th>
                    <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500 whitespace-nowrap">着手中</th>
                    <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500 whitespace-nowrap">提出回数</th>
                    <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500 whitespace-nowrap">平均提出</th>
                    <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500 whitespace-nowrap">AIレビュー数</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {lessons.map((ls) => {
                    const avg =
                      ls.completed_count > 0
                        ? (ls.submission_count / ls.completed_count).toFixed(1)
                        : '-'
                    return (
                      <tr key={ls.lesson_id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 text-gray-400 text-xs whitespace-nowrap">
                          Lv.{ls.level_order}&#x20;{ls.level_title}
                        </td>
                        <td className="px-4 py-2.5 text-gray-700">{ls.lesson_title}</td>
                        <td className="px-4 py-2.5 text-right font-medium text-gray-900">
                          {ls.completed_count.toLocaleString()}
                        </td>
                        <td className="px-4 py-2.5 text-right text-gray-500">
                          {ls.in_progress_count.toLocaleString()}
                        </td>
                        <td className="px-4 py-2.5 text-right text-gray-700">
                          {ls.submission_count.toLocaleString()}
                        </td>
                        <td className="px-4 py-2.5 text-right text-gray-500">{avg}</td>
                        <td className="px-4 py-2.5 text-right text-gray-500">
                          {ls.ai_review_count.toLocaleString()}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}

      {/* ユーザー別 進捗一覧 */}
      <h2 className="text-base font-semibold text-gray-900 mb-3">ユーザー別 進捗一覧</h2>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">メール</th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">プラン</th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 whitespace-nowrap">登録日</th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 whitespace-nowrap">最終提出</th>
                <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500 whitespace-nowrap">完了Lesson数</th>
                <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500 whitespace-nowrap">AIレビュー使用数</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {userStats.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-400">
                    データがありません
                  </td>
                </tr>
              ) : (
                userStats.map((u, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-gray-700 text-xs">{u.email}</td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          u.plan === 'paid'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {u.plan}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs whitespace-nowrap">
                      {new Date(u.created_at).toLocaleDateString('ja-JP')}
                    </td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs whitespace-nowrap">
                      {u.last_submission
                        ? new Date(u.last_submission).toLocaleDateString('ja-JP')
                        : '-'}
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-700">
                      {u.completed_lesson_count.toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-500">
                      {u.ai_review_used.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function SummaryCard({
  label,
  value,
  sub,
}: {
  label: string
  value: number
  sub?: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}
