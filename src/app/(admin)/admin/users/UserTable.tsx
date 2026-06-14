'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { Button } from '@/components/ui/Button'
import { setVip, unsetVip, deleteUser } from './actions'

export type UserRow = {
  id: string
  email: string
  role: string | null
  plan: string
  created_at: string
}

function RoleBadge({ role }: { role: string | null }) {
  if (role === 'admin') {
    return (
      <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">
        admin
      </span>
    )
  }
  if (role === 'vip') {
    return (
      <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-600">
        vip
      </span>
    )
  }
  return (
    <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-gray-50 text-gray-400">
      user
    </span>
  )
}

function KebabMenu({ user, onDeleteClick }: { user: UserRow; onDeleteClick: (u: UserRow) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [])

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen(o => !o)}
        className="px-2 py-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors text-base leading-none"
        aria-label="メニューを開く"
      >
        ⋮
      </button>
      {open && (
        <div className="absolute right-0 top-full z-10 mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          {user.role === 'user' && (
            <form action={setVip}>
              <input type="hidden" name="userId" value={user.id} />
              <button
                type="submit"
                className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 cursor-pointer"
                onClick={(e: React.MouseEvent) => {
                  if (!window.confirm(`${user.email} をVIPにしますか？\nAIレビューが月30回になります`)) {
                    e.preventDefault()
                  }
                }}
              >
                VIPにする
              </button>
            </form>
          )}
          {user.role === 'vip' && (
            <form action={unsetVip}>
              <input type="hidden" name="userId" value={user.id} />
              <button
                type="submit"
                className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 cursor-pointer"
                onClick={(e: React.MouseEvent) => {
                  if (!window.confirm(`${user.email} のVIPを解除しますか？\n無料プラン（月10回）に戻ります`)) {
                    e.preventDefault()
                  }
                }}
              >
                VIP解除
              </button>
            </form>
          )}
          <div className="border-t border-gray-100" />
          <button
            className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 cursor-pointer"
            onClick={() => {
              setOpen(false)
              onDeleteClick(user)
            }}
          >
            ユーザーを削除
          </button>
        </div>
      )}
    </div>
  )
}

function DeleteModal({ user, onClose }: { user: UserRow; onClose: () => void }) {
  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteUser(user.id)
      if (result?.error) {
        setError(result.error)
      } else {
        onClose()
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
        <h2 className="text-base font-bold text-gray-900 mb-3">ユーザーを削除</h2>
        <p className="text-sm text-gray-600 mb-4">
          この操作は取り消せません。<span className="font-medium text-gray-900">{user.email}</span> のアカウントと全ての学習データ（提出履歴・進捗・AIレビュー）が完全に削除されます。
        </p>
        <p className="text-xs text-gray-500 mb-2">
          確認のため <span className="font-medium text-gray-700">{user.email}</span> を入力してください
        </p>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400 mb-4"
          placeholder={user.email}
          autoComplete="off"
        />
        {error && (
          <p className="text-xs text-red-600 mb-4">{error}</p>
        )}
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={isPending}>
            キャンセル
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleDelete}
            disabled={input !== user.email || isPending}
          >
            {isPending ? '削除中...' : '削除する'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function UserTable({ users }: { users: UserRow[] }) {
  const [query, setQuery] = useState('')
  const [deleteModal, setDeleteModal] = useState<UserRow | null>(null)

  const filtered = query.trim()
    ? users.filter(u => u.email?.toLowerCase().includes(query.toLowerCase()))
    : users

  return (
    <div>
      {deleteModal && (
        <DeleteModal user={deleteModal} onClose={() => setDeleteModal(null)} />
      )}

      {/* 検索ボックス */}
      <div className="mb-4">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="メールアドレスで絞り込み..."
          className="w-full max-w-sm border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">メール</th>
              <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">role</th>
              <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">プラン</th>
              <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 whitespace-nowrap">登録日</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-400">
                  {query ? '該当するユーザーがいません' : 'ユーザーがいません'}
                </td>
              </tr>
            ) : (
              filtered.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 text-gray-700 text-xs">{u.email}</td>
                  <td className="px-4 py-2.5">
                    <RoleBadge role={u.role} />
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                      u.plan === 'paid' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {u.plan}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-gray-500 text-xs whitespace-nowrap">
                    {new Date(u.created_at).toLocaleDateString('ja-JP')}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {u.role !== 'admin' && (
                      <KebabMenu user={u} onDeleteClick={setDeleteModal} />
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > 0 && (
        <p className="mt-2 text-xs text-gray-400 text-right">{filtered.length} 件</p>
      )}
    </div>
  )
}
