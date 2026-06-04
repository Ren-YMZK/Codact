import { createAdminClient } from '@/lib/supabase/admin'
import { addLesson, deleteLesson, addTestCase, deleteTestCase } from './actions'

export default async function AdminLessonsPage() {
  const admin = createAdminClient()
  const [{ data: lessons }, { data: levels }, { data: testCases }] = await Promise.all([
    admin
      .from('lessons')
      .select('id, title, order, level_id, levels(title, courses(title))')
      .order('order', { ascending: true }),
    admin
      .from('levels')
      .select('id, title, courses(title)')
      .order('order', { ascending: true }),
    admin
      .from('test_cases')
      .select('id, lesson_id, input, expected, order')
      .order('order', { ascending: true }),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function extractCourseTitle(courses: any): string | undefined {
    if (!courses) return undefined
    if (Array.isArray(courses)) return courses[0]?.title
    return courses.title
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function getLevelLabel(level: any): string {
    const courseTitle = extractCourseTitle(level.courses)
    return courseTitle ? `${courseTitle} / ${level.title}` : level.title
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function getCourseTitle(lesson: any): string {
    return extractCourseTitle(lesson.levels?.courses) ?? '-'
  }

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-bold text-gray-900">Lesson管理</h1>

      {/* Lesson一覧 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">order</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">タイトル</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Level</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">コース</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {lessons?.map((lesson) => (
              <tr key={lesson.id}>
                <td className="px-4 py-3 text-gray-600">{lesson.order}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{lesson.title}</td>
                <td className="px-4 py-3 text-gray-500">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(lesson.levels as any)?.title ?? '-'}
                </td>
                <td className="px-4 py-3 text-gray-500">{getCourseTitle(lesson)}</td>
                <td className="px-4 py-3">
                  <form action={deleteLesson}>
                    <input type="hidden" name="id" value={lesson.id} />
                    <button
                      type="submit"
                      className="text-xs text-red-500 hover:text-red-700 font-medium cursor-pointer"
                      onClick={(e) => { if (!confirm('削除しますか?')) e.preventDefault() }}
                    >
                      削除
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {(!lessons || lessons.length === 0) && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-400">Lessonがありません</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Lesson追加フォーム */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Lessonを追加</h2>
        <form action={addLesson} className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Level *</label>
            <select name="level_id" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="">選択してください</option>
              {levels?.map((lv) => (
                <option key={lv.id} value={lv.id}>{getLevelLabel(lv as { title: string; courses: unknown })}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">タイトル *</label>
            <input name="title" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">コンテンツ（Markdown） *</label>
            <textarea
              name="content"
              required
              rows={8}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">初期コード *</label>
            <textarea
              name="initial_code"
              required
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">ヒント</label>
            <textarea
              name="hint"
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">order</label>
            <input name="order" type="number" defaultValue={0} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
            >
              追加
            </button>
          </div>
        </form>
      </div>

      {/* テストケース一覧 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <h2 className="text-base font-semibold text-gray-900">テストケース一覧</h2>
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
            {testCases?.map((tc) => {
              const lessonTitle = lessons?.find((l) => l.id === tc.lesson_id)?.title ?? tc.lesson_id.slice(0, 8)
              return (
                <tr key={tc.id}>
                  <td className="px-4 py-3 text-gray-600">{tc.order}</td>
                  <td className="px-4 py-3 text-gray-700">{lessonTitle}</td>
                  <td className="px-4 py-2 max-w-xs">
                    <pre className="text-xs text-gray-600 whitespace-pre-wrap">{tc.input || '（なし）'}</pre>
                  </td>
                  <td className="px-4 py-2 max-w-xs">
                    <pre className="text-xs text-gray-600 whitespace-pre-wrap">{tc.expected}</pre>
                  </td>
                  <td className="px-4 py-3">
                    <form action={deleteTestCase}>
                      <input type="hidden" name="id" value={tc.id} />
                      <button
                        type="submit"
                        className="text-xs text-red-500 hover:text-red-700 font-medium cursor-pointer"
                        onClick={(e) => { if (!confirm('削除しますか?')) e.preventDefault() }}
                      >
                        削除
                      </button>
                    </form>
                  </td>
                </tr>
              )
            })}
            {(!testCases || testCases.length === 0) && (
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
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Lesson *</label>
            <select name="lesson_id" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="">選択してください</option>
              {lessons?.map((l) => (
                <option key={l.id} value={l.id}>{l.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">input（stdin）</label>
            <textarea
              name="input"
              rows={3}
              placeholder="入力がない場合は空欄"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">expected（期待する出力） *</label>
            <textarea
              name="expected"
              required
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">order</label>
            <input name="order" type="number" defaultValue={0} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
            >
              追加
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
