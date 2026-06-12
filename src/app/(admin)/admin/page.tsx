import { createAdminClient } from '@/lib/supabase/admin'
import { addCourse } from './courses/actions'
import { CourseCard } from './CourseCard'
import { Button } from '@/components/ui/Button'
import { LANGUAGE_IDS } from '@/lib/piston'

export default async function AdminPage() {
  const admin = createAdminClient()
  const { data: courses, error } = await admin
    .from('courses')
    .select('id, title, language, description, order')
    .order('order', { ascending: true })

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">コース管理</h1>

      {/* コース一覧（カード） */}
      {(!courses || courses.length === 0) ? (
        <p className="text-sm text-gray-400 mb-8">コースがありません</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}

      {/* コース追加フォーム */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">コースを追加</h2>
        <form action={addCourse} className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">タイトル *</label>
            <input name="title" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">言語 *</label>
            <select name="language" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900">
              {Object.keys(LANGUAGE_IDS).map((lang) => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">説明</label>
            <input name="description" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900" />
          </div>
          <div className="col-span-2">
            <Button type="submit">追加</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
