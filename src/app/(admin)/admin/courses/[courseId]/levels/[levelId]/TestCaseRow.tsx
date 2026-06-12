'use client'

import { useState } from 'react'
import { updateTestCase, deleteTestCase } from './actions'
import { DeleteButton } from '../../../../DeleteButton'
import { Button } from '@/components/ui/Button'

interface TestCase {
  id: string
  lesson_id: string
  input: string
  expected: string
  order: number
}

interface Props { tc: TestCase; lessonTitle: string; courseId: string; levelId: string }

export function TestCaseRow({ tc, lessonTitle, courseId, levelId }: Props) {
  const [editing, setEditing] = useState(false)

  return (
    <>
      <tr>
        <td className="px-4 py-3 text-gray-500 w-16">{tc.order}</td>
        <td className="px-4 py-3 text-gray-700">{lessonTitle}</td>
        <td className="px-4 py-2 max-w-xs">
          <pre className="text-xs text-gray-600 whitespace-pre-wrap">{tc.input || '（なし）'}</pre>
        </td>
        <td className="px-4 py-2 max-w-xs">
          <pre className="text-xs text-gray-600 whitespace-pre-wrap">{tc.expected}</pre>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setEditing(!editing)}
              className="text-xs text-gray-500 hover:text-gray-700 font-medium cursor-pointer"
            >
              {editing ? 'キャンセル' : '編集'}
            </button>
            <DeleteButton
              action={deleteTestCase}
              hiddenFields={{ id: tc.id, courseId, levelId }}
              confirmMessage={`テストケースを削除しますか?（${lessonTitle}）`}
            />
          </div>
        </td>
      </tr>
      {editing && (
        <tr className="bg-blue-50">
          <td colSpan={5} className="px-4 py-4">
            <form
              action={async (fd) => { await updateTestCase(fd); setEditing(false) }}
              className="grid grid-cols-2 gap-3"
            >
              <input type="hidden" name="id" value={tc.id} />
              <input type="hidden" name="courseId" value={courseId} />
              <input type="hidden" name="levelId" value={levelId} />
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">input（stdin）</label>
                <textarea name="input" rows={3} defaultValue={tc.input} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono text-gray-900" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">expected（期待する出力） *</label>
                <textarea name="expected" required rows={3} defaultValue={tc.expected} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono text-gray-900" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">order</label>
                <input name="order" type="number" defaultValue={tc.order} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900" />
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
