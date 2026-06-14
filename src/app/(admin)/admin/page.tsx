import Link from 'next/link'

const MENU_ITEMS = [
  {
    href: '/admin/courses',
    label: 'コース管理',
    description: 'コース・Level・Lessonの作成と編集',
  },
  {
    href: '/admin/stats',
    label: '統計',
    description: '学習進捗・Lesson別サマリー・ユーザー別一覧',
  },
  {
    href: '/admin/users',
    label: 'ユーザー管理',
    description: 'VIPロール付与・アカウント削除',
  },
]

export default function AdminTopPage() {
  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">管理者メニュー</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {MENU_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="bg-white border border-gray-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-sm transition-all group"
          >
            <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">
              {item.label}
            </p>
            <p className="text-xs text-gray-400">{item.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
