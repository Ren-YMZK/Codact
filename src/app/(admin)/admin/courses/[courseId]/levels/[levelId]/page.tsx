import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { addLesson, addTestCase } from './actions'
import { LessonRow } from './LessonRow'
import { TestCaseRow } from './TestCaseRow'
import { Button } from '@/components/ui/Button'

interface ConceptRow {
  id: string
  name: string
  category: string | null
}

export default async function AdminLevelPage({
  params,
}: {
  params: Promise<{ courseId: string; levelId: string }>
}) {
  const { courseId, levelId } = await params
  const admin = createAdminClient()

  const [{ data: course }, { data: level }, { data: lessons }, { data: testCases }, { data: allConcepts }] = await Promise.all([
    admin.from('courses').select('id, title').eq('id', courseId).single(),
    admin.from('levels').select('id, title').eq('id', levelId).single(),
    admin.from('lessons').select('id, title, content, initial_code, hint, order').eq('level_id', levelId).order('order', { ascending: true }),
    admin.from('test_cases').select('id, lesson_id, input, expected, order').order('order', { ascending: true }),
    admin.from('concepts').select('id, name, category').order('category'),
  ])

  if (!course || !level) notFound()

  const lessonIdList = (lessons ?? []).map(l => l.id)
  const lessonIdSet = new Set(lessonIdList)
  const filteredTestCases = (testCases ?? []).filter((tc) => lessonIdSet.has(tc.lesson_id))

  // Lesson×概念の紐づけを取得（lesson_conceptsはservice_role必須）
  const { data: lessonConceptsData } = lessonIdList.length > 0
    ? await admin.from('lesson_concepts').select('lesson_id, concept_id').in('lesson_id', lessonIdList)
    : { data: [] as { lesson_id: string; concept_id: string }[] }

  const lessonConceptMap = new Map<string, string[]>()
  for (const lc of lessonConceptsData ?? []) {
    const existing = lessonConceptMap.get(lc.lesson_id) ?? []
    existing.push(lc.concept_id)
    lessonConceptMap.set(lc.lesson_id, existing)
  }

  const conceptRows = (allConcepts ?? []) as ConceptRow[]

  // カテゴリ → 概念[] のマップ（追加フォーム描画用）
  const conceptsByCategory = conceptRows.reduce<Map<string, ConceptRow[]>>((acc, c) => {
    const cat = c.category ?? 'その他'
    acc.set(cat, [...(acc.get(cat) ?? []), c])
    return acc
  }, new Map())

  return (
    <div className="space-y-8">
      {/* パンくず */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-400">
        <Link href="/admin" className="hover:text-gray-600 transition-colors">管理者トップ</Link>
        <span>/</span>
        <Link href={`/admin/courses/${courseId}`} className="hover:text-gray-600 transition-colors">{course.title}</Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">{level.title}</span>
      </nav>

      <h1 className="text-xl font-bold text-gray-900">{level.title} — Lesson管理</h1>

      {/* Lesson一覧 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">order</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">タイトル</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(lessons ?? []).map((lesson, index) => (
              <LessonRow
                key={lesson.id}
                lesson={lesson}
                courseId={courseId}
                levelId={levelId}
                isFirst={index === 0}
                isLast={index === ((lessons ?? []).length - 1)}
                concepts={conceptRows}
                selectedConceptIds={lessonConceptMap.get(lesson.id) ?? []}
              />
            ))}
            {(!lessons || lessons.length === 0) && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-sm text-gray-400">Lessonがありません</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Lesson追加フォーム */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Lessonを追加</h2>
        <form action={addLesson} className="grid grid-cols-2 gap-4">
          <input type="hidden" name="courseId" value={courseId} />
          <input type="hidden" name="levelId" value={levelId} />
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">タイトル *</label>
            <input name="title" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">コンテンツ（Markdown） *</label>
            <textarea name="content" required rows={8} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono text-gray-900" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">初期コード *</label>
            <textarea name="initial_code" required rows={4} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono text-gray-900" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">ヒント</label>
            <textarea name="hint" rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900" />
          </div>
          {/* 関連概念セレクタ */}
          {conceptsByCategory.size > 0 && (
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-2">関連概念</label>
              <div className="space-y-3">
                {[...conceptsByCategory.entries()].map(([category, items]) => (
                  <div key={category}>
                    <p className="text-xs text-gray-400 mb-1">{category}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                      {items.map(c => (
                        <label key={c.id} className="flex items-center gap-1 text-xs text-gray-700 cursor-pointer select-none">
                          <input type="checkbox" name="concept_ids" value={c.id} className="accent-blue-600" />
                          {c.name}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="col-span-2">
            <Button type="submit">追加</Button>
          </div>
        </form>
      </div>

      {/* テストケース一覧 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <h2 className="text-base font-semibold text-gray-900">テストケース</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">order</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Lesson</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">input</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">expected</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredTestCases.map((tc) => {
              const lessonTitle = lessons?.find((l) => l.id === tc.lesson_id)?.title ?? '-'
              return (
                <TestCaseRow key={tc.id} tc={tc} lessonTitle={lessonTitle} courseId={courseId} levelId={levelId} />
              )
            })}
            {filteredTestCases.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-400">テストケースがありません</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* テストケース追加フォーム */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">テストケースを追加</h2>
        <form action={addTestCase} className="grid grid-cols-2 gap-4">
          <input type="hidden" name="courseId" value={courseId} />
          <input type="hidden" name="levelId" value={levelId} />
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Lesson *</label>
            <select name="lesson_id" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900">
              <option value="">選択してください</option>
              {lessons?.map((l) => (
                <option key={l.id} value={l.id}>{l.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">input（stdin）</label>
            <textarea name="input" rows={3} placeholder="入力がない場合は空欄" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono text-gray-900" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">expected（期待する出力） *</label>
            <textarea name="expected" required rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono text-gray-900" />
          </div>
          <div className="col-span-2">
            <Button type="submit">追加</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
