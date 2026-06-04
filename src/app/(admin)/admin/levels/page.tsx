import { createAdminClient } from '@/lib/supabase/admin'
import { addLevel, deleteLevel } from './actions'

export default async function AdminLevelsPage() {
  const admin = createAdminClient()
  const [{ data: levels }, { data: courses }] = await Promise.all([
    admin
      .from('levels')
      .select('id, title, order, courses(title)')
      .order('order', { ascending: true }),
    admin
      .from('courses')
      .select('id, title')
      .order('order', { ascending: true }),
  ])

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Level管理</h1>

      {/* 一覧 */}
      <div className="bg-white rounded-xl border border-gray-200 mb-8 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">order</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">タイトル</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">コース</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {levels?.map((level) => (
              <tr key={level.id}>
                <td className="px-4 py-3 text-gray-600">{level.order}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{level.title}</td>
                <td className="px-4 py-3 text-gray-500">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {Array.isArray((level as any).courses)
                    ? (level as any).courses[0]?.title ?? '-'
                    : (level as any).courses?.title ?? '-'}
                </td>
                <td className="px-4 py-3">
                  <form action={deleteLevel}>
                    <input type="hidden" name="id" value={level.id} />
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
            {(!levels || levels.length === 0) && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-400">Levelがありません</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 追加フォーム */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Levelを追加</h2>
        <form action={addLevel} className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">コース *</label>
            <select name="course_id" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="">選択してください</option>
              {courses?.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">タイトル *</label>
            <input name="title" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
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
