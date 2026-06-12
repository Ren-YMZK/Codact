'use client'

import { useState } from 'react'
import { updateLesson, deleteLesson, moveLesson } from './actions'
import { DeleteButton } from '../../../../DeleteButton'
import { Button } from '@/components/ui/Button'

interface Lesson {
  id: string
  title: string
  content: string
  initial_code: string
  hint: string | null
  order: number
}

interface Props {
  lesson: Lesson
  courseId: string
  levelId: string
  isFirst: boolean
  isLast: boolean
}

export function LessonRow({ lesson, courseId, levelId, isFirst, isLast }: Props) {
  const [editing, setEditing] = useState(false)

  return (
    <>
      <tr>
        <td className="px-4 py-3 text-gray-500 w-16">{lesson.order}</td>
        <td className="px-4 py-3 font-medium text-gray-900">{lesson.title}</td>
        <td className="px-4 py-3">
          <div className="flex items-center justify-end gap-2">
            {/* 順番変更ボタン */}
            <form action={moveLesson}>
              <input type="hidden" name="id" value={lesson.id} />
              <input type="hidden" name="direction" value="up" />
              <input type="hidden" name="courseId" value={courseId} />
              <input type="hidden" name="levelId" value={levelId} />
              <button
                type="submit"
                disabled={isFirst}
                className="text-gray-400 hover:text-gray-700 disabled:text-gray-200 disabled:cursor-not-allowed cursor-pointer"
                aria-label="上へ"
              >
                ↑
              </button>
            </form>
            <form action={moveLesson}>
              <input type="hidden" name="id" value={lesson.id} />
              <input type="hidden" name="direction" value="down" />
              <input type="hidden" name="courseId" value={courseId} />
              <input type="hidden" name="levelId" value={levelId} />
              <button
                type="submit"
                disabled={isLast}
                className="text-gray-400 hover:text-gray-700 disabled:text-gray-200 disabled:cursor-not-allowed cursor-pointer"
                aria-label="下へ"
              >
                ↓
              </button>
            </form>
            <span className="text-gray-200">|</span>
            <button
              type="button"
              onClick={() => setEditing(!editing)}
              className="text-xs text-gray-500 hover:text-gray-700 font-medium cursor-pointer"
            >
              {editing ? 'キャンセル' : '編集'}
            </button>
            <DeleteButton
              action={deleteLesson}
              hiddenFields={{ id: lesson.id, courseId, levelId }}
              confirmMessage={`Lesson「${lesson.title}」を削除しますか?`}
            />
          </div>
        </td>
      </tr>
      {editing && (
        <tr className="bg-blue-50">
          <td colSpan={3} className="px-4 py-4">
            <form
              action={async (fd) => { await updateLesson(fd); setEditing(false) }}
              className="grid grid-cols-2 gap-3"
            >
              <input type="hidden" name="id" value={lesson.id} />
              <input type="hidden" name="courseId" value={courseId} />
              <input type="hidden" name="levelId" value={levelId} />
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">タイトル *</label>
                <input name="title" required defaultValue={lesson.title} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">コンテンツ（Markdown） *</label>
                <textarea name="content" required rows={8} defaultValue={lesson.content} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono text-gray-900" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">初期コード *</label>
                <textarea name="initial_code" required rows={4} defaultValue={lesson.initial_code} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono text-gray-900" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">ヒント</label>
                <textarea name="hint" rows={2} defaultValue={lesson.hint ?? ''} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">order</label>
                <input name="order" type="number" defaultValue={lesson.order} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900" />
              </div>
              <div className="flex items-end gap-2">
                <Button type="submit" size="sm">保存</Button>
                <Button type="button" size="sm" variant="secondary" onClick={() => setEditing(false)}>キャンセル</Button>
              </div>
            </form>
          </td>
        </tr>
      )}
    </>
  )
}
