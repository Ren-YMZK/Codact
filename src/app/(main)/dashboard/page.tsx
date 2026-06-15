import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { extractNextLesson } from '@/lib/supabaseHelpers'
import { ConceptMap } from './ConceptMap'
import type { CategoryStat, WeakConceptStat } from './ConceptMap'

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

interface WeaknessRow {
  concept_id: string
  success_count: number
  fail_count: number
}

interface ConceptRow {
  id: string
  name: string
  category: string | null
}

interface LessonConceptRow {
  lesson_id: string
  concept_id: string
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  // コース集計・in_progress・最終completed・弱点プロファイル・全Lesson概念対応を並列取得
  const [
    summaryResult,
    inProgressResult,
    lastCompletedResult,
    weaknessResult,
    conceptsResult,
    allLessonConceptsResult,
  ] = await Promise.all([
    supabase.rpc('get_course_progress_summary', { p_user_id: user.id }),
    supabase
      .from('progress')
      .select('lessons(id, title, levels(title, order, courses(title)))')
      .eq('user_id', user.id)
      .eq('status', 'in_progress')
      .limit(1)
      .maybeSingle(),
    supabase
      .from('progress')
      .select('lessons(id, title, levels(title, order, courses(title)))')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    // 弱点プロファイル（concepts テーブルに authenticated GRANT が無いため admin で取得）
    admin
      .from('user_weaknesses')
      .select('concept_id, success_count, fail_count')
      .eq('user_id', user.id),
    admin
      .from('concepts')
      .select('id, name, category')
      .order('category'),
    // 全Lesson×概念の対応表（復習Lesson特定に使用・admin で取得）
    admin
      .from('lesson_concepts')
      .select('lesson_id, concept_id'),
  ])

  const courses = (summaryResult.data ?? []) as CourseSummaryRow[]
  const hasCourses = courses.length > 0

  // in_progress 優先、なければ最後にcompleted したLesson
  const nextProgressData = inProgressResult.data ?? lastCompletedResult.data
  const lastLesson = nextProgressData
    ? extractNextLesson((nextProgressData as { lessons: unknown }).lessons)
    : null

  // 理解度マップ集計
  const weaknessRows = (weaknessResult.data ?? []) as WeaknessRow[]
  const conceptRows = (conceptsResult.data ?? []) as ConceptRow[]

  const weaknessMap = new Map(weaknessRows.map(w => [w.concept_id, w]))

  // カテゴリ単位で success/fail を合算
  const categoryDataMap = new Map<string, { success: number; fail: number }>()
  for (const concept of conceptRows) {
    const cat = concept.category ?? 'その他'
    const acc = categoryDataMap.get(cat) ?? { success: 0, fail: 0 }
    const w = weaknessMap.get(concept.id)
    acc.success += w?.success_count ?? 0
    acc.fail += w?.fail_count ?? 0
    categoryDataMap.set(cat, acc)
  }

  const categories: CategoryStat[] = [...categoryDataMap.entries()]
    .map(([category, { success, fail }]) => ({
      category,
      rate: success + fail > 0 ? success / (success + fail) : null,
    }))
    .sort((a, b) => {
      // データありカテゴリを rate 昇順（苦手順）、データなしは末尾
      if (a.rate === null && b.rate === null) return a.category.localeCompare(b.category)
      if (a.rate === null) return 1
      if (b.rate === null) return -1
      return a.rate - b.rate
    })

  // 弱点概念: fail_count >= 1 を rate 昇順で最大5件
  const weakConceptsBase: WeakConceptStat[] = conceptRows
    .filter(c => {
      const w = weaknessMap.get(c.id)
      return w && w.fail_count >= 1
    })
    .map(c => {
      const w = weaknessMap.get(c.id)!
      const total = w.success_count + w.fail_count
      return {
        conceptId: c.id,
        name: c.name,
        category: c.category ?? 'その他',
        rate: total > 0 ? w.success_count / total : 0,
        reviewLesson: null,
      }
    })
    .sort((a, b) => a.rate - b.rate)
    .slice(0, 5)

  // 弱点概念ごとに「最新の失敗Lesson」を特定
  const allLessonConceptRows = (allLessonConceptsResult.data ?? []) as LessonConceptRow[]

  // concept_id → lesson_id[] のマップ
  const conceptToLessonIds = new Map<string, string[]>()
  for (const row of allLessonConceptRows) {
    const existing = conceptToLessonIds.get(row.concept_id) ?? []
    existing.push(row.lesson_id)
    conceptToLessonIds.set(row.concept_id, existing)
  }

  // 弱点概念に紐づく全 lesson_id を収集
  const weakLessonIdSet = new Set<string>()
  for (const wc of weakConceptsBase) {
    for (const lessonId of conceptToLessonIds.get(wc.conceptId) ?? []) {
      weakLessonIdSet.add(lessonId)
    }
  }
  const weakLessonIds = [...weakLessonIdSet]

  // フェーズ2: 弱点Lessonへの失敗提出を取得（created_at DESC で最新順）
  type FailedSubRow = { lesson_id: string; lesson_title: string }
  let failedSubList: FailedSubRow[] = []
  if (weakLessonIds.length > 0) {
    const { data: failedSubs } = await admin
      .from('submissions')
      .select('lesson_id, created_at, lessons(id, title)')
      .eq('user_id', user.id)
      .eq('status', 'failed')
      .in('lesson_id', weakLessonIds)
      .order('created_at', { ascending: false })

    failedSubList = (failedSubs ?? []).map(sub => {
      const lesson = Array.isArray(sub.lessons) ? sub.lessons[0] : sub.lessons
      const title = lesson && typeof lesson === 'object'
        ? String((lesson as Record<string, unknown>).title ?? '')
        : ''
      return { lesson_id: sub.lesson_id as string, lesson_title: title }
    })
  }

  // 弱点概念ごとに最新の失敗Lessonを付与
  const weakConcepts: WeakConceptStat[] = weakConceptsBase.map(wc => {
    const lessonIdSet = new Set(conceptToLessonIds.get(wc.conceptId) ?? [])
    // failedSubList は created_at DESC 順なので最初のマッチが最新
    const match = failedSubList.find(sub => lessonIdSet.has(sub.lesson_id))
    return {
      ...wc,
      reviewLesson: match ? { id: match.lesson_id, title: match.lesson_title } : null,
    }
  })

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
              <p className="text-xs text-blue-200 mb-1 truncate">
                {lastLesson.courseTitle} / Level {lastLesson.levelOrder} {lastLesson.levelTitle}
              </p>
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

        {/* 理解度マップ */}
        <ConceptMap categories={categories} weakConcepts={weakConcepts} />

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
                <Link
                  key={row.course_id}
                  href={`/courses/${row.course_id}`}
                  className="block bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-5 hover:border-blue-300 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <h2 className="text-base font-semibold text-gray-900">{row.course_title}</h2>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${color.bg} ${color.text}`}>
                        {row.language}
                      </span>
                    </div>
                    <svg className="w-5 h-5 shrink-0 text-gray-300 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
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
                </Link>
              )
            })}
          </div>
        )}
      </Container>
    </div>
  )
}
