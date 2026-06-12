'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { setVip, unsetVip } from './actions'

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

export function UserTable({ users }: { users: UserRow[] }) {
  const [query, setQuery] = useState('')

  const filtered = query.trim()
    ? users.filter(u => u.email?.toLowerCase().includes(query.toLowerCase()))
    : users

  return (
    <div>
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
                    {u.role === 'user' && (
                      <form action={setVip}>
                        <input type="hidden" name="userId" value={u.id} />
                        <Button
                          type="submit"
                          size="sm"
                          variant="secondary"
                          onClick={(e: React.MouseEvent) => {
                            if (!window.confirm(`${u.email} をVIPにしますか？\nAIレビューが月30回になります`)) {
                              e.preventDefault()
                            }
                          }}
                        >
                          VIPにする
                        </Button>
                      </form>
                    )}
                    {u.role === 'vip' && (
                      <form action={unsetVip}>
                        <input type="hidden" name="userId" value={u.id} />
                        <Button
                          type="submit"
                          size="sm"
                          variant="danger"
                          onClick={(e: React.MouseEvent) => {
                            if (!window.confirm(`${u.email} のVIPを解除しますか？\n無料プラン（月10回）に戻ります`)) {
                              e.preventDefault()
                            }
                          }}
                        >
                          VIP解除
                        </Button>
                      </form>
                    )}
                    {u.role === 'admin' && (
                      <span className="text-xs text-gray-300">-</span>
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
