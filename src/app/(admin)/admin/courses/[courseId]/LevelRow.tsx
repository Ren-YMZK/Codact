'use client'

import { useState } from 'react'
import Link from 'next/link'
import { updateLevel, deleteLevel, moveLevel } from './actions'
import { DeleteButton } from '../DeleteButton'
import { Button } from '@/components/ui/Button'

interface Level { id: string; title: string; order: number; concepts: string[] | null; built: string | null; next_preview: string | null }
interface Props { level: Level; courseId: string; isFirst: boolean; isLast: boolean }

export function LevelRow({ level, courseId, isFirst, isLast }: Props) {
  const [editing, setEditing] = useState(false)

  if (editing) {
    return (
      <tr className="bg-blue-50">
        <td className="px-4 py-3" colSpan={3}>
          <form
            action={async (fd) => { await updateLevel(fd); setEditing(false) }}
            className="flex flex-col gap-3"
          >
            <input type="hidden" name="id" value={level.id} />
            <input type="hidden" name="courseId" value={courseId} />
            <div className="flex items-end gap-3 flex-wrap">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">タイトル *</label>
                <input name="title" required defaultValue={level.title} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">order</label>
                <input name="order" type="number" defaultValue={level.order} className="w-20 border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">学習概念（カンマ区切り）</label>
              <input
                name="concepts"
                defaultValue={level.concepts?.join(', ') ?? ''}
                placeholder="print()による出力, リストの作り方, for文"
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">実装したこと</label>
              <input
                name="built"
                defaultValue={level.built ?? ''}
                placeholder="〇〇機能を実装した"
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">次のLevelの予告</label>
              <input
                name="next_preview"
                defaultValue={level.next_preview ?? ''}
                placeholder="次はXXXを学びます"
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm">保存</Button>
              <Button type="button" size="sm" variant="secondary" onClick={() => setEditing(false)}>キャンセル</Button>
            </div>
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
        {level.concepts && level.concepts.length > 0 && (
          <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{level.concepts.join('、')}</p>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-2">
          <form action={moveLevel}>
            <input type="hidden" name="id" value={level.id} />
            <input type="hidden" name="direction" value="up" />
            <input type="hidden" name="courseId" value={courseId} />
            <button type="submit" disabled={isFirst} className="text-gray-400 hover:text-gray-700 disabled:text-gray-200 disabled:cursor-not-allowed cursor-pointer" aria-label="上へ">↑</button>
          </form>
          <form action={moveLevel}>
            <input type="hidden" name="id" value={level.id} />
            <input type="hidden" name="direction" value="down" />
            <input type="hidden" name="courseId" value={courseId} />
            <button type="submit" disabled={isLast} className="text-gray-400 hover:text-gray-700 disabled:text-gray-200 disabled:cursor-not-allowed cursor-pointer" aria-label="下へ">↓</button>
          </form>
          <span className="text-gray-200">|</span>
          <Link href={`/admin/courses/${courseId}/levels/${level.id}`} className="text-xs text-blue-600 hover:text-blue-800 font-medium">
            Lesson管理 →
          </Link>
          <button type="button" onClick={() => setEditing(true)} className="text-xs text-gray-500 hover:text-gray-700 font-medium cursor-pointer">
            編集
          </button>
          <DeleteButton
            action={deleteLevel}
            hiddenFields={{ id: level.id, courseId }}
            confirmMessage={`Level「${level.title}」を削除しますか?配下のLessonも削除されます`}
          />
        </div>
      </td>
    </tr>
  )
}
