'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/(auth)/logout/actions'

const NAV_LINKS = [
  { href: '/dashboard', label: 'ダッシュボード' },
  { href: '/courses', label: 'コース一覧' },
  { href: '/settings', label: '設定' },
]

export default function Navbar() {
  const pathname = usePathname()

  return (
    <header className="h-14 shrink-0 bg-white border-b border-gray-200 px-6 flex items-center justify-between">
      {/* ロゴ */}
      <Link
        href="/dashboard"
        className="text-base font-bold text-gray-900 tracking-tight hover:text-blue-600 transition-colors"
      >
        Codact
      </Link>

      {/* ナビリンク */}
      <nav className="flex items-center gap-1">
        {NAV_LINKS.map(({ href, label }) => {
          const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {label}
            </Link>
          )
        })}
      </nav>

      {/* ログアウト */}
      <form action={logout}>
        <button
          type="submit"
          className="px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
        >
          ログアウト
        </button>
      </form>
    </header>
  )
}
