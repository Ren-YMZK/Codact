'use client'

import { useState } from 'react'
import Link from 'next/link'
import { updateLevel, deleteLevel } from './actions'

interface Level { id: string; title: string; order: number }
interface Props { level: Level; courseId: string }

export function LevelRow({ level, courseId }: Props) {
  const [editing, setEditing] = useState(false)

  if (editing) {
    return (
      <tr className="bg-blue-50">
        <td className="px-4 py-3" colSpan={3}>
          <form
            action={async (fd) => { await updateLevel(fd); setEditing(false) }}
            className="flex items-end gap-3 flex-wrap"
          >
            <input type="hidden" name="id" value={level.id} />
            <input type="hidden" name="courseId" value={courseId} />
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">タイトル *</label>
              <input name="title" required defaultValue={level.title} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">order</label>
              <input name="order" type="number" defaultValue={level.order} className="w-20 border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900" />
            </div>
            <button type="submit" className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer">保存</button>
            <button type="button" onClick={() => setEditing(false)} className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer">キャンセル</button>
          </form>
        </td>
      </tr>
    )
  }

  return (
    <tr>
      <td className="px-4 py-3 text-gray-500 w-16">{level.order}</td>
      <td className="px-4 py-3">
        <Link
          href={`/admin/courses/${courseId}/levels/${level.id}`}
          className="font-medium text-gray-900 hover:text-blue-600 transition-colors"
        >
          {level.title}
        </Link>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-4">
          <Link href={`/admin/courses/${courseId}/levels/${level.id}`} className="text-xs text-blue-600 hover:text-blue-800 font-medium">
            Lesson管理 →
          </Link>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs text-gray-500 hover:text-gray-700 font-medium cursor-pointer"
          >
            編集
          </button>
          <form action={deleteLevel}>
            <input type="hidden" name="id" value={level.id} />
            <input type="hidden" name="courseId" value={courseId} />
            <button type="submit" className="text-xs text-red-500 hover:text-red-700 font-medium cursor-pointer">削除</button>
          </form>
        </div>
      </td>
    </tr>
  )
}
