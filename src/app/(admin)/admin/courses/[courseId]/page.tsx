import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { addLevel, addPracticeLevel } from './actions'
import { LevelRow } from './LevelRow'
import { Button } from '@/components/ui/Button'

interface LevelRow_ {
  id: string
  title: string
  order: number
  concepts: string[] | null
  built: string | null
  next_preview: string | null
  is_practice: boolean
}

export default async function AdminCoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>
}) {
  const { courseId } = await params
  const admin = createAdminClient()

  const [{ data: course }, { data: rawLevels }] = await Promise.all([
    admin.from('courses').select('id, title').eq('id', courseId).single(),
    admin.from('levels').select('id, title, order, concepts, built, next_preview, is_practice').eq('course_id', courseId).order('order', { ascending: true }),
  ])

  if (!course) notFound()

  const levels = (rawLevels ?? []) as LevelRow_[]
  const normalLevels = levels.filter(l => !l.is_practice)
  const practiceLevel = levels.find(l => l.is_practice) ?? null

  return (
    <div>
      {/* パンくず */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-6">
        <Link href="/admin/courses" className="hover:text-gray-600 transition-colors">コース管理</Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">{course.title}</span>
      </nav>

      <h1 className="text-xl font-bold text-gray-900 mb-6">{course.title} — Level管理</h1>

      {/* Level一覧（通常Levelのみ） */}
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
            {normalLevels.map((level, index) => (
              <LevelRow
                key={level.id}
                level={level}
                courseId={courseId}
                isFirst={index === 0}
                isLast={index === (normalLevels.length - 1)}
              />
            ))}
            {normalLevels.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-sm text-gray-400">Levelがありません</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Level追加フォーム */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Levelを追加</h2>
        <form action={addLevel} className="grid grid-cols-2 gap-4">
          <input type="hidden" name="courseId" value={courseId} />
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">タイトル *</label>
            <input name="title" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">学習概念（カンマ区切り）</label>
            <input
              name="concepts"
              placeholder="print()による出力, リストの作り方, for文"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">実装したこと</label>
            <input
              name="built"
              placeholder="〇〇機能を実装した"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">次のLevelの予告</label>
            <input
              name="next_preview"
              placeholder="次はXXXを学びます"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900"
            />
          </div>
          <div className="col-span-2">
            <Button type="submit">追加</Button>
          </div>
        </form>
      </div>

      {/* 補習Level管理セクション */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-1">補習Level</h2>
        <p className="text-xs text-gray-400 mb-4">弱点克服用の補習問題をまとめるLevelです。コースのLevel一覧には表示されません。</p>
        {practiceLevel ? (
          <div className="flex items-center justify-between rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
            <span className="text-sm font-medium text-gray-800">{practiceLevel.title}</span>
            <Link
              href={`/admin/courses/${courseId}/levels/${practiceLevel.id}`}
              className="text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              補習Level管理 →
            </Link>
          </div>
        ) : (
          <form action={addPracticeLevel}>
            <input type="hidden" name="courseId" value={courseId} />
            <Button type="submit" variant="secondary">補習Levelを作成</Button>
          </form>
        )}
      </div>
    </div>
  )
}
