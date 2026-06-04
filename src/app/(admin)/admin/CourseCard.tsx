'use client'

import { useState } from 'react'
import Link from 'next/link'
import { updateCourse, deleteCourse } from './courses/actions'

interface Course {
  id: string
  title: string
  language: string
  description: string | null
  order: number
}

export function CourseCard({ course }: { course: Course }) {
  const [editing, setEditing] = useState(false)

  if (editing) {
    return (
      <div className="bg-white border border-blue-300 rounded-xl p-5">
        <p className="text-xs font-semibold text-gray-500 mb-3">コースを編集</p>
        <form
          action={async (fd) => { await updateCourse(fd); setEditing(false) }}
          className="flex flex-col gap-3"
        >
          <input type="hidden" name="id" value={course.id} />
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">タイトル *</label>
            <input name="title" required defaultValue={course.title} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">言語 *</label>
            <input name="language" required defaultValue={course.language} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">説明</label>
            <input name="description" defaultValue={course.description ?? ''} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">order</label>
            <input name="order" type="number" defaultValue={course.order} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900" />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer">保存</button>
            <button type="button" onClick={() => setEditing(false)} className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer">キャンセル</button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-3">
      <Link href={`/admin/courses/${course.id}`} className="flex-1 hover:opacity-80 transition-opacity">
        <p className="font-semibold text-gray-900">{course.title}</p>
        <p className="text-xs text-gray-500 mt-0.5">{course.language}</p>
        {course.description && (
          <p className="text-xs text-gray-400 mt-1 line-clamp-2">{course.description}</p>
        )}
        <p className="text-xs text-gray-300 mt-1">order: {course.order}</p>
      </Link>
      <div className="flex items-center justify-between border-t border-gray-100 pt-3">
        <Link href={`/admin/courses/${course.id}`} className="text-xs text-blue-600 hover:text-blue-800 font-medium">
          Level管理 →
        </Link>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs text-gray-500 hover:text-gray-700 font-medium cursor-pointer"
          >
            編集
          </button>
          <form action={deleteCourse}>
            <input type="hidden" name="id" value={course.id} />
            <button type="submit" className="text-xs text-red-500 hover:text-red-700 font-medium cursor-pointer">
              削除
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
