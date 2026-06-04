import Link from 'next/link'

const cards = [
  { href: '/admin/courses', label: 'コース管理', desc: 'コースの追加・削除' },
  { href: '/admin/levels', label: 'Level管理', desc: 'Levelの追加・削除' },
  { href: '/admin/lessons', label: 'Lesson管理', desc: 'Lessonとテストケースの追加・削除' },
]

export default function AdminPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">管理者ダッシュボード</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="block bg-white border border-gray-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-sm transition-all"
          >
            <p className="font-semibold text-gray-900">{card.label}</p>
            <p className="text-sm text-gray-500 mt-1">{card.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
