import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { addLevel } from './actions'
import { LevelRow } from './LevelRow'

export default async function AdminCoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>
}) {
  const { courseId } = await params
  const admin = createAdminClient()

  const [{ data: course }, { data: levels }] = await Promise.all([
    admin.from('courses').select('id, title').eq('id', courseId).single(),
    admin.from('levels').select('id, title, order').eq('course_id', courseId).order('order', { ascending: true }),
  ])

  if (!course) notFound()

  return (
    <div>
      {/* パンくず */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-6">
        <Link href="/admin" className="hover:text-gray-600 transition-colors">管理者トップ</Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">{course.title}</span>
      </nav>

      <h1 className="text-xl font-bold text-gray-900 mb-6">{course.title} — Level管理</h1>

      {/* Level一覧 */}
      <div className="bg-white rounded-xl border border-gray-200 mb-8 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">order</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">タイトル</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {levels?.map((level) => (
              <LevelRow key={level.id} level={level} courseId={courseId} />
            ))}
            {(!levels || levels.length === 0) && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-sm text-gray-400">Levelがありません</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Level追加フォーム */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Levelを追加</h2>
        <form action={addLevel} className="grid grid-cols-2 gap-4">
          <input type="hidden" name="courseId" value={courseId} />
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">タイトル *</label>
            <input name="title" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">order</label>
            <input name="order" type="number" defaultValue={0} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900" />
          </div>
          <div className="col-span-2">
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
